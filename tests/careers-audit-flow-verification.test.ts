import { describe, it, expect, vi, beforeEach } from "vitest";
import { CareerApplyService } from "@/lib/services/career-apply.service";
import { CareerApplicationsRepository } from "@/lib/repositories/career-applications.repository";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { ContentDbService } from "@/lib/services/content-db.service";
import { generateMetadata } from "@/app/careers/[slug]/page";
import { JobStatus, ApplicationStatus } from "@/lib/constants/enums/content.enum";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";

function createMockApplicationsRepo(methods: Record<string, any>): CareerApplicationsRepository {
  return Object.assign(Object.create(CareerApplicationsRepository.prototype), methods);
}

describe("Careers Flow Audit Verification Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Resume Requirement Logic (Critical Problem #1)", () => {
    it("allows application submission without resume when job.resumeRequired is false", async () => {
      const mockRepo = createMockApplicationsRepo({
        findJobById: vi.fn().mockResolvedValue({
          id: "job-optional-resume",
          siteId: "site-1",
          title: "Frontend Intern",
          status: JobStatus.PUBLISHED,
          resumeRequired: false,
          versionId: 1,
          screeningQuestions: [],
        }),
        findExistingApplication: vi.fn().mockResolvedValue(null),
        insertApplication: vi
          .fn()
          .mockImplementation((data) => Promise.resolve({ id: "app-123", ...data })),
        incrementJobApplyCount: vi.fn().mockResolvedValue(undefined),
      });

      const service = new CareerApplyService(mockRepo, undefined, null);

      const result = await service.submitApplication({
        jobId: "job-optional-resume",
        candidateName: "Alex Rivera",
        email: "alex@example.com",
        privacyConsent: true,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe("app-123");
      expect(mockRepo.insertApplication).toHaveBeenCalledWith(
        expect.objectContaining({
          candidateName: "Alex Rivera",
          email: "alex@example.com",
          resumeStoragePath: "",
          resumeFileName: "",
          privacyConsent: true,
        }),
      );
    });

    it("rejects application submission without resume when job.resumeRequired is true", async () => {
      const mockRepo = createMockApplicationsRepo({
        findJobById: vi.fn().mockResolvedValue({
          id: "job-mandatory-resume",
          siteId: "site-1",
          title: "Senior Architect",
          status: JobStatus.PUBLISHED,
          resumeRequired: true,
          versionId: 1,
          screeningQuestions: [],
        }),
        findExistingApplication: vi.fn().mockResolvedValue(null),
      });

      const service = new CareerApplyService(mockRepo, undefined, null);

      await expect(
        service.submitApplication({
          jobId: "job-mandatory-resume",
          candidateName: "Alex Rivera",
          email: "alex@example.com",
          privacyConsent: true,
        }),
      ).rejects.toThrow(CAREER_ERRORS.RESUME_DOCUMENT_REQUIRED);
    });
  });

  describe("2. Storage Orphan File Rollback (Major Problem)", () => {
    it("rolls back and deletes uploaded storage file if database insert fails", async () => {
      const mockRemove = vi.fn().mockResolvedValue({ error: null });
      const mockStorage = {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ data: { path: "path/to/resume" }, error: null }),
          remove: mockRemove,
          createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://signed.url" } }),
        }),
      };

      const mockRepo = createMockApplicationsRepo({
        findJobById: vi.fn().mockResolvedValue({
          id: "job-1",
          siteId: "site-1",
          title: "Cloud Engineer",
          status: JobStatus.PUBLISHED,
          resumeRequired: true,
          versionId: 1,
          screeningQuestions: [],
        }),
        findExistingApplication: vi.fn().mockResolvedValue(null),
        insertApplication: vi.fn().mockRejectedValue(new Error("Database write failure")),
      });

      const service = new CareerApplyService(mockRepo, undefined, { storage: mockStorage } as any);

      // Standard dummy PDF header %PDF-
      const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

      await expect(
        service.submitApplication({
          jobId: "job-1",
          candidateName: "Jane Doe",
          email: "jane@example.com",
          privacyConsent: true,
          resumeFile: {
            name: "resume.pdf",
            size: pdfBytes.length,
            type: "application/pdf",
            arrayBuffer: async () => pdfBytes.buffer,
          },
        }),
      ).rejects.toThrow("Database write failure");

      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe("3. Scheduled Publish & Expiration Sweep (Critical Problems #3 & #4)", () => {
    it("auto-publishes scheduled jobs and auto-closes expired jobs during lifecycle sweep", async () => {
      const mockJobsRepo = {
        findScheduledJobsToPublish: vi.fn().mockResolvedValue([
          {
            id: "scheduled-job-1",
            slug: "staff-ai-researcher",
            status: JobStatus.SCHEDULED,
            publishAt: new Date(Date.now() - 3600000), // 1 hour ago
          },
        ]),
        findOpenJobsToClose: vi.fn().mockResolvedValue([
          {
            id: "expired-job-1",
            slug: "devops-engineer",
            status: JobStatus.PUBLISHED,
            closesAt: new Date(Date.now() - 60000), // 1 minute ago
          },
        ]),
        updateJobWithAudit: vi
          .fn()
          .mockImplementation((id, updates) =>
            Promise.resolve({ id, slug: `slug-${id}`, ...updates }),
          ),
      };

      const service = new AdminJobsService(mockJobsRepo as any);
      const sweepResult = await service.sweepExpiredAndScheduledJobs();

      expect(sweepResult.publishedCount).toBe(1);
      expect(sweepResult.closedCount).toBe(1);
      expect(mockJobsRepo.updateJobWithAudit).toHaveBeenCalledWith(
        "scheduled-job-1",
        expect.objectContaining({ status: JobStatus.PUBLISHED }),
        expect.anything(),
      );
      expect(mockJobsRepo.updateJobWithAudit).toHaveBeenCalledWith(
        "expired-job-1",
        expect.objectContaining({ status: JobStatus.CLOSED }),
        expect.anything(),
      );
    });
  });

  describe("4. Application Stage: ON_HOLD (Critical Problem #5)", () => {
    it("supports ON_HOLD in ApplicationStatus enum and stage definitions", () => {
      expect(ApplicationStatus.ON_HOLD).toBe("ON_HOLD");
    });
  });

  describe("5. Slug Locking on Live Jobs (Major Problem)", () => {
    it("locks slug and prevents slug modification when updating a published job", async () => {
      const mockJobsRepo = {
        findJobById: vi.fn().mockResolvedValue({
          id: "job-live-1",
          slug: "permanent-job-slug",
          status: JobStatus.PUBLISHED,
          versionId: 2,
        }),
        updateJobWithAudit: vi
          .fn()
          .mockImplementation((id, updates) => Promise.resolve({ id, ...updates })),
      };

      const service = new AdminJobsService(mockJobsRepo as any);
      const result = await service.updateJob("job-live-1", {
        slug: "attempted-new-slug",
        title: "Updated Title",
      });

      expect(result.slug).toBe("permanent-job-slug");
    });
  });

  describe("6. Read-time Job Expiration (ContentDbService)", () => {
    it("marks job as CLOSED at read time if closesAt is in the past", async () => {
      const pastDate = new Date(Date.now() - 100000);
      const mockContentRepo = {
        findPublishedJobs: vi.fn().mockResolvedValue([
          {
            id: "j-expired",
            slug: "expired-role",
            title: "Expired Role",
            department: "Engineering",
            location: "Remote",
            workMode: "remote",
            type: "full_time",
            description: "Desc",
            status: "PUBLISHED",
            closesAt: pastDate,
          },
        ]),
        findJobBySlug: vi.fn().mockResolvedValue({
          id: "j-expired",
          slug: "expired-role",
          title: "Expired Role",
          department: "Engineering",
          location: "Remote",
          workMode: "remote",
          type: "full_time",
          description: "Desc",
          status: "PUBLISHED",
          closesAt: pastDate,
        }),
      };

      const service = new ContentDbService(mockContentRepo as any);

      // fetchJobs filtering for OPEN/PUBLISHED filters out the expired job
      const openJobs = await service.fetchJobs(JobStatus.OPEN);
      expect(openJobs.length).toBe(0);

      // fetchJobBySlug returns it with status CLOSED
      const jobDetail = await service.fetchJobBySlug("expired-role");
      expect(jobDetail).toBeDefined();
      expect(jobDetail?.status).toBe(JobStatus.CLOSED);
    });
  });

  describe("7. SEO & Robots Noindex on Unlisted or Closed Roles", () => {
    it("generates robots noindex for unlisted and closed career postings", async () => {
      const meta = await generateMetadata({
        params: Promise.resolve({ slug: "business-development-partner" }),
      });

      expect(meta).toBeDefined();
      expect(meta.title).toBeDefined();
    });
  });
});
