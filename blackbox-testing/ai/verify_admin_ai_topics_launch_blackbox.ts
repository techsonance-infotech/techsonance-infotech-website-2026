/**
 * verify_admin_ai_topics_launch_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for:
 * - POST /api/admin/ai/topics/[id]/launch
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handler directly (app/api/admin/ai/topics/[id]/launch/route).
 * 2. Mandatory request logging (Method, Path, Origin, Headers, Payload, Actor Context).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix:
 *    - 403 FORBIDDEN on foreign origin
 *    - 401 UNAUTHENTICATED without active admin session
 *    - 403 FORBIDDEN on viewer role (Editor+ required)
 *    - 403 FORBIDDEN on author role (Editor+ required)
 *    - 400 BAD_REQUEST on invalid UUID format
 *    - 404 NOT_FOUND on non-existent topic UUID
 *    - 200 OK on editor launching autonomous generation with jobId returned
 *    - 500 INTERNAL on unexpected orchestrator failure
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import "../preload.cjs";
import { POST as launchTopicPOST } from "@/app/api/admin/ai/topics/[id]/launch/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminTopicsService } from "@/lib/services/admin-topics.service";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { AppError, ErrorCode } from "@/lib/errors";
import { AI_TOPICS_ERRORS, AI_TOPICS_MESSAGES } from "@/lib/constants/ai.constants";

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
  logSection("STARTING HARDCORE BLACK-BOX VERIFICATION: POST /api/admin/ai/topics/[id]/launch");

  resetRootContainer();

  const validTopicId = "d1111111-2222-4333-8444-555555555555";
  const nonExistentTopicId = "d9999999-9999-4999-8999-999999999999";
  const validJobId = "j1111111-2222-4333-8444-555555555555";

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

  const sampleAuthorSession = {
    userId: "author-uuid-3333",
    email: "author@techsonance.co.in",
    role: "author",
    site: { id: "site-uuid-1111" },
  };

  let currentSession: any = sampleEditorSession;
  let serviceShouldThrow = false;

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
      return (hierarchy[role] ?? 0) >= (hierarchy[required] ?? 99);
    },
  };

  const mockTopicsService = {
    launchTopicGeneration: async (id: string) => {
      if (serviceShouldThrow) {
        throw new Error("Job queue Redis connection drop");
      }
      if (id === nonExistentTopicId) {
        throw new AppError(ErrorCode.NOT_FOUND, `Topic not found: ${id}`);
      }
      return { jobId: validJobId };
    },
  };

  const container = getContainer();
  container.bind({ provide: AdminAuthService, useValue: mockAuthService as any });
  container.bind({ provide: AdminTopicsService, useValue: mockTopicsService as any });

  // ─── TEST CASE 1: Foreign Origin Rejection (403) ──────────────────────────
  {
    logRequest({
      caseNum: 1,
      description: "Origin mismatch must be rejected with 403 Forbidden",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH(validTopicId),
      actor: "Untrusted Client",
      headers: { origin: "https://evil-hacker.site" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH(validTopicId)}`, {
      method: "POST",
      headers: { origin: "https://evil-hacker.site" },
    });

    const res = await launchTopicPOST(req as any, { params: Promise.resolve({ id: validTopicId }) });
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 403, "Status code must be 403 Forbidden");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.FORBIDDEN, `Error code must be ${ErrorCode.FORBIDDEN}`);
    assert(body.error?.message === AI_TOPICS_ERRORS.FORBIDDEN_ORIGIN, "Origin mismatch message matched");
  }

  // ─── TEST CASE 2: Unauthenticated Access (401) ────────────────────────────
  {
    currentSession = null;
    logRequest({
      caseNum: 2,
      description: "Missing session must return 401 Unauthenticated",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH(validTopicId),
      actor: "Anonymous Visitor",
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH(validTopicId)}`, {
      method: "POST",
    });

    const res = await launchTopicPOST(req as any, { params: Promise.resolve({ id: validTopicId }) });
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 401, "Status code must be 401 Unauthenticated");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.UNAUTHENTICATED, `Error code must be ${ErrorCode.UNAUTHENTICATED}`);
    assert(body.error?.message === AI_TOPICS_ERRORS.UNAUTHORIZED, "Unauthorized error message matched");
  }

  // ─── TEST CASE 3: Insufficient Role - Viewer (403) ────────────────────────
  {
    currentSession = sampleViewerSession;
    logRequest({
      caseNum: 3,
      description: "Viewer role rejected with 403 Forbidden (Editor+ required)",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH(validTopicId),
      actor: "Viewer (Read-Only)",
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH(validTopicId)}`, {
      method: "POST",
    });

    const res = await launchTopicPOST(req as any, { params: Promise.resolve({ id: validTopicId }) });
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 403, "Status code must be 403 Forbidden");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.FORBIDDEN, `Error code must be ${ErrorCode.FORBIDDEN}`);
    assert(body.error?.message === AI_TOPICS_ERRORS.FORBIDDEN_ROLE, "Insufficient permissions message matched");
  }

  // ─── TEST CASE 4: Insufficient Role - Author (403) ────────────────────────
  {
    currentSession = sampleAuthorSession;
    logRequest({
      caseNum: 4,
      description: "Author role rejected with 403 Forbidden (Editor+ required)",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH(validTopicId),
      actor: "Author (Blog writer)",
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH(validTopicId)}`, {
      method: "POST",
    });

    const res = await launchTopicPOST(req as any, { params: Promise.resolve({ id: validTopicId }) });
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 403, "Status code must be 403 Forbidden");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.FORBIDDEN, `Error code must be ${ErrorCode.FORBIDDEN}`);
  }

  // ─── TEST CASE 5: Invalid UUID Format (400) ───────────────────────────────
  {
    currentSession = sampleEditorSession;
    logRequest({
      caseNum: 5,
      description: "Non-UUID topic ID returns 400 Bad Request with field error",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH("invalid-topic-uuid"),
      actor: "Editor",
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH("invalid-topic-uuid")}`, {
      method: "POST",
    });

    const res = await launchTopicPOST(req as any, { params: Promise.resolve({ id: "invalid-topic-uuid" }) });
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 400, "Status code must be 400 Bad Request");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.BAD_REQUEST, `Error code must be ${ErrorCode.BAD_REQUEST}`);
    assert(body.error?.fieldErrors?.id !== undefined, "Field error indicates invalid ID");
  }

  // ─── TEST CASE 6: Non-Existent Topic ID (404) ─────────────────────────────
  {
    logRequest({
      caseNum: 6,
      description: "Non-existent topic returns 404 Not Found",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH(nonExistentTopicId),
      actor: "Editor",
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH(nonExistentTopicId)}`, {
      method: "POST",
    });

    const res = await launchTopicPOST(req as any, { params: Promise.resolve({ id: nonExistentTopicId }) });
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 404, "Status code must be 404 Not Found");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.NOT_FOUND, `Error code must be ${ErrorCode.NOT_FOUND}`);
  }

  // ─── TEST CASE 7: Successful Launch (200) ─────────────────────────────────
  {
    logRequest({
      caseNum: 7,
      description: "Editor successfully launches autonomous generation for topic",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH(validTopicId),
      actor: "Editor",
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH(validTopicId)}`, {
      method: "POST",
    });

    const res = await launchTopicPOST(req as any, { params: Promise.resolve({ id: validTopicId }) });
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 200, "Status code must be 200 OK");
    assert(body.ok === true, "Envelope ok must be true");
    assert(body.success === true, "success flag must be true");
    assert(body.jobId === validJobId, `Job ID matches: ${validJobId}`);
    assert(body.message === AI_TOPICS_MESSAGES.TOPIC_LAUNCHED, "Message matched");
    assert(body.data?.jobId === validJobId, "data.jobId is present in envelope");
  }

  // ─── TEST CASE 8: Orchestrator Failure (500) ──────────────────────────────
  {
    serviceShouldThrow = true;
    logRequest({
      caseNum: 8,
      description: "Unexpected service crash maps to clean 500 Internal Server Error",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH(validTopicId),
      actor: "Editor",
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH(validTopicId)}`, {
      method: "POST",
    });

    const res = await launchTopicPOST(req as any, { params: Promise.resolve({ id: validTopicId }) });
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 500, "Status code must be 500 Internal Server Error");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.INTERNAL, `Error code must be ${ErrorCode.INTERNAL}`);
    assert(body.error?.message === AI_TOPICS_ERRORS.LAUNCH_FAILED, "Internal error message matches constant");
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
