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
    applyCount: 5,
    screeningQuestions: [
      {
        id: "q1",
        question: "Do you have 4+ years of React/TypeScript experience?",
        type: "boolean",
        required: true,
        knockoutAnswer: false, // If candidate answers false, knockoutTriggered = true
      },
    ],
  };

  beforeEach(() => {
    mockDb = {
      query: {
        jobsTable: {
          findFirst: vi.fn().mockResolvedValue(mockJob),
        },
        applicationsTable: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: "app-uuid-1234",
              jobId: mockJob.id,
              candidateName: "John Doe",
              email: "john@example.com",
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
      sendMail: vi.fn().mockResolvedValue({ ok: true }),
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

  it("blocks duplicate application for same email and role", async () => {
    mockDb.query.applicationsTable.findFirst.mockResolvedValueOnce({
      id: "existing-app-id",
      email: "john@example.com",
    });

    const file = new File(["dummy content"], "resume.pdf", { type: "application/pdf" });

    await expect(
      service.submitApplication({
        jobId: mockJob.id,
        candidateName: "John Doe",
        email: "john@example.com",
        phone: "+91 9876543210",
        resumeFile: file,
        screeningAnswers: [{ questionId: "q1", question: "Do you have 4+ years of React/TypeScript experience?", answer: true }],
        privacyConsent: true,
      })
    ).rejects.toThrow("Already applied");
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

    const file = new File(["dummy content"], "resume.pdf", { type: "application/pdf" });

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

  it("successfully submits application, uploads resume to private storage, and increments applyCount", async () => {
    const file = new File(["dummy content"], "jane_cv.pdf", { type: "application/pdf" });

    const result = await service.submitApplication({
      jobId: mockJob.id,
      candidateName: "Jane Doe",
      email: "jane@example.com",
      resumeFile: file,
      screeningAnswers: [
        {
          questionId: "q1",
          question: "Do you have 4+ years of React/TypeScript experience?",
          answer: true,
        },
      ],
      privacyConsent: true,
    });

    expect(result.id).toBe("app-uuid-1234");
    expect(mockSupabaseAdmin.storage.from).toHaveBeenCalledWith("resumes");
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockEmailService.sendMail).toHaveBeenCalledTimes(2); // Candidate confirmation + recruiter alert
  });

  it("rejects application when resume exceeds 5MB", async () => {
    const largeContent = new Uint8Array(6 * 1024 * 1024);
    const file = new File([largeContent], "huge.pdf", { type: "application/pdf" });

    await expect(
      service.submitApplication({
        jobId: mockJob.id,
        candidateName: "Big File",
        email: "bigfile@example.com",
        resumeFile: file,
        privacyConsent: true,
      })
    ).rejects.toThrow(/size|5MB/i);
  });

  it("rejects invalid resume file types", async () => {
    const file = new File(["malicious script"], "evil.exe", { type: "application/x-msdownload" });

    await expect(
      service.submitApplication({
        jobId: mockJob.id,
        candidateName: "Bad File",
        email: "badfile@example.com",
        resumeFile: file,
        privacyConsent: true,
      })
    ).rejects.toThrow(/format|type/i);
  });
});
