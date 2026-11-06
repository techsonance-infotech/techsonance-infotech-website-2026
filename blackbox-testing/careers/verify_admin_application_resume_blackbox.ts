/**
 * verify_admin_application_resume_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for GET /api/admin/careers/applications/[id]/resume
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handler directly (GET from app/api/admin/careers/applications/[id]/resume/route).
 * 2. Mandatory request logging (Method, Path, Params, Caller Context).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix: Auth, Origin, UUID Validation, Role Authorization, 404, Happy Path (Admin/Recruiter/Hiring Manager), and 500 error.
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import "../preload.cjs";
import { GET } from "@/app/api/admin/careers/applications/[id]/resume/route";
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
  params: Record<string, unknown>;
  caller: Record<string, unknown>;
}) {
  console.log(`\n----------------------------------------------------------------------`);
  console.log(`[TEST CASE ${details.caseNum}] ${details.description}`);
  console.log(`Incoming Request:`);
  console.log(`  Method:  ${details.method}`);
  console.log(`  Path:    ${details.path}`);
  console.log(`  Params:  ${JSON.stringify(details.params)}`);
  console.log(`  Caller:  ${JSON.stringify(details.caller)}`);
}

function logResponse(status: number, body: unknown) {
  console.log(`Controller Response (HTTP ${status}):`);
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
  logSection(
    "STARTING HARDCORE BLACK-BOX VERIFICATION: GET /api/admin/careers/applications/[id]/resume",
  );

  resetRootContainer();

  const validAppId = "a1111111-2222-4333-8444-555555555555";
  const mockSignedUrl =
    "https://supabase.co/storage/v1/object/sign/resumes/candidate.pdf?token=abc123xyz";

  let currentSession: { userId: string; email: string; role: string } | null = {
    userId: "admin-uuid-1111",
    email: "admin@techsonance.co.in",
    role: "admin",
  };

  const mockAuthService = {
    getCurrentSession: async () => currentSession,
  };

  const mockApplicationsService = {
    getSignedResumeUrl: async (id: string, role?: string) => {
      if (id === "00000000-0000-4000-a000-000000000000") {
        throw new AppError(ErrorCode.NOT_FOUND, CAREER_ERRORS.APPLICATION_NOT_FOUND);
      }
      if (id === "a2222222-3333-4444-8555-666666666666") {
        throw new AppError(ErrorCode.NOT_FOUND, CAREER_ERRORS.RESUME_NOT_ATTACHED);
      }
      if (id === "a3333333-4444-4555-8666-777777777777") {
        throw new Error("Storage bucket connection timed out");
      }
      return mockSignedUrl;
    },
  };

  const container = getContainer();
  container.bind({
    provide: AdminAuthService,
    useValue: mockAuthService as unknown as AdminAuthService,
  });
  container.bind({
    provide: ApplicationsService,
    useValue: mockApplicationsService as unknown as ApplicationsService,
  });

  // Case 1: Unauthenticated request
  {
    currentSession = null;
    logRequest({
      caseNum: 1,
      description: "Reject unauthenticated request",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.APPLICATION_RESUME(validAppId),
      params: { id: validAppId },
      caller: { role: "anonymous" },
    });

    const req = new Request(
      `http://localhost:3000${API_ENDPOINTS.ADMIN.APPLICATION_RESUME(validAppId)}`,
      {
        method: "GET",
      },
    );

    const res = await GET(req, { params: Promise.resolve({ id: validAppId }) });
    const json = await res.json();
    logResponse(res.status, json);

    assertTest(
      res.status === 401 && json.ok === false && json.error?.code === ErrorCode.UNAUTHENTICATED,
      1,
      "Returns 401 UNAUTHENTICATED",
    );
  }

  // Case 2: Reject foreign origin
  {
    currentSession = { userId: "admin-uuid-1111", email: "admin@techsonance.co.in", role: "admin" };
    logRequest({
      caseNum: 2,
      description: "Reject foreign origin with 403 FORBIDDEN",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.APPLICATION_RESUME(validAppId),
      params: { id: validAppId },
      caller: currentSession,
    });

    const req = new Request(
      `http://localhost:3000${API_ENDPOINTS.ADMIN.APPLICATION_RESUME(validAppId)}`,
      {
        method: "GET",
        headers: { origin: "https://untrusted-hacker.com" },
      },
    );

    const res = await GET(req, { params: Promise.resolve({ id: validAppId }) });
    const json = await res.json();
    logResponse(res.status, json);

    assertTest(
      res.status === 403 && json.ok === false && json.error?.code === ErrorCode.FORBIDDEN,
      2,
      "Returns 403 FORBIDDEN for untrusted origin",
    );
  }

  // Case 3: Invalid UUID parameter
  {
    currentSession = { userId: "admin-uuid-1111", email: "admin@techsonance.co.in", role: "admin" };
    logRequest({
      caseNum: 3,
      description: "Reject non-UUID id parameter with 400 VALIDATION",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.APPLICATION_RESUME("bad-uuid-123"),
      params: { id: "bad-uuid-123" },
      caller: currentSession,
    });

    const req = new Request(
      `http://localhost:3000${API_ENDPOINTS.ADMIN.APPLICATION_RESUME("bad-uuid-123")}`,
      {
        method: "GET",
      },
    );

    const res = await GET(req, { params: Promise.resolve({ id: "bad-uuid-123" }) });
    const json = await res.json();
    logResponse(res.status, json);

    assertTest(
      res.status === 400 && json.ok === false && json.error?.code === ErrorCode.VALIDATION,
      3,
      "Returns 400 VALIDATION with fieldErrors",
    );
  }

  // Case 4: Unauthorized role (viewer)
  {
    currentSession = {
      userId: "viewer-uuid-4444",
      email: "viewer@techsonance.co.in",
      role: "viewer",
    };
    logRequest({
      caseNum: 4,
      description: "Reject unauthorized role with 403 FORBIDDEN",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.APPLICATION_RESUME(validAppId),
      params: { id: validAppId },
      caller: currentSession,
    });

    const req = new Request(
      `http://localhost:3000${API_ENDPOINTS.ADMIN.APPLICATION_RESUME(validAppId)}`,
      {
        method: "GET",
      },
    );

    const res = await GET(req, { params: Promise.resolve({ id: validAppId }) });
    const json = await res.json();
    logResponse(res.status, json);

    assertTest(
      res.status === 403 && json.ok === false && json.error?.code === ErrorCode.FORBIDDEN,
      4,
      "Returns 403 FORBIDDEN for unauthorized role",
    );
  }

  // Case 5: Application not found
  {
    currentSession = { userId: "admin-uuid-1111", email: "admin@techsonance.co.in", role: "admin" };
    const nonExistentId = "00000000-0000-4000-a000-000000000000";
    logRequest({
      caseNum: 5,
      description: "Return 404 NOT_FOUND when application does not exist",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.APPLICATION_RESUME(nonExistentId),
      params: { id: nonExistentId },
      caller: currentSession,
    });

    const req = new Request(
      `http://localhost:3000${API_ENDPOINTS.ADMIN.APPLICATION_RESUME(nonExistentId)}`,
      {
        method: "GET",
      },
    );

    const res = await GET(req, { params: Promise.resolve({ id: nonExistentId }) });
    const json = await res.json();
    logResponse(res.status, json);

    assertTest(
      res.status === 404 && json.ok === false && json.error?.code === ErrorCode.NOT_FOUND,
      5,
      "Returns 404 NOT_FOUND for non-existent application",
    );
  }

  // Case 6: Resume not attached
  {
    currentSession = { userId: "admin-uuid-1111", email: "admin@techsonance.co.in", role: "admin" };
    const noResumeId = "a2222222-3333-4444-8555-666666666666";
    logRequest({
      caseNum: 6,
      description: "Return 404 NOT_FOUND when resume is not attached",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.APPLICATION_RESUME(noResumeId),
      params: { id: noResumeId },
      caller: currentSession,
    });

    const req = new Request(
      `http://localhost:3000${API_ENDPOINTS.ADMIN.APPLICATION_RESUME(noResumeId)}`,
      {
        method: "GET",
      },
    );

    const res = await GET(req, { params: Promise.resolve({ id: noResumeId }) });
    const json = await res.json();
    logResponse(res.status, json);

    assertTest(
      res.status === 404 && json.ok === false && json.error?.code === ErrorCode.NOT_FOUND,
      6,
      "Returns 404 NOT_FOUND when resume is not attached",
    );
  }

  // Case 7: Happy path for Admin
  {
    currentSession = { userId: "admin-uuid-1111", email: "admin@techsonance.co.in", role: "admin" };
    logRequest({
      caseNum: 7,
      description: "Happy path: generate signed URL for admin with headers",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.APPLICATION_RESUME(validAppId),
      params: { id: validAppId },
      caller: currentSession,
    });

    const req = new Request(
      `http://localhost:3000${API_ENDPOINTS.ADMIN.APPLICATION_RESUME(validAppId)}`,
      {
        method: "GET",
      },
    );

    const res = await GET(req, { params: Promise.resolve({ id: validAppId }) });
    const json = await res.json();
    logResponse(res.status, json);

    assertTest(
      res.status === 200 &&
        json.ok === true &&
        json.data?.signedUrl === mockSignedUrl &&
        json.signedUrl === mockSignedUrl &&
        Boolean(res.headers.get("x-request-id")) &&
        res.headers.get("Cache-Control") === "no-store, private",
      7,
      "Returns 200 OK with signed URL and cache headers",
    );
  }

  // Case 8: Happy path for Recruiter
  {
    currentSession = {
      userId: "recruiter-uuid-2222",
      email: "recruiter@techsonance.co.in",
      role: "recruiter",
    };
    logRequest({
      caseNum: 8,
      description: "Happy path: generate signed URL for recruiter role",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.APPLICATION_RESUME(validAppId),
      params: { id: validAppId },
      caller: currentSession,
    });

    const req = new Request(
      `http://localhost:3000${API_ENDPOINTS.ADMIN.APPLICATION_RESUME(validAppId)}`,
      {
        method: "GET",
      },
    );

    const res = await GET(req, { params: Promise.resolve({ id: validAppId }) });
    const json = await res.json();
    logResponse(res.status, json);

    assertTest(
      res.status === 200 && json.ok === true && json.data?.signedUrl === mockSignedUrl,
      8,
      "Returns 200 OK for recruiter role",
    );
  }

  // Case 9: Happy path for Hiring Manager
  {
    currentSession = {
      userId: "hm-uuid-3333",
      email: "hm@techsonance.co.in",
      role: "hiring_manager",
    };
    logRequest({
      caseNum: 9,
      description: "Happy path: generate signed URL for hiring manager role",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.APPLICATION_RESUME(validAppId),
      params: { id: validAppId },
      caller: currentSession,
    });

    const req = new Request(
      `http://localhost:3000${API_ENDPOINTS.ADMIN.APPLICATION_RESUME(validAppId)}`,
      {
        method: "GET",
      },
    );

    const res = await GET(req, { params: Promise.resolve({ id: validAppId }) });
    const json = await res.json();
    logResponse(res.status, json);

    assertTest(
      res.status === 200 && json.ok === true && json.data?.signedUrl === mockSignedUrl,
      9,
      "Returns 200 OK for hiring manager role",
    );
  }

  // Case 10: Unexpected storage failure
  {
    currentSession = { userId: "admin-uuid-1111", email: "admin@techsonance.co.in", role: "admin" };
    const failId = "a3333333-4444-4555-8666-777777777777";
    logRequest({
      caseNum: 10,
      description: "Handle storage failure gracefully with 500 INTERNAL",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.APPLICATION_RESUME(failId),
      params: { id: failId },
      caller: currentSession,
    });

    const req = new Request(
      `http://localhost:3000${API_ENDPOINTS.ADMIN.APPLICATION_RESUME(failId)}`,
      {
        method: "GET",
      },
    );

    const res = await GET(req, { params: Promise.resolve({ id: failId }) });
    const json = await res.json();
    logResponse(res.status, json);

    assertTest(
      res.status === 500 && json.ok === false && json.error?.code === ErrorCode.INTERNAL,
      10,
      "Returns 500 INTERNAL on storage exception",
    );
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
