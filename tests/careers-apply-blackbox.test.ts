import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/careers/apply/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { CareerApplyService } from "@/lib/services/career-apply.service";
import { CareerApplicationsRepository } from "@/lib/repositories/career-applications.repository";
import { ApplicationStatus } from "@/lib/database/enum/content.enum";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";

describe("POST /api/careers/apply — End-to-End Black Box Tests", () => {
  let mockDb: any;
  let mockRepository: any;
  let mockEmailService: any;
  let mockSupabaseAdmin: any;

  const testJob = {
    id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    siteId: "ffffffff-1111-2222-3333-444444444444",
    slug: "principal-ai-systems-engineer",
    title: "Principal AI Systems Engineer",
    versionId: 1,
    status: "PUBLISHED",
    closesAt: null,
    applyCount: 4,
    screeningQuestions: [
      {
        id: "q_years",
        question: "Do you have 6+ years in production LLM/AI architecture?",
        type: "boolean",
        required: true,
        knockoutAnswer: false,
      },
    ],
  };

  // Valid binary signatures
  const validPdfBytes = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x0a]); // %PDF-1.5
  const validDocxBytes = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]); // PK\x03\x04
  const dangerousExeBytes = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // MZ (Windows PE Executable)

  beforeEach(() => {
    resetRootContainer();

    mockDb = {
      query: {
        jobsTable: { findFirst: vi.fn().mockResolvedValue(testJob) },
        applicationsTable: { findFirst: vi.fn().mockResolvedValue(null) },
        talentPoolTable: { findFirst: vi.fn().mockResolvedValue(null) },
        sitesTable: { findFirst: vi.fn().mockResolvedValue({ id: testJob.siteId }) },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: "app-uuid-8888",
              jobId: testJob.id,
              candidateName: "Jordan Vance",
              email: "jordan.vance@example.com",
              status: "NEW",
              knockoutTriggered: false,
            },
          ]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    };

    mockRepository = new CareerApplicationsRepository(mockDb as any);
    vi.spyOn(mockRepository, "findJobById").mockResolvedValue(testJob as any);
    vi.spyOn(mockRepository, "findExistingApplication").mockResolvedValue(null);
    vi.spyOn(mockRepository, "insertApplication").mockResolvedValue({
      id: "app-uuid-8888",
      siteId: testJob.siteId,
      jobId: testJob.id,
      jobVersionId: 1,
      candidateName: "Jordan Vance",
      email: "jordan.vance@example.com",
      status: ApplicationStatus.NEW,
      knockoutTriggered: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.spyOn(mockRepository, "insertTalentPoolCandidate").mockResolvedValue({
      id: "talent-uuid-8888",
      siteId: testJob.siteId,
      name: "Jordan Vance",
      email: "jordan.vance@example.com",
      skills: [],
      consentDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.spyOn(mockRepository, "incrementJobApplyCount").mockResolvedValue(undefined as any);
    vi.spyOn(mockRepository, "getDefaultSiteId").mockResolvedValue(testJob.siteId);

    mockEmailService = {
      sendMail: vi.fn().mockResolvedValue({ success: true, messageId: "msg_123" }),
    };

    mockSupabaseAdmin = {
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ data: { path: "resumes/test.pdf" }, error: null }),
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: "https://storage.supabase.co/resumes/signed-test.pdf" },
            error: null,
          }),
        }),
      },
    };

    const testService = new CareerApplyService(
      mockDb as any,
      mockEmailService as any,
      mockSupabaseAdmin as any,
      { ADMIN_EMAIL: "recruiting@techsonance.co.in", SMTP_USER: "smtp@techsonance.co.in" } as any,
      mockRepository,
    );

    const container = getContainer();
    container.bind({ provide: CareerApplyService, useValue: testService });
  });

  it("1. Successfully submits valid application with PDF resume from genuine origin", async () => {
    const formData = new FormData();
    formData.append("jobId", testJob.id);
    formData.append("candidateName", "Jordan Vance");
    formData.append("email", "jordan.vance@example.com");
    formData.append("phone", "+91 9988776655");
    formData.append("currentLocation", "Bangalore, India");
    formData.append("portfolioUrl", "https://jordanvance.ai");
    formData.append("githubUrl", "https://github.com/jordanvance");
    formData.append("linkedinUrl", "https://linkedin.com/in/jordanvance");
    formData.append("coverLetter", "Excited to join the Techsonance engineering team!");
    formData.append("noticePeriodWeeks", "2");
    formData.append("privacyConsent", "true");
    formData.append("talentPoolConsent", "true");
    formData.append("source", "career_portal");

    const screening = [
      {
        questionId: "q_years",
        question: "Do you have 6+ years in production LLM/AI architecture?",
        answer: true,
      },
    ];
    formData.append("screeningAnswers", JSON.stringify(screening));

    const resumeBlob = new Blob([validPdfBytes], { type: "application/pdf" });
    formData.append("resumeFile", resumeBlob, "jordan_resume.pdf");

    const req = new Request("http://localhost:3000/api/careers/apply", {
      method: "POST",
      headers: {
        origin: "https://www.techsonance.co.in",
      },
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data).toBeDefined();
    expect(json.data.applicationId).toBeDefined();
    expect(json.data.status).toBe("NEW");
    expect(json.applicationId).toBe(json.data.applicationId);
    expect(res.headers.get("x-request-id")).toBeDefined();
  });

  it("2. Successfully submits valid application with DOCX document", async () => {
    const formData = new FormData();
    formData.append("jobId", testJob.id);
    formData.append("candidateName", "Jordan Vance");
    formData.append("email", "jordan.vance@example.com");
    formData.append("privacyConsent", "true");

    const resumeBlob = new Blob([validDocxBytes], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    formData.append("resumeFile", resumeBlob, "jordan_resume.docx");

    const req = new Request("http://localhost:3000/api/careers/apply", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.status).toBe("NEW");
  });

  it("3. Anti-bot honeypot traps spam bots with silent 200 simulation", async () => {
    const botFormData = new FormData();
    botFormData.append("jobId", testJob.id);
    botFormData.append("candidateName", "Spam Bot 3000");
    botFormData.append("email", "bot@spammer.org");
    botFormData.append("website_url", "http://spam-payload.xyz"); // Honeypot trigger!

    const req = new Request("http://localhost:3000/api/careers/apply", {
      method: "POST",
      body: botFormData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.applicationId).toBe("simulated-id");
  });

  it("4. Rejects request with 403 FORBIDDEN when submitted from unauthorized foreign origin", async () => {
    const formData = new FormData();
    formData.append("jobId", testJob.id);
    formData.append("candidateName", "Malicious Caller");
    formData.append("email", "malicious@attacker.com");
    formData.append("privacyConsent", "true");

    const resumeBlob = new Blob([validPdfBytes], { type: "application/pdf" });
    formData.append("resumeFile", resumeBlob, "resume.pdf");

    const req = new Request("http://localhost:3000/api/careers/apply", {
      method: "POST",
      headers: {
        origin: "https://malicious-phishing-site.com",
      },
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.errorPayload.code).toBe("FORBIDDEN");
  });

  it("5. Rejects request with 400 when mandatory resume is missing", async () => {
    const formData = new FormData();
    formData.append("jobId", testJob.id);
    formData.append("candidateName", "Jordan Vance");
    formData.append("email", "jordan.vance@example.com");
    formData.append("privacyConsent", "true");
    // No resumeFile provided

    const req = new Request("http://localhost:3000/api/careers/apply", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe(CAREER_ERRORS.RESUME_DOCUMENT_REQUIRED);
  });

  it("6. Rejects request with 400 when privacy consent is false or omitted", async () => {
    const formData = new FormData();
    formData.append("jobId", testJob.id);
    formData.append("candidateName", "Jordan Vance");
    formData.append("email", "jordan.vance@example.com");
    formData.append("privacyConsent", "false"); // Disallowed

    const resumeBlob = new Blob([validPdfBytes], { type: "application/pdf" });
    formData.append("resumeFile", resumeBlob, "resume.pdf");

    const req = new Request("http://localhost:3000/api/careers/apply", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe(CAREER_ERRORS.PRIVACY_CONSENT_REQUIRED);
  });

  it("7. Rejects executable disguised as PDF with 415 UNSUPPORTED_MEDIA", async () => {
    const formData = new FormData();
    formData.append("jobId", testJob.id);
    formData.append("candidateName", "Sneaky Attacker");
    formData.append("email", "sneaky@attacker.com");
    formData.append("privacyConsent", "true");

    // Executable binary disguised with .pdf filename
    const fakeBlob = new Blob([dangerousExeBytes], { type: "application/pdf" });
    formData.append("resumeFile", fakeBlob, "exploit.pdf");

    const req = new Request("http://localhost:3000/api/careers/apply", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(415);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe(CAREER_ERRORS.RESUME_PDF_MAGIC);
  });
});
