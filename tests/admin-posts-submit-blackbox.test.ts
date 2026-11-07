import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/admin/blog/posts/[id]/submit/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminPostsService } from "@/lib/services/admin-posts.service";
import { PostStatus } from "@/lib/constants/enums/content.enum";
import { AppError, ErrorCode } from "@/lib/errors";
import { POST_ERRORS } from "@/lib/constants/posts.constants";

describe("POST /api/admin/blog/posts/[id]/submit — Black Box Integration Tests", () => {
  let mockAuthService: any;
  let mockPostsService: any;

  const validPostId = "c1111111-2222-4333-8444-555555555555";
  const nonExistentId = "c9999999-9999-4999-8999-999999999999";

  const sampleAuthorSession = {
    userId: "author-uuid-1111",
    email: "author@techsonance.co.in",
    role: "author",
    site: { id: "site-uuid-1111" },
  };

  const sampleDraftPost = {
    id: validPostId,
    siteId: "site-uuid-1111",
    slug: "typescript-5-8-guide",
    title: "TypeScript 5.8: Modern Compiler Enhancements",
    excerpt: "Exploring new checks, flags, and speedups in TypeScript.",
    content: "Deep architectural dive into the updated type inference engine.",
    status: PostStatus.DRAFT,
    tags: ["typescript", "javascript", "tooling"],
    readTime: "4 min read",
    versionId: 1,
    publishedAt: null,
    createdBy: "author-uuid-1111",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    resetRootContainer();

    mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(sampleAuthorSession),
    };

    mockPostsService = {
      submitForReview: vi.fn().mockImplementation(async (id: string, actorId?: string) => {
        if (id !== validPostId) {
          throw new AppError(ErrorCode.NOT_FOUND, `Post with id "${id}" not found`);
        }
        return {
          ...sampleDraftPost,
          status: PostStatus.IN_REVIEW,
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

    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}/submit`, {
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
    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}/submit`, {
      method: "POST",
      headers: {
        origin: "https://malicious-external-domain.com",
      },
    });

    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(POST_ERRORS.FORBIDDEN_ORIGIN);
  });

  it("3. Rejects viewer role with 403 FORBIDDEN (Author+ required)", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      ...sampleAuthorSession,
      role: "viewer",
    });

    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}/submit`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(POST_ERRORS.FORBIDDEN_ROLE);
  });

  it("4. Rejects invalid UUID parameter with 400 VALIDATION", async () => {
    const req = new Request("http://localhost:3000/api/admin/posts/invalid-id/submit", {
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

  it("5. Returns 404 NOT_FOUND when the target post does not exist", async () => {
    const req = new Request(`http://localhost:3000/api/admin/posts/${nonExistentId}/submit`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: nonExistentId }) });
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it("6. Successfully submits draft post for review with 200 OK by author", async () => {
    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}/submit`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.post.status).toBe(PostStatus.IN_REVIEW);
    expect(json.data.post.versionId).toBe(2);
    expect(json.message).toBe(POST_ERRORS.POST_SUBMITTED_SUCCESS);
    expect(mockPostsService.submitForReview).toHaveBeenCalledWith(
      validPostId,
      sampleAuthorSession.userId,
      undefined,
    );
  });

  it("7. Successfully submits draft post for review with 200 OK by editor or admin", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      ...sampleAuthorSession,
      userId: "editor-uuid-2222",
      role: "editor",
    });

    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}/submit`, {
      method: "POST",
      headers: {
        "x-forwarded-for": "10.0.0.1",
      },
    });

    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.post.status).toBe(PostStatus.IN_REVIEW);
    expect(mockPostsService.submitForReview).toHaveBeenCalledWith(
      validPostId,
      "editor-uuid-2222",
      "10.0.0.1",
    );
  });

  it("8. Returns 500 INTERNAL when unexpected exception occurs", async () => {
    mockPostsService.submitForReview.mockRejectedValueOnce(new Error("Database pool connection timed out"));

    const req = new Request(`http://localhost:3000/api/admin/posts/${validPostId}/submit`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.INTERNAL);
    expect(json.error.message).toBe(POST_ERRORS.FAILED_SUBMIT_POST);
  });
});
