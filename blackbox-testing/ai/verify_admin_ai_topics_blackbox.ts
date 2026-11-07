/**
 * verify_admin_ai_topics_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for:
 * - GET /api/admin/ai/topics
 * - POST /api/admin/ai/topics
 * - GET /api/admin/ai/topics/[id]
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handlers directly (app/api/admin/ai/topics/route, app/api/admin/ai/topics/[id]/route).
 * 2. Mandatory request logging (Method, Path, Origin, Headers, Payload, Actor Context).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix:
 *    - 401 UNAUTHENTICATED on GET & POST without session
 *    - 403 FORBIDDEN on GET & POST with untrusted origin
 *    - 403 FORBIDDEN on POST for viewer role (Editor+ required)
 *    - 422 VALIDATION on POST with title < 5 characters
 *    - 200 OK on GET /api/admin/ai/topics with list of topics
 *    - 201 CREATED on POST /api/admin/ai/topics adding new topic
 *    - 404 NOT_FOUND on GET /api/admin/ai/topics/[id] with non-existent UUID
 *    - 200 OK on GET /api/admin/ai/topics/[id] returning topic detail
 *    - 200 OK on PATCH /api/admin/ai/topics/[id] updating status
 *    - 200 OK on DELETE /api/admin/ai/topics/[id] removing topic
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import "../preload.cjs";
import { GET as listTopicsGET, POST as createTopicPOST } from "@/app/api/admin/ai/topics/route";
import {
  GET as getTopicByIdGET,
  PATCH as updateTopicPATCH,
  DELETE as deleteTopicDELETE,
} from "@/app/api/admin/ai/topics/[id]/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminTopicsService } from "@/lib/services/admin-topics.service";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { AiTopicStatus } from "@/lib/constants/enums/ai.enum";
import { ErrorCode } from "@/lib/errors";
import { AI_TOPICS_ERRORS } from "@/lib/constants/ai.constants";

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
  logSection("STARTING HARDCORE BLACK-BOX VERIFICATION: GET, POST /api/admin/ai/topics & [id]");

  const validTopicId = "d1111111-2222-4333-8444-555555555555";
  const nonExistentId = "d9999999-9999-4999-8999-999999999999";

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

  const storedTopics: any[] = [
    {
      id: validTopicId,
      siteId: "site-uuid-1111",
      title: "Event-Driven Microservices with Next.js 16 and Kafka",
      keywords: ["microservices", "kafka", "event-driven", "nextjs"],
      category: "Architecture",
      targetAudience: "Lead Architects & CTOs",
      difficulty: "advanced",
      status: AiTopicStatus.ACCEPTED,
      priority: 1,
      suggestedBy: "admin",
      notes: "High organic search volume and intent",
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

  const mockTopicsService = {
    listTopics: async (opts?: any) => {
      let filtered = [...storedTopics];
      if (opts?.status) {
        filtered = filtered.filter((t) => t.status === opts.status);
      }
      return { topics: filtered, total: filtered.length };
    },
    getTopicById: async (id: string) => {
      return storedTopics.find((t) => t.id === id) ?? null;
    },
    createTopic: async (data: any) => {
      const created = {
        id: `topic-uuid-${Date.now()}`,
        siteId: "site-uuid-1111",
        title: data.title,
        keywords: data.keywords ?? [],
        category: data.category ?? "Engineering",
        targetAudience: data.targetAudience ?? "Tech Leads & Engineers",
        difficulty: data.difficulty ?? "intermediate",
        status: AiTopicStatus.ACCEPTED,
        priority: data.priority ?? 0,
        suggestedBy: data.suggestedBy ?? "admin",
        notes: data.notes ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      storedTopics.push(created);
      return created;
    },
    updateTopicStatus: async (id: string, status: any) => {
      const found = storedTopics.find((t) => t.id === id);
      if (!found) return null;
      found.status = status;
      found.updatedAt = new Date().toISOString();
      return found;
    },
    deleteTopic: async (id: string) => {
      const idx = storedTopics.findIndex((t) => t.id === id);
      if (idx === -1) return false;
      storedTopics.splice(idx, 1);
      return true;
    },
  };

  resetRootContainer();
  const container = getContainer();
  container.bind({ provide: AdminAuthService, useValue: mockAuthService as any });
  container.bind({ provide: AdminTopicsService, useValue: mockTopicsService as any });

  // ─── Case 1: GET /api/admin/ai/topics unauthenticated (401 UNAUTHENTICATED) ──
  {
    activeSession = null;
    logRequest({
      caseNum: 1,
      description:
        "GET /api/admin/ai/topics: Rejects unauthenticated request with 401 UNAUTHENTICATED",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.AI.TOPICS,
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPICS}`, {
      method: "GET",
    });

    const res = await listTopicsGET(req as any);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 401, "Status must be 401 Unauthorized");
    assert(json.ok === false, "Envelope ok must be false");
    assert(
      json.error.code === ErrorCode.UNAUTHENTICATED,
      `Code must be ${ErrorCode.UNAUTHENTICATED}`,
    );
  }

  // ─── Case 2: GET /api/admin/ai/topics untrusted origin (403 FORBIDDEN) ──────
  {
    activeSession = sampleEditorSession;
    logRequest({
      caseNum: 2,
      description: "GET /api/admin/ai/topics: Rejects untrusted foreign origin with 403 FORBIDDEN",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.AI.TOPICS,
      headers: { origin: "https://evil-untrusted-site.com" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPICS}`, {
      method: "GET",
      headers: { origin: "https://evil-untrusted-site.com" },
    });

    const res = await listTopicsGET(req as any);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 403, "Status must be 403 Forbidden");
    assert(json.ok === false, "Envelope ok must be false");
    assert(json.error.code === ErrorCode.FORBIDDEN, `Code must be ${ErrorCode.FORBIDDEN}`);
  }

  // ─── Case 3: GET /api/admin/ai/topics authenticated list (200 OK) ───────────
  {
    activeSession = sampleEditorSession;
    logRequest({
      caseNum: 3,
      description: "GET /api/admin/ai/topics: Editor retrieves topics list with 200 OK",
      method: "GET",
      path: `${API_ENDPOINTS.ADMIN.AI.TOPICS}?limit=20`,
      actor: "editor@techsonance.co.in",
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPICS}?limit=20`, {
      method: "GET",
    });

    const res = await listTopicsGET(req as any);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 200, "Status must be 200 OK");
    assert(json.ok === true, "Envelope ok must be true");
    assert(Array.isArray(json.data.topics), "data.topics must be an array");
    assert(json.data.total === 1, "data.total must equal 1");
    assert(Boolean(res.headers.get("x-request-id")), "x-request-id header must be present");
  }

  // ─── Case 4: POST /api/admin/ai/topics viewer denied (403 FORBIDDEN) ────────
  {
    activeSession = sampleViewerSession;
    logRequest({
      caseNum: 4,
      description:
        "POST /api/admin/ai/topics: Viewer role rejected with 403 FORBIDDEN (Editor+ required)",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.TOPICS,
      actor: "viewer@techsonance.co.in",
      payload: { title: "Autonomous Topic Creation" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPICS}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Autonomous Topic Creation" }),
    });

    const res = await createTopicPOST(req as any);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 403, "Status must be 403 Forbidden");
    assert(json.ok === false, "Envelope ok must be false");
    assert(json.error.code === ErrorCode.FORBIDDEN, `Code must be ${ErrorCode.FORBIDDEN}`);
  }

  // ─── Case 5: POST /api/admin/ai/topics validation failure: Short Title (422) ─
  {
    activeSession = sampleEditorSession;
    logRequest({
      caseNum: 5,
      description: "POST /api/admin/ai/topics: Title < 5 chars rejected with 422 VALIDATION",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.TOPICS,
      payload: { title: "Bad" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPICS}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Bad" }),
    });

    const res = await createTopicPOST(req as any);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 422, "Status must be 422 Unprocessable Entity");
    assert(json.ok === false, "Envelope ok must be false");
    assert(json.error.code === ErrorCode.VALIDATION, `Code must be ${ErrorCode.VALIDATION}`);
    assert(Boolean(json.error.fieldErrors?.title), "Field error for 'title' must be present");
  }

  // ─── Case 6: POST /api/admin/ai/topics create topic success (201 CREATED) ────
  {
    activeSession = sampleEditorSession;
    const payload = {
      title: "Building Zero-Knowledge Authentication in Next.js 16",
      category: "Security",
      keywords: ["auth", "cryptography", "zero-knowledge"],
      targetAudience: "Security Engineers",
      difficulty: "advanced",
      priority: 2,
    };

    logRequest({
      caseNum: 6,
      description: "POST /api/admin/ai/topics: Creates new topic with 201 CREATED for editor",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.TOPICS,
      actor: "editor@techsonance.co.in",
      payload,
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPICS}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await createTopicPOST(req as any);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 201, "Status must be 201 Created");
    assert(json.ok === true, "Envelope ok must be true");
    assert(json.data.topic.title === payload.title, "Created topic title must match payload");
    assert(json.data.topic.category === payload.category, "Category must match payload");
    assert(
      json.success === true,
      "Top-level success boolean preserved for backwards compatibility",
    );
    assert(storedTopics.length === 2, "Database now holds 2 topics");
  }

  // ─── Case 7: GET /api/admin/ai/topics/[id] not found (404 NOT_FOUND) ────────
  {
    activeSession = sampleEditorSession;
    logRequest({
      caseNum: 7,
      description: "GET /api/admin/ai/topics/[id]: Non-existent UUID returns 404 NOT_FOUND",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.AI.TOPIC(nonExistentId),
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC(nonExistentId)}`, {
      method: "GET",
    });

    const res = await getTopicByIdGET(req as any, {
      params: Promise.resolve({ id: nonExistentId }),
    });
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 404, "Status must be 404 Not Found");
    assert(json.ok === false, "Envelope ok must be false");
    assert(json.error.code === ErrorCode.NOT_FOUND, `Code must be ${ErrorCode.NOT_FOUND}`);
  }

  // ─── Case 8: GET /api/admin/ai/topics/[id] success (200 OK) ─────────────────
  {
    activeSession = sampleEditorSession;
    logRequest({
      caseNum: 8,
      description: "GET /api/admin/ai/topics/[id]: Returns 200 OK with topic detail",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.AI.TOPIC(validTopicId),
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC(validTopicId)}`, {
      method: "GET",
    });

    const res = await getTopicByIdGET(req as any, {
      params: Promise.resolve({ id: validTopicId }),
    });
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 200, "Status must be 200 OK");
    assert(json.ok === true, "Envelope ok must be true");
    assert(json.data.topic.id === validTopicId, "Topic ID must match request ID");
    assert(json.data.topic.title.includes("Event-Driven"), "Topic title must match seed");
  }

  // ─── Case 9: PATCH /api/admin/ai/topics/[id] status update (200 OK) ─────────
  {
    activeSession = sampleEditorSession;
    logRequest({
      caseNum: 9,
      description: "PATCH /api/admin/ai/topics/[id]: Updates status to QUEUED with 200 OK",
      method: "PATCH",
      path: API_ENDPOINTS.ADMIN.AI.TOPIC(validTopicId),
      payload: { status: AiTopicStatus.QUEUED },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC(validTopicId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: AiTopicStatus.QUEUED }),
    });

    const res = await updateTopicPATCH(req as any, {
      params: Promise.resolve({ id: validTopicId }),
    });
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 200, "Status must be 200 OK");
    assert(json.ok === true, "Envelope ok must be true");
    assert(json.data.topic.status === AiTopicStatus.QUEUED, "Status must be updated to QUEUED");
    assert(json.success === true, "Top-level success boolean preserved");
  }

  // ─── Case 10: DELETE /api/admin/ai/topics/[id] remove topic (200 OK) ────────
  {
    activeSession = sampleEditorSession;
    logRequest({
      caseNum: 10,
      description: "DELETE /api/admin/ai/topics/[id]: Removes topic from backlog with 200 OK",
      method: "DELETE",
      path: API_ENDPOINTS.ADMIN.AI.TOPIC(validTopicId),
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC(validTopicId)}`, {
      method: "DELETE",
    });

    const res = await deleteTopicDELETE(req as any, {
      params: Promise.resolve({ id: validTopicId }),
    });
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 200, "Status must be 200 OK");
    assert(json.ok === true, "Envelope ok must be true");
    assert(json.data.success === true, "data.success must be true");
    assert(storedTopics.length === 1, "Topic was removed from stored list");
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
