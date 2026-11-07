/**
 * verify_admin_ai_prompts_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for:
 * - GET  /api/admin/ai/prompts
 * - PATCH /api/admin/ai/prompts?id=<uuid>
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handlers directly (app/api/admin/ai/prompts/route).
 * 2. Mandatory request logging (Method, Path, Origin, Headers, Payload, Actor Context).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix:
 *    GET:
 *      - 403 FORBIDDEN on foreign origin
 *      - 401 UNAUTHENTICATED without active admin session
 *      - 200 OK for viewer role (read-only)
 *      - 200 OK for editor role with full template list
 *      - 500 INTERNAL on unexpected service failure
 *    PATCH:
 *      - 403 FORBIDDEN on foreign origin
 *      - 401 UNAUTHENTICATED without session
 *      - 403 FORBIDDEN for viewer role (Editor+ required)
 *      - 422 VALIDATION on invalid/missing id param
 *      - 422 VALIDATION on body schema violations
 *      - 200 OK successful update with envelope
 *      - 404 NOT_FOUND when template does not exist
 *      - 500 INTERNAL on unexpected service failure
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import "../preload.cjs";
import { GET as getPromptsGET, PATCH as patchPromptsPATCH } from "@/app/api/admin/ai/prompts/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminPromptsService } from "@/lib/services/admin-prompts.service";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { ErrorCode } from "@/lib/errors";
import { AI_PROMPTS_ERRORS, AI_PROMPTS_MESSAGES } from "@/lib/constants/ai.constants";

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

const BASE_URL = `http://localhost:3000${API_ENDPOINTS.ADMIN.AI.PROMPTS}`;
const TEMPLATE_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const sampleTemplates = [
  {
    id: TEMPLATE_ID,
    siteId: "site-uuid-1111",
    stepName: "outline",
    version: 1,
    systemPrompt: "You are a Technical Writer at TechSonance Infotech.",
    userPromptTemplate: "Topic: {{topic}}\nCategory: {{category}}",
    modelPreference: "gemini-2.5-flash",
    temperature: 70,
    isActive: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    siteId: "site-uuid-1111",
    stepName: "section",
    version: 1,
    systemPrompt: "You are a Senior Staff Engineer.",
    userPromptTemplate: "Section: {{heading}}\nKey points: {{keyPoints}}",
    modelPreference: "gemini-2.5-flash",
    temperature: 70,
    isActive: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
];

const updatedTemplate = {
  ...sampleTemplates[0],
  systemPrompt: "Updated system prompt text for comprehensive testing.",
  modelPreference: "gemini-2.5-pro",
  temperature: 80,
  updatedAt: new Date("2026-11-07"),
};

async function runGetTests() {
  logSection("PART 1: GET /api/admin/ai/prompts");

  resetRootContainer();

  const editorSession = {
    userId: "editor-uuid-aaaa",
    email: "editor@techsonance.co.in",
    role: "editor",
    site: { id: "site-uuid-1111" },
  };

  const viewerSession = {
    userId: "viewer-uuid-bbbb",
    email: "viewer@techsonance.co.in",
    role: "viewer",
    site: { id: "site-uuid-1111" },
  };

  let currentSession: any = editorSession;
  let serviceShouldThrow = false;

  const mockAuthService = {
    getCurrentSession: async () => currentSession,
    hasPermission: () => true,
  };

  const mockPromptsService = {
    listTemplates: async () => {
      if (serviceShouldThrow) throw new Error("DB pool timeout");
      return sampleTemplates;
    },
    updateTemplate: async (id: string, patch: object) => null,
    getTemplateByStep: async () => sampleTemplates[0],
    seedDefaults: async () => sampleTemplates,
  };

  const container = getContainer();
  container.bind({ provide: AdminAuthService, useValue: mockAuthService as any });
  container.bind({ provide: AdminPromptsService, useValue: mockPromptsService as any });

  // ─── TEST CASE 1: Foreign Origin Rejection (403) ───────────────────────────
  {
    logRequest({
      caseNum: 1,
      description: "GET — Foreign origin must be rejected with 403 Forbidden",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.AI.PROMPTS,
      actor: "Untrusted Client",
      headers: { origin: "https://evil-hacker.site" },
    });

    const req = new Request(BASE_URL, {
      method: "GET",
      headers: { origin: "https://evil-hacker.site" },
    });

    const res = await getPromptsGET(req as any);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 403, "Status code must be 403 Forbidden");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.FORBIDDEN, `Error code must be ${ErrorCode.FORBIDDEN}`);
    assert(body.error?.message === AI_PROMPTS_ERRORS.FORBIDDEN_ORIGIN, "Origin mismatch message matched");
  }

  // ─── TEST CASE 2: Unauthenticated Access (401) ─────────────────────────────
  {
    currentSession = null;

    logRequest({
      caseNum: 2,
      description: "GET — Missing session must return 401 Unauthenticated",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.AI.PROMPTS,
      actor: "Anonymous Visitor",
    });

    const req = new Request(BASE_URL, { method: "GET" });
    const res = await getPromptsGET(req as any);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 401, "Status code must be 401 Unauthenticated");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.UNAUTHENTICATED, `Error code must be ${ErrorCode.UNAUTHENTICATED}`);
    assert(body.error?.message === AI_PROMPTS_ERRORS.UNAUTHORIZED, "Unauthorized error message matched");
  }

  // ─── TEST CASE 3: Viewer Role Access (200) ─────────────────────────────────
  {
    currentSession = viewerSession;

    logRequest({
      caseNum: 3,
      description: "GET — Viewer role reads all prompt templates with 200 OK",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.AI.PROMPTS,
      actor: "Viewer (Read-Only)",
    });

    const req = new Request(BASE_URL, { method: "GET" });
    const res = await getPromptsGET(req as any);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 200, "Status code must be 200 OK");
    assert(body.ok === true, "Envelope ok must be true");
    assert(Array.isArray(body.templates), "Top-level templates is an array");
    assert(body.templates?.length === 2, "2 template records present at top level");
    assert(body.total === 2, "total count is 2 at top level");
    assert(body.data?.templates?.length === 2, "data.templates has 2 records");
    assert(body.data?.total === 2, "data.total is 2");
  }

  // ─── TEST CASE 4: Editor Role Access (200) ─────────────────────────────────
  {
    currentSession = editorSession;

    logRequest({
      caseNum: 4,
      description: "GET — Editor role receives full template list with 200 OK",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.AI.PROMPTS,
      actor: "Editor",
    });

    const req = new Request(BASE_URL, { method: "GET" });
    const res = await getPromptsGET(req as any);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 200, "Status code must be 200 OK");
    assert(body.ok === true, "Envelope ok must be true");
    assert(body.templates?.[0]?.stepName === "outline", "First template stepName is 'outline'");
    assert(body.templates?.[1]?.stepName === "section", "Second template stepName is 'section'");
    assert(body.data?.templates?.[0]?.id === TEMPLATE_ID, "data.templates[0].id matches expected UUID");
  }

  // ─── TEST CASE 5: Unexpected Service Error (500) ───────────────────────────
  {
    serviceShouldThrow = true;

    logRequest({
      caseNum: 5,
      description: "GET — Service crash maps to clean 500 Internal Server Error",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.AI.PROMPTS,
      actor: "Editor",
    });

    const req = new Request(BASE_URL, { method: "GET" });
    const res = await getPromptsGET(req as any);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 500, "Status code must be 500 Internal Server Error");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.INTERNAL, `Error code must be ${ErrorCode.INTERNAL}`);
    assert(body.error?.message === AI_PROMPTS_ERRORS.LIST_FAILED, "Internal error message matches constant");
  }
}

async function runPatchTests() {
  logSection("PART 2: PATCH /api/admin/ai/prompts?id=<uuid>");

  resetRootContainer();

  const editorSession = {
    userId: "editor-uuid-aaaa",
    email: "editor@techsonance.co.in",
    role: "editor",
    site: { id: "site-uuid-1111" },
  };

  const viewerSession = {
    userId: "viewer-uuid-bbbb",
    email: "viewer@techsonance.co.in",
    role: "viewer",
    site: { id: "site-uuid-1111" },
  };

  let currentSession: any = editorSession;
  let hasPermission = true;
  let updateShouldReturnNull = false;
  let updateShouldThrow = false;

  const mockAuthService = {
    getCurrentSession: async () => currentSession,
    hasPermission: () => hasPermission,
  };

  const mockPromptsService = {
    listTemplates: async () => sampleTemplates,
    updateTemplate: async (_id: string, _patch: object) => {
      if (updateShouldThrow) throw new Error("DB write failure");
      if (updateShouldReturnNull) return null;
      return updatedTemplate;
    },
    getTemplateByStep: async () => sampleTemplates[0],
    seedDefaults: async () => sampleTemplates,
  };

  const container = getContainer();
  container.bind({ provide: AdminAuthService, useValue: mockAuthService as any });
  container.bind({ provide: AdminPromptsService, useValue: mockPromptsService as any });

  const makeUrl = (id?: string) =>
    id ? `${BASE_URL}?id=${id}` : BASE_URL;

  const makePatchReq = (url: string, body: unknown = {}, extraHeaders: Record<string, string> = {}) =>
    new Request(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify(body),
    });

  // ─── TEST CASE 6: Foreign Origin Rejection for PATCH (403) ────────────────
  {
    logRequest({
      caseNum: 6,
      description: "PATCH — Foreign origin must be rejected with 403 Forbidden",
      method: "PATCH",
      path: `${API_ENDPOINTS.ADMIN.AI.PROMPTS}?id=${TEMPLATE_ID}`,
      actor: "Untrusted Client",
      headers: { origin: "https://evil-hacker.site" },
    });

    const req = new Request(makeUrl(TEMPLATE_ID), {
      method: "PATCH",
      headers: { origin: "https://evil-hacker.site", "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt: "Updated system prompt text for comprehensive testing." }),
    });

    const res = await patchPromptsPATCH(req as any);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 403, "Status code must be 403 Forbidden");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.FORBIDDEN, `Error code must be ${ErrorCode.FORBIDDEN}`);
    assert(body.error?.message === AI_PROMPTS_ERRORS.FORBIDDEN_ORIGIN, "Origin mismatch message matched");
  }

  // ─── TEST CASE 7: Unauthenticated PATCH (401) ─────────────────────────────
  {
    currentSession = null;

    logRequest({
      caseNum: 7,
      description: "PATCH — Missing session must return 401 Unauthenticated",
      method: "PATCH",
      path: `${API_ENDPOINTS.ADMIN.AI.PROMPTS}?id=${TEMPLATE_ID}`,
      actor: "Anonymous Visitor",
      payload: { systemPrompt: "Updated system prompt text for comprehensive testing." },
    });

    const res = await patchPromptsPATCH(
      makePatchReq(makeUrl(TEMPLATE_ID), { systemPrompt: "Updated system prompt text for comprehensive testing." }) as any,
    );
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 401, "Status code must be 401 Unauthenticated");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.UNAUTHENTICATED, `Error code must be ${ErrorCode.UNAUTHENTICATED}`);
    assert(body.error?.message === AI_PROMPTS_ERRORS.UNAUTHORIZED, "Unauthorized error message matched");
  }

  // ─── TEST CASE 8: Viewer Forbidden on PATCH (403) ─────────────────────────
  {
    currentSession = viewerSession;
    hasPermission = false;

    logRequest({
      caseNum: 8,
      description: "PATCH — Viewer role denied with 403 Forbidden (Editor+ required)",
      method: "PATCH",
      path: `${API_ENDPOINTS.ADMIN.AI.PROMPTS}?id=${TEMPLATE_ID}`,
      actor: "Viewer (Read-Only)",
      payload: { systemPrompt: "Updated system prompt text for comprehensive testing." },
    });

    const res = await patchPromptsPATCH(
      makePatchReq(makeUrl(TEMPLATE_ID), { systemPrompt: "Updated system prompt text for comprehensive testing." }) as any,
    );
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 403, "Status code must be 403 Forbidden");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.FORBIDDEN, `Error code must be ${ErrorCode.FORBIDDEN}`);
    assert(body.error?.message === AI_PROMPTS_ERRORS.FORBIDDEN_ROLE, "Role forbidden message matched");
  }

  // ─── TEST CASE 9: Invalid ID param (422) ──────────────────────────────────
  {
    currentSession = editorSession;
    hasPermission = true;

    logRequest({
      caseNum: 9,
      description: "PATCH — Non-UUID id param must return 422 Validation error",
      method: "PATCH",
      path: `${API_ENDPOINTS.ADMIN.AI.PROMPTS}?id=not-a-uuid`,
      actor: "Editor",
      payload: { systemPrompt: "Updated system prompt text for comprehensive testing." },
    });

    const res = await patchPromptsPATCH(
      makePatchReq(makeUrl("not-a-uuid"), { systemPrompt: "Updated system prompt text for comprehensive testing." }) as any,
    );
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 422, "Status code must be 422 Validation Error");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.VALIDATION, `Error code must be ${ErrorCode.VALIDATION}`);
    assert(body.error?.message === AI_PROMPTS_ERRORS.INVALID_ID, "Invalid ID error message matched");
  }

  // ─── TEST CASE 10: Body schema violation (422) ────────────────────────────
  {
    logRequest({
      caseNum: 10,
      description: "PATCH — Body schema violation (systemPrompt too short) returns 422",
      method: "PATCH",
      path: `${API_ENDPOINTS.ADMIN.AI.PROMPTS}?id=${TEMPLATE_ID}`,
      actor: "Editor",
      payload: { systemPrompt: "short" },
    });

    const res = await patchPromptsPATCH(
      makePatchReq(makeUrl(TEMPLATE_ID), { systemPrompt: "short" }) as any,
    );
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 422, "Status code must be 422 Validation Error");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.VALIDATION, `Error code must be ${ErrorCode.VALIDATION}`);
  }

  // ─── TEST CASE 11: Successful Update (200) ────────────────────────────────
  {
    const patch = {
      systemPrompt: "Updated system prompt text for comprehensive testing.",
      modelPreference: "gemini-2.5-pro",
      temperature: 80,
    };

    logRequest({
      caseNum: 11,
      description: "PATCH — Editor updates prompt template successfully with 200 OK",
      method: "PATCH",
      path: `${API_ENDPOINTS.ADMIN.AI.PROMPTS}?id=${TEMPLATE_ID}`,
      actor: "Editor",
      payload: patch,
    });

    const res = await patchPromptsPATCH(makePatchReq(makeUrl(TEMPLATE_ID), patch) as any);
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 200, "Status code must be 200 OK");
    assert(body.ok === true, "Envelope ok must be true");
    assert(body.data?.template?.id === TEMPLATE_ID, "data.template.id matches expected UUID");
    assert(body.data?.template?.systemPrompt === updatedTemplate.systemPrompt, "Updated systemPrompt returned");
    assert(body.template?.id === TEMPLATE_ID, "Top-level template.id present (backwards-compat)");
    assert(body.message === AI_PROMPTS_MESSAGES.TEMPLATE_UPDATED, "Success message matches constant");
  }

  // ─── TEST CASE 12: Template Not Found (404) ───────────────────────────────
  {
    updateShouldReturnNull = true;

    logRequest({
      caseNum: 12,
      description: "PATCH — Non-existent template ID returns 404 Not Found",
      method: "PATCH",
      path: `${API_ENDPOINTS.ADMIN.AI.PROMPTS}?id=${TEMPLATE_ID}`,
      actor: "Editor",
      payload: { systemPrompt: "Updated system prompt text for comprehensive testing." },
    });

    const res = await patchPromptsPATCH(
      makePatchReq(makeUrl(TEMPLATE_ID), { systemPrompt: "Updated system prompt text for comprehensive testing." }) as any,
    );
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 404, "Status code must be 404 Not Found");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.NOT_FOUND, `Error code must be ${ErrorCode.NOT_FOUND}`);
    assert(body.error?.message === AI_PROMPTS_ERRORS.TEMPLATE_NOT_FOUND, "Not found error message matched");
  }

  // ─── TEST CASE 13: Unexpected Service Error on PATCH (500) ────────────────
  {
    updateShouldReturnNull = false;
    updateShouldThrow = true;

    logRequest({
      caseNum: 13,
      description: "PATCH — Service crash maps to clean 500 Internal Server Error",
      method: "PATCH",
      path: `${API_ENDPOINTS.ADMIN.AI.PROMPTS}?id=${TEMPLATE_ID}`,
      actor: "Editor",
      payload: { systemPrompt: "Updated system prompt text for comprehensive testing." },
    });

    const res = await patchPromptsPATCH(
      makePatchReq(makeUrl(TEMPLATE_ID), { systemPrompt: "Updated system prompt text for comprehensive testing." }) as any,
    );
    const body = await res.json();
    logResponse(res.status, body);

    assert(res.status === 500, "Status code must be 500 Internal Server Error");
    assert(body.ok === false, "Envelope ok must be false");
    assert(body.error?.code === ErrorCode.INTERNAL, `Error code must be ${ErrorCode.INTERNAL}`);
    assert(body.error?.message === AI_PROMPTS_ERRORS.UPDATE_FAILED, "Internal error message matches constant");
  }
}

async function run() {
  logSection("STARTING HARDCORE BLACK-BOX VERIFICATION: GET & PATCH /api/admin/ai/prompts");

  await runGetTests();
  await runPatchTests();

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
