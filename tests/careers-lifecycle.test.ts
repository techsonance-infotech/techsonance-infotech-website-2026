import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { JobStatus, JobApprovalStatus } from "@/lib/database/enum/content.enum";
import {
  jobPostingInputSchema,
  createJobSchema,
  updateJobSchema,
  jobStatusTransitionSchema,
  applicationSubmissionSchema,
} from "@/lib/validations/careers";

describe("Careers Validation Schemas", () => {
  const validJobInput = {
    title: "Senior Fullstack Engineer",
    slug: "senior-fullstack-engineer",
    referenceCode: "ENG-2026-01",
    department: "Engineering",
    openingsCount: 2,
    summary: "Lead the development of next-generation web applications using Next.js 16 and React 19.",
    workMode: "hybrid" as const,
    location: "Bhubaneswar, India",
    type: "full_time" as const,
    experienceLevel: "senior" as const,
    description: "Detailed job description with requirements and company mission.",
    responsibilities: ["Architect scalable APIs", "Lead code reviews"],
    requirements: ["5+ years TypeScript", "Next.js App Router expertise"],
    skills: ["TypeScript", "Next.js", "PostgreSQL"],
    salaryMin: 1200000,
    salaryMax: 2400000,
    salaryCurrency: "INR",
    salaryPeriod: "year" as const,
    showSalaryPublicly: true,
    applicationMethod: "builtin" as const,
    resumeRequired: true,
    coverLetterRequirement: "optional" as const,
    status: "DRAFT" as const,
    visibility: "public" as const,
  };

  it("validates a compliant job posting payload", () => {
    const parsed = createJobSchema.safeParse(validJobInput);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.openingsCount).toBe(2);
      expect(parsed.data.location).toBe("Bhubaneswar, India");
    }
  });

  it("enforces positive openings count (openingsCount >= 1)", () => {
    const invalid = { ...validJobInput, openingsCount: 0 };
    const parsed = createJobSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("enforces salary minimum <= salary maximum", () => {
    const invalid = { ...validJobInput, salaryMin: 3000000, salaryMax: 1500000 };
    const parsed = createJobSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const issue = parsed.error.issues.find((i) => i.path.includes("salaryMax"));
      expect(issue).toBeDefined();
    }
  });

  it("enforces strict single-location rule", () => {
    const multipleLocations = { ...validJobInput, location: "Multiple Locations" };
    const parsedMultiple = createJobSchema.safeParse(multipleLocations);
    expect(parsedMultiple.success).toBe(false);

    const dualCities = { ...validJobInput, location: "London and New York" };
    const parsedDual = createJobSchema.safeParse(dualCities);
    expect(parsedDual.success).toBe(false);

    const remoteJob = { ...validJobInput, location: "Remote" };
    const parsedRemote = createJobSchema.safeParse(remoteJob);
    expect(parsedRemote.success).toBe(true);
  });

  it("validates partial updates with updateJobSchema", () => {
    const validUpdate = {
      summary: "Updated short summary describing the modern technology stack.",
      openingsCount: 3,
    };
    const parsed = updateJobSchema.safeParse(validUpdate);
    expect(parsed.success).toBe(true);

    const invalidSalaryUpdate = {
      salaryMin: 500000,
      salaryMax: 400000,
    };
    const parsedInvalid = updateJobSchema.safeParse(invalidSalaryUpdate);
    expect(parsedInvalid.success).toBe(false);
  });

  it("validates job status transitions with jobStatusTransitionSchema", () => {
    const validTransition = { targetStatus: "PUBLISHED", comment: "Approved by Head of Engineering" };
    const parsed = jobStatusTransitionSchema.safeParse(validTransition);
    expect(parsed.success).toBe(true);

    const invalidTransition = { targetStatus: "UNKNOWN_STATUS" };
    const parsedInvalid = jobStatusTransitionSchema.safeParse(invalidTransition);
    expect(parsedInvalid.success).toBe(false);
  });

  it("validates application submissions with mandatory privacy consent", () => {
    const validApplication = {
      candidateName: "Aarav Sharma",
      email: "aarav.sharma@example.com",
      phone: "+91 9876543210",
      resumeStoragePath: "resumes/aarav-sharma-2026.pdf",
      resumeFileName: "aarav-resume.pdf",
      resumeMimeType: "application/pdf",
      privacyConsent: true,
      talentPoolConsent: true,
      screeningAnswers: [
        {
          questionId: "q1",
          question: "Do you have 3+ years experience with Next.js?",
          answer: "Yes",
          isKnockout: false,
        },
      ],
    };

    const parsed = applicationSubmissionSchema.safeParse(validApplication);
    expect(parsed.success).toBe(true);

    const missingConsent = { ...validApplication, privacyConsent: false };
    const parsedNoConsent = applicationSubmissionSchema.safeParse(missingConsent);
    expect(parsedNoConsent.success).toBe(false);

    const invalidEmail = { ...validApplication, email: "not-an-email" };
    const parsedInvalidEmail = applicationSubmissionSchema.safeParse(invalidEmail);
    expect(parsedInvalidEmail.success).toBe(false);
  });
});

