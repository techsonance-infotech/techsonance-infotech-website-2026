import { describe, it, expect, vi, beforeEach } from "vitest";
import { CareerApplyService } from "@/lib/services/career-apply.service";
import { AppError } from "@/lib/errors";

describe("CareerApplyService", () => {
  let mockDb: any;
  let mockEmailService: any;
  let mockSupabaseAdmin: any;
  let service: CareerApplyService;

  const mockJob = {
    id: "11111111-1111-1111-1111-111111111111",
    siteId: "22222222-2222-2222-2222-222222222222",
    slug: "senior-frontend-engineer",
    title: "Senior Frontend Engineer",
    versionId: 2,
    status: "PUBLISHED",
    closesAt: null,
    applyCount: 5,
    screeningQuestions: [
      {
        id: "q1",
        question: "Do you have 4+ years of React/TypeScript experience?",
        type: "boolean",
        required: true,
        knockoutAnswer: false, // If candidate answers false, knockoutTriggered = true
      },
      {
        id: "q2",
        question: "Are you willing to work in hybrid mode in Bhubaneswar?",
        type: "choice",
        options: ["Yes", "No"],
        required: true,
        knockoutAnswer: "No",
      },
    ],
  };

  // Valid PDF header bytes "%PDF-1.5..."
  const validPdfContent = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x0a, 0x25]);
  // Valid DOCX zip header bytes "PK\x03\x04..."
  const validDocxContent = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
  // Executable header bytes "MZ..."
  const fakeExeContent = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);

  beforeEach(() => {
    mockDb = {
      query: {
        jobsTable: {
          findFirst: vi.fn().mockResolvedValue(mockJob),
        },
        applicationsTable: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
        sitesTable: {
          findFirst: vi.fn().mockResolvedValue({ id: "22222222-2222-2222-2222-222222222222" }),
        },
        talentPoolTable: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockImplementation((val) =>
            Promise.resolve([
              {
                id: "app-uuid-1234",
                jobId: mockJob.id,
                candidateName: "John Doe",
                email: "john@example.com",
                status: "NEW",
                knockoutTriggered: false,
              },
            ]),
          ),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      }),
    };

    mockEmailService = {
      sendMail: vi.fn().mockResolvedValue({ ok: true, messageId: "msg-123" }),
    };

    mockSupabaseAdmin = {
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ data: { path: "resumes/test.pdf" }, error: null }),
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: "https://supabase.co/signed/resumes/test.pdf" },
            error: null,
          }),
        }),
      },
    };

    service = new CareerApplyService(mockDb, mockEmailService, mockSupabaseAdmin);
  });

  it("blocks submission if role is closed or deadline has passed", async () => {
    // 1. Role is closed
    mockDb.query.jobsTable.findFirst.mockResolvedValueOnce({
      ...mockJob,
      status: "CLOSED",
    });

    const file = new File([validPdfContent], "resume.pdf", { type: "application/pdf" });

    await expect(
      service.submitApplication({
        jobId: mockJob.id,
        candidateName: "John Doe",
        email: "john@example.com",
        resumeFile: file,
        privacyConsent: true,
      }),
    ).rejects.toThrow(/closed|no longer accepting/i);

    // 2. Deadline has passed
    mockDb.query.jobsTable.findFirst.mockResolvedValueOnce({
      ...mockJob,
      status: "PUBLISHED",
      closesAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    });

    await expect(
      service.submitApplication({
        jobId: mockJob.id,
        candidateName: "John Doe",
        email: "john@example.com",
        resumeFile: file,
        privacyConsent: true,
      }),
    ).rejects.toThrow(/deadline/i);
  });

  it("blocks duplicate application for same email and role", async () => {
    mockDb.query.applicationsTable.findFirst.mockResolvedValueOnce({
      id: "existing-app-id",
      email: "john@example.com",
    });

    const file = new File([validPdfContent], "resume.pdf", { type: "application/pdf" });

    await expect(
      service.submitApplication({
        jobId: mockJob.id,
        candidateName: "John Doe",
        email: "john@example.com",
        phone: "+91 9876543210",
        resumeFile: file,
        screeningAnswers: [{ questionId: "q1", question: "Experience", answer: true }],
        privacyConsent: true,
      }),
    ).rejects.toThrow(/already applied|already submitted/i);
  });

  it("flags knockoutTriggered if candidate fails knockout screening question", async () => {
    let insertedValues: any = null;
    mockDb.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockImplementation((val) => {
        insertedValues = val;
        return {
          returning: vi.fn().mockResolvedValue([
            {
              id: "app-uuid-1234",
              ...val,
            },
          ]),
        };
      }),
    });

    const file = new File([validPdfContent], "resume.pdf", { type: "application/pdf" });

    const result = await service.submitApplication({
      jobId: mockJob.id,
      candidateName: "Jane Doe",
      email: "jane@example.com",
      resumeFile: file,
      screeningAnswers: [
        {
          questionId: "q1",
          question: "Do you have 4+ years of React/TypeScript experience?",
          answer: false, // matches knockoutAnswer!
        },
      ],
      privacyConsent: true,
    });

    expect(result.knockoutTriggered).toBe(true);
    expect(insertedValues.knockoutTriggered).toBe(true);
  });

  it("validates file MIME type and size (<= 5MB)", async () => {
    // 1. Exceeds 5MB
    const largeContent = new Uint8Array(6 * 1024 * 1024);
    const largeFile = new File([largeContent], "huge.pdf", { type: "application/pdf" });

    await expect(
      service.submitApplication({
        jobId: mockJob.id,
        candidateName: "Big File",
        email: "bigfile@example.com",
        resumeFile: largeFile,
        privacyConsent: true,
      }),
    ).rejects.toThrow(/size|5MB/i);

    // 2. Disallowed extension
    const exeFile = new File([fakeExeContent], "evil.exe", { type: "application/x-msdownload" });
    await expect(
      service.submitApplication({
        jobId: mockJob.id,
        candidateName: "Bad File",
        email: "badfile@example.com",
        resumeFile: exeFile,
        privacyConsent: true,
      }),
    ).rejects.toThrow(/format|type/i);
  });

  it("verifies magic bytes and rejects disguised executables with .pdf extension", async () => {
    // Disguised exe named innocent.pdf
    const disguisedFile = new File([fakeExeContent], "innocent.pdf", { type: "application/pdf" });

    await expect(
      service.submitApplication({
        jobId: mockJob.id,
        candidateName: "Hacker",
        email: "hacker@example.com",
        resumeFile: disguisedFile,
        privacyConsent: true,
      }),
    ).rejects.toThrow(/magic bytes|format|content does not match/i);
  });

  it("accepts valid DOCX file with proper magic bytes PK\x03\x04", async () => {
    const docxFile = new File(
      [validDocxContent],
      "resume.docx",
      { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
    );

    const result = await service.submitApplication({
      jobId: mockJob.id,
      candidateName: "Docx Applicant",
      email: "docx@example.com",
      resumeFile: docxFile,
      privacyConsent: true,
    });

    expect(result).toBeDefined();
    expect(mockSupabaseAdmin.storage.from).toHaveBeenCalledWith("resumes");
  });

  it("stores resume in private bucket under {siteId}/{jobId}/{uuid}-{filename}", async () => {
    let capturedPath = "";
    mockSupabaseAdmin.storage.from.mockReturnValue({
      upload: vi.fn().mockImplementation((path: string) => {
        capturedPath = path;
        return Promise.resolve({ data: { path }, error: null });
      }),
      createSignedUrl: vi.fn().mockResolvedValue({
        data: { signedUrl: "https://supabase.co/signed/url" },
        error: null,
      }),
    });

    const file = new File([validPdfContent], "candidate_resume.pdf", { type: "application/pdf" });

    await service.submitApplication({
      jobId: mockJob.id,
      candidateName: "Jane Doe",
      email: "jane@example.com",
      resumeFile: file,
      privacyConsent: true,
    });

    expect(capturedPath).toMatch(
      new RegExp(`^${mockJob.siteId}/${mockJob.id}/[a-f0-9-]+_candidate_resume\\.pdf$`),
    );
  });

  it("dispatches dual emails (candidate confirmation + recruiter notification)", async () => {
    const file = new File([validPdfContent], "jane_cv.pdf", { type: "application/pdf" });

    await service.submitApplication({
      jobId: mockJob.id,
      candidateName: "Jane Doe",
      email: "jane@example.com",
      resumeFile: file,
      privacyConsent: true,
    });

    expect(mockEmailService.sendMail).toHaveBeenCalledTimes(2);

    const calls = mockEmailService.sendMail.mock.calls;
    const candidateEmail = calls.find((c: any) => c[0].to === "jane@example.com");
    const recruiterEmail = calls.find((c: any) => c[0].to !== "jane@example.com");

    expect(candidateEmail).toBeDefined();
    expect(candidateEmail[0].subject).toContain("Application Received");

    expect(recruiterEmail).toBeDefined();
    expect(recruiterEmail[0].subject).toContain("New Application");
    expect(recruiterEmail[0].html).toContain("/admin/careers/applications");
  });

  it("submits candidate to talent pool and dispatches confirmation email", async () => {
    let insertedTalent: any = null;
    mockDb.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockImplementation((val) => {
        insertedTalent = val;
        return {
          returning: vi.fn().mockResolvedValue([
            {
              id: "talent-uuid-5678",
              ...val,
            },
          ]),
        };
      }),
    });

    const result = await service.submitTalentPool({
      siteId: mockJob.siteId,
      name: "Alex Smith",
      email: "alex@example.com",
      phone: "+91 9999988888",
      skills: ["React", "Node.js", "PostgreSQL"],
      preferredRole: "Full Stack Engineer",
      notes: "Open to remote or hybrid roles",
    });

    expect(result.id).toBe("talent-uuid-5678");
    expect(insertedTalent.email).toBe("alex@example.com");
    expect(insertedTalent.skills).toEqual(["React", "Node.js", "PostgreSQL"]);

    expect(mockEmailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alex@example.com",
        subject: expect.stringContaining("Talent Pool"),
      }),
    );
  });
});

