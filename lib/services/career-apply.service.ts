import { eq, and, sql } from "drizzle-orm";
import { getDrizzleDb } from "@/lib/database";
import { applicationsTable, jobsTable } from "@/lib/database/schema/index.schema";
import { ApplicationStatus } from "@/lib/database/enum/content.enum";
import { AppError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmailService } from "./email.service";

export interface ScreeningAnswerInput {
  questionId: string;
  question: string;
  answer: string | boolean | number | string[];
}

export interface ApplicationSubmitPayload {
  jobId: string;
  candidateName: string;
  email: string;
  phone?: string;
  currentLocation?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  resumeFile: File;
  coverLetter?: string;
  noticePeriodWeeks?: number;
  screeningAnswers?: ScreeningAnswerInput[];
  privacyConsent: boolean;
  talentPoolConsent?: boolean;
  source?: string;
}

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5 MB

export class CareerApplyService {
  constructor(
    private db = getDrizzleDb(),
    private emailService?: EmailService,
    private supabaseAdmin = createAdminClient(),
  ) {}

  async submitApplication(payload: ApplicationSubmitPayload) {
    // 1. Consent validation
    if (!payload.privacyConsent) {
      throw new AppError("BAD_REQUEST", "You must accept the privacy policy to submit an application.");
    }

    // 2. Resume file validation
    const file = payload.resumeFile;
    if (!file) {
      throw new AppError("BAD_REQUEST", "A resume file is required to submit an application.");
    }

    if (file.size > MAX_RESUME_SIZE) {
      throw new AppError("PAYLOAD_TOO_LARGE", "Resume file size exceeds the maximum limit of 5MB.");
    }

    const fileName = (file.name || "").toLowerCase();
    const isAllowedExt =
      fileName.endsWith(".pdf") || fileName.endsWith(".docx") || fileName.endsWith(".doc");

    if (!ALLOWED_MIME_TYPES.includes(file.type) && !isAllowedExt) {
      throw new AppError(
        "UNSUPPORTED_MEDIA",
        "Unsupported resume format. Please upload a PDF or Word document (.pdf, .docx, .doc).",
      );
    }

    // 3. Verify Job exists and is accepting applications
    let job: any = null;
    if ((this.db as any).query?.jobsTable?.findFirst) {
      job = await (this.db as any).query.jobsTable.findFirst({
        where: (jobs: any, { eq }: any) => eq(jobs.id, payload.jobId),
      });
    }
    if (!job && this.db.select) {
      const [found] = await this.db
        .select()
        .from(jobsTable)
        .where(eq(jobsTable.id, payload.jobId))
        .limit(1);
      job = found;
    }

    if (!job) {
      throw new AppError("NOT_FOUND", "The specified job opening does not exist.");
    }

    if (job.status !== "PUBLISHED" && job.status !== "OPEN") {
      throw new AppError("BAD_REQUEST", "This opening is currently closed and no longer accepting applications.");
    }

    if (job.closesAt && new Date(job.closesAt).getTime() < Date.now()) {
      throw new AppError("BAD_REQUEST", "The application deadline for this opening has passed.");
    }

    // 4. Check for duplicate application
    const normalizedEmail = payload.email.trim().toLowerCase();
    let existing: any = null;
    if ((this.db as any).query?.applicationsTable?.findFirst) {
      existing = await (this.db as any).query.applicationsTable.findFirst({
        where: (apps: any, { eq, and }: any) =>
          and(eq(apps.jobId, payload.jobId), eq(apps.email, normalizedEmail)),
      });
    }
    if (!existing && this.db.select) {
      const [found] = await this.db
        .select()
        .from(applicationsTable)
        .where(
          and(
            eq(applicationsTable.jobId, payload.jobId),
            eq(applicationsTable.email, normalizedEmail),
          ),
        )
        .limit(1);
      existing = found;
    }

    if (existing) {
      throw new AppError(
        "CONFLICT",
        "Already applied: You have already submitted an application for this role with this email address.",
      );
    }

    // 5. Evaluate screening questions for knockout triggers
    let knockoutTriggered = false;
    const questions = Array.isArray(job.screeningQuestions) ? (job.screeningQuestions as any[]) : [];

    if (questions.length > 0 && payload.screeningAnswers && payload.screeningAnswers.length > 0) {
      for (const answer of payload.screeningAnswers) {
        const questionDef = questions.find((q) => q.id === answer.questionId);
        if (questionDef && questionDef.knockoutAnswer !== undefined) {
          if (answer.answer === questionDef.knockoutAnswer) {
            knockoutTriggered = true;
            break;
          }
        }
      }
    }

    // 6. Upload resume to private Supabase Storage bucket
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `resumes/${job.id}/${Date.now()}_${sanitizedName}`;
    let resumeUrl: string | undefined;

    if (this.supabaseAdmin) {
      try {
        const fileBuffer = await file.arrayBuffer();
        const { error: uploadError } = await this.supabaseAdmin.storage
          .from("resumes")
          .upload(storagePath, fileBuffer, {
            contentType: file.type || "application/pdf",
            upsert: false,
          });

        if (uploadError) {
          console.warn("Storage upload warning:", uploadError.message);
        } else {
          const { data: signedData } = await this.supabaseAdmin.storage
            .from("resumes")
            .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7-day initial signed URL

          if (signedData?.signedUrl) {
            resumeUrl = signedData.signedUrl;
          }
        }
      } catch (uploadErr) {
        console.warn("Supabase storage upload error:", uploadErr);
      }
    }

    // 7. Insert application record into database
    const [application] = await this.db
      .insert(applicationsTable)
      .values({
        siteId: job.siteId,
        jobId: job.id,
        jobVersionId: job.versionId || 1,
        candidateName: payload.candidateName.trim(),
        email: normalizedEmail,
        phone: payload.phone?.trim() || null,
        currentLocation: payload.currentLocation?.trim() || null,
        portfolioUrl: payload.portfolioUrl?.trim() || null,
        githubUrl: payload.githubUrl?.trim() || null,
        linkedinUrl: payload.linkedinUrl?.trim() || null,
        resumeStoragePath: storagePath,
        resumeFileName: file.name,
        resumeMimeType: file.type || "application/pdf",
        resumeUrl: resumeUrl || null,
        coverLetter: payload.coverLetter?.trim() || null,
        noticePeriodWeeks: payload.noticePeriodWeeks ?? null,
        screeningAnswers: payload.screeningAnswers || [],
        knockoutTriggered,
        source: payload.source || "direct",
        status: ApplicationStatus.NEW,
        privacyConsentDate: new Date(),
        privacyNoticeVersion: "2026-v1",
        talentPoolConsent: payload.talentPoolConsent ?? false,
      })
      .returning();

    // 8. Increment job applyCount
    try {
      await this.db
        .update(jobsTable)
        .set({ applyCount: sql`${jobsTable.applyCount} + 1` })
        .where(eq(jobsTable.id, job.id));
    } catch (countErr) {
      console.warn("Failed to increment apply count:", countErr);
    }

    // 9. Dispatch background dual notification emails
    if (this.emailService) {
      // Email A: Candidate confirmation
      this.emailService
        .sendMail({
          to: normalizedEmail,
          subject: `Application Received: ${job.title} at TechSonance Infotech`,
          text: `Dear ${payload.candidateName},\n\nThank you for applying for the ${job.title} position at TechSonance Infotech LLP.\n\nWe have received your resume and application details. Our engineering talent team reviews each application carefully. If your background aligns with our engineering requirements, we will reach out directly to schedule the next conversation.\n\nBest regards,\nTalent Acquisition Team\nTechSonance Infotech LLP\nhttps://www.techsonance.co.in`,
          html: `
            <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #1155cc; margin-bottom: 16px;">Application Received</h2>
              <p>Dear <strong>${payload.candidateName}</strong>,</p>
              <p>Thank you for your interest in joining <strong>TechSonance Infotech LLP</strong>. We have received your application for the following position:</p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <h3 style="margin: 0 0 8px 0; color: #0f172a;">${job.title}</h3>
                <p style="margin: 0; color: #64748b; font-size: 14px;">Reference ID: ${application.id}</p>
              </div>
              <p>Our hiring team evaluates each candidate's background, projects, and engineering experience. If your profile matches our requirements, we will contact you directly to schedule an introductory interview.</p>
              <p style="margin-top: 32px; font-size: 14px; color: #64748b;">Best regards,<br/><strong>TechSonance Talent Team</strong><br/><a href="https://www.techsonance.co.in" style="color: #1155cc;">techsonance.co.in</a></p>
            </div>
          `,
        })
        .catch((err) => console.error("Failed to send candidate confirmation email:", err));

      // Email B: Recruiter notification
      const recruiterRecipient = process.env.RECRUITER_NOTIFICATION_EMAIL || "careers@techsonance.co.in";
      this.emailService
        .sendMail({
          to: recruiterRecipient,
          subject: `${knockoutTriggered ? "[ALERT: Knockout Triggered] " : ""}New Application: ${payload.candidateName} for ${job.title}`,
          text: `New candidate application submitted for ${job.title}.\n\nCandidate: ${payload.candidateName}\nEmail: ${normalizedEmail}\nPhone: ${payload.phone || "N/A"}\nKnockout Triggered: ${knockoutTriggered ? "YES" : "NO"}\nApplication ID: ${application.id}`,
          html: `
            <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #1155cc; margin-bottom: 16px;">New Candidate Application</h2>
              ${
                knockoutTriggered
                  ? `<div style="background-color: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-weight: bold;">
                      ⚠️ KNOCKOUT QUESTION TRIGGERED: Candidate failed one or more required screening gates.
                    </div>`
                  : ""
              }
              <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                <tr><td style="padding: 8px 0; color: #64748b;">Position:</td><td style="padding: 8px 0; font-weight: bold;">${job.title}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Candidate:</td><td style="padding: 8px 0; font-weight: bold;">${payload.candidateName}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Email:</td><td style="padding: 8px 0;">${normalizedEmail}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Phone:</td><td style="padding: 8px 0;">${payload.phone || "N/A"}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Application ID:</td><td style="padding: 8px 0; font-family: monospace;">${application.id}</td></tr>
              </table>
              <div style="margin-top: 24px;">
                <a href="https://www.techsonance.co.in/admin/careers/applications?id=${application.id}" style="display: inline-block; background-color: #1155cc; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                  Review in ATS Inbox
                </a>
              </div>
            </div>
          `,
        })
        .catch((err) => console.error("Failed to send recruiter alert email:", err));
    }

    return application;
  }
}
