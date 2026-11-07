/**
 * verify_admin_auth_login_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for:
 * - POST /api/admin/auth/login
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handler directly (app/api/admin/auth/login/route).
 * 2. Mandatory request logging (Method, Path, Origin, Headers, Payload, Actor Context).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix:
 *    - 403 FORBIDDEN on foreign origin
 *    - 422 VALIDATION on invalid/malformed email
 *    - 422 VALIDATION on short password (< 6 chars)
 *    - 429 RATE_LIMITED on brute force attempt (rate limit exceeded)
 *    - 401 UNAUTHENTICATED on invalid credentials
 *    - 403 FORBIDDEN on disabled user account
 *    - 200 OK on valid credentials with Set-Cookie header & user DTO
 *    - 500 INTERNAL on unexpected service/database crash
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import "../preload.cjs";
import { POST as postLoginPOST } from "@/app/api/admin/auth/login/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { RateLimiterService } from "@/lib/services/ratelimit.service";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { ErrorCode, AppError } from "@/lib/errors";
import { AUTH_ERRORS, AUTH_MESSAGES } from "@/lib/constants/auth.constants";
import { SESSION_COOKIE } from "@/lib/auth/session";

const PASS = "✓ PASS";
const FAIL = "✗ FAIL";

let passCount = 0;
let failCount = 0;

function logSection(title: string) {
  console.log(`\n======================================================================`);
  console.log(`  ${title}`);
  console.log(`======================================================================`);
}

function logRequest(details: {
  caseNum: number;
  description: string;
  method: string;
  path: string;
  actor?: string;
  headers?: Record<string, string>;
  payload?: unknown;
}) {
  console.log(`\n--- [TEST CASE ${details.caseNum}] ${details.description} ---`);
  console.log(`[REQUEST] ${details.method} ${details.path}`);
  if (details.actor) console.log(`[ACTOR]   ${details.actor}`);
  if (details.headers) console.log(`[HEADERS] ${JSON.stringify(details.headers)}`);
  if (details.payload !== undefined) {
    console.log(
      `[PAYLOAD] ${typeof details.payload === "string" ? details.payload : JSON.stringify(details.payload)}`,
    );
  }
}

function logResponse(status: number, body: unknown, headers?: Record<string, string | null>) {
  console.log(`[RESPONSE STATUS] ${status}`);
  if (headers) console.log(`[RESPONSE HEADERS] ${JSON.stringify(headers, null, 2)}`);
  console.log(`[RESPONSE BODY]\n${JSON.stringify(body, null, 2)}`);
}

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ${PASS}: ${message}`);
    passCount++;
  } else {
    console.error(`  ${FAIL}: ${message}`);
    failCount++;
  }
}

const BASE_URL = `http://localhost:3000${API_ENDPOINTS.ADMIN.AUTH.LOGIN}`;

const sampleValidUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "admin@techsonance.co.in",
  name: "Master Admin",
  role: "owner" as const,
};

async function run() {
  logSection("STARTING HARDCORE BLACK-BOX VERIFICATION: POST /api/admin/auth/login");

  resetRootContainer();

  let rateLimitSuccess = true;
  let authShouldThrow: Error | null = null;

  const mockRateLimiterService = {
    getClientIp: () => "127.0.0.1",
    check: async () => ({
      success: rateLimitSuccess,
      remaining: rateLimitSuccess ? 4 : 0,
      retryAfter: rateLimitSuccess ? undefined : 60,
    }),
  };

  const mockAuthService = {
    authenticate: async (email: string, _pass: string) => {
      if (authShouldThrow) throw authShouldThrow;
      return {
        ...sampleValidUser,
        email,
      };
    },
  };

  const container = getContainer();
  container.bind({ provide: RateLimiterService, useValue: mockRateLimiterService as any });
  container.bind({ provide: AdminAuthService, useValue: mockAuthService as any });

  const makeReq = (body: unknown, extraHeaders: Record<string, string> = {}) =>
    new Request(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    });

  // ─── TEST CASE 1: Foreign Origin Rejection (403) ───────────────────────────
  {
    logRequest({
      caseNum: 1,
      description: "Foreign origin must be rejected with 403 Forbidden",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AUTH.LOGIN,
      actor: "Untrusted Cross-Site Origin",
      headers: { origin: "https://malicious-external-site.com" },
      payload: { email: "admin@techsonance.co.in", password: "SecurePassword123!" },
    });

    const req = makeReq(
      { email: "admin@techsonance.co.in", password: "SecurePassword123!" },
      { origin: "https://malicious-external-site.com" },
    );

    const res = await postLoginPOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 403, "Status code must be 403 Forbidden");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.FORBIDDEN, `Error code must be ${ErrorCode.FORBIDDEN}`);
    assert(body.error?.message === AUTH_ERRORS.FORBIDDEN_ORIGIN, "Origin mismatch message matched");
  }

  // ─── TEST CASE 2: Malformed Email (422) ────────────────────────────────────
  {
    logRequest({
      caseNum: 2,
      description: "Malformed email must return 422 Validation Error",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AUTH.LOGIN,
      actor: "Anonymous User",
      payload: { email: "not-an-email", password: "ValidPassword123!" },
    });

    const req = makeReq({ email: "not-an-email", password: "ValidPassword123!" });
    const res = await postLoginPOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 422, "Status code must be 422 Validation Error");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.VALIDATION, `Error code must be ${ErrorCode.VALIDATION}`);
    assert(body.error?.fieldErrors?.email !== undefined, "fieldErrors.email is present");
  }

  // ─── TEST CASE 3: Short Password (422) ─────────────────────────────────────
  {
    logRequest({
      caseNum: 3,
      description: "Password shorter than 6 characters returns 422 Validation Error",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AUTH.LOGIN,
      actor: "Anonymous User",
      payload: { email: "admin@techsonance.co.in", password: "123" },
    });

    const req = makeReq({ email: "admin@techsonance.co.in", password: "123" });
    const res = await postLoginPOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 422, "Status code must be 422 Validation Error");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.VALIDATION, `Error code must be ${ErrorCode.VALIDATION}`);
    assert(body.error?.fieldErrors?.password !== undefined, "fieldErrors.password is present");
  }

  // ─── TEST CASE 4: Rate Limiting / Brute Force Protection (429) ────────────
  {
    rateLimitSuccess = false;

    logRequest({
      caseNum: 4,
      description: "Exceeded login attempts must return 429 Too Many Requests with Retry-After",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AUTH.LOGIN,
      actor: "Brute Force Attacker",
      payload: { email: "admin@techsonance.co.in", password: "GuessedPassword123!" },
    });

    const req = makeReq({ email: "admin@techsonance.co.in", password: "GuessedPassword123!" });
    const res = await postLoginPOST(req);
    const body = await res.json();
    logResponse(res.status, body, { "Retry-After": res.headers.get("Retry-After") });

    assert(res.status === 429, "Status code must be 429 Too Many Requests");
    assert(res.headers.get("Retry-After") === "60", "Retry-After header set to 60s");
    assert(body.ok === false, "Envelope ok must be false");
    assert(
      body.error?.code === ErrorCode.RATE_LIMITED,
      `Error code must be ${ErrorCode.RATE_LIMITED}`,
    );
    assert(body.error?.message === AUTH_ERRORS.RATE_LIMITED, "Rate limit error message matched");
    assert(body.error?.retryAfterSec === 60, "retryAfterSec matches 60");

    rateLimitSuccess = true; // Reset
  }

  // ─── TEST CASE 5: Invalid Credentials (401) ────────────────────────────────
  {
    authShouldThrow = new AppError(ErrorCode.UNAUTHENTICATED, AUTH_ERRORS.INVALID_CREDENTIALS);

    logRequest({
      caseNum: 5,
      description: "Invalid credentials must return 401 Unauthenticated",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AUTH.LOGIN,
      actor: "Unknown User",
      payload: { email: "admin@techsonance.co.in", password: "WrongPassword999!" },
    });

    const req = makeReq({ email: "admin@techsonance.co.in", password: "WrongPassword999!" });
    const res = await postLoginPOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 401, "Status code must be 401 Unauthenticated");
    assert(body.ok === false, "Envelope ok must be false");
    assert(
      body.error?.code === ErrorCode.UNAUTHENTICATED,
      `Error code must be ${ErrorCode.UNAUTHENTICATED}`,
    );
    assert(
      body.error?.message === AUTH_ERRORS.INVALID_CREDENTIALS,
      "Invalid credentials message matched",
    );

    authShouldThrow = null; // Reset
  }

  // ─── TEST CASE 6: Disabled User Account (403) ──────────────────────────────
  {
    authShouldThrow = new AppError(ErrorCode.FORBIDDEN, AUTH_ERRORS.ACCOUNT_DISABLED);

    logRequest({
      caseNum: 6,
      description: "Disabled user account must return 403 Forbidden",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AUTH.LOGIN,
      actor: "Deactivated Staff Member",
      payload: { email: "deactivated@techsonance.co.in", password: "CorrectPassword123!" },
    });

    const req = makeReq({
      email: "deactivated@techsonance.co.in",
      password: "CorrectPassword123!",
    });
    const res = await postLoginPOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 403, "Status code must be 403 Forbidden");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.FORBIDDEN, `Error code must be ${ErrorCode.FORBIDDEN}`);
    assert(
      body.error?.message === AUTH_ERRORS.ACCOUNT_DISABLED,
      "Account disabled message matched",
    );

    authShouldThrow = null; // Reset
  }

  // ─── TEST CASE 7: Successful Login (200) ───────────────────────────────────
  {
    logRequest({
      caseNum: 7,
      description: "Valid credentials successfully authenticate, set cookie, and return 200 OK",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AUTH.LOGIN,
      actor: "Legitimate Admin",
      payload: { email: "admin@techsonance.co.in", password: "ValidPassword123!" },
    });

    const req = makeReq({ email: "admin@techsonance.co.in", password: "ValidPassword123!" });
    const res = await postLoginPOST(req);
    const body = await res.json();
    const setCookie = res.headers.get("set-cookie");
    logResponse(res.status, body, { "set-cookie": setCookie });

    assert(res.status === 200, "Status code must be 200 OK");
    assert(body.ok === true, "Envelope ok must be true");
    assert(body.data?.user?.id === sampleValidUser.id, "data.user.id matches expected user ID");
    assert(
      body.data?.user?.email === "admin@techsonance.co.in",
      "data.user.email matches submitted email",
    );
    assert(body.data?.user?.role === "owner", "data.user.role matches owner");
    assert(body.user?.id === sampleValidUser.id, "top-level user.id present (backwards-compat)");
    assert(body.message === AUTH_MESSAGES.LOGIN_SUCCESS, "Success message matches constant");
    assert(setCookie !== null, "set-cookie header is present");
    assert(setCookie?.includes(SESSION_COOKIE) === true, `set-cookie contains ${SESSION_COOKIE}`);
    assert(setCookie?.includes("HttpOnly") === true, "set-cookie contains HttpOnly");
  }

  // ─── TEST CASE 8: Unexpected Service Crash (500) ───────────────────────────
  {
    authShouldThrow = new Error("Database pool connection timeout");

    logRequest({
      caseNum: 8,
      description: "Unexpected service crash maps cleanly to 500 Internal Server Error",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AUTH.LOGIN,
      actor: "Legitimate Admin",
      payload: { email: "admin@techsonance.co.in", password: "ValidPassword123!" },
    });

    const req = makeReq({ email: "admin@techsonance.co.in", password: "ValidPassword123!" });
    const res = await postLoginPOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 500, "Status code must be 500 Internal Server Error");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.INTERNAL, `Error code must be ${ErrorCode.INTERNAL}`);
    assert(
      body.error?.message === AUTH_ERRORS.LOGIN_FAILED,
      "Internal error message matches constant",
    );

    authShouldThrow = null; // Reset
  }

  // ─── SUMMARY SCOREBOARD ────────────────────────────────────────────────────
  logSection(`VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  if (failCount > 0) {
    console.error(`\n❌ Black-box test suite failed with ${failCount} errors.`);
    process.exit(1);
  } else {
    console.log(`\n✅ All ${passCount} assertions passed cleanly! Zero regressions.`);
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("Unhandled fatal exception during test run:", err);
  process.exit(1);
});
