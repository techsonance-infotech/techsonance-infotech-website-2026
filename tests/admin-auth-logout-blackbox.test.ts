import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as postLogoutPOST } from "@/app/api/admin/auth/logout/route";
import { resetRootContainer } from "@/lib/di/container";
import { ErrorCode } from "@/lib/errors";
import { AUTH_ERRORS, AUTH_MESSAGES } from "@/lib/constants/auth.constants";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { SESSION_COOKIE } from "@/lib/auth/session";

describe("POST /api/admin/auth/logout — Black Box Integration Tests", () => {
  beforeEach(() => {
    resetRootContainer();
  });

  const makeReq = (extraHeaders: Record<string, string> = {}) =>
    new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AUTH.LOGOUT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders,
      },
    });

  // ─── 1. SECURITY & ORIGIN TESTS ───────────────────────────────────────────

  it("1. Rejects request with foreign origin with 403 Forbidden", async () => {
    const req = makeReq({ origin: "https://malicious-external-site.com" });

    const res = await postLogoutPOST(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(AUTH_ERRORS.FORBIDDEN_ORIGIN);
  });

  // ─── 2. SUCCESSFUL LOGOUT TESTS ───────────────────────────────────────────

  it("2. Successfully logs out, clears session cookie, and returns 200 OK", async () => {
    const req = makeReq();

    const res = await postLogoutPOST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.message).toBe(AUTH_MESSAGES.LOGOUT_SUCCESS);
    expect(json.message).toBe(AUTH_MESSAGES.LOGOUT_SUCCESS);
    expect(json.success).toBe(true);

    // Verify cookie deletion in Set-Cookie header
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain(SESSION_COOKIE);
  });
});
