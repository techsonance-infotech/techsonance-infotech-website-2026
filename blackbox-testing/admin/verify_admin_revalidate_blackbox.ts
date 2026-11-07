/**
 * verify_admin_revalidate_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for:
 * - POST /api/admin/revalidate
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handler directly (app/api/admin/revalidate/route).
 * 2. Mandatory request logging (Method, Path, Origin, Headers, Payload, Actor Context).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix:
 *    - 403 FORBIDDEN on foreign origin
 *    - 401 UNAUTHENTICATED without active admin session
 *    - 403 FORBIDDEN for Viewer role (Editor+ required)
 *    - 400 BAD_REQUEST on invalid JSON body
 *    - 422 VALIDATION on schema violations
 *    - 200 OK with default tags on empty body (Editor role)
 *    - 200 OK with custom tags and paths
 *    - 500 INTERNAL on unexpected service/DB crash
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import "../preload.cjs";
import { POST as postRevalidatePOST } from "@/app/api/admin/revalidate/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { ErrorCode } from "@/lib/errors";
import {
  DEFAULT_REVALIDATE_TAGS,
  REVALIDATE_ERRORS,
  REVALIDATE_MESSAGES,
} from "@/lib/constants/revalidate.constants";

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

const BASE_URL = `http://localhost:3000${API_ENDPOINTS.ADMIN.REVALIDATE}`;

const editorSession = {
  userId: "admin-uuid-1111",
  email: "editor@techsonance.co.in",
  role: "editor" as const,
  site: { id: "site-uuid-1111" },
};

const viewerSession = {
  userId: "viewer-uuid-2222",
  email: "viewer@techsonance.co.in",
  role: "viewer" as const,
  site: { id: "site-uuid-1111" },
};

async function run() {
  logSection("STARTING HARDCORE BLACK-BOX VERIFICATION: POST /api/admin/revalidate");

  resetRootContainer();

  let currentSession: any = editorSession;
  let authShouldThrow = false;

  const mockAuthService = {
    getCurrentSession: async () => {
      if (authShouldThrow) throw new Error("Database pool connection timeout");
      return currentSession;
    },
    hasPermission: (role: string, required: string) => {
      const hierarchy: Record<string, number> = {
        viewer: 1,
        author: 2,
        editor: 3,
        admin: 4,
        owner: 5,
      };
      return (hierarchy[role] ?? 0) >= (hierarchy[required] ?? 0);
    },
  };

  const container = getContainer();
  container.bind({ provide: AdminAuthService, useValue: mockAuthService as any });

  const makeReq = (body?: unknown, extraHeaders: Record<string, string> = {}) =>
    new Request(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  // ─── TEST CASE 1: Foreign Origin Rejection (403) ───────────────────────────
  {
    logRequest({
      caseNum: 1,
      description: "Foreign origin must be rejected with 403 Forbidden",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.REVALIDATE,
      actor: "Untrusted Cross-Site Origin",
      headers: { origin: "https://evil-cross-site.com" },
      payload: { tags: ["posts"] },
    });

    const req = makeReq({ tags: ["posts"] }, { origin: "https://evil-cross-site.com" });
    const res = await postRevalidatePOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 403, "Status code must be 403 Forbidden");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.FORBIDDEN, `Error code must be ${ErrorCode.FORBIDDEN}`);
    assert(body.error?.message === REVALIDATE_ERRORS.FORBIDDEN_ORIGIN, "Origin mismatch message matched");
  }

  // ─── TEST CASE 2: Unauthenticated Access (401) ─────────────────────────────
  {
    currentSession = null;

    logRequest({
      caseNum: 2,
      description: "Missing session must return 401 Unauthenticated",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.REVALIDATE,
      actor: "Anonymous User",
      payload: { tags: ["posts"] },
    });

    const req = makeReq({ tags: ["posts"] });
    const res = await postRevalidatePOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 401, "Status code must be 401 Unauthenticated");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.UNAUTHENTICATED, `Error code must be ${ErrorCode.UNAUTHENTICATED}`);
    assert(body.error?.message === REVALIDATE_ERRORS.UNAUTHORIZED, "Unauthorized error message matched");
  }

  // ─── TEST CASE 3: Role Authorization / RBAC (403) ──────────────────────────
  {
    currentSession = viewerSession;

    logRequest({
      caseNum: 3,
      description: "Viewer role rejected with 403 Forbidden (Editor+ required)",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.REVALIDATE,
      actor: "Viewer (Read-Only)",
      payload: { tags: ["posts"] },
    });

    const req = makeReq({ tags: ["posts"] });
    const res = await postRevalidatePOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 403, "Status code must be 403 Forbidden");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.FORBIDDEN, `Error code must be ${ErrorCode.FORBIDDEN}`);
    assert(body.error?.message === REVALIDATE_ERRORS.FORBIDDEN_ROLE, "Role forbidden message matched");

    currentSession = editorSession; // Reset to editor
  }

  // ─── TEST CASE 4: Malformed JSON Body (400) ────────────────────────────────
  {
    logRequest({
      caseNum: 4,
      description: "Malformed JSON body returns 400 Bad Request",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.REVALIDATE,
      actor: "Editor",
      payload: "{ bad-json-structure",
    });

    const req = new Request(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ bad-json-structure",
    });

    const res = await postRevalidatePOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 400, "Status code must be 400 Bad Request");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.BAD_REQUEST, `Error code must be ${ErrorCode.BAD_REQUEST}`);
  }

  // ─── TEST CASE 5: Schema Validation Failure (422) ──────────────────────────
  {
    logRequest({
      caseNum: 5,
      description: "Invalid tags type returns 422 Validation Error",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.REVALIDATE,
      actor: "Editor",
      payload: { tags: "should-be-an-array" },
    });

    const req = makeReq({ tags: "should-be-an-array" });
    const res = await postRevalidatePOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 422, "Status code must be 422 Validation Error");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.VALIDATION, `Error code must be ${ErrorCode.VALIDATION}`);
    assert(body.error?.message === REVALIDATE_ERRORS.VALIDATION_FAILED, "Validation failure message matched");
    assert(body.error?.fieldErrors?.tags !== undefined, "fieldErrors.tags is present");
  }

  // ─── TEST CASE 6: Default Revalidation on Empty Body (200) ─────────────────
  {
    logRequest({
      caseNum: 6,
      description: "Empty body revalidates default site tags with 200 OK",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.REVALIDATE,
      actor: "Editor",
    });

    const req = makeReq();
    const res = await postRevalidatePOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 200, "Status code must be 200 OK");
    assert(body.ok === true, "Envelope ok must be true");
    assert(
      JSON.stringify(body.data?.revalidatedTags) === JSON.stringify(DEFAULT_REVALIDATE_TAGS),
      "data.revalidatedTags matches DEFAULT_REVALIDATE_TAGS",
    );
    assert(body.data?.revalidatedPaths?.length === 0, "data.revalidatedPaths is empty array");
    assert(body.data?.message === REVALIDATE_MESSAGES.REVALIDATE_SUCCESS, "Message matches constant");
    assert(body.success === true, "Top-level success boolean is true (backwards-compat)");
    assert(
      JSON.stringify(body.revalidated) === JSON.stringify(DEFAULT_REVALIDATE_TAGS),
      "Top-level revalidated matches default tags (backwards-compat)",
    );
  }

  // ─── TEST CASE 7: Custom Tags & Paths Revalidation (200) ───────────────────
  {
    const payload = {
      tags: ["posts", "post:ai-engineering-2026"],
      paths: ["/blog", "/careers"],
    };

    logRequest({
      caseNum: 7,
      description: "Custom tags and paths revalidate successfully with 200 OK",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.REVALIDATE,
      actor: "Editor",
      payload,
    });

    const req = makeReq(payload);
    const res = await postRevalidatePOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 200, "Status code must be 200 OK");
    assert(body.ok === true, "Envelope ok must be true");
    assert(
      JSON.stringify(body.data?.revalidatedTags) === JSON.stringify(payload.tags),
      "data.revalidatedTags matches submitted tags",
    );
    assert(
      JSON.stringify(body.data?.revalidatedPaths) === JSON.stringify(payload.paths),
      "data.revalidatedPaths matches submitted paths",
    );
    assert(body.timestamp !== undefined, "timestamp is present");
  }

  // ─── TEST CASE 8: Unexpected Service Crash (500) ───────────────────────────
  {
    authShouldThrow = true;

    logRequest({
      caseNum: 8,
      description: "Unexpected service crash maps cleanly to 500 Internal Server Error",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.REVALIDATE,
      actor: "Editor",
      payload: { tags: ["posts"] },
    });

    const req = makeReq({ tags: ["posts"] });
    const res = await postRevalidatePOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 500, "Status code must be 500 Internal Server Error");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.INTERNAL, `Error code must be ${ErrorCode.INTERNAL}`);
    assert(body.error?.message === REVALIDATE_ERRORS.REVALIDATE_FAILED, "Internal error message matches constant");

    authShouldThrow = false; // Reset
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
