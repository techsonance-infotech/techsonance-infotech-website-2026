import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { JobStatus, JobApprovalStatus } from "@/lib/database/enum";
import {
  createJobSchema,
  updateJobSchema,
  applicationSubmissionSchema,
} from "@/lib/validations/careers";

describe("Careers Validation Schemas", () => {
  it("validates a complete, valid job posting", () => {
    const validJob = {
      title: "Senior Fullstack Engineer",
      slug: "senior-fullstack-engineer",
      department: "Engineering",
      location: "Bhubaneswar, India",
      workMode: "hybrid",
      type: "full_time",
      summary: "Build scalable cloud platforms.",
      description: "Detailed job description here.",
      openingsCount: 2,
      salaryMin: 1200000,
      salaryMax: 1800000,
      salaryCurrency: "INR",
      salaryPeriod: "year",
      showSalaryPublicly: true,
      applicationMethod: "builtin",
      resumeRequired: true,
      coverLetterRequirement: "optional",
    };

    const result = createJobSchema.safeParse(validJob);
    expect(result.success).toBe(true);
  });

  it("rejects openings count <= 0", () => {
    const invalidJob = {
      title: "Senior Fullstack Engineer",
      slug: "senior-fullstack-engineer",
      department: "Engineering",
      location: "Bhubaneswar, India",
      summary: "Short summary",
      description: "Detailed description",
      openingsCount: 0,
    };

    const result = createJobSchema.safeParse(invalidJob);
    expect(result.success).toBe(false);
  });

  it("rejects salaryMin greater than salaryMax", () => {
    const invalidJob = {
      title: "Senior Fullstack Engineer",
      slug: "senior-fullstack-engineer",
      department: "Engineering",
      location: "Bhubaneswar, India",
      summary: "Short summary",
      description: "Detailed description",
      salaryMin: 2000000,
      salaryMax: 1000000,
    };

    const result = createJobSchema.safeParse(invalidJob);
    expect(result.success).toBe(false);
  });

  it("validates application submission payload", () => {
    const validApp = {
      candidateName: "John Doe",
      email: "john@example.com",
      phone: "+91 9876543210",
      resumeStoragePath: "resumes/site1/app1/resume.pdf",
      resumeFileName: "resume.pdf",
      resumeMimeType: "application/pdf",
      privacyConsent: true,
      talentPoolConsent: true,
    };

    const result = applicationSubmissionSchema.safeParse(validApp);
    expect(result.success).toBe(true);
  });

  it("rejects application submission without privacy consent", () => {
    const invalidApp = {
      candidateName: "John Doe",
      email: "john@example.com",
      resumeStoragePath: "resumes/site1/app1/resume.pdf",
      resumeFileName: "resume.pdf",
      resumeMimeType: "application/pdf",
      privacyConsent: false,
    };

    const result = applicationSubmissionSchema.safeParse(invalidApp);
    expect(result.success).toBe(false);
  });
});

describe("AdminJobsService Lifecycle State Machine", () => {
  let mockDb: any;
  let jobsService: AdminJobsService;
  let jobStore: Record<string, any>;
  let auditLogs: any[];
  let versionSnapshots: any[];

  beforeEach(() => {
    auditLogs = [];
    versionSnapshots = [];
    jobStore = {
      "job-1": {
        id: "job-1",
        slug: "fullstack-engineer",
        title: "Fullstack Engineer",
        status: JobStatus.DRAFT,
        approvalStatus: JobApprovalStatus.PENDING,
        versionId: 1,
        ownerId: "recruiter-1",
        siteId: "site-1",
      },
    };

    mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => Promise.resolve([jobStore["job-1"]])),
          })),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockImplementation((updates: any) => ({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockImplementation(() => {
              jobStore["job-1"] = {
                ...jobStore["job-1"],
                ...updates,
                versionId: (jobStore["job-1"].versionId || 1) + 1,
              };
              return Promise.resolve([jobStore["job-1"]]);
            }),
          }),
        })),
      }),
      insert: vi.fn().mockImplementation((table: any) => ({
        values: vi.fn().mockImplementation((val: any) => {
          if (val.action) auditLogs.push(val);
          if (val.snapshot) versionSnapshots.push(val);
          return Promise.resolve([val]);
        }),
      })),
    };

    jobsService = new AdminJobsService(mockDb);
  });

  it("allows transition from DRAFT to IN_REVIEW", async () => {
    const updated = await jobsService.transitionStatus(
      "job-1",
      JobStatus.IN_REVIEW,
      { userId: "recruiter-1", role: "recruiter" }
    );

    expect(updated.status).toBe(JobStatus.IN_REVIEW);
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(versionSnapshots.length).toBeGreaterThan(0);
  });

  it("prevents transition from DRAFT directly to PUBLISHED if approval is required and role is recruiter", async () => {
    await expect(
      jobsService.transitionStatus(
        "job-1",
        JobStatus.PUBLISHED,
        { userId: "recruiter-1", role: "recruiter" }
      )
    ).rejects.toThrow(/approval required/i);
  });

  it("allows Admin to approve IN_REVIEW to PUBLISHED or return to DRAFT with comment", async () => {
    // Put job into IN_REVIEW first
    jobStore["job-1"].status = JobStatus.IN_REVIEW;

    // Admin approves to PUBLISHED
    const published = await jobsService.transitionStatus(
      "job-1",
      JobStatus.PUBLISHED,
      { userId: "admin-1", role: "admin" }
    );
    expect(published.status).toBe(JobStatus.PUBLISHED);
    expect(published.approvalStatus).toBe(JobApprovalStatus.APPROVED);

    // Reset to IN_REVIEW to test return
    jobStore["job-1"].status = JobStatus.IN_REVIEW;
    const returned = await jobsService.transitionStatus(
      "job-1",
      JobStatus.DRAFT,
      { userId: "admin-1", role: "admin" },
      "Needs clearer salary range."
    );
    expect(returned.status).toBe(JobStatus.DRAFT);
    expect(returned.approvalStatus).toBe(JobApprovalStatus.RETURNED);
    expect(returned.approvalComment).toBe("Needs clearer salary range.");
  });

  it("allows pausing and re-opening published roles", async () => {
    jobStore["job-1"].status = JobStatus.PUBLISHED;

    // Pause role
    const paused = await jobsService.transitionStatus(
      "job-1",
      JobStatus.PAUSED,
      { userId: "recruiter-1", role: "recruiter" }
    );
    expect(paused.status).toBe(JobStatus.PAUSED);

    // Re-open role
    const reopened = await jobsService.transitionStatus(
      "job-1",
      JobStatus.PUBLISHED,
      { userId: "recruiter-1", role: "recruiter" }
    );
    expect(reopened.status).toBe(JobStatus.PUBLISHED);
  });

  it("allows closing roles from PUBLISHED or PAUSED", async () => {
    jobStore["job-1"].status = JobStatus.PUBLISHED;

    const closed = await jobsService.transitionStatus(
      "job-1",
      JobStatus.CLOSED,
      { userId: "recruiter-1", role: "recruiter" }
    );
    expect(closed.status).toBe(JobStatus.CLOSED);
    expect(closed.closedAt).toBeDefined();
  });

  it("rejects illegal transitions like ARCHIVED to IN_REVIEW", async () => {
    jobStore["job-1"].status = JobStatus.ARCHIVED;

    await expect(
      jobsService.transitionStatus(
        "job-1",
        JobStatus.IN_REVIEW,
        { userId: "admin-1", role: "admin" }
      )
    ).rejects.toThrow(/illegal transition/i);
  });
});
