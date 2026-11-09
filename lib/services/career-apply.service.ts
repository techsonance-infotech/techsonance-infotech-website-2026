import "server-only";
import crypto from "node:crypto";
import { inject } from "@needle-di/core";
import { ENV_CONFIG_TOKEN, SUPABASE_CLIENT_TOKEN } from "@/lib/di/tokens";
import type { Database } from "@/lib/database/index";
import { ApplicationStatus, JobExperienceLevel } from "@/lib/database/enum/content.enum";
import { AppError, ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getEnv, type Env } from "@/lib/env";
import { EmailService } from "./email.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { CareerApplicationsRepository } from "@/lib/repositories/career-applications.repository";
import {
  renderCandidateConfirmationEmail,
  renderRecruiterAlertEmail,
  renderTalentPoolConfirmationEmail,
  renderCareerInquiryEmail,
} from "./career-email.template";
import {
  CAREER_ERRORS,
  NIL_SITE_ID,
  MAX_RESUME_BYTES,
  ALLOWED_RESUME_MIME_TYPES,
  PDF_MAGIC_BYTES,
  DOCX_MAGIC_BYTES,
  RESUME_BUCKET,
  RESUME_CREATION_SIGNED_URL_TTL_SEC,
  PRIVACY_NOTICE_VERSION,
  DEFAULT_APPLICATION_SOURCE,
  DEFAULT_RECRUITER_EMAIL,
} from "@/lib/constants/careers.constants";

export interface ScreeningAnswerInput {
  questionId: string;
  question: string;
  answer: string | boolean | number | string[];
}

export interface EEOCInput {
  gender?: string;
  ethnicity?: string;
  veteranStatus?: string;
  disabilityStatus?: string;
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
  resumeFile?:
    | File
    | {
        name: string;
        size: number;
        type: string;
        arrayBuffer?: () => Promise<ArrayBuffer>;
        buffer?: Buffer | ArrayBuffer;
      }
    | null;
  coverLetter?: string;
  noticePeriodWeeks?: number;
  screeningAnswers?: ScreeningAnswerInput[];
  privacyConsent: boolean;
  talentPoolConsent?: boolean;
  eeoc?: EEOCInput;
  source?: string;
}

export interface TalentPoolSubmitPayload {
  siteId?: string;
  name: string;
  email: string;
  phone?: string;
  skills?: string[];
  preferredRole?: string;
  experienceLevel?: string;
  portfolioUrl?: string;
  resumeFile?:
    | File
    | {
        name: string;
        size: number;
        type: string;
        arrayBuffer?: () => Promise<ArrayBuffer>;
        buffer?: Buffer | ArrayBuffer;
      };
  notes?: string;
}

export interface CareerInquiryPayload {
  fullName: string;
  email: string;
  role: string;
  message: string;
  resumeFile?:
    | File
    | {
        name: string;
        size: number;
        type: string;
        arrayBuffer?: () => Promise<ArrayBuffer>;
        buffer?: Buffer | ArrayBuffer;
      }
    | null;
}

const ALLOWED_MIME_TYPES = ALLOWED_RESUME_MIME_TYPES;
const MAX_RESUME_SIZE = MAX_RESUME_BYTES;

// Magic bytes:
// PDF: starts with %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
const PDF_MAGIC = PDF_MAGIC_BYTES;
// DOCX: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
const DOCX_MAGIC = DOCX_MAGIC_BYTES;

export class CareerApplyService {
  private emailService?: EmailService;
  private supabaseAdmin?: SupabaseClient | null;
  private envConfig: Env;
  private repository: CareerApplicationsRepository;

  constructor(
    repoOrDb: CareerApplicationsRepository | Database = inject(CareerApplicationsRepository),
    emailService?: EmailService,
    supabaseAdmin?: SupabaseClient | null,
    env?: Env,
    repository?: CareerApplicationsRepository,
  ) {
    this.emailService = emailService;
    this.supabaseAdmin = supabaseAdmin;
    try {
      this.envConfig = env || inject(ENV_CONFIG_TOKEN) || getEnv();
    } catch {
      this.envConfig = env || ({} as Env);
    }

    if (repository) {
      this.repository = repository;
    } else if (repoOrDb instanceof CareerApplicationsRepository) {
      this.repository = repoOrDb;
    } else {
      this.repository = new CareerApplicationsRepository(repoOrDb);
    }

    if (!this.emailService) {
      try {
        this.emailService = inject(EmailService);
      } catch {
        // injected at runtime if container available
      }
    }

    if (this.supabaseAdmin === undefined) {
      try {
        this.supabaseAdmin = inject(SUPABASE_CLIENT_TOKEN) || createAdminClient();
      } catch {
        this.supabaseAdmin = null;
      }
    }
  }

