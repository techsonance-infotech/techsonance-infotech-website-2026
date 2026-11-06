import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/admin/posts/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminPostsService } from "@/lib/services/admin-posts.service";
import { PostStatus } from "@/lib/constants/enums/content.enum";
import { AppError, ErrorCode } from "@/lib/errors";

describe("GET & POST /api/admin/posts — Black Box Integration Tests", () => {
  let mockAuthService: any;
  let mockPostsService: any;

  const sampleAdminSession = {
    userId: "admin-uuid-1111",
    email: "editor@techsonance.co.in",
    role: "editor",
    site: { id: "site-uuid-1111" },
  };

  const samplePost = {
    id: "post-uuid-2222",
    siteId: "site-uuid-1111",
    slug: "nextjs-16-deep-dive",
    title: "Next.js 16 Deep Dive: Architecture and Performance",
    excerpt: "Exploring Next.js 16 innovations and App Router patterns.",
    content: "Comprehensive overview of server actions, streaming, and caching.",
    status: PostStatus.DRAFT,
    tags: ["nextjs", "react", "architecture"],
    readTime: "5 min read",
    createdBy: "admin-uuid-1111",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    resetRootContainer();

    mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(sampleAdminSession),
    };

    mockPostsService = {
      listPosts: vi.fn().mockResolvedValue({
        posts: [samplePost],
        total: 1,
      }),
      createPost: vi.fn().mockResolvedValue(samplePost),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService });
    container.bind({ provide: AdminPostsService, useValue: mockPostsService });
  });

  // ─── GET /api/admin/posts ───────────────────────────────────────────────────

  it("1. GET /api/admin/posts rejects unauthenticated request with 401 UNAUTHENTICATED", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const req = new Request("http://localhost:3000/api/admin/posts", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    expect(res.headers.get("x-request-id")).toBeDefined();
  });

  it("2. GET /api/admin/posts rejects foreign origin with 403 FORBIDDEN", async () => {
    const req = new Request("http://localhost:3000/api/admin/posts", {
      method: "GET",
      headers: {
        origin: "https://evil-unauthorized-domain.com",
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it("3. GET /api/admin/posts rejects invalid query parameters with 400 VALIDATION", async () => {
    const req = new Request("http://localhost:3000/api/admin/posts?limit=9999&status=INVALID_STATUS", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.fieldErrors).toBeDefined();
  });

  it("4. GET /api/admin/posts returns 200 with standard envelope and posts list", async () => {
    const req = new Request(
      "http://localhost:3000/api/admin/posts?status=DRAFT&limit=10&offset=0&search=Nextjs",
      {
        method: "GET",
      },
    );

    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.posts).toHaveLength(1);
    expect(json.data.total).toBe(1);
    expect(json.posts).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });

  // ─── POST /api/admin/posts ──────────────────────────────────────────────────

  it("5. POST /api/admin/posts rejects unauthenticated request with 401 UNAUTHENTICATED", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const req = new Request("http://localhost:3000/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Post",
        slug: "test-post",
        content: "Valid post content with more than 10 characters",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
  });

  it("6. POST /api/admin/posts rejects foreign origin with 403 FORBIDDEN", async () => {
    const req = new Request("http://localhost:3000/api/admin/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: "https://attacker.site",
      },
      body: JSON.stringify({
        title: "Test Post",
        slug: "test-post",
        content: "Valid post content with more than 10 characters",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it("7. POST /api/admin/posts rejects viewer role with 403 FORBIDDEN", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      ...sampleAdminSession,
      role: "viewer",
    });

    const req = new Request("http://localhost:3000/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Post",
        slug: "test-post",
        content: "Valid post content with more than 10 characters",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it("8. POST /api/admin/posts rejects invalid payload with 400 VALIDATION", async () => {
    const req = new Request("http://localhost:3000/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "X", // < 3 chars
        slug: "Invalid Slug with spaces", // invalid regex
        content: "Short", // < 10 chars
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.fieldErrors).toHaveProperty("title");
    expect(json.error.fieldErrors).toHaveProperty("slug");
    expect(json.error.fieldErrors).toHaveProperty("content");
  });

  it("9. POST /api/admin/posts handles slug conflict with 409 CONFLICT", async () => {
    mockPostsService.createPost.mockRejectedValueOnce(
      new AppError(ErrorCode.CONFLICT, 'A post with slug "existing-post" already exists', {
        fieldErrors: { slug: ["Slug is already taken"] },
      }),
    );

    const req = new Request("http://localhost:3000/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Existing Post Title",
        slug: "existing-post",
        content: "Content that already has a conflicting slug.",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.CONFLICT);
    expect(json.error.fieldErrors?.slug).toBeDefined();
  });

  it("10. POST /api/admin/posts returns 201 with created post in standard envelope", async () => {
    const req = new Request("http://localhost:3000/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Next.js 16 Deep Dive: Architecture and Performance",
        slug: "nextjs-16-deep-dive",
        excerpt: "Exploring Next.js 16 innovations and App Router patterns.",
        content: "Comprehensive overview of server actions, streaming, and caching.",
        tags: ["nextjs", "react", "architecture"],
        readTime: "5 min read",
        status: PostStatus.DRAFT,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.post.id).toBe("post-uuid-2222");
    expect(json.data.post.slug).toBe("nextjs-16-deep-dive");
    expect(json.post.id).toBe("post-uuid-2222");
  });

  it("11. POST /api/admin/posts returns 500 when unexpected error occurs", async () => {
    mockPostsService.createPost.mockRejectedValueOnce(new Error("Unexpected DB crash"));

    const req = new Request("http://localhost:3000/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Server Error Post",
        slug: "server-error-post",
        content: "Content that causes internal failure.",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.INTERNAL);
  });
});
