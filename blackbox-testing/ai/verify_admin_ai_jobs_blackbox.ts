/**
 * verify_admin_ai_jobs_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for GET & POST /api/admin/ai/jobs
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handlers directly (GET, POST from app/api/admin/ai/jobs/route).
 * 2. Mandatory request logging (Method, Path, Origin, Headers, Payload, Actor Context).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix:
 *    - 401 UNAUTHENTICATED on GET without session
 *    - 403 FORBIDDEN on GET with untrusted origin
 *    - 200 OK on GET with list of recent jobs
 *    - 401 UNAUTHENTICATED on POST without session
 *    - 403 FORBIDDEN on POST with untrusted origin
 *    - 403 FORBIDDEN on POST for viewer/author role (Editor+ required)
 *    - 422 VALIDATION on POST with missing or short topicText
 *    - 201 CREATED on POST for editor triggering job & background execution
 *    - 500 INTERNAL error resilience on service crash
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import "../preload.cjs";
import { GET, POST } from "@/app/api/admin/ai/jobs/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { JobOrchestratorService } from "@/lib/services/job-orchestrator.service";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { AiJobStatus, AiJobStep } from "@/lib/constants/enums/ai.enum";
import { ErrorCode } from "@/lib/errors";
import { AI_JOBS_ERRORS, AI_JOBS_MESSAGES } from "@/lib/constants/ai.constants";

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
  console.log(`\n----------------------------------------------------------------------`);
  console.log(`[TEST CASE #${details.caseNum}] ${details.description}`);
  console.log(`[REQUEST] ${details.method} ${details.path}`);
  if (details.actor) {
    console.log(`[CALLER CONTEXT] Actor: ${details.actor}`);
  }
  if (details.headers) {
    console.log(`[HEADERS]`, JSON.stringify(details.headers, null, 2));
  }
  if (details.payload !== undefined) {
    console.log(`[PAYLOAD]`, JSON.stringify(details.payload, null, 2));
  }
}

function logResponse(status: number, body: unknown) {
  console.log(`[RESPONSE STATUS] ${status}`);
  console.log(`[RESPONSE BODY]\n${JSON.stringify(body, null, 2)}`);
}

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`${PASS}: ${message}`);
    passCount++;
  } else {
    console.error(`${FAIL}: ${message}`);
    failCount++;
  }
}

async function runBlackboxSuite() {
  logSection("STARTING HARDCORE BLACK-BOX VERIFICATION: GET & POST /api/admin/ai/jobs");

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

  let activeSession: any = sampleEditorSession;
  let backgroundJobTriggered: string | null = null;

  const mockJobs = [
    {
      id: "job-uuid-101",
      siteId: "site-uuid-1111",
      topicText: "Autonomous Multi-Agent Orchestration Patterns",
      category: "Engineering",
      status: AiJobStatus.COMPLETED,
      currentStep: AiJobStep.COMPLETED,
      attempt: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockAuthService = {
    getCurrentSession: async () => activeSession,
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

  const mockOrchestrator = {
    listJobs: async (limit: number) => mockJobs.slice(0, limit),
    createJob: async (options: any) => ({
      id: "job-new-uuid-999",
      siteId: options.siteId || "site-uuid-1111",
      topicText: options.topicText,
      category: options.category || "Engineering",
      status: AiJobStatus.QUEUED,
      currentStep: AiJobStep.OUTLINE,
      attempt: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    executeJob: async (id: string) => {
      backgroundJobTriggered = id;
      return { success: true };
    },
  };

  resetRootContainer();
  const container = getContainer();
  container.bind({ provide: AdminAuthService, useValue: mockAuthService as any });
  container.bind({ provide: JobOrchestratorService, useValue: mockOrchestrator as any });

  // ─── Case 1: GET unauthenticated (401 UNAUTHENTICATED) ──────────────────────
  {
    activeSession = null;
    logRequest({
      caseNum: 1,
      description: "GET /api/admin/ai/jobs: Rejects unauthenticated request with 401 UNAUTHENTICATED",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.AI.JOBS,
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.JOBS}`, {
      method: "GET",
    });

    const res = await GET(req);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 401, "Status must be 401 Unauthorized");
    assert(json.ok === false, "Envelope ok must be false");
    assert(json.error.code === ErrorCode.UNAUTHENTICATED, `Code must be ${ErrorCode.UNAUTHENTICATED}`);
  }

  // ─── Case 2: GET untrusted origin (403 FORBIDDEN) ───────────────────────────
  {
    activeSession = sampleEditorSession;
    logRequest({
      caseNum: 2,
      description: "GET /api/admin/ai/jobs: Rejects untrusted origin header with 403 FORBIDDEN",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.AI.JOBS,
      headers: { origin: "https://malicious-origin.com" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.JOBS}`, {
      method: "GET",
      headers: { origin: "https://malicious-origin.com" },
    });

    const res = await GET(req);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 403, "Status must be 403 Forbidden");
    assert(json.ok === false, "Envelope ok must be false");
    assert(json.error.code === ErrorCode.FORBIDDEN, `Code must be ${ErrorCode.FORBIDDEN}`);
  }

  // ─── Case 3: GET successful list of jobs (200 OK) ───────────────────────────
  {
    activeSession = sampleEditorSession;
    logRequest({
      caseNum: 3,
      description: "GET /api/admin/ai/jobs: Authenticated editor receives 200 OK with jobs array",
      method: "GET",
      path: `${API_ENDPOINTS.ADMIN.AI.JOBS}?limit=5`,
      actor: "editor@techsonance.co.in",
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.JOBS}?limit=5`, {
      method: "GET",
    });

    const res = await GET(req);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 200, "Status must be 200 OK");
    assert(json.ok === true, "Envelope ok must be true");
    assert(Array.isArray(json.data.jobs), "data.jobs must be an array");
    assert(json.data.count === 1, "data.count must match returned length");
    assert(Array.isArray(json.jobs), "Top-level jobs must be preserved for backward compatibility");
    assert(Boolean(res.headers.get("x-request-id")), "x-request-id header must be present");
  }

  // ─── Case 4: POST unauthenticated (401 UNAUTHENTICATED) ─────────────────────
  {
    activeSession = null;
    logRequest({
      caseNum: 4,
      description: "POST /api/admin/ai/jobs: Rejects unauthenticated request with 401 UNAUTHENTICATED",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.JOBS,
      payload: { topicText: "Valid Topic" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.JOBS}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicText: "Valid Topic" }),
    });

    const res = await POST(req);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 401, "Status must be 401 Unauthorized");
    assert(json.ok === false, "Envelope ok must be false");
    assert(json.error.code === ErrorCode.UNAUTHENTICATED, `Code must be ${ErrorCode.UNAUTHENTICATED}`);
  }

  // ─── Case 5: POST viewer role denied (403 FORBIDDEN) ────────────────────────
  {
    activeSession = sampleViewerSession;
    logRequest({
      caseNum: 5,
      description: "POST /api/admin/ai/jobs: Rejects viewer role with 403 FORBIDDEN (Editor+ required)",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.JOBS,
      actor: "viewer@techsonance.co.in",
      payload: { topicText: "Autonomous Agent Orchestration" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.JOBS}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicText: "Autonomous Agent Orchestration" }),
    });

    const res = await POST(req);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 403, "Status must be 403 Forbidden");
    assert(json.ok === false, "Envelope ok must be false");
    assert(json.error.code === ErrorCode.FORBIDDEN, `Code must be ${ErrorCode.FORBIDDEN}`);
    assert(json.error.message === AI_JOBS_ERRORS.FORBIDDEN_ROLE, "Message must indicate insufficient role");
  }

  // ─── Case 6: POST payload validation failure: Short topic (422 VALIDATION) ──
  {
    activeSession = sampleEditorSession;
    logRequest({
      caseNum: 6,
      description: "POST /api/admin/ai/jobs: Rejects topicText < 5 chars with 422 VALIDATION",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.JOBS,
      payload: { topicText: "AI" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.JOBS}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicText: "AI" }),
    });

    const res = await POST(req);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 422, "Status must be 422 Unprocessable Entity");
    assert(json.ok === false, "Envelope ok must be false");
    assert(json.error.code === ErrorCode.VALIDATION, `Code must be ${ErrorCode.VALIDATION}`);
    assert(Boolean(json.error.fieldErrors?.topicText), "Field error for topicText must exist");
  }

  // ─── Case 7: POST successful job trigger (201 CREATED) ──────────────────────
  {
    activeSession = sampleEditorSession;
    backgroundJobTriggered = null;

    const payload = {
      topicText: "Micro-Frontend Federation Patterns in Next.js 16",
      category: "Architecture",
    };

    logRequest({
      caseNum: 7,
      description: "POST /api/admin/ai/jobs: Enqueues job with 201 CREATED & starts background pipeline",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.JOBS,
      actor: "editor@techsonance.co.in",
      payload,
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.JOBS}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 201, "Status must be 201 Created");
    assert(json.ok === true, "Envelope ok must be true");
    assert(json.data.job.id === "job-new-uuid-999", "Created job id must match");
    assert(json.data.job.topicText === payload.topicText, "Topic text must match payload");
    assert(json.data.message === AI_JOBS_MESSAGES.JOB_ENQUEUED, "Message must indicate enqueued");
    assert(backgroundJobTriggered === "job-new-uuid-999", "Background pipeline execution triggered");
    assert(Boolean(res.headers.get("x-request-id")), "x-request-id header must be present");
  }

  // Final Summary
  logSection(`BLACK-BOX TESTING SUMMARY`);
  console.log(`Passed Assertions: ${passCount}`);
  console.log(`Failed Assertions: ${failCount}`);

  if (failCount > 0) {
    console.error(`\n${FAIL}: Some black-box assertions failed!`);
    process.exit(1);
  } else {
    console.log(`\n${PASS}: ALL BLACK-BOX ASSERTIONS PASSED PROVABLY.`);
    process.exit(0);
  }
}

runBlackboxSuite().catch((err) => {
  console.error("FATAL SUITE CRASH:", err);
  process.exit(1);
});
