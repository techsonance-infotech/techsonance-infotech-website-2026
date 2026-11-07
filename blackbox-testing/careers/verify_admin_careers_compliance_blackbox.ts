/**
 * verify_admin_careers_compliance_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for:
 * - GET  /api/admin/careers/compliance (GDPR Candidate Data Export)
 * - POST /api/admin/careers/compliance (GDPR Candidate Data Purge / Erasure)
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handler directly (app/api/admin/careers/compliance/route).
 * 2. Mandatory request logging (Method, Path, Origin, Headers, Payload, Actor Context).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix:
 *    GET (Export):
 *      - 403 FORBIDDEN on foreign origin
 *      - 401 UNAUTHENTICATED on missing session
 *      - 403 FORBIDDEN on Editor role (Admin/Owner required)
 *      - 422 VALIDATION on malformed email query param
 *      - 200 OK on valid candidate export with full records envelope
 *      - 500 INTERNAL on unexpected service error
 *    POST (Purge):
 *      - 403 FORBIDDEN on foreign origin
 *      - 403 FORBIDDEN on Editor role (Admin/Owner required)
 *      - 422 VALIDATION on invalid email payload
 *      - 200 OK on successful candidate purge with deletion counters
 *      - 500 INTERNAL on unexpected storage/service failure
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import "../preload.cjs";
import {
  GET as getComplianceGET,
  POST as postCompliancePOST,
} from "@/app/api/admin/careers/compliance/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { ApplicationsService } from "@/lib/services/applications.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { ErrorCode } from "@/lib/errors";
import { CAREER_ERRORS, CAREER_COMPLIANCE_MESSAGES } from "@/lib/constants/careers.constants";

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

const BASE_URL = `http://localhost:3000${API_ENDPOINTS.ADMIN.COMPLIANCE}`;

const adminSession = {
  userId: "admin-uuid-1111",
  email: "admin@techsonance.co.in",
  role: "admin" as const,
  site: { id: "site-uuid-1111" },
};

const editorSession = {
  userId: "editor-uuid-2222",
  email: "editor@techsonance.co.in",
  role: "editor" as const,
  site: { id: "site-uuid-1111" },
};

const sampleCandidateData = {
  email: "candidate@example.com",
  exportedAt: new Date("2026-11-07T06:00:00.000Z"),
  applications: [
    {
      id: "app-1",
      candidateName: "Jane Candidate",
      jobId: "job-100",
      email: "candidate@example.com",
    },
  ],
  talentPoolSubmissions: [],
};

const samplePurgeResult = {
  success: true,
  email: "candidate@example.com",
  deletedApplicationsCount: 1,
  deletedTalentPoolCount: 0,
  deletedFilesCount: 1,
};

async function run() {
  logSection("STARTING HARDCORE BLACK-BOX VERIFICATION: GET & POST /api/admin/careers/compliance");

  resetRootContainer();

  let currentSession: any = adminSession;
  let exportShouldThrow = false;
  let purgeShouldThrow = false;

  const mockAuthService = {
    getCurrentSession: async () => currentSession,
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

  const mockApplicationsService = {
    exportCandidateData: async (_email: string) => {
      if (exportShouldThrow) throw new Error("Database pool timeout");
      return sampleCandidateData;
    },
    purgeCandidateData: async (_email: string, _actorId?: string, _ip?: string) => {
      if (purgeShouldThrow) throw new Error("Storage service unavailable");
      return samplePurgeResult;
    },
  };

  const container = getContainer();
  container.bind({ provide: AdminAuthService, useValue: mockAuthService as any });
  container.bind({ provide: ApplicationsService, useValue: mockApplicationsService as any });

  const makeGetReq = (query: string = "", extraHeaders: Record<string, string> = {}) =>
    new Request(`${BASE_URL}${query}`, {
      method: "GET",
      headers: { ...extraHeaders },
    });

  const makePostReq = (body: unknown, extraHeaders: Record<string, string> = {}) =>
    new Request(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    });

  // ══════════════════════════════════════════════════════════════════════════
  // PART 1: GET /api/admin/careers/compliance (GDPR Export)
  // ══════════════════════════════════════════════════════════════════════════

  // ─── TEST CASE 1: Foreign Origin on Export (403) ──────────────────────────
  {
    logRequest({
      caseNum: 1,
      description: "GET — Foreign origin must be rejected with 403 Forbidden",
      method: "GET",
      path: `${API_ENDPOINTS.ADMIN.COMPLIANCE}?email=candidate@example.com`,
      actor: "Untrusted Cross-Site Origin",
      headers: { origin: "https://evil-untrusted-site.com" },
    });

    const req = makeGetReq("?email=candidate@example.com", {
      origin: "https://evil-untrusted-site.com",
    });

    const res = await getComplianceGET(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 403, "Status code must be 403 Forbidden");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.FORBIDDEN, `Error code must be ${ErrorCode.FORBIDDEN}`);
    assert(
      body.error?.message === CAREER_ERRORS.FORBIDDEN_ORIGIN,
      "Origin mismatch message matched",
    );
  }

  // ─── TEST CASE 2: Unauthenticated Export (401) ────────────────────────────
  {
    currentSession = null;

    logRequest({
      caseNum: 2,
      description: "GET — Missing session returns 401 Unauthenticated",
      method: "GET",
      path: `${API_ENDPOINTS.ADMIN.COMPLIANCE}?email=candidate@example.com`,
      actor: "Anonymous User",
    });

    const req = makeGetReq("?email=candidate@example.com");
    const res = await getComplianceGET(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 401, "Status code must be 401 Unauthenticated");
    assert(body.ok === false, "Envelope ok must be false");
    assert(
      body.error?.code === ErrorCode.UNAUTHENTICATED,
      `Error code must be ${ErrorCode.UNAUTHENTICATED}`,
    );

    currentSession = adminSession; // Reset
  }

  // ─── TEST CASE 3: Editor Role Forbidden on Export (403) ───────────────────
  {
    currentSession = editorSession;

    logRequest({
      caseNum: 3,
      description: "GET — Editor role rejected with 403 Forbidden (Admin/Owner required)",
      method: "GET",
      path: `${API_ENDPOINTS.ADMIN.COMPLIANCE}?email=candidate@example.com`,
      actor: "Editor (Non-Compliance Role)",
    });

    const req = makeGetReq("?email=candidate@example.com");
    const res = await getComplianceGET(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 403, "Status code must be 403 Forbidden");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.FORBIDDEN, `Error code must be ${ErrorCode.FORBIDDEN}`);
    assert(
      body.error?.message === CAREER_ERRORS.FORBIDDEN_COMPLIANCE_EXPORT,
      "Compliance export forbidden message matched",
    );

    currentSession = adminSession; // Reset
  }

  // ─── TEST CASE 4: Invalid Email Query Param (422) ─────────────────────────
  {
    logRequest({
      caseNum: 4,
      description: "GET — Malformed email query param returns 422 Validation Error",
      method: "GET",
      path: `${API_ENDPOINTS.ADMIN.COMPLIANCE}?email=not-an-email`,
      actor: "Admin",
    });

    const req = makeGetReq("?email=not-an-email");
    const res = await getComplianceGET(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 422, "Status code must be 422 Validation Error");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.VALIDATION, `Error code must be ${ErrorCode.VALIDATION}`);
    assert(body.error?.fieldErrors?.email !== undefined, "fieldErrors.email is present");
  }

  // ─── TEST CASE 5: Successful Candidate Export (200) ───────────────────────
  {
    logRequest({
      caseNum: 5,
      description: "GET — Admin exports candidate data successfully with 200 OK",
      method: "GET",
      path: `${API_ENDPOINTS.ADMIN.COMPLIANCE}?email=candidate@example.com`,
      actor: "Admin",
    });

    const req = makeGetReq("?email=candidate@example.com");
    const res = await getComplianceGET(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 200, "Status code must be 200 OK");
    assert(body.ok === true, "Envelope ok must be true");
    assert(body.data?.email === "candidate@example.com", "data.email matches candidate");
    assert(body.data?.applications?.length === 1, "data.applications has 1 entry");
    assert(
      body.candidateData?.email === "candidate@example.com",
      "candidateData.email present (backwards-compat)",
    );
    assert(
      body.message === CAREER_COMPLIANCE_MESSAGES.EXPORT_SUCCESS,
      "Success message matches constant",
    );
  }

  // ─── TEST CASE 6: Service Error on Export (500) ───────────────────────────
  {
    exportShouldThrow = true;

    logRequest({
      caseNum: 6,
      description: "GET — Service crash maps to clean 500 Internal Server Error",
      method: "GET",
      path: `${API_ENDPOINTS.ADMIN.COMPLIANCE}?email=candidate@example.com`,
      actor: "Admin",
    });

    const req = makeGetReq("?email=candidate@example.com");
    const res = await getComplianceGET(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 500, "Status code must be 500 Internal Server Error");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.INTERNAL, `Error code must be ${ErrorCode.INTERNAL}`);
    assert(
      body.error?.message === CAREER_ERRORS.FAILED_EXPORT_COMPLIANCE,
      "Internal error message matches constant",
    );

    exportShouldThrow = false; // Reset
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PART 2: POST /api/admin/careers/compliance (GDPR Purge)
  // ══════════════════════════════════════════════════════════════════════════

  // ─── TEST CASE 7: Foreign Origin on Purge (403) ───────────────────────────
  {
    logRequest({
      caseNum: 7,
      description: "POST — Foreign origin on purge must be rejected with 403 Forbidden",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.COMPLIANCE,
      actor: "Untrusted Cross-Site Origin",
      headers: { origin: "https://evil-untrusted-site.com" },
      payload: { email: "candidate@example.com" },
    });

    const req = makePostReq(
      { email: "candidate@example.com" },
      { origin: "https://evil-untrusted-site.com" },
    );

    const res = await postCompliancePOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 403, "Status code must be 403 Forbidden");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.FORBIDDEN, `Error code must be ${ErrorCode.FORBIDDEN}`);
  }

  // ─── TEST CASE 8: Editor Role Forbidden on Purge (403) ────────────────────
  {
    currentSession = editorSession;

    logRequest({
      caseNum: 8,
      description: "POST — Editor role rejected with 403 Forbidden on purge (Admin/Owner required)",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.COMPLIANCE,
      actor: "Editor",
      payload: { email: "candidate@example.com" },
    });

    const req = makePostReq({ email: "candidate@example.com" });
    const res = await postCompliancePOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 403, "Status code must be 403 Forbidden");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.FORBIDDEN, `Error code must be ${ErrorCode.FORBIDDEN}`);
    assert(
      body.error?.message === CAREER_ERRORS.FORBIDDEN_COMPLIANCE_PURGE,
      "Compliance purge forbidden message matched",
    );

    currentSession = adminSession; // Reset
  }

  // ─── TEST CASE 9: Invalid Email in Body (422) ─────────────────────────────
  {
    logRequest({
      caseNum: 9,
      description: "POST — Invalid email in body returns 422 Validation Error",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.COMPLIANCE,
      actor: "Admin",
      payload: { email: "invalid-email" },
    });

    const req = makePostReq({ email: "invalid-email" });
    const res = await postCompliancePOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 422, "Status code must be 422 Validation Error");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.VALIDATION, `Error code must be ${ErrorCode.VALIDATION}`);
    assert(body.error?.fieldErrors?.email !== undefined, "fieldErrors.email is present");
  }

  // ─── TEST CASE 10: Successful Candidate Purge (200) ───────────────────────
  {
    logRequest({
      caseNum: 10,
      description: "POST — Admin purges candidate records successfully with 200 OK",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.COMPLIANCE,
      actor: "Admin",
      payload: { email: "candidate@example.com" },
    });

    const req = makePostReq({ email: "candidate@example.com" });
    const res = await postCompliancePOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 200, "Status code must be 200 OK");
    assert(body.ok === true, "Envelope ok must be true");
    assert(body.data?.deletedApplicationsCount === 1, "data.deletedApplicationsCount is 1");
    assert(body.data?.deletedFilesCount === 1, "data.deletedFilesCount is 1");
    assert(body.result?.success === true, "result.success is true (backwards-compat)");
    assert(
      body.message === CAREER_COMPLIANCE_MESSAGES.PURGE_SUCCESS,
      "Success message matches constant",
    );
  }

  // ─── TEST CASE 11: Service Error on Purge (500) ───────────────────────────
  {
    purgeShouldThrow = true;

    logRequest({
      caseNum: 11,
      description: "POST — Unexpected purge failure maps cleanly to 500 Internal Server Error",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.COMPLIANCE,
      actor: "Admin",
      payload: { email: "candidate@example.com" },
    });

    const req = makePostReq({ email: "candidate@example.com" });
    const res = await postCompliancePOST(req);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 500, "Status code must be 500 Internal Server Error");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.INTERNAL, `Error code must be ${ErrorCode.INTERNAL}`);
    assert(
      body.error?.message === CAREER_ERRORS.FAILED_PURGE_CANDIDATE,
      "Internal error message matches constant",
    );

    purgeShouldThrow = false; // Reset
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
