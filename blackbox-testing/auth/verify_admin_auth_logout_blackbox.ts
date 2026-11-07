/**
 * verify_admin_auth_logout_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for:
 * - POST /api/admin/auth/logout
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handler directly (app/api/admin/auth/logout/route).
 * 2. Mandatory request logging (Method, Path, Origin, Headers, Payload, Actor Context).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix:
 *    - 403 FORBIDDEN on foreign origin
 *    - 200 OK on legitimate logout with Set-Cookie deletion & success message
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import "../preload.cjs";
import { POST as postLogoutPOST } from "@/app/api/admin/auth/logout/route";
import { resetRootContainer } from "@/lib/di/container";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { ErrorCode } from "@/lib/errors";
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

const BASE_URL = `http://localhost:3000${API_ENDPOINTS.ADMIN.AUTH.LOGOUT}`;

async function run() {
  logSection("STARTING HARDCORE BLACK-BOX VERIFICATION: POST /api/admin/auth/logout");

  resetRootContainer();

  const makeReq = (extraHeaders: Record<string, string> = {}) =>
    new Request(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders,
      },
    });

  // ─── TEST CASE 1: Foreign Origin Rejection (403) ───────────────────────────
  {
    logRequest({
      caseNum: 1,
      description: "Foreign origin must be rejected with 403 Forbidden",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AUTH.LOGOUT,
      actor: "Untrusted Cross-Site Origin",
      headers: { origin: "https://attacker-origin.com" },
    });

    const req = makeReq({ origin: "https://attacker-origin.com" });
    const res = await postLogoutPOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 403, "Status code must be 403 Forbidden");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.FORBIDDEN, `Error code must be ${ErrorCode.FORBIDDEN}`);
    assert(body.error?.message === AUTH_ERRORS.FORBIDDEN_ORIGIN, "Origin mismatch message matched");
  }

  // ─── TEST CASE 2: Successful Logout (200) ──────────────────────────────────
  {
    logRequest({
      caseNum: 2,
      description: "Legitimate logout request clears session cookie and returns 200 OK",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AUTH.LOGOUT,
      actor: "Authenticated Admin",
    });

    const req = makeReq();
    const res = await postLogoutPOST(req);
    const body = await res.json();
    const setCookie = res.headers.get("set-cookie");
    logResponse(res.status, body, { "set-cookie": setCookie });

    assert(res.status === 200, "Status code must be 200 OK");
    assert(body.ok === true, "Envelope ok must be true");
    assert(
      body.data?.message === AUTH_MESSAGES.LOGOUT_SUCCESS,
      "data.message matches LOGOUT_SUCCESS",
    );
    assert(
      body.message === AUTH_MESSAGES.LOGOUT_SUCCESS,
      "Top-level message present (backwards-compat)",
    );
    assert(body.success === true, "Top-level success boolean is true");
    assert(setCookie !== null, "set-cookie header is present in response");
    assert(setCookie?.includes(SESSION_COOKIE) === true, `set-cookie references ${SESSION_COOKIE}`);
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
