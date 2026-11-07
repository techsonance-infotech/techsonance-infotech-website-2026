import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH, DELETE } from "@/app/api/admin/blog/posts/[id]/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminPostsService } from "@/lib/services/admin-posts.service";
import { PostStatus } from "@/lib/constants/enums/content.enum";
import { AppError, ErrorCode } from "@/lib/errors";

describe("GET, PATCH, DELETE /api/admin/blog/posts/[id] — Black Box Integration Tests", () => {
  let mockAuthService: any;
  let mockPostsService: any;

  const validPostId = "b1111111-2222-4333-8444-555555555555";
  const nonExistentId = "b9999999-9999-4999-8999-999999999999";

  const sampleAdminSession = {
    userId: "admin-uuid-1111",
    email: "editor@techsonance.co.in",
    role: "editor",
    site: { id: "site-uuid-1111" },
  };

  const samplePost = {
    id: validPostId,
    siteId: "site-uuid-1111",
    slug: "nextjs-16-deep-dive",
    title: "Next.js 16 Deep Dive: Architecture and Performance",
    excerpt: "Exploring Next.js 16 innovations and App Router patterns.",
    content: "Comprehensive overview of server actions, streaming, and caching.",
    status: PostStatus.DRAFT,
    tags: ["nextjs", "react", "architecture"],
    readTime: "5 min read",
    versionId: 1,
    createdBy: "admin-uuid-1111",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    resetRootContainer();

    mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(sampleAdminSession),
      hasPermission: vi.fn().mockImplementation((role: string, required: string) => {
        if (required === "editor") {
          return ["editor", "admin", "owner"].includes(role);
        }
        return false;
      }),
    };

    mockPostsService = {
      getPostById: vi.fn().mockImplementation(async (id: string) => {
        if (id === validPostId) return samplePost;
        return null;
      }),
      updatePost: vi.fn().mockImplementation(async (id: string, updates: any) => {
        if (id !== validPostId) {
          throw new AppError(ErrorCode.NOT_FOUND, `Post with id "${id}" not found`);
        }
        if (updates.slug === "conflicting-slug") {
          throw new AppError(
            ErrorCode.CONFLICT,
            `A post with slug "${updates.slug}" already exists`,
            { fieldErrors: { slug: ["Slug is already taken"] } },
          );
        }
        return {
          ...samplePost,
          ...updates,
          versionId: (samplePost.versionId || 1) + 1,
        };
      }),
      deletePost: vi.fn().mockImplementation(async (id: string) => {
        if (id === validPostId) return true;
        return false;
      }),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService });
    container.bind({ provide: AdminPostsService, useValue: mockPostsService });
  });

  // ─── GET /api/admin/posts/[id] ───────────────────────────────────────────────

  it("1. GET /api/admin/posts/[id] rejects unauthenticated request with 401 UNAUTHENTICATED", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}`, {
      method: "GET",
    });

    const res = await GET(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
  });

  it("2. GET /api/admin/posts/[id] rejects foreign origin with 403 FORBIDDEN", async () => {
    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}`, {
      method: "GET",
      headers: { origin: "https://evil-cross-site.com" },
    });

    const res = await GET(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it("3. GET /api/admin/posts/[id] rejects invalid UUID param with 400 VALIDATION", async () => {
    const req = new Request("http://localhost:3000/api/admin/posts/invalid-non-uuid", {
      method: "GET",
    });

    const res = await GET(req, { params: Promise.resolve({ id: "invalid-non-uuid" }) });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
  });

  it("4. GET /api/admin/posts/[id] returns 404 NOT_FOUND when post does not exist", async () => {
    const req = new Request(`http://localhost:3000/api/admin/posts/${nonExistentId}`, {
      method: "GET",
    });

    const res = await GET(req, { params: Promise.resolve({ id: nonExistentId }) });
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it("5. GET /api/admin/posts/[id] returns 200 OK with single post envelope", async () => {
    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}`, {
      method: "GET",
    });

    const res = await GET(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.post.id).toBe(validPostId);
    expect(json.post.id).toBe(validPostId);
  });

  // ─── PATCH /api/admin/posts/[id] ─────────────────────────────────────────────

  it("6. PATCH /api/admin/posts/[id] rejects unauthenticated request with 401 UNAUTHENTICATED", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Title" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
  });

  it("7. PATCH /api/admin/posts/[id] rejects foreign origin with 403 FORBIDDEN", async () => {
    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        origin: "https://evil-cross-site.com",
      },
      body: JSON.stringify({ title: "Updated Title" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it("8. PATCH /api/admin/posts/[id] rejects viewer role with 403 FORBIDDEN", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      ...sampleAdminSession,
      role: "viewer",
    });

    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Title" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it("9. PATCH /api/admin/posts/[id] rejects malformed payload with 400 VALIDATION", async () => {
    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "X", // < 3 chars
        slug: "Invalid Slug with spaces",
        content: "Short", // < 10 chars
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.fieldErrors).toHaveProperty("title");
    expect(json.error.fieldErrors).toHaveProperty("slug");
    expect(json.error.fieldErrors).toHaveProperty("content");
  });

  it("10. PATCH /api/admin/posts/[id] returns 409 CONFLICT on slug collision", async () => {
    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "conflicting-slug" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.CONFLICT);
    expect(json.error.fieldErrors?.slug).toBeDefined();
  });

  it("11. PATCH /api/admin/posts/[id] returns 404 NOT_FOUND for non-existent post", async () => {
    const req = new Request(`http://localhost:3000/api/admin/posts/${nonExistentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Non-Existent Post" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: nonExistentId }) });
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it("12. PATCH /api/admin/posts/[id] returns 200 OK with updated post and incremented version", async () => {
    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Next.js 16 Architecture & Performance Guide (Updated)",
        readTime: "7 min read",
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.post.title).toBe("Next.js 16 Architecture & Performance Guide (Updated)");
    expect(json.data.post.versionId).toBe(2);
  });

  // ─── DELETE /api/admin/posts/[id] ───────────────────────────────────────────

  it("13. DELETE /api/admin/posts/[id] rejects unauthenticated request with 401 UNAUTHENTICATED", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}`, {
      method: "DELETE",
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
  });

  it("14. DELETE /api/admin/posts/[id] rejects foreign origin with 403 FORBIDDEN", async () => {
    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}`, {
      method: "DELETE",
      headers: { origin: "https://evil-cross-site.com" },
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it("15. DELETE /api/admin/posts/[id] rejects author role with 403 FORBIDDEN (Editor+ required)", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      ...sampleAdminSession,
      role: "author",
    });

    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}`, {
      method: "DELETE",
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it("16. DELETE /api/admin/posts/[id] returns 404 NOT_FOUND for non-existent post", async () => {
    const req = new Request(`http://localhost:3000/api/admin/posts/${nonExistentId}`, {
      method: "DELETE",
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: nonExistentId }) });
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it("17. DELETE /api/admin/posts/[id] returns 200 OK with success deletion message", async () => {
    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}`, {
      method: "DELETE",
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.success).toBe(true);
    expect(json.message).toBe("Post deleted successfully");
  });

  it("18. DELETE /api/admin/posts/[id] returns 500 INTERNAL on unexpected storage failure", async () => {
    mockPostsService.deletePost.mockRejectedValueOnce(new Error("Unexpected DB disconnect"));

    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}`, {
      method: "DELETE",
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.INTERNAL);
  });
});
