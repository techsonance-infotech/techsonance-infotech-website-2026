/**
 * verify_admin_ai_usage_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for:
 * - GET /api/admin/ai/usage
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handler directly (app/api/admin/ai/usage/route).
 * 2. Mandatory request logging (Method, Path, Origin, Headers, Payload, Actor Context).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix:
 *    - 403 FORBIDDEN on foreign origin
 *    - 401 UNAUTHENTICATED without active admin session
 *    - 200 OK on viewer role (accessible to all authenticated admin roles)
 *    - 200 OK on editor role with complete telemetry aggregates
 *    - Verification of both top-level keys and data envelope
 *    - 500 INTERNAL on unexpected telemetry service failure
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import "../preload.cjs";
import { GET as getAiUsageGET } from "@/app/api/admin/ai/usage/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminTelemetryService } from "@/lib/services/admin-telemetry.service";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { ErrorCode } from "@/lib/errors";
import { AI_USAGE_ERRORS } from "@/lib/constants/ai.constants";

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
    console.log(`[PAYLOAD] ${typeof details.payload === "string" ? details.payload : JSON.stringify(details.payload)}`);
  }
}

function logResponse(status: number, body: unknown) {
  console.log(`[RESPONSE STATUS] ${status}`);
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

async function run() {
  logSection("STARTING HARDCORE BLACK-BOX VERIFICATION: GET /api/admin/ai/usage");

  resetRootContainer();

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

  const sampleSummary = {
    tokensToday: 14500,
    tokensThisWeek: 85200,
    dailyPostsUsed: 1,
    dailyPostCap: 1,
    weeklyPostsUsed: 2,
    weeklyPostCap: 3,
    totalJobs: 18,
    activeJobs: 1,
    providerStats: [
      {
        provider: "gemini-2.5-pro",
        totalCalls: 32,
        successCalls: 31,
        avgDurationMs: 1420,
      },
      {
        provider: "workers-ai-flux",
        totalCalls: 12,
        successCalls: 12,
        avgDurationMs: 2310,
      },
    ],
    recentEvents: [],
  };

  let currentSession: any = sampleEditorSession;
  let serviceShouldThrow = false;

  const mockAuthService = {
    getCurrentSession: async () => currentSession,
    hasPermission: () => true,
  };

  const mockTelemetryService = {
    getTelemetrySummary: async () => {
      if (serviceShouldThrow) {
        throw new Error("Telemetry DB pool timeout");
      }
      return sampleSummary;
    },
  };

  const container = getContainer();
  container.bind({ provide: AdminAuthService, useValue: mockAuthService as any });
  container.bind({ provide: AdminTelemetryService, useValue: mockTelemetryService as any });

  // ─── TEST CASE 1: Foreign Origin Rejection (403) ──────────────────────────
  {
    logRequest({
      caseNum: 1,
      description: "Origin mismatch must be rejected with 403 Forbidden",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.AI.USAGE,
      actor: "Untrusted Client",
      headers: { origin: "https://evil-hacker.site" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.USAGE}`, {
      method: "GET",
      headers: { origin: "https://evil-hacker.site" },
    });

    const res = await getAiUsageGET(req as any);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 403, "Status code must be 403 Forbidden");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.FORBIDDEN, `Error code must be ${ErrorCode.FORBIDDEN}`);
    assert(body.error?.message === AI_USAGE_ERRORS.FORBIDDEN_ORIGIN, "Origin mismatch message matched");
  }

  // ─── TEST CASE 2: Unauthenticated Access (401) ────────────────────────────
  {
    currentSession = null;
    logRequest({
      caseNum: 2,
      description: "Missing session must return 401 Unauthenticated",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.AI.USAGE,
      actor: "Anonymous Visitor",
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.USAGE}`, {
      method: "GET",
    });

    const res = await getAiUsageGET(req as any);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 401, "Status code must be 401 Unauthenticated");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.UNAUTHENTICATED, `Error code must be ${ErrorCode.UNAUTHENTICATED}`);
    assert(body.error?.message === AI_USAGE_ERRORS.UNAUTHORIZED, "Unauthorized error message matched");
  }

  // ─── TEST CASE 3: Viewer Role Access (200) ────────────────────────────────
  {
    currentSession = sampleViewerSession;
    logRequest({
      caseNum: 3,
      description: "Viewer role allowed to read telemetry metrics with 200 OK",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.AI.USAGE,
      actor: "Viewer (Read-Only)",
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.USAGE}`, {
      method: "GET",
    });

    const res = await getAiUsageGET(req as any);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 200, "Status code must be 200 OK");
    assert(body.ok === true, "Envelope ok must be true");
    assert(body.tokensToday === 14500, "tokensToday returned at top level");
    assert(body.data?.tokensToday === 14500, "tokensToday returned in data envelope");
  }

  // ─── TEST CASE 4: Editor Role Access (200) ────────────────────────────────
  {
    currentSession = sampleEditorSession;
    logRequest({
      caseNum: 4,
      description: "Editor role receives full telemetry aggregates with 200 OK",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.AI.USAGE,
      actor: "Editor",
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.USAGE}`, {
      method: "GET",
    });

    const res = await getAiUsageGET(req as any);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 200, "Status code must be 200 OK");
    assert(body.ok === true, "Envelope ok must be true");
    assert(body.data?.totalJobs === 18, "data.totalJobs matches expected 18");
    assert(body.data?.activeJobs === 1, "data.activeJobs matches expected 1");
    assert(Array.isArray(body.data?.providerStats), "data.providerStats is an array");
    assert(body.data?.providerStats?.length === 2, "2 provider stats records present");
  }

  // ─── TEST CASE 5: Unexpected Service Error (500) ──────────────────────────
  {
    serviceShouldThrow = true;
    logRequest({
      caseNum: 5,
      description: "Service crash maps to clean 500 Internal Server Error",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.AI.USAGE,
      actor: "Editor",
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.USAGE}`, {
      method: "GET",
    });

    const res = await getAiUsageGET(req as any);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 500, "Status code must be 500 Internal Server Error");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.INTERNAL, `Error code must be ${ErrorCode.INTERNAL}`);
    assert(body.error?.message === AI_USAGE_ERRORS.LOAD_FAILED, "Internal error message matches constant");
  }

  // ─── SUMMARY SCOREBOARD ──────────────────────────────────────────────────
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
