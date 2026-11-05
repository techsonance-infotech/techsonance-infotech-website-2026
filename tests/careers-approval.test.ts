import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { AdminJobsRepository } from "@/lib/repositories/admin-jobs.repository";
import { JobStatus, JobApprovalStatus } from "@/lib/database/enum/content.enum";
import { versionsTable } from "@/lib/database/schema/core/version.schema";

describe("Careers Approval Workflow & Version Restoration", () => {
  let mockDb: any;
  let jobsService: AdminJobsService;
  let mockJobRecord: any;
  let mockVersions: any[];
  let mockAuditLogs: any[];

  beforeEach(() => {
    vi.clearAllMocks();

    mockJobRecord = {
      id: "job-123",
      siteId: "site-456",
      title: "Senior Fullstack Engineer",
      slug: "senior-fullstack-engineer",
      department: "Engineering",
      status: JobStatus.IN_REVIEW,
      approvalStatus: JobApprovalStatus.PENDING,
      approvalComment: null,
      publishAt: null,
      closesAt: null,
      publishedAt: null,
      closedAt: null,
      versionId: 2,
      ownerId: "recruiter-001",
    };

    mockVersions = [
      {
        id: "ver-1",
        entityType: "job",
        entityId: "job-123",
        snapshot: {
          id: "job-123",
          title: "Initial Fullstack Engineer Draft",
          slug: "initial-fullstack-engineer-draft",
          department: "Engineering",
          status: JobStatus.DRAFT,
          approvalStatus: JobApprovalStatus.PENDING,
          versionId: 1,
        },
        changedBy: "recruiter-001",
        createdAt: new Date("2026-11-01T10:00:00Z"),
      },
    ];

    mockAuditLogs = [];

    mockDb = {
      query: {
        jobsTable: {
          findFirst: vi.fn().mockImplementation(() => Promise.resolve(mockJobRecord)),
          findMany: vi.fn().mockImplementation(() => Promise.resolve([mockJobRecord])),
        },
      },
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation((table: any) => ({
          where: vi.fn().mockImplementation((condition: any) => {
            // For versions query
            const resultPromise = Promise.resolve(mockVersions);
            (resultPromise as any).limit = vi.fn().mockImplementation((limitNum: number) => {
              return Promise.resolve(mockVersions.slice(0, limitNum));
            });
            (resultPromise as any).orderBy = vi.fn().mockImplementation(() => {
              const ordered = Promise.resolve([...mockVersions]);
              (ordered as any).limit = vi.fn().mockResolvedValue([...mockVersions]);
              return ordered;
            });

            // For jobs query
            const jobPromise = Promise.resolve([mockJobRecord]);
            (jobPromise as any).limit = vi.fn().mockResolvedValue([mockJobRecord]);
            (jobPromise as any).orderBy = vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([mockJobRecord]),
              }),
            });

            return table === versionsTable ||
              table?._?.name === "ts_content_versions" ||
              (table && String(table).includes("versions"))
              ? resultPromise
              : jobPromise;
          }),
        })),
      })),
      insert: vi.fn().mockImplementation((table: any) => ({
        values: vi.fn().mockImplementation((val: any) => {
          if (val.entityType === "job" && val.snapshot) {
            mockVersions.push({
              id: `ver-${mockVersions.length + 1}`,
              ...val,
              createdAt: new Date(),
            });
          }
          if (val.action) {
            mockAuditLogs.push(val);
          }
          return {
            returning: vi.fn().mockResolvedValue([mockJobRecord]),
          };
        }),
      })),
      update: vi.fn().mockImplementation(() => ({
        set: vi.fn().mockImplementation((updates: any) => ({
          where: vi.fn().mockImplementation(() => {
            mockJobRecord = { ...mockJobRecord, ...updates };
            return {
              returning: vi.fn().mockResolvedValue([mockJobRecord]),
            };
          }),
        })),
      })),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
      transaction: vi.fn().mockImplementation((fn: any) => fn(mockDb)),
    };

    jobsService = new AdminJobsService(new AdminJobsRepository(mockDb));
  });

  it("approves IN_REVIEW job to PUBLISHED status", async () => {
    mockJobRecord.status = JobStatus.IN_REVIEW;
    mockJobRecord.approvalStatus = JobApprovalStatus.PENDING;

    const result = await jobsService.approveJob("job-123", "admin-001");

    expect(result.status).toBe(JobStatus.PUBLISHED);
    expect(result.approvalStatus).toBe(JobApprovalStatus.APPROVED);
    expect(result.publishedAt).toBeDefined();
    expect(result.versionId).toBe(3);
  });

  it("approves IN_REVIEW job with future publishAt to SCHEDULED status", async () => {
    mockJobRecord.status = JobStatus.IN_REVIEW;
    mockJobRecord.approvalStatus = JobApprovalStatus.PENDING;
    mockJobRecord.publishAt = new Date(Date.now() + 86400000 * 7); // 7 days in future

    const result = await jobsService.approveJob("job-123", "admin-001");

    expect(result.status).toBe(JobStatus.SCHEDULED);
    expect(result.approvalStatus).toBe(JobApprovalStatus.APPROVED);
  });

  it("returns IN_REVIEW job to DRAFT status with comment", async () => {
    mockJobRecord.status = JobStatus.IN_REVIEW;
    mockJobRecord.approvalStatus = JobApprovalStatus.PENDING;

    const feedback = "Please add salary range and expand responsibilities.";
    const result = await jobsService.returnJob("job-123", feedback, "admin-001");

    expect(result.status).toBe(JobStatus.DRAFT);
    expect(result.approvalStatus).toBe(JobApprovalStatus.RETURNED);
    expect(result.approvalComment).toBe(feedback);
  });

  it("rejects returnJob when comment is empty or blank", async () => {
    mockJobRecord.status = JobStatus.IN_REVIEW;

    await expect(jobsService.returnJob("job-123", "", "admin-001")).rejects.toThrow(
      /comment.*required/i,
    );
    await expect(jobsService.returnJob("job-123", "   ", "admin-001")).rejects.toThrow(
      /comment.*required/i,
    );
  });

  it("lists version history and restores selected version snapshot", async () => {
    const versions = await jobsService.listVersions("job-123");
    expect(Array.isArray(versions)).toBe(true);
    expect(versions.length).toBeGreaterThan(0);
    expect(versions[0].id).toBe("ver-1");

    const restored = await jobsService.restoreVersion("job-123", "ver-1", "admin-001");
    expect(restored.title).toBe("Initial Fullstack Engineer Draft");
    expect(restored.slug).toBe("initial-fullstack-engineer-draft");
    expect(restored.versionId).toBe(3); // Bumped from 2 to 3
  });
});
