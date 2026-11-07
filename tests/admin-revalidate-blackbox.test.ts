import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as postRevalidatePOST } from "@/app/api/admin/revalidate/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { ErrorCode } from "@/lib/errors";
import {
  DEFAULT_REVALIDATE_TAGS,
  REVALIDATE_ERRORS,
  REVALIDATE_MESSAGES,
} from "@/lib/constants/revalidate.constants";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe("POST /api/admin/revalidate — Black Box Integration Tests", () => {
  let mockAuthService: any;

  const editorSession = {
    userId: "admin-uuid-1111",
    email: "editor@techsonance.co.in",
    role: "editor",
    site: { id: "site-uuid-1111" },
  };

  const viewerSession = {
    userId: "viewer-uuid-2222",
    email: "viewer@techsonance.co.in",
    role: "viewer",
    site: { id: "site-uuid-1111" },
  };

  beforeEach(() => {
    resetRootContainer();

    mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(editorSession),
      hasPermission: vi.fn((role: string, required: string) => {
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

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService as any });
  });

  const makeReq = (body?: unknown, extraHeaders: Record<string, string> = {}) =>
    new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.REVALIDATE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  // ─── 1. SECURITY & ORIGIN TESTS ───────────────────────────────────────────

  it("1. Rejects request with foreign origin with 403 Forbidden", async () => {
    const req = makeReq({ tags: ["posts"] }, { origin: "https://untrusted-attacker.com" });

    const res = await postRevalidatePOST(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(REVALIDATE_ERRORS.FORBIDDEN_ORIGIN);
  });

  // ─── 2. AUTHENTICATION & RBAC TESTS ───────────────────────────────────────

  it("2. Rejects unauthenticated request with 401 Unauthenticated", async () => {
    mockAuthService.getCurrentSession.mockResolvedValue(null);

    const req = makeReq({ tags: ["posts"] });
    const res = await postRevalidatePOST(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    expect(json.error.message).toBe(REVALIDATE_ERRORS.UNAUTHORIZED);
  });

  it("3. Rejects viewer role with 403 Forbidden (Editor+ required)", async () => {
    mockAuthService.getCurrentSession.mockResolvedValue(viewerSession);

    const req = makeReq({ tags: ["posts"] });
    const res = await postRevalidatePOST(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(REVALIDATE_ERRORS.FORBIDDEN_ROLE);
  });

  // ─── 3. VALIDATION TESTS ──────────────────────────────────────────────────

  it("4. Rejects request with malformed JSON body with 400 Bad Request", async () => {
    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.REVALIDATE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid-not-json{",
    });

    const res = await postRevalidatePOST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.BAD_REQUEST);
  });

  it("5. Rejects request with schema violations (e.g. non-array tags) with 422 Validation Error", async () => {
    const req = makeReq({ tags: "not-an-array" });

    const res = await postRevalidatePOST(req);
    expect(res.status).toBe(422);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.message).toBe(REVALIDATE_ERRORS.VALIDATION_FAILED);
    expect(json.error.fieldErrors).toBeDefined();
  });

  // ─── 4. SUCCESSFUL REVALIDATION TESTS ─────────────────────────────────────

  it("6. Revalidates default tags when empty body is sent by Editor", async () => {
    const req = makeReq();

    const res = await postRevalidatePOST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.revalidatedTags).toEqual([...DEFAULT_REVALIDATE_TAGS]);
    expect(json.data.revalidatedPaths).toEqual([]);
    expect(json.data.message).toBe(REVALIDATE_MESSAGES.REVALIDATE_SUCCESS);
    expect(json.revalidated).toEqual([...DEFAULT_REVALIDATE_TAGS]);
    expect(json.success).toBe(true);
    expect(json.timestamp).toBeDefined();
  });

  it("7. Successfully revalidates custom tags and paths with 200 OK", async () => {
    const req = makeReq({
      tags: ["posts", "post:ai-engineering-2026"],
      paths: ["/blog", "/careers"],
    });

    const res = await postRevalidatePOST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.revalidatedTags).toEqual(["posts", "post:ai-engineering-2026"]);
    expect(json.data.revalidatedPaths).toEqual(["/blog", "/careers"]);
    expect(json.data.message).toBe(REVALIDATE_MESSAGES.REVALIDATE_SUCCESS);
  });

  // ─── 5. UNEXPECTED ERROR HANDLING ─────────────────────────────────────────

  it("8. Handles unexpected session failure with clean 500 status", async () => {
    mockAuthService.getCurrentSession.mockRejectedValue(new Error("Database pool connection timeout"));

    const req = makeReq({ tags: ["posts"] });
    const res = await postRevalidatePOST(req);
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.INTERNAL);
    expect(json.error.message).toBe(REVALIDATE_ERRORS.REVALIDATE_FAILED);
  });
});
