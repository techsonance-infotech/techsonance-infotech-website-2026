/**
 * verify_admin_ai_topics_suggest_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for:
 * - POST /api/admin/ai/topics/suggest
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handler directly (app/api/admin/ai/topics/suggest/route).
 * 2. Mandatory request logging (Method, Path, Origin, Headers, Payload, Actor Context).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix:
 *    - 403 FORBIDDEN on foreign origin
 *    - 401 UNAUTHENTICATED without active admin session
 *    - 403 FORBIDDEN on viewer role (Editor+ required)
 *    - 403 FORBIDDEN on author role (Editor+ required)
 *    - 400 BAD_REQUEST on malformed JSON payload
 *    - 422 VALIDATION on category exceeding max length (100 chars)
 *    - 422 VALIDATION on unknown extra properties (strictObject enforcement)
 *    - 200 OK on editor generating topics with custom category
 *    - 200 OK on editor generating topics with empty body (defaults applied)
 *    - 500 INTERNAL on LLM service failure
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import "../preload.cjs";
import { POST as suggestTopicsPOST } from "@/app/api/admin/ai/topics/suggest/route";
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
  logSection("STARTING HARDCORE BLACK-BOX VERIFICATION: POST /api/admin/ai/topics/suggest");

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

  const sampleAuthorSession = {
    userId: "author-uuid-3333",
    email: "author@techsonance.co.in",
    role: "author",
    site: { id: "site-uuid-1111" },
  };

  const sampleGeneratedTopics = [
    {
      id: "topic-uuid-1",
      siteId: "site-uuid-1111",
      title: "Building Production Multi-Agent Systems with Next.js 16",
      keywords: ["Multi-Agent AI", "Next.js 16", "Needle DI"],
      category: "Agentic AI",
      targetAudience: "Engineering Leads",
      difficulty: "advanced",
      status: AiTopicStatus.SUGGESTED,
      suggestedBy: "ai",
      priority: 1,
      notes: "Curated agency topic recommendation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "topic-uuid-2",
      siteId: "site-uuid-1111",
      title: "Zero-Downtime Migration from Zod 3 to Zod 4",
      keywords: ["Zod 4", "Validation", "TypeScript"],
      category: "Full-Stack",
      targetAudience: "Software Engineers",
      difficulty: "intermediate",
      status: AiTopicStatus.SUGGESTED,
      suggestedBy: "ai",
      priority: 1,
      notes: "High SEO developer search intent",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

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
    suggestTopicsWithAI: async (category: string) => {
      if (serviceShouldThrow) {
        throw new Error("Simulated LLM Provider Outage");
      }
      return sampleGeneratedTopics.map((t) => ({ ...t, category }));
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
      path: API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST,
      actor: "Untrusted Client",
      headers: { origin: "https://evil-hacker.site" },
      payload: { category: "Agentic AI" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST}`, {
      method: "POST",
      headers: {
        origin: "https://evil-hacker.site",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category: "Agentic AI" }),
    });

    const res = await suggestTopicsPOST(req as any);
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
      path: API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST,
      actor: "Anonymous Visitor",
      payload: { category: "Agentic AI" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "Agentic AI" }),
    });

    const res = await suggestTopicsPOST(req as any);
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
      path: API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST,
      actor: "Viewer (Read-Only)",
      payload: { category: "Agentic AI" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "Agentic AI" }),
    });

    const res = await suggestTopicsPOST(req as any);
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
      path: API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST,
      actor: "Author (Blog writer)",
      payload: { category: "Agentic AI" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "Agentic AI" }),
    });

    const res = await suggestTopicsPOST(req as any);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 403, "Status code must be 403 Forbidden");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.FORBIDDEN, `Error code must be ${ErrorCode.FORBIDDEN}`);
  }

  // ─── TEST CASE 5: Malformed JSON Payload (400) ────────────────────────────
  {
    currentSession = sampleEditorSession;
    logRequest({
      caseNum: 5,
      description: "Broken/unparseable JSON string returns 400 Bad Request",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST,
      actor: "Editor",
      payload: "{ broken-json-syntax ",
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ broken-json-syntax ",
    });

    const res = await suggestTopicsPOST(req as any);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 400, "Status code must be 400 Bad Request");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.BAD_REQUEST, `Error code must be ${ErrorCode.BAD_REQUEST}`);
  }

  // ─── TEST CASE 6: Category Length Validation (422) ────────────────────────
  {
    logRequest({
      caseNum: 6,
      description: "Category > 100 characters rejected with 422 Unprocessable Entity",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST,
      actor: "Editor",
      payload: { category: "X".repeat(150) },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "X".repeat(150) }),
    });

    const res = await suggestTopicsPOST(req as any);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 422, "Status code must be 422 Validation Error");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.VALIDATION, `Error code must be ${ErrorCode.VALIDATION}`);
    assert(body.error?.fieldErrors?.category !== undefined, "Field error specifies 'category'");
  }

  // ─── TEST CASE 7: Strict Inbound Shape Enforcement (422) ──────────────────
  {
    logRequest({
      caseNum: 7,
      description: "Unexpected extra properties rejected with 422 via strictObject",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST,
      actor: "Editor",
      payload: { category: "Cloud Architecture", rogueField: 123 },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "Cloud Architecture", rogueField: 123 }),
    });

    const res = await suggestTopicsPOST(req as any);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 422, "Status code must be 422 Validation Error");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.VALIDATION, `Error code must be ${ErrorCode.VALIDATION}`);
  }

  // ─── TEST CASE 8: Success with Custom Category (200) ──────────────────────
  {
    logRequest({
      caseNum: 8,
      description: "Editor successfully requests topic suggestions with custom category",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST,
      actor: "Editor",
      payload: { category: "Next.js 16 Performance" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "Next.js 16 Performance" }),
    });

    const res = await suggestTopicsPOST(req as any);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 200, "Status code must be 200 OK");
    assert(body.ok === true, "Envelope ok must be true");
    assert(body.success === true, "success flag must be true");
    assert(body.count === 2, "count must equal 2");
    assert(Array.isArray(body.topics) && body.topics.length === 2, "topics array returned");
    assert(body.data?.count === 2, "data.count is present in envelope");
    assert(body.data?.topics?.length === 2, "data.topics is present in envelope");
    assert(body.topics[0].category === "Next.js 16 Performance", "category reflected in proposals");
  }

  // ─── TEST CASE 9: Success with Empty Body Defaults (200) ──────────────────
  {
    logRequest({
      caseNum: 9,
      description: "Editor requests topic suggestions with empty body (default category applied)",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST,
      actor: "Editor",
      payload: "",
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "",
    });

    const res = await suggestTopicsPOST(req as any);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 200, "Status code must be 200 OK");
    assert(body.ok === true, "Envelope ok must be true");
    assert(body.count === 2, "count must equal 2");
    assert(body.topics[0].category === "Full-Stack & Agentic AI", "default category applied");
  }

  // ─── TEST CASE 10: Graceful 500 on LLM Provider Outage ───────────────────
  {
    serviceShouldThrow = true;
    logRequest({
      caseNum: 10,
      description: "Service failure maps to clean 500 Internal Server Error",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST,
      actor: "Editor",
      payload: { category: "Agentic AI" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "Agentic AI" }),
    });

    const res = await suggestTopicsPOST(req as any);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 500, "Status code must be 500 Internal Server Error");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.INTERNAL, `Error code must be ${ErrorCode.INTERNAL}`);
    assert(body.error?.message === AI_TOPICS_ERRORS.SUGGEST_FAILED, "Internal error message matches constant");
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