  /**
   * Validates resume file size, extension, MIME type, and binary magic bytes.
   */
  async validateResume(
    file:
      | File
      | {
          name: string;
          size: number;
          type: string;
          arrayBuffer?: () => Promise<ArrayBuffer>;
          buffer?: Buffer | ArrayBuffer;
        },
  ): Promise<Uint8Array> {
    if (!file) {
      throw new AppError(ErrorCode.BAD_REQUEST, CAREER_ERRORS.RESUME_REQUIRED);
    }

    if (file.size > MAX_RESUME_SIZE) {
      throw new AppError("PAYLOAD_TOO_LARGE", CAREER_ERRORS.RESUME_TOO_LARGE);
    }

    const fileName = (file.name || "").toLowerCase();
    const isAllowedExt =
      fileName.endsWith(".pdf") || fileName.endsWith(".docx") || fileName.endsWith(".doc");

    if (!ALLOWED_MIME_TYPES.has(file.type) && !isAllowedExt) {
      throw new AppError("UNSUPPORTED_MEDIA", CAREER_ERRORS.RESUME_BAD_FORMAT);
    }

    // Read bytes for magic byte verification
    let bytes: Uint8Array;
    if ("arrayBuffer" in file && typeof file.arrayBuffer === "function") {
      const ab = await file.arrayBuffer();
      bytes = new Uint8Array(ab);
    } else if ("buffer" in file && file.buffer) {
      bytes = new Uint8Array(file.buffer as ArrayBuffer);
    } else {
      bytes = new Uint8Array(0);
    }

    if (bytes.length >= 4) {
      const isPdfExt = fileName.endsWith(".pdf") || file.type === "application/pdf";
      const isDocxExt =
        fileName.endsWith(".docx") ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      if (isPdfExt) {
        const matchesPdf =
          bytes.length >= 5 &&
          bytes[0] === PDF_MAGIC[0] &&
          bytes[1] === PDF_MAGIC[1] &&
          bytes[2] === PDF_MAGIC[2] &&
          bytes[3] === PDF_MAGIC[3] &&
          bytes[4] === PDF_MAGIC[4];

        if (!matchesPdf) {
          throw new AppError("UNSUPPORTED_MEDIA", CAREER_ERRORS.RESUME_PDF_MAGIC);
        }
      } else if (isDocxExt) {
        const matchesDocx =
          bytes[0] === DOCX_MAGIC[0] &&
          bytes[1] === DOCX_MAGIC[1] &&
          bytes[2] === DOCX_MAGIC[2] &&
          bytes[3] === DOCX_MAGIC[3];

        if (!matchesDocx) {
          throw new AppError("UNSUPPORTED_MEDIA", CAREER_ERRORS.RESUME_DOCX_MAGIC);
        }
      }
    }

    return bytes;
  }

  /**
   * Uploads resume to private Supabase Storage bucket under `${siteId}/${jobId}/${uuid}_${sanitizedName}`.
   */
  async uploadResumeToPrivateStorage(
    fileBuffer: Uint8Array | Buffer | ArrayBuffer,
    fileName: string,
    mimeType: string,
    siteId: string,
    jobId: string,
  ): Promise<string> {
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueId = crypto.randomUUID();
    const storagePath = `${siteId}/${jobId}/${uniqueId}_${sanitizedName}`;

    if (this.supabaseAdmin?.storage) {
      try {
        let { error: uploadError } = await this.supabaseAdmin.storage
          .from(RESUME_BUCKET)
          .upload(storagePath, fileBuffer, {
            contentType: mimeType || "application/pdf",
            upsert: false,
          });

        // If bucket doesn't exist, auto-create it using admin service role and retry
        if (
          uploadError &&
          (uploadError.message?.toLowerCase().includes("bucket not found") ||
            (uploadError as unknown as { statusCode?: string | number }).statusCode === "404" ||
            (uploadError as unknown as { statusCode?: string | number }).statusCode === 404)
        ) {
          const { error: createError } = await this.supabaseAdmin.storage.createBucket(
            RESUME_BUCKET,
            {
              public: false,
              fileSizeLimit: MAX_RESUME_BYTES,
              allowedMimeTypes: Array.from(ALLOWED_RESUME_MIME_TYPES),
            },
          );

          if (!createError) {
            const retry = await this.supabaseAdmin.storage
              .from(RESUME_BUCKET)
              .upload(storagePath, fileBuffer, {
                contentType: mimeType || "application/pdf",
                upsert: false,
              });
            uploadError = retry.error;
          }
        }

        if (uploadError) {
          logger.warn(`Storage upload warning: ${uploadError.message}`);
        }
      } catch (uploadErr) {
        logger.warn(`Supabase storage upload error: ${String(uploadErr)}`);
      }
    }

    return storagePath;
  }

