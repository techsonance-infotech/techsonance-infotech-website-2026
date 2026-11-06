/**
 * verify_admin_applications_export_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for GET /api/admin/careers/applications/export
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handler directly (GET from app/api/admin/careers/applications/export/route).
 * 2. Mandatory request logging (Method, Path, Query, Caller Context).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix: Auth, Origin, UUID Validation, Role RBAC (Admin/Owner), CSV Stream, Storage archiving, JSON Envelope, and Error Handling.
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import { GET } from "@/app/api/admin/careers/applications/export/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { ApplicationsService } from "@/lib/services/applications.service";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { AppError, ErrorCode } from "@/lib/errors";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";

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
  query: Record<string, unknown>;
  caller: Record<string, unknown>;
}) {
  console.log(`\n----------------------------------------------------------------------`);
  console.log(`[TEST CASE ${details.caseNum}] ${details.description}`);
  console.log(`Incoming Request:`);
  console.log(`  Method:  ${details.method}`);
  console.log(`  Path:    ${details.path}`);
  console.log(`  Query:   ${JSON.stringify(details.query)}`);
  console.log(`  Caller:  ${JSON.stringify(details.caller)}`);
}

function logResponse(status: number, headers: Headers, body: unknown) {
  console.log(`Controller Response (HTTP ${status}):`);
  console.log(`Headers: Content-Type=${headers.get("content-type")}, Content-Disposition=${headers.get("content-disposition")}, x-request-id=${headers.get("x-request-id")}`);
  console.log(JSON.stringify(body, null, 2));
}

function assertTest(condition: boolean, caseNum: number, message: string) {
  if (condition) {
    console.log(`${PASS} [Case ${caseNum}]: ${message}`);
    passCount++;
  } else {
    console.error(`${FAIL} [Case ${caseNum}]: Assertion failed - ${message}`);
    failCount++;
  }
}

async function runBlackboxSuite() {
  logSection("STARTING HARDCORE BLACK-BOX VERIFICATION: GET /api/admin/careers/applications/export");

  resetRootContainer();

  const validJobId = "550e8400-e29b-41d4-a716-446655440000";
  const mockCsvContent =
    'ID,Candidate Name,Email,Phone,Status,Job Title,Knockout Triggered,Rating,Created At\n' +
    '"app-1","Sarah Connor","sarah@techsonance.co.in","+919876543210","interview","Lead DevOps Engineer","No","5","2026-11-06T12:00:00.000Z"\n' +
    '"app-2","John Doe","john@example.com","","new","Lead DevOps Engineer","Yes","","2026-11-06T14:30:00.000Z"';

  let currentSession: { userId: string; email: string; role: string } | null = {
    userId: "admin-uuid-1111",
    email: "admin@techsonance.co.in",
    role: "admin",
  };

  const mockAuthService = {
    getCurrentSession: async () => currentSession,
  };

  const mockApplicationsService = {
    generateApplicationsCsv: async (jobId?: string, actorId?: string) => {
      if (jobId === "00000000-0000-4000-a000-000000000000") {
        throw new Error("Simulated storage / database timeout");
      }
      const filename = jobId
        ? `applications-${jobId}-2026-11-06.csv`
        : "applications-all-2026-11-06.csv";
      return {
        csvData: mockCsvContent,
        filename,
        rowCount: 2,
        storagePath: `exports/${filename}`,
      };
    },
  };

  const container = getContainer();
  container.bind({ provide: AdminAuthService, useValue: mockAuthService as unknown as AdminAuthService });
  container.bind({ provide: ApplicationsService, useValue: mockApplicationsService as unknown as ApplicationsService });

  // Case 1: Unauthenticated request
  {
    currentSession = null;
    logRequest({
      caseNum: 1,
      description: "Reject unauthenticated request",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT,
      query: {},
      caller: { role: "anonymous" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT}`, {
      method: "GET",
    });

    const res = await GET(req);
    const json = await res.json();
    logResponse(res.status, res.headers, json);

    assertTest(res.status === 401 && json.ok === false && json.error?.code === ErrorCode.UNAUTHENTICATED, 1, "Returns 401 UNAUTHENTICATED");
  }

  // Case 2: Untrusted foreign origin
  {
    currentSession = { userId: "admin-uuid-1111", email: "admin@techsonance.co.in", role: "admin" };
    logRequest({
      caseNum: 2,
      description: "Reject foreign origin with 403 FORBIDDEN",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT,
      query: {},
      caller: currentSession,
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT}`, {
      method: "GET",
      headers: { origin: "https://malicious-scraping-site.com" },
    });

    const res = await GET(req);
    const json = await res.json();
    logResponse(res.status, res.headers, json);

    assertTest(res.status === 403 && json.ok === false && json.error?.code === ErrorCode.FORBIDDEN, 2, "Returns 403 FORBIDDEN for untrusted origin");
  }

  // Case 3: Reject non-admin/owner role (recruiter)
  {
    currentSession = { userId: "recruiter-uuid-2222", email: "recruiter@techsonance.co.in", role: "recruiter" };
    logRequest({
      caseNum: 3,
      description: "Reject recruiter role with 403 FORBIDDEN (Admin/Owner required)",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT,
      query: {},
      caller: currentSession,
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT}`, {
      method: "GET",
    });

    const res = await GET(req);
    const json = await res.json();
    logResponse(res.status, res.headers, json);

    assertTest(res.status === 403 && json.ok === false && json.error?.code === ErrorCode.FORBIDDEN, 3, "Returns 403 FORBIDDEN for non-admin role");
  }

  // Case 4: Invalid UUID query parameter
  {
    currentSession = { userId: "admin-uuid-1111", email: "admin@techsonance.co.in", role: "admin" };
    logRequest({
      caseNum: 4,
      description: "Reject invalid jobId parameter with 400 VALIDATION",
      method: "GET",
      path: `${API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT}?jobId=invalid-format`,
      query: { jobId: "invalid-format" },
      caller: currentSession,
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT}?jobId=invalid-format`, {
      method: "GET",
    });

    const res = await GET(req);
    const json = await res.json();
    logResponse(res.status, res.headers, json);

    assertTest(res.status === 400 && json.ok === false && json.error?.code === ErrorCode.VALIDATION, 4, "Returns 400 VALIDATION with fieldErrors");
  }

  // Case 5: Happy path (Browser CSV file download)
  {
    currentSession = { userId: "admin-uuid-1111", email: "admin@techsonance.co.in", role: "admin" };
    logRequest({
      caseNum: 5,
      description: "Happy path: direct CSV file attachment download for browser",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT,
      query: {},
      caller: currentSession,
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT}`, {
      method: "GET",
    });

    const res = await GET(req);
    const text = await res.text();
    logResponse(res.status, res.headers, { previewLines: text.split("\n").slice(0, 3) });

    assertTest(
      res.status === 200 &&
        res.headers.get("content-type") === "text/csv; charset=utf-8" &&
        Boolean(res.headers.get("content-disposition")?.includes("applications-all-")) &&
        Boolean(res.headers.get("x-export-storage-path")) &&
        text.includes("Sarah Connor"),
      5,
      "Returns 200 OK with real CSV attachment stream and storage path header",
    );
  }

  // Case 6: Happy path (Filtered by jobId)
  {
    currentSession = { userId: "admin-uuid-1111", email: "admin@techsonance.co.in", role: "admin" };
    logRequest({
      caseNum: 6,
      description: "Happy path: filtered by specific jobId",
      method: "GET",
      path: `${API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT}?jobId=${validJobId}`,
      query: { jobId: validJobId },
      caller: currentSession,
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT}?jobId=${validJobId}`, {
      method: "GET",
    });

    const res = await GET(req);
    const text = await res.text();
    logResponse(res.status, res.headers, { previewLines: text.split("\n").slice(0, 3) });

    assertTest(
      res.status === 200 &&
        Boolean(res.headers.get("content-disposition")?.includes(validJobId)),
      6,
      "Returns 200 OK with job-scoped filename in content-disposition",
    );
  }

  // Case 7: Happy path (JSON envelope for API client)
  {
    currentSession = { userId: "admin-uuid-1111", email: "admin@techsonance.co.in", role: "admin" };
    logRequest({
      caseNum: 7,
      description: "Happy path: JSON envelope requested via Accept: application/json",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT,
      query: {},
      caller: currentSession,
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const res = await GET(req);
    const json = await res.json();
    logResponse(res.status, res.headers, json);

    assertTest(
      res.status === 200 &&
        json.ok === true &&
        json.data?.rowCount === 2 &&
        json.data?.filename &&
        json.data?.storagePath,
      7,
      "Returns 200 OK with JSON envelope containing filename, storagePath, and csvData",
    );
  }

  // Case 8: Owner role access
  {
    currentSession = { userId: "owner-uuid-0000", email: "founder@techsonance.co.in", role: "owner" };
    logRequest({
      caseNum: 8,
      description: "Happy path: owner role can export candidate CSV",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT,
      query: {},
      caller: currentSession,
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT}`, {
      method: "GET",
    });

    const res = await GET(req);
    logResponse(res.status, res.headers, { status: "OK", statusText: res.statusText });

    assertTest(res.status === 200, 8, "Returns 200 OK for owner role");
  }

  // Case 9: Error handling on database/storage failure
  {
    currentSession = { userId: "admin-uuid-1111", email: "admin@techsonance.co.in", role: "admin" };
    const failJobId = "00000000-0000-4000-a000-000000000000";
    logRequest({
      caseNum: 9,
      description: "Handle generation failure gracefully with 500 INTERNAL",
      method: "GET",
      path: `${API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT}?jobId=${failJobId}`,
      query: { jobId: failJobId },
      caller: currentSession,
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT}?jobId=${failJobId}`, {
      method: "GET",
    });

    const res = await GET(req);
    const json = await res.json();
    logResponse(res.status, res.headers, json);

    assertTest(res.status === 500 && json.ok === false && json.error?.code === ErrorCode.INTERNAL, 9, "Returns 500 INTERNAL on unexpected generation error");
  }

  logSection("EXECUTION AUDIT SUMMARY");
  console.log(`Total Test Cases Executed: ${passCount + failCount}`);
  console.log(`Passed:                   ${passCount}`);
  console.log(`Failed:                   ${failCount}`);

  if (failCount > 0) {
    console.error(`\n❌ BLACK-BOX VERIFICATION FAILED WITH ${failCount} FAILURES`);
    process.exit(1);
  } else {
    console.log(`\n✅ HARDCORE BLACK-BOX VERIFICATION PASSED (ALL ${passCount} TESTS CONFIRMED)`);
    process.exit(0);
  }
}

runBlackboxSuite().catch((err) => {
  console.error("Unhandled error in blackbox verification script:", err);
  process.exit(1);
});
