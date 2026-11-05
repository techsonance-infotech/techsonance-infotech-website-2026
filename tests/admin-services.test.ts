import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminPostsService } from "../lib/services/admin-posts.service";
import { AdminJobsService } from "../lib/services/admin-jobs.service";

describe("AdminPostsService & AdminJobsService Tests", () => {
  let mockDb: any;
  let postsService: AdminPostsService;
  let jobsService: AdminJobsService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      query: {
        postsTable: {
          findMany: vi
            .fn()
            .mockResolvedValue([
              {
                id: "p1",
                title: "Test Post 1",
                slug: "test-post-1",
                status: "DRAFT",
                siteId: "s1",
              },
            ]),
          findFirst: vi.fn().mockResolvedValue({
            id: "p1",
            title: "Test Post 1",
            slug: "test-post-1",
            status: "DRAFT",
            versionId: 1,
            siteId: "s1",
          }),
        },
        jobsTable: {
          findMany: vi
            .fn()
            .mockResolvedValue([
              {
                id: "j1",
                title: "Fullstack Engineer",
                slug: "fullstack-engineer",
                status: "DRAFT",
                siteId: "s1",
              },
            ]),
          findFirst: vi.fn().mockResolvedValue({
            id: "j1",
            title: "Fullstack Engineer",
            slug: "fullstack-engineer",
            status: "DRAFT",
            versionId: 1,
            siteId: "s1",
          }),
        },
      },
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockImplementation(() => {
          const promise = Promise.resolve([{ cnt: 1 }]);
          (promise as any).where = vi.fn().mockResolvedValue([{ cnt: 1 }]);
          return promise;
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockResolvedValue([
              { id: "created-id", title: "Created", versionId: 1, slug: "created" },
            ]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([
                { id: "p1", title: "Updated", status: "PUBLISHED", versionId: 2, slug: "p1" },
              ]),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    };

    postsService = new AdminPostsService(mockDb);
    jobsService = new AdminJobsService(mockDb);
  });

  describe("AdminPostsService", () => {
    it("should list posts and return total count", async () => {
      const result = await postsService.listPosts({ limit: 10, offset: 0 });
      expect(result.posts.length).toBe(1);
      expect(result.posts[0].slug).toBe("test-post-1");
      expect(result.total).toBe(1);
    });

    it("should get post by id", async () => {
      const post = await postsService.getPostById("p1");
      expect(post).toBeDefined();
      expect(post?.title).toBe("Test Post 1");
    });

    it("should create post and record audit log and version history", async () => {
      const created = await postsService.createPost(
        {
          siteId: "s1",
          slug: "created",
          title: "Created",
          content: "Content",
        } as any,
        "actor-uuid-1",
      );

      expect(created.id).toBe("created-id");
      expect(mockDb.insert).toHaveBeenCalledTimes(3); // postsTable, auditLogsTable, versionsTable
    });

    it("should publish a post and update its status", async () => {
      const published = await postsService.publishPost("p1", "actor-1");
      expect(published.status).toBe("PUBLISHED");
      expect(published.versionId).toBe(2);
    });
  });

  describe("AdminJobsService", () => {
    it("should list jobs and return total count", async () => {
      const result = await jobsService.listJobs({ limit: 10, offset: 0 });
      expect(result.jobs.length).toBe(1);
      expect(result.jobs[0].title).toBe("Fullstack Engineer");
      expect(result.total).toBe(1);
    });

    it("should get job by id", async () => {
      const job = await jobsService.getJobById("j1");
      expect(job).toBeDefined();
      expect(job?.slug).toBe("fullstack-engineer");
    });

    it("should create job and record audit log and version history", async () => {
      const created = await jobsService.createJob(
        {
          siteId: "s1",
          slug: "created",
          title: "Created",
          department: "Engineering",
          location: "Remote",
          type: "Full Time",
          description: "Desc",
        } as any,
        "actor-uuid-1",
      );

      expect(created.id).toBe("created-id");
      expect(mockDb.insert).toHaveBeenCalledTimes(3); // jobsTable, auditLogsTable, versionsTable
    });
  });
});
