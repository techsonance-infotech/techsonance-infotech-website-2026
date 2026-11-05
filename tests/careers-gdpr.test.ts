import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplicationsService } from "@/lib/services/applications.service";
import { applicationsTable } from "@/lib/database/schema/core/application.schema";
import { talentPoolTable } from "@/lib/database/schema/core/talent-pool.schema";
import { auditLogsTable } from "@/lib/database/schema/core/audit.schema";

describe("GDPR Compliance: Candidate Data Export & Permanent Deletion", () => {
  let mockDb: any;
  let mockSupabaseAdmin: any;
  let applicationsService: ApplicationsService;

  let existingApplications: any[];
  let existingTalentPool: any[];
  let auditLogs: any[];
  let deletedStoragePaths: string[];

  beforeEach(() => {
    vi.clearAllMocks();

    existingApplications = [
      {
        id: "app-1",
        email: "candidate@example.com",
        candidateName: "Jane Doe",
        jobId: "job-100",
        resumeStoragePath: "resumes/jane-doe-resume-1.pdf",
        screeningAnswers: [{ questionId: "q1", answer: "5 years" }],
      },
      {
        id: "app-2",
        email: "candidate@example.com",
        candidateName: "Jane Doe",
        jobId: "job-200",
        resumeStoragePath: "resumes/jane-doe-resume-2.pdf",
        screeningAnswers: [{ questionId: "q1", answer: "Remote only" }],
      },
    ];

    existingTalentPool = [
      {
        id: "tp-1",
        email: "candidate@example.com",
        name: "Jane Doe",
        resumeStoragePath: "resumes/jane-doe-talent-pool.pdf",
        skills: ["React", "Node.js"],
      },
    ];

    auditLogs = [];
    deletedStoragePaths = [];

    mockSupabaseAdmin = {
      storage: {
        from: vi.fn().mockReturnValue({
          remove: vi.fn().mockImplementation((paths: string[]) => {
            deletedStoragePaths.push(...paths);
            return Promise.resolve({ data: paths, error: null });
          }),
        }),
      },
    };

    mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation((table: any) => ({
          where: vi.fn().mockImplementation(() => {
            if (table === talentPoolTable || table?._?.name === "ts_content_talent_pool") {
              return Promise.resolve(existingTalentPool);
            }
            if (table === applicationsTable || table?._?.name === "ts_content_applications") {
              return Promise.resolve(existingApplications);
            }
            return Promise.resolve([]);
          }),
        })),
      })),
      delete: vi.fn().mockImplementation((table: any) => ({
        where: vi.fn().mockImplementation(() => {
          if (table === talentPoolTable || table?._?.name === "ts_content_talent_pool") {
            const count = existingTalentPool.length;
            existingTalentPool = [];
            return Promise.resolve({ rowCount: count });
          }
          if (table === applicationsTable || table?._?.name === "ts_content_applications") {
            const count = existingApplications.length;
            existingApplications = [];
            return Promise.resolve({ rowCount: count });
          }
          return Promise.resolve({ rowCount: 0 });
        }),
      })),
      insert: vi.fn().mockImplementation((table: any) => ({
        values: vi.fn().mockImplementation((val: any) => {
          if (table === auditLogsTable || val.action) {
            auditLogs.push(val);
          }
          return Promise.resolve();
        }),
      })),
    };

    applicationsService = new ApplicationsService(mockDb, mockSupabaseAdmin);
  });

  it("exports candidate data across applications and talent pool records", async () => {
    const candidateData = await applicationsService.exportCandidateData("candidate@example.com");

    expect(candidateData.email).toBe("candidate@example.com");
    expect(candidateData.applications.length).toBe(2);
    expect(candidateData.talentPoolSubmissions.length).toBe(1);
    expect(candidateData.applications[0].candidateName).toBe("Jane Doe");
    expect(candidateData.talentPoolSubmissions[0].skills).toContain("React");
  });

  it("permanently purges candidate applications, talent pool rows, and resumes from storage", async () => {
    const result = await applicationsService.purgeCandidateData(
      "candidate@example.com",
      "admin-compliance-officer",
      "127.0.0.1",
    );

    expect(result.success).toBe(true);
    expect(result.deletedApplicationsCount).toBe(2);
    expect(result.deletedTalentPoolCount).toBe(1);
    expect(result.deletedFilesCount).toBe(3);

    // Assert files purged from storage
    expect(deletedStoragePaths).toContain("resumes/jane-doe-resume-1.pdf");
    expect(deletedStoragePaths).toContain("resumes/jane-doe-resume-2.pdf");
    expect(deletedStoragePaths).toContain("resumes/jane-doe-talent-pool.pdf");

    // Assert audit log was recorded
    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0].action).toBe("compliance.candidate_purged");
    expect(auditLogs[0].actorId).toBe("admin-compliance-officer");
    expect(auditLogs[0].ipAddress).toBe("127.0.0.1");
    expect(auditLogs[0].afterState.email).toBe("candidate@example.com");
  });

  it("throws an error when attempting to purge with an invalid or empty email", async () => {
    await expect(applicationsService.purgeCandidateData("")).rejects.toThrow(
      /valid candidate email is required/i,
    );
    await expect(applicationsService.purgeCandidateData("   ")).rejects.toThrow(
      /valid candidate email is required/i,
    );
  });
});
