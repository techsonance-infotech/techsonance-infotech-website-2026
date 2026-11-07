import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as postLoginPOST } from "@/app/api/admin/auth/login/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { RateLimiterService } from "@/lib/services/ratelimit.service";
import { ErrorCode, AppError } from "@/lib/errors";
import { AUTH_ERRORS, AUTH_MESSAGES } from "@/lib/constants/auth.constants";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { SESSION_COOKIE } from "@/lib/auth/session";

describe("POST /api/admin/auth/login — Black Box Integration Tests", () => {
  let mockAuthService: any;
  let mockRateLimiterService: any;

  const validUser = {
    id: "user-uuid-1111",
    email: "admin@techsonance.co.in",
    name: "Admin User",
    role: "owner" as const,
  };

  beforeEach(() => {
    resetRootContainer();

    mockAuthService = {
      authenticate: vi.fn().mockResolvedValue(validUser),
    };

    mockRateLimiterService = {
      getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
      check: vi.fn().mockResolvedValue({ success: true, remaining: 4 }),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService as any });
    container.bind({ provide: RateLimiterService, useValue: mockRateLimiterService as any });
  });

  const makeReq = (body: unknown, extraHeaders: Record<string, string> = {}) =>
    new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AUTH.LOGIN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    });

  // ─── 1. SECURITY & ORIGIN TESTS ───────────────────────────────────────────

  it("1. Rejects request with foreign origin with 403 Forbidden", async () => {
    const req = makeReq(
      { email: "admin@techsonance.co.in", password: "SecurePassword123!" },
      { origin: "https://untrusted-cross-site.com" },
    );

    const res = await postLoginPOST(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(AUTH_ERRORS.FORBIDDEN_ORIGIN);
  });

  // ─── 2. VALIDATION TESTS ──────────────────────────────────────────────────

  it("2. Rejects request with malformed email with 422 Validation Error", async () => {
    const req = makeReq({ email: "invalid-email-format", password: "SecurePassword123!" });

    const res = await postLoginPOST(req);
    expect(res.status).toBe(422);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.fieldErrors).toBeDefined();
    expect(json.error.fieldErrors.email).toBeDefined();
  });

  it("3. Rejects request with password shorter than 6 characters with 422 Validation Error", async () => {
    const req = makeReq({ email: "admin@techsonance.co.in", password: "123" });

    const res = await postLoginPOST(req);
    expect(res.status).toBe(422);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.fieldErrors).toBeDefined();
    expect(json.error.fieldErrors.password).toBeDefined();
  });

  // ─── 3. RATE LIMITING TESTS ───────────────────────────────────────────────

  it("4. Rejects request with 429 Too Many Requests when rate limit exceeded", async () => {
    mockRateLimiterService.check.mockResolvedValue({
      success: false,
      remaining: 0,
      retryAfter: 60,
    });

    const req = makeReq({ email: "admin@techsonance.co.in", password: "SecurePassword123!" });

    const res = await postLoginPOST(req);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.RATE_LIMITED);
    expect(json.error.message).toBe(AUTH_ERRORS.RATE_LIMITED);
    expect(json.error.retryAfterSec).toBe(60);
  });

  // ─── 4. AUTHENTICATION FAILURE TESTS ──────────────────────────────────────

  it("5. Rejects request with 401 Unauthenticated on invalid credentials", async () => {
    mockAuthService.authenticate.mockRejectedValue(
      new AppError(ErrorCode.UNAUTHENTICATED, AUTH_ERRORS.INVALID_CREDENTIALS),
    );

    const req = makeReq({ email: "admin@techsonance.co.in", password: "WrongPassword!" });

    const res = await postLoginPOST(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    expect(json.error.message).toBe(AUTH_ERRORS.INVALID_CREDENTIALS);
  });

  it("6. Rejects request with 403 Forbidden when user account is disabled", async () => {
    mockAuthService.authenticate.mockRejectedValue(
      new AppError(ErrorCode.FORBIDDEN, AUTH_ERRORS.ACCOUNT_DISABLED),
    );

    const req = makeReq({ email: "disabled@techsonance.co.in", password: "CorrectPassword123!" });

    const res = await postLoginPOST(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(AUTH_ERRORS.ACCOUNT_DISABLED);
  });

  // ─── 5. SUCCESSFUL LOGIN TESTS ───────────────────────────────────────────

  it("7. Authenticates successfully with valid credentials, sets cookie, returns 200 OK", async () => {
    const req = makeReq({ email: "admin@techsonance.co.in", password: "ValidPassword123!" });

    const res = await postLoginPOST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.user.id).toBe(validUser.id);
    expect(json.data.user.email).toBe(validUser.email);
    expect(json.data.user.role).toBe(validUser.role);
    expect(json.user.id).toBe(validUser.id);
    expect(json.message).toBe(AUTH_MESSAGES.LOGIN_SUCCESS);

    // Verify Set-Cookie header is issued
    const cookieHeader = res.headers.get("set-cookie");
    expect(cookieHeader).toBeDefined();
    expect(cookieHeader).toContain(SESSION_COOKIE);
    expect(cookieHeader).toContain("HttpOnly");

    expect(mockAuthService.authenticate).toHaveBeenCalledWith(
      "admin@techsonance.co.in",
      "ValidPassword123!",
    );
  });

  // ─── 6. UNEXPECTED ERROR HANDLING ─────────────────────────────────────────

  it("8. Handles unexpected service crash with clean 500 status", async () => {
    mockAuthService.authenticate.mockRejectedValue(new Error("Database connection pool drop"));

    const req = makeReq({ email: "admin@techsonance.co.in", password: "ValidPassword123!" });

    const res = await postLoginPOST(req);
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.INTERNAL);
    expect(json.error.message).toBe(AUTH_ERRORS.LOGIN_FAILED);
  });
});