describe("AdminJobsService Lifecycle State Machine", () => {
  let mockDb: any;
  let jobsService: AdminJobsService;
  let mockJobRecord: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockJobRecord = {
      id: "job-123",
      siteId: "site-456",
      title: "Senior Fullstack Engineer",
      slug: "senior-fullstack-engineer",
      status: JobStatus.DRAFT,
      approvalStatus: JobApprovalStatus.PENDING,
      approvalComment: null,
      publishAt: null,
      closesAt: null,
      publishedAt: null,
      closedAt: null,
      versionId: 1,
      ownerId: "recruiter-001",
    };

    mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            const resultPromise = Promise.resolve([mockJobRecord]);
            (resultPromise as any).limit = vi.fn().mockResolvedValue([mockJobRecord]);
            (resultPromise as any).orderBy = vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([mockJobRecord]),
              }),
            });
            return resultPromise;
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockJobRecord]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockImplementation((updates: any) => ({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockImplementation(() => {
              mockJobRecord = { ...mockJobRecord, ...updates };
              return Promise.resolve([mockJobRecord]);
            }),
          }),
        })),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    };

    jobsService = new AdminJobsService(mockDb);
  });

  it("allows transition from DRAFT to IN_REVIEW", async () => {
    const actor = { userId: "recruiter-001", role: "recruiter" };
    const updated = await jobsService.transitionStatus(
      "job-123",
      JobStatus.IN_REVIEW,
      actor,
    );

    expect(updated.status).toBe(JobStatus.IN_REVIEW);
    expect(updated.approvalStatus).toBe(JobApprovalStatus.PENDING);
  });

  it("prevents transition from DRAFT directly to PUBLISHED if approval is required and role is recruiter", async () => {
    const actor = { userId: "recruiter-001", role: "recruiter" };
    await expect(
      jobsService.transitionStatus("job-123", JobStatus.PUBLISHED, actor),
    ).rejects.toThrow();
  });

  it("allows Admin to bypass approval and publish DRAFT directly", async () => {
    const adminActor = { userId: "admin-001", role: "admin" };
    const updated = await jobsService.transitionStatus(
      "job-123",
      JobStatus.PUBLISHED,
      adminActor,
    );

    expect(updated.status).toBe(JobStatus.PUBLISHED);
    expect(updated.approvalStatus).toBe(JobApprovalStatus.APPROVED);
    expect(updated.publishedAt).toBeDefined();
  });

  it("allows Admin to approve IN_REVIEW to PUBLISHED or return to DRAFT with comment", async () => {
    mockJobRecord.status = JobStatus.IN_REVIEW;
    const adminActor = { userId: "admin-001", role: "admin" };

    // Approve to PUBLISHED
    const published = await jobsService.transitionStatus(
      "job-123",
      JobStatus.PUBLISHED,
      adminActor,
    );
    expect(published.status).toBe(JobStatus.PUBLISHED);
    expect(published.approvalStatus).toBe(JobApprovalStatus.APPROVED);

    // Return to DRAFT with comment
    mockJobRecord.status = JobStatus.IN_REVIEW;
    mockJobRecord.approvalStatus = JobApprovalStatus.PENDING;
    const returned = await jobsService.transitionStatus(
      "job-123",
      JobStatus.DRAFT,
      adminActor,
      "Please add salary details and clarify responsibilities.",
    );
    expect(returned.status).toBe(JobStatus.DRAFT);
    expect(returned.approvalStatus).toBe(JobApprovalStatus.RETURNED);
    expect(returned.approvalComment).toBe("Please add salary details and clarify responsibilities.");
  });

  it("allows Admin to schedule IN_REVIEW when publishAt date is set", async () => {
    mockJobRecord.status = JobStatus.IN_REVIEW;
    mockJobRecord.publishAt = new Date("2026-12-01T00:00:00Z");
    const adminActor = { userId: "admin-001", role: "admin" };

    const scheduled = await jobsService.transitionStatus(
      "job-123",
      JobStatus.SCHEDULED,
      adminActor,
    );
    expect(scheduled.status).toBe(JobStatus.SCHEDULED);
    expect(scheduled.approvalStatus).toBe(JobApprovalStatus.APPROVED);
  });

  it("rejects transition to SCHEDULED when publishAt is missing", async () => {
    mockJobRecord.status = JobStatus.IN_REVIEW;
    mockJobRecord.publishAt = null;
    const adminActor = { userId: "admin-001", role: "admin" };

    await expect(
      jobsService.transitionStatus("job-123", JobStatus.SCHEDULED, adminActor),
    ).rejects.toThrow();
  });

  it("allows pausing and re-opening published roles", async () => {
    mockJobRecord.status = JobStatus.PUBLISHED;
    const actor = { userId: "recruiter-001", role: "recruiter" };

    const paused = await jobsService.transitionStatus(
      "job-123",
      JobStatus.PAUSED,
      actor,
    );
    expect(paused.status).toBe(JobStatus.PAUSED);

    const reopened = await jobsService.transitionStatus(
      "job-123",
      JobStatus.PUBLISHED,
      actor,
    );
    expect(reopened.status).toBe(JobStatus.PUBLISHED);
  });

  it("allows closing roles from PUBLISHED or PAUSED", async () => {
    mockJobRecord.status = JobStatus.PUBLISHED;
    const actor = { userId: "recruiter-001", role: "recruiter" };

    const closedFromPublished = await jobsService.transitionStatus(
      "job-123",
      JobStatus.CLOSED,
      actor,
    );
    expect(closedFromPublished.status).toBe(JobStatus.CLOSED);
    expect(closedFromPublished.closedAt).toBeDefined();

    mockJobRecord.status = JobStatus.PAUSED;
    const closedFromPaused = await jobsService.transitionStatus(
      "job-123",
      JobStatus.CLOSED,
      actor,
    );
    expect(closedFromPaused.status).toBe(JobStatus.CLOSED);
  });

  it("allows Admin to archive CLOSED roles", async () => {
    mockJobRecord.status = JobStatus.CLOSED;
    const adminActor = { userId: "admin-001", role: "admin" };

    const archived = await jobsService.transitionStatus(
      "job-123",
      JobStatus.ARCHIVED,
      adminActor,
    );
    expect(archived.status).toBe(JobStatus.ARCHIVED);
  });

  it("prevents Recruiter from archiving CLOSED roles", async () => {
    mockJobRecord.status = JobStatus.CLOSED;
    const recruiterActor = { userId: "recruiter-001", role: "recruiter" };

    await expect(
      jobsService.transitionStatus("job-123", JobStatus.ARCHIVED, recruiterActor),
    ).rejects.toThrow();
  });

  it("prevents illegal status transitions such as ARCHIVED to IN_REVIEW or DRAFT to CLOSED", async () => {
    mockJobRecord.status = JobStatus.ARCHIVED;
    const adminActor = { userId: "admin-001", role: "admin" };

    await expect(
      jobsService.transitionStatus("job-123", JobStatus.IN_REVIEW, adminActor),
    ).rejects.toThrow();

    mockJobRecord.status = JobStatus.DRAFT;
    await expect(
      jobsService.transitionStatus("job-123", JobStatus.CLOSED, adminActor),
    ).rejects.toThrow();
  });
});
