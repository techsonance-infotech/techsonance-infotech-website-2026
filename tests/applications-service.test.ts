import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplicationsService } from "@/lib/services/applications.service";
import { ApplicationStatus } from "@/lib/database/enum/content.enum";
import { AppError } from "@/lib/errors";

describe("ApplicationsService", () => {
  let mockDb: any;
  let mockSupabaseAdmin: any;
  let service: ApplicationsService;

  const mockApp = {
    id: "app-1111-2222-3333",
    siteId: "site-uuid",
    jobId: "job-uuid",
    candidateName: "Alex Rivera",
    email: "alex@example.com",
    phone: "+91 9999999999",
    status: ApplicationStatus.NEW,
    rating: null,
    internalNotes: null,
    rejectionReason: null,
    knockoutTriggered: false,
    resumeStoragePath: "resumes/job-uuid/alex_resume.pdf",
    resumeFileName: "alex_resume.pdf",
    resumeMimeType: "application/pdf",
    createdAt: new Date("2026-11-01T10:00:00.000Z"),
  };

  const mockJob = {
    id: "job-uuid",
    title: "Senior Full Stack Engineer",
  };

  beforeEach(() => {
    mockDb = {
      query: {
        applicationsTable: {
          findFirst: vi.fn().mockResolvedValue(mockApp),
          findMany: vi.fn().mockResolvedValue([{ ...mockApp, job: mockJob }]),
        },
      },
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ ...mockApp, status: ApplicationStatus.SCREENING }]),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue([{ id: "audit-uuid" }]),
      }),
    };

    mockSupabaseAdmin = {
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: "https://supabase.co/signed/resumes/job-uuid/alex_resume.pdf?token=xyz" },
            error: null,
          }),
        }),
      },
    };

    service = new ApplicationsService(mockDb, mockSupabaseAdmin);
  });

  it("transitions applicant between stages and logs audit event", async () => {
    const result = await service.updateStage(
      mockApp.id,
      ApplicationStatus.SCREENING,
      undefined,
      "recruiter-user-id"
    );

    expect(result.status).toBe(ApplicationStatus.SCREENING);
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.insert).toHaveBeenCalled(); // Audit log entry
  });

  it("records rejectionReason when transitioned to REJECTED", async () => {
    mockDb.update.mockReturnValueOnce({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { ...mockApp, status: ApplicationStatus.REJECTED, rejectionReason: "Lacks required experience" },
          ]),
        }),
      }),
    });

    const result = await service.updateStage(
      mockApp.id,
      ApplicationStatus.REJECTED,
      "Lacks required experience",
      "recruiter-user-id"
    );

    expect(result.status).toBe(ApplicationStatus.REJECTED);
    expect(result.rejectionReason).toBe("Lacks required experience");
  });

  it("updates internal notes and rating (1-5 stars)", async () => {
    mockDb.update.mockReturnValueOnce({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { ...mockApp, rating: 5, internalNotes: "Exceptional architecture test solution" },
          ]),
        }),
      }),
    });

    const result = await service.updateNotesAndRating(
      mockApp.id,
      "Exceptional architecture test solution",
      5,
      "recruiter-user-id"
    );

    expect(result.rating).toBe(5);
    expect(result.internalNotes).toBe("Exceptional architecture test solution");
  });

  it("rejects invalid rating outside 1-5 range", async () => {
    await expect(
      service.updateNotesAndRating(mockApp.id, "Note", 6)
    ).rejects.toThrow("Rating must be between 1 and 5");
  });

  it("generates short-lived signed URL for resume download", async () => {
    const signedUrl = await service.getSignedResumeUrl(mockApp.id);
    expect(signedUrl).toContain("https://supabase.co/signed/resumes");
    expect(mockSupabaseAdmin.storage.from).toHaveBeenCalledWith("resumes");
  });

  it("exports applications as CSV string with proper headers", async () => {
    const csv = await service.exportApplicationsCsv();
    expect(csv).toContain("ID,Candidate Name,Email,Phone,Status,Job Title,Knockout Triggered,Rating,Created At");
    expect(csv).toContain("Alex Rivera");
    expect(csv).toContain("alex@example.com");
  });
});