  /**
   * Submits a candidate job application with duplicate prevention, knockout screening,
   * private resume storage, and background dual notification emails.
   */
  async submitApplication(payload: ApplicationSubmitPayload) {
    // 1. Consent validation
    if (!payload.privacyConsent) {
      throw new AppError(ErrorCode.BAD_REQUEST, CAREER_ERRORS.PRIVACY_CONSENT_REQUIRED);
    }

    // 2. Verify Job exists and is accepting applications
    const job = await this.repository.findJobById(payload.jobId);
    if (!job) {
      throw new AppError("NOT_FOUND", CAREER_ERRORS.JOB_NOT_FOUND);
    }

    if (job.status !== "PUBLISHED" && job.status !== "OPEN") {
      throw new AppError(ErrorCode.BAD_REQUEST, CAREER_ERRORS.JOB_NOT_ACCEPTING);
    }

    if (job.closesAt && new Date(job.closesAt).getTime() < Date.now()) {
      throw new AppError(ErrorCode.BAD_REQUEST, CAREER_ERRORS.JOB_DEADLINE_PASSED);
    }

    // 3. Resume validation: required if job.resumeRequired !== false, otherwise optional
    const file = payload.resumeFile;
    const hasResume = Boolean(
      file && (typeof file !== "object" || !("size" in file) || file.size > 0),
    );

    if (job.resumeRequired !== false && !hasResume) {
      throw new AppError(ErrorCode.BAD_REQUEST, CAREER_ERRORS.RESUME_DOCUMENT_REQUIRED);
    }

    let storagePath = "";
    let resumeFileName = "";
    let resumeMimeType = "application/pdf";
    let resumeUrl: string | undefined;

    if (hasResume && file) {
      const fileBytes = await this.validateResume(file);
      storagePath = await this.uploadResumeToPrivateStorage(
        fileBytes,
        file.name,
        file.type || "application/pdf",
        job.siteId,
        job.id,
      );
      resumeFileName = file.name;
      resumeMimeType = file.type || "application/pdf";

      if (this.supabaseAdmin?.storage && storagePath) {
        try {
          const { data: signedData } = await this.supabaseAdmin.storage
            .from(RESUME_BUCKET)
            .createSignedUrl(storagePath, RESUME_CREATION_SIGNED_URL_TTL_SEC);

          if (signedData?.signedUrl) {
            resumeUrl = signedData.signedUrl;
          }
        } catch {
          // signed URL creation optional
        }
      }
    }

    // 4. Check for duplicate application
    const normalizedEmail = payload.email.trim().toLowerCase();
    const existing = await this.repository.findExistingApplication(payload.jobId, normalizedEmail);
    if (existing) {
      // Clean up uploaded file if duplicate
      if (storagePath && this.supabaseAdmin?.storage) {
        try {
          await this.supabaseAdmin.storage.from(RESUME_BUCKET).remove([storagePath]);
        } catch {
          // ignore
        }
      }
      throw new AppError("CONFLICT", CAREER_ERRORS.DUPLICATE_APPLICATION);
    }

    // 5. Evaluate screening questions for knockout triggers
    let knockoutTriggered = false;
    const questions = Array.isArray(job.screeningQuestions)
      ? (job.screeningQuestions as any[])
      : [];

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

    // 6. Insert application record into database (with rollback on storage if insert fails)
    let application;
    try {
      application = await this.repository.insertApplication({
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
        resumeFileName: resumeFileName,
        resumeMimeType: resumeMimeType,
        resumeUrl: resumeUrl || null,
        coverLetter: payload.coverLetter?.trim() || null,
        noticePeriodWeeks: payload.noticePeriodWeeks ?? null,
        screeningAnswers: payload.screeningAnswers || [],
        knockoutTriggered,
        source: payload.source || DEFAULT_APPLICATION_SOURCE,
        status: ApplicationStatus.NEW,
        privacyConsent: true,
        privacyConsentDate: new Date(),
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
        talentPoolConsent: payload.talentPoolConsent ?? false,
      });
    } catch (insertErr) {
      // Clean up orphaned uploaded file from storage
      if (storagePath && this.supabaseAdmin?.storage) {
        try {
          await this.supabaseAdmin.storage.from(RESUME_BUCKET).remove([storagePath]);
          logger.info(`Cleaned up orphaned resume after DB insert failure: ${storagePath}`);
        } catch (cleanupErr) {
          logger.warn(`Failed to clean up orphaned resume: ${String(cleanupErr)}`);
        }
      }
      throw insertErr;
    }

    // 7b. Store voluntary anonymous EEOC survey response if candidate chose to provide it
    if (
      payload.eeoc &&
      (payload.eeoc.gender ||
        payload.eeoc.ethnicity ||
        payload.eeoc.veteranStatus ||
        payload.eeoc.disabilityStatus)
    ) {
      try {
        await this.repository.insertEEOCResponse({
          jobId: job.id,
          gender: payload.eeoc.gender?.trim() || null,
          ethnicity: payload.eeoc.ethnicity?.trim() || null,
          veteranStatus: payload.eeoc.veteranStatus?.trim() || null,
          disabilityStatus: payload.eeoc.disabilityStatus?.trim() || null,
        });
      } catch (eeocErr) {
        logger.warn(`Failed to store anonymous EEOC response: ${String(eeocErr)}`);
      }
    }

    // 8. Increment job applyCount
    await this.repository.incrementJobApplyCount(job.id);

    // 9. Dispatch background dual notification emails
    if (this.emailService) {
      // Email A: Candidate confirmation
      const candidateEmail = renderCandidateConfirmationEmail({
        candidateName: payload.candidateName,
        jobTitle: job.title,
        applicationId: application.id,
      });

      this.emailService
        .sendMail({
          to: normalizedEmail,
          subject: candidateEmail.subject,
          text: candidateEmail.text,
          html: candidateEmail.html,
        })
        .catch((err) =>
          logger.error(`Failed to send candidate confirmation email: ${String(err)}`),
        );

      // Email B: Recruiter notification
      const recruiterRecipient =
        ((this.envConfig as Record<string, unknown>)?.RECRUITER_NOTIFICATION_EMAIL as
          | string
          | undefined) ??
        this.envConfig?.ADMIN_EMAIL ??
        DEFAULT_RECRUITER_EMAIL;

      const recruiterEmail = renderRecruiterAlertEmail({
        candidateName: payload.candidateName,
        email: normalizedEmail,
        phone: payload.phone,
        jobTitle: job.title,
        applicationId: application.id,
        knockoutTriggered,
      });

      this.emailService
        .sendMail({
          to: recruiterRecipient,
          subject: recruiterEmail.subject,
          text: recruiterEmail.text,
          html: recruiterEmail.html,
        })
        .catch((err) => logger.error(`Failed to send recruiter alert email: ${String(err)}`));
    }

    return application;
  }

