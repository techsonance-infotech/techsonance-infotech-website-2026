import { describe, it, expect, vi, beforeEach } from "vitest";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { CareerApplyService } from "@/lib/services/career-apply.service";
import { EmailService } from "@/lib/services/email.service";
import { CareerApplicationsRepository } from "@/lib/repositories/career-applications.repository";
import { ApplicationStatus } from "@/lib/database/enum/content.enum";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";

describe("Careers Backend Endpoints — Client-Side Form Payload Verification", () => {
  let mockDb: any;
  let mockEmailService: any;
  let mockSupabaseAdmin: any;
  let mockRepository: any;

  const sampleJob = {
    id: "33333333-3333-3333-3333-333333333333",
    siteId: "44444444-4444-4444-4444-444444444444",
    slug: "senior-backend-architect",
    title: "Senior Backend Architect",
    versionId: 1,
    status: "PUBLISHED",
    closesAt: null,
    applyCount: 10,
    screeningQuestions: [
      {
        id: "q_exp",
        question: "Do you have 5+ years of distributed backend systems experience?",
        type: "boolean",
        required: true,
        knockoutAnswer: false,
      },
    ],
  };

  // Valid PDF header bytes: %PDF-
  const validPdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x0a]);

  beforeEach(() => {
    resetRootContainer();
    mockDb = {
      query: {
        jobsTable: { findFirst: vi.fn().mockResolvedValue(sampleJob) },
        applicationsTable: { findFirst: vi.fn().mockResolvedValue(null) },
        talentPoolTable: { findFirst: vi.fn().mockResolvedValue(null) },
        sitesTable: {
          findFirst: vi.fn().mockResolvedValue({ id: "44444444-4444-4444-4444-444444444444" }),
        },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: "app-uuid-9999",
              jobId: sampleJob.id,
              candidateName: "Alex Rivera",
              email: "alex.rivera@example.com",
              status: "NEW",
              knockoutTriggered: false,
            },
          ]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      }),
    };

    mockEmailService = {
      sendMail: vi.fn().mockResolvedValue({ ok: true, messageId: "email-ack-123" }),
    };

    mockSupabaseAdmin = {
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ data: { path: "resumes/alex.pdf" }, error: null }),
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: "https://supabase.co/storage/v1/resumes/alex.pdf" },
            error: null,
          }),
        }),
      },
    };

    mockRepository = new CareerApplicationsRepository(mockDb as any);
    vi.spyOn(mockRepository, "findJobById").mockResolvedValue(sampleJob as any);
    vi.spyOn(mockRepository, "findExistingApplication").mockResolvedValue(null);
    vi.spyOn(mockRepository, "insertApplication").mockResolvedValue({
      id: "app-uuid-9999",
      siteId: sampleJob.siteId,
      jobId: sampleJob.id,
      jobVersionId: 1,
      candidateName: "Alex Rivera",
      email: "alex.rivera@example.com",
      status: ApplicationStatus.NEW,
      knockoutTriggered: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.spyOn(mockRepository, "insertTalentPoolCandidate").mockResolvedValue({
      id: "talent-uuid-1111",
      siteId: sampleJob.siteId,
      name: "Alex Rivera",
      email: "alex.rivera@example.com",
      skills: [],
      consentDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.spyOn(mockRepository, "incrementJobApplyCount").mockResolvedValue(undefined as any);
    vi.spyOn(mockRepository, "getDefaultSiteId").mockResolvedValue(sampleJob.siteId);

    const testService = new CareerApplyService(
      mockDb as any,
      mockEmailService as any,
      mockSupabaseAdmin as any,
      { ADMIN_EMAIL: "recruiting@techsonance.co.in", SMTP_USER: "smtp@techsonance.co.in" } as any,
      mockRepository,
    );

    // Bind into container so route handlers resolve it
    const container = getContainer();
    container.bind({ provide: CareerApplyService, useValue: testService });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ENDPOINT 1: POST /api/careers (General Career / Partnership Inquiries)
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Endpoint 1: POST /api/careers", () => {
    it("successfully processes client-side FormData payload and saves to talent pool + emails recruiter", async () => {
      const { POST } = await import("@/app/api/careers/route");

      const clientFormData = new FormData();
      clientFormData.append("fullName", "Alex Rivera");
      clientFormData.append("email", "alex.rivera@example.com");
      clientFormData.append("role", "Lead Cloud Systems Architect");
      clientFormData.append(
        "message",
        "I have 8+ years building enterprise systems and would love to join Techsonance.",
      );

      const resumeBlob = new Blob([validPdfBuffer], { type: "application/pdf" });
      clientFormData.append("resume", resumeBlob, "alex_rivera_cv.pdf");

      const req = new Request("http://localhost:3000/api/careers", {
        method: "POST",
        body: clientFormData,
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.ok).toBe(true);
      expect(json.message).toBe(CAREER_ERRORS.INQUIRY_RECEIVED_SUCCESS);

      // Verify repository tracked candidate in talent pool
      expect(mockRepository.insertTalentPoolCandidate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Alex Rivera",
          email: "alex.rivera@example.com",
          preferredRole: "Lead Cloud Systems Architect",
        }),
      );

      // Verify email was dispatched
      expect(mockEmailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "recruiting@techsonance.co.in",
          subject: expect.stringContaining("Alex Rivera"),
          attachments: expect.arrayContaining([
            expect.objectContaining({ filename: "alex_rivera_cv.pdf" }),
          ]),
        }),
      );
    });

    it("rejects client submission when required fields (role, email, message) are missing", async () => {
      const { POST } = await import("@/app/api/careers/route");

      const invalidFormData = new FormData();
      invalidFormData.append("fullName", "Alex Rivera");
      // missing email, role, message

      const req = new Request("http://localhost:3000/api/careers", {
        method: "POST",
        body: invalidFormData,
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.ok).toBe(false);
      expect(json.error).toBeDefined();
    });

    it("defeats spam bots when honeypot field is present", async () => {
      const { POST } = await import("@/app/api/careers/route");

      const botFormData = new FormData();
      botFormData.append("fullName", "Spam Bot");
      botFormData.append("email", "bot@spammer.com");
      botFormData.append("role", "Bot Role");
      botFormData.append("message", "Spam content buy links");
      botFormData.append("website_url", "https://spamlink.com"); // honeypot trigger

      const req = new Request("http://localhost:3000/api/careers", {
        method: "POST",
        body: botFormData,
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.ok).toBe(true);
      // Ensure no actual email or database insert was made
      expect(mockEmailService.sendMail).not.toHaveBeenCalled();
      expect(mockRepository.insertTalentPoolCandidate).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ENDPOINT 2: POST /api/careers/apply (Formal Job Application Submission)
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Endpoint 2: POST /api/careers/apply", () => {
    it("successfully processes client-side payload exactly matching JobDetailClient form submission", async () => {
      const { POST } = await import("@/app/api/careers/apply/route");

      // Exactly replicates lines 240-285 in JobDetailClient.tsx
      const clientFormData = new FormData();
      clientFormData.append("jobId", sampleJob.id);
      clientFormData.append("candidateName", "Alex Rivera");
      clientFormData.append("email", "alex.rivera@example.com");
      clientFormData.append("phone", "+91 9876543210");
      clientFormData.append("currentLocation", "Bhubaneswar, India");
      clientFormData.append("portfolioUrl", "https://alexrivera.dev");
      clientFormData.append("githubUrl", "https://github.com/alexrivera");
      clientFormData.append("linkedinUrl", "https://linkedin.com/in/alexrivera");
      clientFormData.append(
        "coverLetter",
        "Excited to apply for the Senior Backend Architect role!",
      );
      clientFormData.append("noticePeriodWeeks", "4");
      clientFormData.append("privacyConsent", "true");
      clientFormData.append("talentPoolConsent", "true");
      clientFormData.append("source", "careers_page");

      // Screening answers exactly formatted as client does
      const screeningAnswers = [
        {
          questionId: "q_exp",
          question: "Do you have 5+ years of distributed backend systems experience?",
          answer: true,
        },
      ];
      clientFormData.append("screeningAnswers", JSON.stringify(screeningAnswers));

      // Resume file with valid magic bytes
      const resumeBlob = new Blob([validPdfBuffer], { type: "application/pdf" });
      clientFormData.append("resumeFile", resumeBlob, "alex_rivera_resume.pdf");

      const req = new Request("http://localhost:3000/api/careers/apply", {
        method: "POST",
        body: clientFormData,
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.ok).toBe(true);
      expect(json.applicationId).toBe("app-uuid-9999");
      expect(json.status).toBe("NEW");

      // Verify repository insert Application was called with client data
      expect(mockRepository.insertApplication).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: sampleJob.id,
          candidateName: "Alex Rivera",
          email: "alex.rivera@example.com",
          phone: "+91 9876543210",
          currentLocation: "Bhubaneswar, India",
          noticePeriodWeeks: 4,
          privacyConsentDate: expect.any(Date),
          talentPoolConsent: true,
        }),
      );

      // Verify applyCount incremented
      expect(mockRepository.incrementJobApplyCount).toHaveBeenCalledWith(sampleJob.id);
    });

    it("rejects application when privacy consent is not given", async () => {
      const { POST } = await import("@/app/api/careers/apply/route");

      const clientFormData = new FormData();
      clientFormData.append("jobId", sampleJob.id);
      clientFormData.append("candidateName", "Alex Rivera");
      clientFormData.append("email", "alex.rivera@example.com");
      clientFormData.append("privacyConsent", "false"); // Consent refused

      const resumeBlob = new Blob([validPdfBuffer], { type: "application/pdf" });
      clientFormData.append("resumeFile", resumeBlob, "alex_rivera_resume.pdf");

      const req = new Request("http://localhost:3000/api/careers/apply", {
        method: "POST",
        body: clientFormData,
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.ok).toBe(false);
      expect(json.error).toBe(CAREER_ERRORS.PRIVACY_CONSENT_REQUIRED);
    });

    it("rejects application when resume document is missing", async () => {
      const { POST } = await import("@/app/api/careers/apply/route");

      const clientFormData = new FormData();
      clientFormData.append("jobId", sampleJob.id);
      clientFormData.append("candidateName", "Alex Rivera");
      clientFormData.append("email", "alex.rivera@example.com");
      clientFormData.append("privacyConsent", "true");
      // missing resumeFile

      const req = new Request("http://localhost:3000/api/careers/apply", {
        method: "POST",
        body: clientFormData,
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.ok).toBe(false);
      expect(json.error).toBe(CAREER_ERRORS.RESUME_DOCUMENT_REQUIRED);
    });

    it("detects and flags knockout trigger when candidate answers knockout question with knockout answer", async () => {
      const { POST } = await import("@/app/api/careers/apply/route");

      const clientFormData = new FormData();
      clientFormData.append("jobId", sampleJob.id);
      clientFormData.append("candidateName", "Junior Candidate");
      clientFormData.append("email", "junior@example.com");
      clientFormData.append("privacyConsent", "true");

      // Answer false to question with knockoutAnswer = false
      const screeningAnswers = [
        {
          questionId: "q_exp",
          question: "Do you have 5+ years of distributed backend systems experience?",
          answer: false, // Knockout!
        },
      ];
      clientFormData.append("screeningAnswers", JSON.stringify(screeningAnswers));

      const resumeBlob = new Blob([validPdfBuffer], { type: "application/pdf" });
      clientFormData.append("resumeFile", resumeBlob, "junior_cv.pdf");

      const req = new Request("http://localhost:3000/api/careers/apply", {
        method: "POST",
        body: clientFormData,
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.ok).toBe(true);

      expect(mockRepository.insertApplication).toHaveBeenCalledWith(
        expect.objectContaining({
          knockoutTriggered: true,
        }),
      );
    });

    it("returns 409 Conflict when candidate has already applied with the same email", async () => {
      const { POST } = await import("@/app/api/careers/apply/route");

      // Mock duplicate existing application found
      mockRepository.findExistingApplication.mockResolvedValueOnce({
        id: "existing-app-123",
        email: "alex.rivera@example.com",
      });

      const clientFormData = new FormData();
      clientFormData.append("jobId", sampleJob.id);
      clientFormData.append("candidateName", "Alex Rivera");
      clientFormData.append("email", "alex.rivera@example.com");
      clientFormData.append("privacyConsent", "true");

      const resumeBlob = new Blob([validPdfBuffer], { type: "application/pdf" });
      clientFormData.append("resumeFile", resumeBlob, "alex_cv.pdf");

      const req = new Request("http://localhost:3000/api/careers/apply", {
        method: "POST",
        body: clientFormData,
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(409);
      expect(json.ok).toBe(false);
      expect(json.error).toBe(CAREER_ERRORS.DUPLICATE_APPLICATION);
    });
  });
});
