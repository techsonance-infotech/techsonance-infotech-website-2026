import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getPostSource, legacyPostSource, cmsPostSource } from "@/lib/content/posts";
import { getJobSource, legacyJobSource, cmsJobSource } from "@/lib/content/jobs";
import { resetEnv } from "@/lib/env";
import { getContainer, createTestContainer } from "@/lib/di/container";
import { ContentDbService } from "@/lib/services/content-db.service";
import { SUPABASE_CLIENT_TOKEN, DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";

describe("Content Abstraction Layer", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    resetEnv();
  });

  afterEach(() => {
    process.env = originalEnv;
    resetEnv();
  });

  describe("Posts Source", () => {
    it("defaults to legacyPostSource when CONTENT_SOURCE_BLOG is not set", () => {
      delete process.env.CONTENT_SOURCE_BLOG;
      resetEnv();
      const source = getPostSource();
      expect(source).toBe(legacyPostSource);
    });

    it("switches to cmsPostSource when CONTENT_SOURCE_BLOG is set to 'cms'", () => {
      process.env.CONTENT_SOURCE_BLOG = "cms";
      resetEnv();
      const source = getPostSource();
      expect(source).toBe(cmsPostSource);
    });

    it("legacyPostSource.list() returns all published blog posts in canonical BlogPost shape", async () => {
      const posts = await legacyPostSource.list();
      expect(Array.isArray(posts)).toBe(true);
      expect(posts.length).toBeGreaterThanOrEqual(8);

      const firstPost = posts[0];
      expect(firstPost).toHaveProperty("slug");
      expect(firstPost).toHaveProperty("title");
      expect(firstPost).toHaveProperty("excerpt");
      expect(firstPost).toHaveProperty("content");
      expect(firstPost).toHaveProperty("category");
      expect(firstPost).toHaveProperty("date");
      expect(firstPost).toHaveProperty("readTime");
      expect(firstPost).toHaveProperty("authors");
      expect(firstPost).toHaveProperty("heroImage");
      expect(firstPost).toHaveProperty("tags");
      expect(firstPost.status).toBe("PUBLISHED");
      expect(Array.isArray(firstPost.authors)).toBe(true);
      expect(firstPost.authors[0]).toHaveProperty("name");
    });

    it("legacyPostSource.list() filters by category", async () => {
      const allPosts = await legacyPostSource.list();
      const swPosts = await legacyPostSource.list({ category: "Software Engineering" });

      expect(swPosts.length).toBeGreaterThan(0);
      expect(swPosts.length).toBeLessThan(allPosts.length);
      expect(swPosts.every((p) => p.category === "Software Engineering")).toBe(true);
    });

    it("legacyPostSource.get() returns post by slug or null if not found", async () => {
      const post = await legacyPostSource.get("cms-techsonance-enterprise-multi-tenant-architecture");
      expect(post).not.toBeNull();
      expect(post?.slug).toBe("cms-techsonance-enterprise-multi-tenant-architecture");
      expect(post?.title).toContain("Architecting an Enterprise Multi-Tenant CMS & HRMS");

      const notFound = await legacyPostSource.get("non-existent-slug-xyz");
      expect(notFound).toBeNull();
    });

    it("legacyPostSource.slugs() returns array of all available post slugs", async () => {
      const slugs = await legacyPostSource.slugs();
      expect(Array.isArray(slugs)).toBe(true);
      expect(slugs.length).toBeGreaterThanOrEqual(8);
      expect(slugs).toContain("cms-techsonance-enterprise-multi-tenant-architecture");
    });
  });

  describe("Jobs Source", () => {
    it("defaults to legacyJobSource when CONTENT_SOURCE_CAREERS is not set", () => {
      delete process.env.CONTENT_SOURCE_CAREERS;
      resetEnv();
      const source = getJobSource();
      expect(source).toBe(legacyJobSource);
    });

    it("switches to cmsJobSource when CONTENT_SOURCE_CAREERS is set to 'cms'", () => {
      process.env.CONTENT_SOURCE_CAREERS = "cms";
      resetEnv();
      const source = getJobSource();
      expect(source).toBe(cmsJobSource);
    });

    it("legacyJobSource.list() returns all jobs with status and canonical JobPosting shape", async () => {
      const jobs = await legacyJobSource.list();
      expect(jobs.length).toBe(2);

      const bdPartner = jobs.find((j) => j.slug === "business-development-partner");
      expect(bdPartner).toBeDefined();
      expect(bdPartner?.status).toBe("OPEN");
      expect(bdPartner?.title).toBe("Business Development Partner");
      expect(bdPartner?.department).toBe("Business Development");
      expect(bdPartner?.responsibilities.length).toBeGreaterThan(0);
      expect(bdPartner?.requirements.length).toBeGreaterThan(0);

      const intern = jobs.find((j) => j.slug === "full-stack-developer-intern");
      expect(intern).toBeDefined();
      expect(intern?.status).toBe("CLOSED");
    });

    it("legacyJobSource.list({ status: 'OPEN' }) returns only open positions", async () => {
      const openJobs = await legacyJobSource.list({ status: "OPEN" });
      expect(openJobs.length).toBe(1);
      expect(openJobs[0].slug).toBe("business-development-partner");
    });

    it("legacyJobSource.get() returns position by slug or null if not found", async () => {
      const job = await legacyJobSource.get("business-development-partner");
      expect(job).not.toBeNull();
      expect(job?.title).toBe("Business Development Partner");

      const notFound = await legacyJobSource.get("non-existent-job");
      expect(notFound).toBeNull();
    });

    it("legacyJobSource.slugs() returns all job slugs", async () => {
      const slugs = await legacyJobSource.slugs();
      expect(slugs).toContain("business-development-partner");
      expect(slugs).toContain("full-stack-developer-intern");
    });
  });

  describe("CMS Sources Interface Compliance & Needle DI Service", () => {
    it("cmsPostSource conforms to PostSource interface", () => {
      expect(typeof cmsPostSource.list).toBe("function");
      expect(typeof cmsPostSource.get).toBe("function");
      expect(typeof cmsPostSource.slugs).toBe("function");
    });

    it("cmsJobSource conforms to JobSource interface", () => {
      expect(typeof cmsJobSource.list).toBe("function");
      expect(typeof cmsJobSource.get).toBe("function");
      expect(typeof cmsJobSource.slugs).toBe("function");
    });

    it("resolves ContentDbService from Needle DI root container", () => {
      const container = getContainer();
      const contentDb = container.get(ContentDbService);
      expect(contentDb).toBeInstanceOf(ContentDbService);
    });

    it("allows mocking ContentDbService or DRIZZLE_DB_TOKEN via createTestContainer", async () => {
      const mockDrizzle: any = {
        query: {
          tsContentPosts: {
            findMany: vi.fn().mockResolvedValue([
              {
                id: "test-id",
                slug: "mocked-test-post",
                title: "Mocked Test Title",
                excerpt: "Mocked excerpt",
                content: "Mocked content",
                category: { name: "Engineering" },
                status: "PUBLISHED",
                tags: ["test"],
                authorIds: [],
                publishedAt: new Date("2026-03-01T00:00:00Z"),
                createdAt: new Date("2026-03-01T00:00:00Z"),
              },
            ]),
          },
          tsContentAuthors: {
            findMany: vi.fn().mockResolvedValue([]),
          },
        },
      };

      const testContainer = createTestContainer([
        { provide: DRIZZLE_DB_TOKEN, useValue: mockDrizzle },
      ]);
      const service = testContainer.get(ContentDbService);
      const posts = await service.fetchPublishedPosts();
      expect(posts.length).toBe(1);
      expect(posts[0].slug).toBe("mocked-test-post");
      expect(posts[0].title).toBe("Mocked Test Title");
    });
  });

  describe("Content Seeder", () => {
    it("seedCmsContent throws when Supabase client is not available", async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      resetEnv();

      const { seedCmsContent } = await import("../scripts/seed-cms-content");
      await expect(seedCmsContent()).rejects.toThrow(/Supabase client unavailable/);
    });

    it("seedCmsContent successfully seeds authors, categories, 10 posts, and 2 jobs with client", async () => {
      const { seedCmsContent } = await import("../scripts/seed-cms-content");

      const upsertedData: Record<string, any[]> = {
        ts_admin_sites: [],
        ts_content_authors: [],
        ts_content_categories: [],
        ts_content_posts: [],
        ts_content_jobs: [],
      };

      const mockClient: any = {
        from: (table: string) => {
          return {
            select: () => ({
              eq: (_col: string, val: any) => ({
                eq: (_col2: string, _val2: any) => ({
                  maybeSingle: async () => ({ data: null }),
                }),
                maybeSingle: async () => {
                  if (table === "ts_admin_sites" && val === "techsonance") {
                    return { data: { id: "site-uuid-1234" } };
                  }
                  return { data: null };
                },
              }),
            }),
            insert: (payload: any) => {
              if (!upsertedData[table]) upsertedData[table] = [];
              upsertedData[table].push(payload);
              return {
                select: () => ({
                  single: async () => ({ data: { id: `mock-author-${Date.now()}` }, error: null }),
                }),
              };
            },
            upsert: (payload: any) => {
              if (!upsertedData[table]) upsertedData[table] = [];
              upsertedData[table].push(payload);
              return {
                select: () => ({
                  single: async () => ({ data: { id: `mock-author-${Date.now()}` }, error: null }),
                }),
              };
            },
            update: () => ({
              eq: async () => ({ error: null }),
            }),
          };
        },
      };

      const result = await seedCmsContent(mockClient);
      expect(result.siteId).toBe("site-uuid-1234");
      expect(result.authorsCount).toBe(3);
      expect(result.categoriesCount).toBe(4);
      expect(result.postsCount).toBe(10);
      expect(result.jobsCount).toBe(2);
      expect(upsertedData.ts_content_posts.length).toBe(10);
      expect(upsertedData.ts_content_jobs.length).toBe(2);
    });
  });
});