describe("Careers API Endpoints", () => {
  it("apply endpoint defeats bots when honeypot field is present", async () => {
    const { POST } = await import("@/app/api/careers/apply/route");

    const formData = new FormData();
    formData.append("website_url", "https://spam-bot.xyz");
    formData.append("jobId", "11111111-1111-1111-1111-111111111111");
    formData.append("candidateName", "Spam Bot");
    formData.append("email", "spambot@example.com");

    const req = new Request("http://localhost:3000/api/careers/apply", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.applicationId).toBe("simulated-id");
  });

  it("apply endpoint returns 400 when required fields are missing", async () => {
    const { POST } = await import("@/app/api/careers/apply/route");

    const formData = new FormData();
    formData.append("candidateName", "Incomplete Form");

    const req = new Request("http://localhost:3000/api/careers/apply", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error).toBeDefined();
  });

  it("talent-pool endpoint defeats bots when honeypot is triggered", async () => {
    const { POST } = await import("@/app/api/careers/talent-pool/route");

    const req = new Request("http://localhost:3000/api/careers/talent-pool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        website_url: "http://bot.com",
        name: "Bot Candidate",
        email: "bot@example.com",
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.id).toBe("simulated-id");
  });

  it("talent-pool endpoint returns 400 when name or email is missing", async () => {
    const { POST } = await import("@/app/api/careers/talent-pool/route");

    const req = new Request("http://localhost:3000/api/careers/talent-pool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "",
        email: "",
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/required/i);
  });
});

