import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/admin/posts/[id]/publish/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminPostsService } from "@/lib/services/admin-posts.service";
import { PostStatus } from "@/lib/constants/enums/content.enum";
import { AppError, ErrorCode } from "@/lib/errors";
import { POST_ERRORS } from "@/lib/constants/posts.constants";

describe("POST /api/admin/posts/[id]/publish — Black Box Integration Tests", () => {
  let mockAuthService: any;
  let mockPostsService: any;

  const validPostId = "b1111111-2222-4333-8444-555555555555";
  const nonExistentId = "b9999999-9999-4999-8999-999999999999";

  const sampleEditorSession = {
    userId: "admin-uuid-1111",
    email: "editor@techsonance.co.in",
    role: "editor",
    site: { id: "site-uuid-1111" },
  };

  const sampleDraftPost = {
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
    publishedAt: null,
    createdBy: "admin-uuid-1111",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    resetRootContainer();

    mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(sampleEditorSession),
      hasPermission: vi.fn().mockImplementation((role: string, required: string) => {
        const hierarchy: Record<string, number> = {
          viewer: 1,
          author: 2,
          editor: 3,
          admin: 4,
          owner: 5,
        };
        return (hierarchy[role] ?? 0) >= (hierarchy[required] ?? 0);
      }),
    };

    mockPostsService = {
      publishPost: vi.fn().mockImplementation(async (id: string, actorId?: string) => {
        if (id !== validPostId) {
          throw new AppError(ErrorCode.NOT_FOUND, `Post with id "${id}" not found`);
        }
        return {
          ...sampleDraftPost,
          status: PostStatus.PUBLISHED,
          publishedAt: new Date().toISOString(),
          versionId: (sampleDraftPost.versionId || 1) + 1,
          updatedBy: actorId,
        };
      }),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService });
    container.bind({ provide: AdminPostsService, useValue: mockPostsService });
  });

  it("1. Rejects unauthenticated request with 401 UNAUTHENTICATED", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}/publish`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    expect(json.error.message).toBe(POST_ERRORS.UNAUTHORIZED);
    expect(json.error.requestId).toBeDefined();
    expect(res.headers.get("x-request-id")).toBeDefined();
  });

  it("2. Rejects untrusted origin header with 403 FORBIDDEN", async () => {
    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}/publish`, {
      method: "POST",
      headers: {
        origin: "https://malicious-site.example.com",
      },
    });

    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(POST_ERRORS.FORBIDDEN_ORIGIN);
  });

  it("3. Rejects viewer role with 403 FORBIDDEN (Editor+ required)", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      ...sampleEditorSession,
      role: "viewer",
    });

    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}/publish`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(POST_ERRORS.FORBIDDEN_PUBLISH);
  });

  it("4. Rejects author role with 403 FORBIDDEN (Editor+ required)", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      ...sampleEditorSession,
      role: "author",
    });

    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}/publish`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(POST_ERRORS.FORBIDDEN_PUBLISH);
  });

  it("5. Rejects invalid UUID parameter with 400 VALIDATION", async () => {
    const req = new Request("http://localhost:3000/api/admin/posts/invalid-id/publish", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "invalid-id" }) });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.message).toBe(POST_ERRORS.INVALID_ID);
    expect(json.error.fieldErrors).toHaveProperty("id");
  });

  it("6. Returns 404 NOT_FOUND when the target post does not exist", async () => {
    const req = new Request(`http://localhost:3000/api/admin/posts/${nonExistentId}/publish`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: nonExistentId }) });
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it("7. Successfully publishes draft post with 200 OK by editor", async () => {
    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}/publish`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.post.status).toBe(PostStatus.PUBLISHED);
    expect(json.data.post.publishedAt).toBeDefined();
    expect(json.data.post.versionId).toBe(2);
    expect(json.message).toBe(POST_ERRORS.POST_PUBLISHED_SUCCESS);
    expect(mockPostsService.publishPost).toHaveBeenCalledWith(
      validPostId,
      sampleEditorSession.userId,
      undefined,
    );
  });

  it("8. Successfully publishes draft post with 200 OK by admin or owner", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      ...sampleEditorSession,
      userId: "owner-uuid-9999",
      role: "owner",
    });

    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}/publish`, {
      method: "POST",
      headers: {
        "x-forwarded-for": "192.168.1.100",
      },
    });

    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.post.status).toBe(PostStatus.PUBLISHED);
    expect(mockPostsService.publishPost).toHaveBeenCalledWith(
      validPostId,
      "owner-uuid-9999",
      "192.168.1.100",
    );
  });

  it("9. Returns 500 INTERNAL when unexpected exception occurs", async () => {
    mockPostsService.publishPost.mockRejectedValueOnce(new Error("Database connection dropped"));

    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}/publish`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.INTERNAL);
    expect(json.error.message).toBe(POST_ERRORS.FAILED_PUBLISH_POST);
  });
});