  /**
   * Submits general interest / talent pool candidate.
   */
  async submitTalentPool(payload: TalentPoolSubmitPayload) {
    if (!payload.name || payload.name.trim().length < 2) {
      throw new AppError(ErrorCode.BAD_REQUEST, CAREER_ERRORS.TALENT_NAME_TOO_SHORT);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = (payload.email || "").trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      throw new AppError(ErrorCode.BAD_REQUEST, CAREER_ERRORS.TALENT_EMAIL_INVALID);
    }

    // Resolve site ID
    let siteId = payload.siteId;
    if (!siteId) {
      siteId = (await this.repository.getDefaultSiteId()) || NIL_SITE_ID;
    }

    // Upload resume if provided
    let resumeStoragePath: string | null = null;
    if (payload.resumeFile) {
      const fileBytes = await this.validateResume(payload.resumeFile);
      const sanitizedName = (payload.resumeFile.name || "resume.pdf").replace(
        /[^a-zA-Z0-9._-]/g,
        "_",
      );
      const uniqueId = crypto.randomUUID();
      resumeStoragePath = `${siteId}/talent-pool/${uniqueId}_${sanitizedName}`;

      if (this.supabaseAdmin?.storage) {
        try {
          await this.supabaseAdmin.storage
            .from(RESUME_BUCKET)
            .upload(resumeStoragePath, fileBytes, {
              contentType: payload.resumeFile.type || "application/pdf",
              upsert: false,
            });
        } catch (uploadErr) {
          logger.warn(`Talent pool resume storage upload warning: ${String(uploadErr)}`);
        }
      }
    }

    const talent = await this.repository.insertTalentPoolCandidate({
      siteId,
      name: payload.name.trim(),
      email: normalizedEmail,
      phone: payload.phone?.trim() || null,
      skills: payload.skills || [],
      preferredRole: payload.preferredRole?.trim() || null,
      experienceLevel: (payload.experienceLevel as any) || JobExperienceLevel.MID,
      portfolioUrl: payload.portfolioUrl?.trim() || null,
      resumeStoragePath,
      notes: payload.notes?.trim() || null,
      consentDate: new Date(),
    });

    if (!talent) {
      throw new AppError("INTERNAL", CAREER_ERRORS.TALENT_INSERT_FAILED);
    }

    // Confirmation email
    if (this.emailService) {
      const talentEmail = renderTalentPoolConfirmationEmail({
        name: payload.name,
      });

      this.emailService
        .sendMail({
          to: normalizedEmail,
          subject: talentEmail.subject,
          text: talentEmail.text,
          html: talentEmail.html,
        })
        .catch((err) =>
          logger.error(`Failed to send talent pool confirmation email: ${String(err)}`),
        );
    }

    return talent;
  }

