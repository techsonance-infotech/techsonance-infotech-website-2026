/**
 * verify_admin_jobs_id_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for GET, PATCH, DELETE /api/admin/jobs/[id]
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handlers directly (no bypassing or cheating).
 * 2. Mandatory request logging (Method, URL, Params, Payload, Caller Context).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix: Auth, Origin, Validation, 404 Not Found, Role RBAC, and Happy Path.
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import "../preload.cjs";
import { GET, PATCH, DELETE } from "@/app/api/admin/jobs/[id]/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { JobStatus, JobApprovalStatus, JobWorkMode, JobVisibility } from "@/lib/database/enum";
import { ErrorCode } from "@/lib/errors";

const PASS = "✓ PASS";
const FAIL = "✗ FAIL";

let passCount = 0;
let failCount = 0;

function logSection(title: string) {
  console.log(`\n======================================================================`);
  console.log(`  ${title}`);
  console.log(`======================================================================`);
}

function logRequest(info: {
  caseNum: number;
  description: string;
  method: string;
  path: string;
  params?: Record<string, any>;
  body?: Record<string, any> | string;
  caller?: { userId?: string; role?: string };
}) {
  console.log(`\n----------------------------------------------------------------------`);
  console.log(`[TEST CASE ${info.caseNum}] ${info.description}`);
  console.log(`Incoming Request:`);
  console.log(`  Method:  ${info.method}`);
  console.log(`  Path:    ${info.path}`);
  if (info.params) console.log(`  Params:  ${JSON.stringify(info.params)}`);
  if (info.caller) console.log(`  Caller:  ${JSON.stringify(info.caller)}`);
  if (info.body !== undefined) {
    console.log(
      `  Payload:\n${typeof info.body === "string" ? info.body : JSON.stringify(info.body, null, 2)}`,
    );
  }
}

function logResponse(status: number, json: any) {
  console.log(`Controller Response (HTTP ${status}):`);
  console.log(JSON.stringify(json, null, 2));
}

function assertCondition(caseNum: number, condition: boolean, message: string) {
  if (condition) {
    console.log(`${PASS} [Case ${caseNum}]: ${message}`);
    passCount++;
  } else {
    console.error(`${FAIL} [Case ${caseNum}]: ${message}`);
    failCount++;
  }
}

async function runBlackboxSuite() {
  logSection("STARTING HARDCORE BLACK-BOX VERIFICATION: GET, PATCH, DELETE /api/admin/jobs/[id]");

  const validJobId = "550e8400-e29b-41d4-a716-446655440000";
  const nonExistentJobId = "00000000-0000-4000-a000-000000000000";

  const adminSession = {
    userId: "admin-uuid-1111",
    email: "admin@techsonance.co.in",
    role: "admin",
  };

  const recruiterSession = {
    userId: "recruiter-uuid-2222",
    email: "recruiter@techsonance.co.in",
    role: "recruiter",
  };

  const mockDbState: Record<string, any> = {
    [validJobId]: {
      id: validJobId,
      siteId: "site-uuid-1111",
      slug: "lead-devops-engineer",
      title: "Lead DevOps Engineer",
      department: "Infrastructure",
      location: "Bhubaneswar",
      workMode: JobWorkMode.HYBRID,
      status: JobStatus.DRAFT,
      approvalStatus: JobApprovalStatus.PENDING,
      visibility: JobVisibility.PUBLIC,
      salaryMin: 1800000,
      salaryMax: 2800000,
      versionId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  // Wire container
  resetRootContainer();
  let currentSession: any = adminSession;

  const mockAuthService = {
    getCurrentSession: async () => currentSession,
  };

  const mockJobsService = {
    getJobById: async (id: string) => mockDbState[id] || null,
    updateJob: async (id: string, updates: any, actorId?: string, ipAddress?: string) => {
      if (!mockDbState[id]) return null;
      mockDbState[id] = {
        ...mockDbState[id],
        ...updates,
        versionId: (mockDbState[id].versionId || 1) + 1,
        updatedAt: new Date().toISOString(),
      };
      return mockDbState[id];
    },
    deleteJob: async (id: string, actorId?: string, ipAddress?: string) => {
      if (!mockDbState[id]) return false;
      delete mockDbState[id];
      return true;
    },
  };

  const container = getContainer();
  container.bind({
    provide: AdminAuthService,
    useValue: mockAuthService as unknown as AdminAuthService,
  });
  container.bind({
    provide: AdminJobsService,
    useValue: mockJobsService as unknown as AdminJobsService,
  });

  // ─── 1. GET TESTS ───────────────────────────────────────────────────────────

  // Case 1: Unauthenticated request
  {
    currentSession = null;
    logRequest({
      caseNum: 1,
      description: "Reject unauthenticated GET request",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.JOB(validJobId),
      params: { id: validJobId },
      caller: { role: "anonymous" },
    });
    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.JOB(validJobId)}`);
    const res = await GET(req, { params: Promise.resolve({ id: validJobId }) });
    const json = await res.json();
    logResponse(res.status, json);
    assertCondition(
      1,
      res.status === 401 && json.ok === false && json.error.code === ErrorCode.UNAUTHENTICATED,
      "Returns 401 UNAUTHENTICATED",
    );
  }

  // Case 2: Untrusted foreign origin
  {
    currentSession = adminSession;
    logRequest({
      caseNum: 2,
      description: "Reject foreign origin with 403 FORBIDDEN",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.JOB(validJobId),
      params: { id: validJobId },
      caller: currentSession,
    });
    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.JOB(validJobId)}`, {
      headers: { origin: "https://malicious-cross-origin.com" },
    });
    const res = await GET(req, { params: Promise.resolve({ id: validJobId }) });
    const json = await res.json();
    logResponse(res.status, json);
    assertCondition(
      2,
      res.status === 403 && json.ok === false && json.error.code === ErrorCode.FORBIDDEN,
      "Returns 403 FORBIDDEN for untrusted origin",
    );
  }

  // Case 3: Invalid UUID parameter
  {
    currentSession = adminSession;
    const invalidId = "not-a-valid-uuid";
    logRequest({
      caseNum: 3,
      description: "Reject non-UUID id parameter with 400 VALIDATION",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.JOB(invalidId),
      params: { id: invalidId },
      caller: currentSession,
    });
    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.JOB(invalidId)}`);
    const res = await GET(req, { params: Promise.resolve({ id: invalidId }) });
    const json = await res.json();
    logResponse(res.status, json);
    assertCondition(
      3,
      res.status === 400 && json.ok === false && json.error.code === ErrorCode.VALIDATION,
      "Returns 400 VALIDATION with field errors",
    );
  }

  // Case 4: Non-existent job
  {
    currentSession = adminSession;
    logRequest({
      caseNum: 4,
      description: "Return 404 NOT_FOUND for non-existent job ID",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.JOB(nonExistentJobId),
      params: { id: nonExistentJobId },
      caller: currentSession,
    });
    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.JOB(nonExistentJobId)}`);
    const res = await GET(req, { params: Promise.resolve({ id: nonExistentJobId }) });
    const json = await res.json();
    logResponse(res.status, json);
    assertCondition(
      4,
      res.status === 404 && json.ok === false && json.error.code === ErrorCode.NOT_FOUND,
      "Returns 404 NOT_FOUND",
    );
  }

  // Case 5: Happy path GET
  {
    currentSession = adminSession;
    logRequest({
      caseNum: 5,
      description: "Happy path: fetch existing job with full envelope",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.JOB(validJobId),
      params: { id: validJobId },
      caller: currentSession,
    });
    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.JOB(validJobId)}`);
    const res = await GET(req, { params: Promise.resolve({ id: validJobId }) });
    const json = await res.json();
    logResponse(res.status, json);
    assertCondition(
      5,
      res.status === 200 &&
        json.ok === true &&
        json.data.job.id === validJobId &&
        Boolean(res.headers.get("x-request-id")),
      "Returns 200 OK with job data and x-request-id header",
    );
  }

  // ─── 2. PATCH TESTS ─────────────────────────────────────────────────────────

  // Case 6: Malformed JSON body
  {
    currentSession = adminSession;
    logRequest({
      caseNum: 6,
      description: "Reject malformed JSON payload with 400 BAD_REQUEST",
      method: "PATCH",
      path: API_ENDPOINTS.ADMIN.JOB(validJobId),
      params: { id: validJobId },
      body: "{ broken json...",
      caller: currentSession,
    });
    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.JOB(validJobId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "{ broken json...",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: validJobId }) });
    const json = await res.json();
    logResponse(res.status, json);
    assertCondition(
      6,
      res.status === 400 && json.ok === false && json.error.code === ErrorCode.BAD_REQUEST,
      "Returns 400 BAD_REQUEST for broken JSON",
    );
  }

  // Case 7: Validation failure (salaryMin > salaryMax)
  {
    currentSession = adminSession;
    const invalidPayload = { salaryMin: 4000000, salaryMax: 2000000 };
    logRequest({
      caseNum: 7,
      description: "Reject invalid salary bounds with 400 VALIDATION",
      method: "PATCH",
      path: API_ENDPOINTS.ADMIN.JOB(validJobId),
      params: { id: validJobId },
      body: invalidPayload,
      caller: currentSession,
    });
    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.JOB(validJobId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidPayload),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: validJobId }) });
    const json = await res.json();
    logResponse(res.status, json);
    assertCondition(
      7,
      res.status === 400 && json.ok === false && json.error.code === ErrorCode.VALIDATION,
      "Returns 400 VALIDATION for invalid salary range",
    );
  }

  // Case 8: Happy path PATCH
  {
    currentSession = adminSession;
    const patchPayload = { title: "Principal DevOps Architect", openingsCount: 3 };
    logRequest({
      caseNum: 8,
      description: "Happy path: update job fields and increment versionId",
      method: "PATCH",
      path: API_ENDPOINTS.ADMIN.JOB(validJobId),
      params: { id: validJobId },
      body: patchPayload,
      caller: currentSession,
    });
    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.JOB(validJobId)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "103.22.45.10",
      },
      body: JSON.stringify(patchPayload),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: validJobId }) });
    const json = await res.json();
    logResponse(res.status, json);
    assertCondition(
      8,
      res.status === 200 &&
        json.ok === true &&
        json.data.job.title === "Principal DevOps Architect" &&
        json.data.job.versionId === 2,
      "Returns 200 OK with updated title and bumped versionId",
    );
  }

  // ─── 3. DELETE TESTS ────────────────────────────────────────────────────────

  // Case 9: Recruiter role rejected on destructive DELETE
  {
    currentSession = recruiterSession;
    logRequest({
      caseNum: 9,
      description: "Reject destructive deletion when caller is recruiter (admin/owner only)",
      method: "DELETE",
      path: API_ENDPOINTS.ADMIN.JOB(validJobId),
      params: { id: validJobId },
      caller: currentSession,
    });
    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.JOB(validJobId)}`, {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: validJobId }) });
    const json = await res.json();
    logResponse(res.status, json);
    assertCondition(
      9,
      res.status === 403 && json.ok === false && json.error.code === ErrorCode.FORBIDDEN,
      "Returns 403 FORBIDDEN for non-admin deletion",
    );
  }

  // Case 10: Happy path DELETE by admin
  {
    currentSession = adminSession;
    logRequest({
      caseNum: 10,
      description: "Happy path: permanently delete job when caller is admin",
      method: "DELETE",
      path: API_ENDPOINTS.ADMIN.JOB(validJobId),
      params: { id: validJobId },
      caller: currentSession,
    });
    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.JOB(validJobId)}`, {
      method: "DELETE",
      headers: { "x-forwarded-for": "103.22.45.10" },
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: validJobId }) });
    const json = await res.json();
    logResponse(res.status, json);
    assertCondition(
      10,
      res.status === 200 &&
        json.ok === true &&
        json.data.success === true &&
        mockDbState[validJobId] === undefined,
      "Returns 200 OK with success: true and removes job from DB",
    );
  }

  // ─── SUMMARY ────────────────────────────────────────────────────────────────
  logSection(`EXECUTION AUDIT SUMMARY`);
  console.log(`Total Test Cases Executed: ${passCount + failCount}`);
  console.log(`Passed:                   ${passCount}`);
  console.log(`Failed:                   ${failCount}`);

  if (failCount > 0) {
    console.error(`\n❌ HARDCORE BLACK-BOX VERIFICATION FAILED`);
    process.exit(1);
  } else {
    console.log(`\n✅ HARDCORE BLACK-BOX VERIFICATION PASSED (ALL 10 TESTS CONFIRMED)`);
    process.exit(0);
  }
}

runBlackboxSuite().catch((err) => {
  console.error("Unhandled error in blackbox verification script:", err);
  process.exit(1);
});
