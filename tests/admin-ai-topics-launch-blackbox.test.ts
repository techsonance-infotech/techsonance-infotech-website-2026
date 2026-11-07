import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as launchTopicPOST } from "@/app/api/admin/ai/topics/[id]/launch/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminTopicsService } from "@/lib/services/admin-topics.service";
import { AppError, ErrorCode } from "@/lib/errors";
import { AI_TOPICS_ERRORS, AI_TOPICS_MESSAGES } from "@/lib/constants/ai.constants";

describe("POST /api/admin/ai/topics/[id]/launch — Black Box Integration Tests", () => {
  let mockAuthService: any;
  let mockTopicsService: any;

  const validTopicId = "d1111111-2222-4333-8444-555555555555";
  const nonExistentTopicId = "d9999999-9999-4999-8999-999999999999";
  const validJobId = "j1111111-2222-4333-8444-555555555555";

  const sampleEditorSession = {
    userId: "admin-uuid-1111",
    email: "editor@techsonance.co.in",
    role: "editor",
    site: { id: "site-uuid-1111" },
  };

  const sampleViewerSession = {
    userId: "viewer-uuid-2222",
    email: "viewer@techsonance.co.in",
    role: "viewer",
    site: { id: "site-uuid-1111" },
  };

  const sampleAuthorSession = {
    userId: "author-uuid-3333",
    email: "author@techsonance.co.in",
    role: "author",
    site: { id: "site-uuid-1111" },
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
        return (hierarchy[role] ?? 0) >= (hierarchy[required] ?? 99);
      }),
    };

    mockTopicsService = {
      launchTopicGeneration: vi.fn().mockImplementation(async (id: string) => {
        if (id === nonExistentTopicId) {
          throw new AppError(ErrorCode.NOT_FOUND, `Topic not found: ${id}`);
        }
        return { jobId: validJobId };
      }),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService as any });
    container.bind({ provide: AdminTopicsService, useValue: mockTopicsService as any });
  });

  // ─── SECURITY & ORIGIN TESTS ──────────────────────────────────────────────

  it("1. Rejects request with foreign origin with 403 Forbidden", async () => {
    const req = new Request(`http://localhost:3000/api/admin/ai/topics/${validTopicId}/launch`, {
      method: "POST",
      headers: {
        origin: "https://untrusted-cross-site.com",
      },
    });

    const res = await launchTopicPOST(req as any, { params: Promise.resolve({ id: validTopicId }) });
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(AI_TOPICS_ERRORS.FORBIDDEN_ORIGIN);
  });

  // ─── AUTHENTICATION & RBAC TESTS ──────────────────────────────────────────

  it("2. Rejects unauthenticated request with 401 Unauthenticated", async () => {
    mockAuthService.getCurrentSession.mockResolvedValue(null);

    const req = new Request(`http://localhost:3000/api/admin/ai/topics/${validTopicId}/launch`, {
      method: "POST",
    });

    const res = await launchTopicPOST(req as any, { params: Promise.resolve({ id: validTopicId }) });
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    expect(json.error.message).toBe(AI_TOPICS_ERRORS.UNAUTHORIZED);
  });

  it("3. Rejects viewer role with 403 Forbidden", async () => {
    mockAuthService.getCurrentSession.mockResolvedValue(sampleViewerSession);

    const req = new Request(`http://localhost:3000/api/admin/ai/topics/${validTopicId}/launch`, {
      method: "POST",
    });

    const res = await launchTopicPOST(req as any, { params: Promise.resolve({ id: validTopicId }) });
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(AI_TOPICS_ERRORS.FORBIDDEN_ROLE);
  });

  it("4. Rejects author role with 403 Forbidden", async () => {
    mockAuthService.getCurrentSession.mockResolvedValue(sampleAuthorSession);

    const req = new Request(`http://localhost:3000/api/admin/ai/topics/${validTopicId}/launch`, {
      method: "POST",
    });

    const res = await launchTopicPOST(req as any, { params: Promise.resolve({ id: validTopicId }) });
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(AI_TOPICS_ERRORS.FORBIDDEN_ROLE);
  });

  // ─── PARAMS VALIDATION TESTS ──────────────────────────────────────────────

  it("5. Rejects invalid UUID parameter with 400 Bad Request", async () => {
    const req = new Request("http://localhost:3000/api/admin/ai/topics/not-a-valid-uuid/launch", {
      method: "POST",
    });

    const res = await launchTopicPOST(req as any, { params: Promise.resolve({ id: "not-a-valid-uuid" }) });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.BAD_REQUEST);
    expect(json.error.fieldErrors).toBeDefined();
    expect(json.error.fieldErrors.id).toBeDefined();
  });

  // ─── BUSINESS LOGIC & ERROR HANDLING TESTS ────────────────────────────────

  it("6. Returns 404 Not Found when topic does not exist", async () => {
    const req = new Request(`http://localhost:3000/api/admin/ai/topics/${nonExistentTopicId}/launch`, {
      method: "POST",
    });

    const res = await launchTopicPOST(req as any, { params: Promise.resolve({ id: nonExistentTopicId }) });
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it("7. Successfully launches generation with 200 OK for editor", async () => {
    const req = new Request(`http://localhost:3000/api/admin/ai/topics/${validTopicId}/launch`, {
      method: "POST",
    });

    const res = await launchTopicPOST(req as any, { params: Promise.resolve({ id: validTopicId }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.success).toBe(true);
    expect(json.jobId).toBe(validJobId);
    expect(json.message).toBe(AI_TOPICS_MESSAGES.TOPIC_LAUNCHED);
    expect(json.data.jobId).toBe(validJobId);

    expect(mockTopicsService.launchTopicGeneration).toHaveBeenCalledWith(validTopicId);
  });

  it("8. Handles unexpected service crash cleanly with 500 status", async () => {
    mockTopicsService.launchTopicGeneration.mockRejectedValue(new Error("Job queue Redis connection drop"));

    const req = new Request(`http://localhost:3000/api/admin/ai/topics/${validTopicId}/launch`, {
      method: "POST",
    });

    const res = await launchTopicPOST(req as any, { params: Promise.resolve({ id: validTopicId }) });
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.INTERNAL);
    expect(json.error.message).toBe(AI_TOPICS_ERRORS.LAUNCH_FAILED);
  });
});