  /**
   * Submits a general career inquiry:
   * - Validates resume file if attached (extension, size, magic bytes)
   * - Saves candidate inquiry to talent pool table for persistent tracking
   * - Dispatches styled recruiter notification email with optional resume attachment
   */
  async submitCareerInquiry(
    payload: CareerInquiryPayload,
  ): Promise<{ ok: boolean; message: string }> {
    const fullName = payload.fullName.trim();
    const email = payload.email.trim().toLowerCase();
    const role = payload.role.trim();
    const message = payload.message.trim();

    if (!fullName) {
      throw new AppError(ErrorCode.BAD_REQUEST, CAREER_ERRORS.FULL_NAME_REQUIRED);
    }
    if (!email) {
      throw new AppError(ErrorCode.BAD_REQUEST, CAREER_ERRORS.EMAIL_REQUIRED);
    }
    if (!role) {
      throw new AppError(ErrorCode.BAD_REQUEST, CAREER_ERRORS.ROLE_REQUIRED);
    }
    if (!message || message.length < 5) {
      throw new AppError(ErrorCode.BAD_REQUEST, CAREER_ERRORS.MESSAGE_REQUIRED);
    }

    let resumeStoragePath: string | null = null;
    const attachments: Array<{ filename: string; content: Buffer }> = [];

    if (payload.resumeFile && payload.resumeFile.size > 0) {
      const resumeBytes = await this.validateResume(payload.resumeFile);
      const buffer = Buffer.from(resumeBytes);
      attachments.push({
        filename: payload.resumeFile.name || "resume.pdf",
        content: buffer,
      });

      const siteId = (await this.repository.getDefaultSiteId()) || NIL_SITE_ID;
      const sanitizedName = (payload.resumeFile.name || "resume.pdf").replace(
        /[^a-zA-Z0-9._-]/g,
        "_",
      );
      const uniqueId = crypto.randomUUID();
      resumeStoragePath = `${siteId}/inquiries/${uniqueId}_${sanitizedName}`;

      if (this.supabaseAdmin?.storage) {
        try {
          await this.supabaseAdmin.storage
            .from(RESUME_BUCKET)
            .upload(resumeStoragePath, resumeBytes, {
              contentType: payload.resumeFile.type || "application/pdf",
              upsert: false,
            });
        } catch (uploadErr) {
          logger.warn(`Inquiry resume storage upload warning: ${String(uploadErr)}`);
        }
      }
    }

    // Persist inquiry to talent pool table
    const siteId = (await this.repository.getDefaultSiteId()) || NIL_SITE_ID;
    try {
      await this.repository.insertTalentPoolCandidate({
        siteId,
        name: fullName,
        email,
        phone: null,
        skills: [],
        preferredRole: role,
        experienceLevel: JobExperienceLevel.MID,
        portfolioUrl: null,
        resumeStoragePath,
        notes: message,
        consentDate: new Date(),
      });
    } catch (dbErr) {
      logger.warn(`Could not save inquiry candidate to talent pool: ${String(dbErr)}`);
    }

    // Render & dispatch recruiter alert email
    if (this.emailService) {
      const rendered = renderCareerInquiryEmail({
        fullName,
        email,
        role,
        message,
        hasResume: attachments.length > 0,
        resumeName: payload.resumeFile?.name,
      });

      const adminEmail = this.envConfig.ADMIN_EMAIL || DEFAULT_RECRUITER_EMAIL;

      const result = await this.emailService.sendMail({
        from: `"${fullName}" <${this.envConfig.SMTP_USER || DEFAULT_RECRUITER_EMAIL}>`,
        to: adminEmail,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
        replyTo: email,
        attachments,
      });

      if (!result.ok) {
        throw new AppError(
          ErrorCode.INTERNAL,
          result.error || CAREER_ERRORS.CAREER_INQUIRY_EMAIL_FAIL,
        );
      }
    }

    return { ok: true, message: CAREER_ERRORS.INQUIRY_RECEIVED_SUCCESS };
  }
}
