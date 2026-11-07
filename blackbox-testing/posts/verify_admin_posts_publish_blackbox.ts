/**
 * verify_admin_posts_publish_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for POST /api/admin/posts/[id]/publish
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handler directly (POST from app/api/admin/posts/[id]/publish/route).
 * 2. Mandatory request logging (Method, Path, Params, Payload, Caller Context).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix: Auth, Origin Check, Param Validation, Role RBAC (Viewer, Author, Editor, Admin),
 *    404 Not Found, Happy Path, and 500 Resilience.
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import "../preload.cjs";
import { POST } from "@/app/api/admin/blog/posts/[id]/publish/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminPostsService } from "@/lib/services/admin-posts.service";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { PostStatus } from "@/lib/constants/enums/content.enum";
import { AppError, ErrorCode } from "@/lib/errors";

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
  params?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  caller: Record<string, unknown>;
}) {
  console.log(`\n----------------------------------------------------------------------`);
  console.log(`[TEST CASE ${details.caseNum}] ${details.description}`);
  console.log(`Incoming Request:`);
  console.log(`  Method:  ${details.method}`);
  console.log(`  Path:    ${details.path}`);
  if (details.params) console.log(`  Params:  ${JSON.stringify(details.params)}`);
  if (details.payload) console.log(`  Payload: ${JSON.stringify(details.payload)}`);
  console.log(`  Caller:  ${JSON.stringify(details.caller)}`);
}

function logResponse(status: number, headers: Headers, body: unknown) {
  console.log(`Controller Response (HTTP ${status}):`);
  console.log(`Headers: x-request-id=${headers.get("x-request-id")}, cache-control=${headers.get("cache-control")}`);
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
  logSection("STARTING HARDCORE BLACK-BOX VERIFICATION: POST /api/admin/posts/[id]/publish");

  resetRootContainer();

  const validPostId = "b1111111-2222-4333-8444-555555555555";
  const nonExistentId = "b9999999-9999-4999-8999-999999999999";

  const sampleEditorSession = {
    userId: "admin-uuid-1111",
    email: "editor@techsonance.co.in",
    role: "editor" as const,
    site: { id: "site-uuid-1111" },
  };

  const sampleDraftPost = {
    id: validPostId,
    siteId: "site-uuid-1111",
    slug: "nextjs-16-deep-dive",
    title: "Next.js 16 Deep Dive: Architecture and Performance",
    excerpt: "Exploring Next.js 16 innovations and App Router patterns.",
    content: "Comprehensive overview of server actions, streaming, and caching.",
    status: PostStatus.DRAFT,
    tags: ["nextjs", "react", "architecture"],
    readTime: "5 min read",
    versionId: 1,
    publishedAt: null,
    createdBy: "admin-uuid-1111",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let currentSession: any = sampleEditorSession;

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

  const mockPostsService = {
    publishPost: async (id: string, actorId?: string, _ip?: string) => {
      if (id === nonExistentId) {
        throw new AppError(ErrorCode.NOT_FOUND, `Post with id "${id}" not found`);
      }
      if (id === "throw-500-error") {
        throw new Error("Simulated database failure");
      }
      return {
        ...sampleDraftPost,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        versionId: 2,
        updatedBy: actorId,
      };
    },
  };

  const container = getContainer();
  container.bind({ provide: AdminAuthService, useValue: mockAuthService as any });
  container.bind({ provide: AdminPostsService, useValue: mockPostsService as any });

  // ─── CASE 1: 401 UNAUTHENTICATED ───────────────────────────────────────────
  {
    currentSession = null;
    const path = API_ENDPOINTS.ADMIN.POST_PUBLISH(validPostId);
    logRequest({
      caseNum: 1,
      description: "Reject unauthenticated request with 401 UNAUTHENTICATED",
      method: "POST",
      path,
      params: { id: validPostId },
      caller: { session: null },
    });

    const req = new Request(`http://localhost:3000${path}`, { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 401, 1, "Status code is 401");
    assertTest(body.ok === false, 1, "Response envelope indicates failure (ok=false)");
    assertTest(body.error?.code === ErrorCode.UNAUTHENTICATED, 1, "Error code is UNAUTHENTICATED");
  }

  // ─── CASE 2: 403 FORBIDDEN ORIGIN ──────────────────────────────────────────
  {
    currentSession = sampleEditorSession;
    const path = API_ENDPOINTS.ADMIN.POST_PUBLISH(validPostId);
    logRequest({
      caseNum: 2,
      description: "Reject untrusted origin with 403 FORBIDDEN",
      method: "POST",
      path,
      params: { id: validPostId },
      caller: { session: sampleEditorSession, origin: "https://evil-attacker.example.com" },
    });

    const req = new Request(`http://localhost:3000${path}`, {
      method: "POST",
      headers: { origin: "https://evil-attacker.example.com" },
    });
    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 403, 2, "Status code is 403");
    assertTest(body.ok === false, 2, "Response envelope ok=false");
    assertTest(body.error?.code === ErrorCode.FORBIDDEN, 2, "Error code is FORBIDDEN");
  }

  // ─── CASE 3: 403 FORBIDDEN ROLE (VIEWER) ───────────────────────────────────
  {
    currentSession = { ...sampleEditorSession, role: "viewer" };
    const path = API_ENDPOINTS.ADMIN.POST_PUBLISH(validPostId);
    logRequest({
      caseNum: 3,
      description: "Reject viewer role with 403 FORBIDDEN",
      method: "POST",
      path,
      params: { id: validPostId },
      caller: currentSession,
    });

    const req = new Request(`http://localhost:3000${path}`, { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 403, 3, "Status code is 403");
    assertTest(body.error?.code === ErrorCode.FORBIDDEN, 3, "Error code is FORBIDDEN");
  }

  // ─── CASE 4: 403 FORBIDDEN ROLE (AUTHOR) ───────────────────────────────────
  {
    currentSession = { ...sampleEditorSession, role: "author" };
    const path = API_ENDPOINTS.ADMIN.POST_PUBLISH(validPostId);
    logRequest({
      caseNum: 4,
      description: "Reject author role with 403 FORBIDDEN (Editor+ required)",
      method: "POST",
      path,
      params: { id: validPostId },
      caller: currentSession,
    });

    const req = new Request(`http://localhost:3000${path}`, { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 403, 4, "Status code is 403");
    assertTest(body.error?.code === ErrorCode.FORBIDDEN, 4, "Error code is FORBIDDEN");
  }

  // ─── CASE 5: 400 VALIDATION (INVALID UUID) ────────────────────────────────
  {
    currentSession = sampleEditorSession;
    const path = API_ENDPOINTS.ADMIN.POST_PUBLISH("not-a-valid-uuid");
    logRequest({
      caseNum: 5,
      description: "Reject invalid UUID param with 400 VALIDATION",
      method: "POST",
      path,
      params: { id: "not-a-valid-uuid" },
      caller: currentSession,
    });

    const req = new Request(`http://localhost:3000${path}`, { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: "not-a-valid-uuid" }) });
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 400, 5, "Status code is 400");
    assertTest(body.error?.code === ErrorCode.VALIDATION, 5, "Error code is VALIDATION");
    assertTest(Boolean(body.error?.fieldErrors?.id), 5, "fieldErrors contains 'id'");
  }

  // ─── CASE 6: 404 NOT FOUND ────────────────────────────────────────────────
  {
    currentSession = sampleEditorSession;
    const path = API_ENDPOINTS.ADMIN.POST_PUBLISH(nonExistentId);
    logRequest({
      caseNum: 6,
      description: "Return 404 NOT_FOUND when target post does not exist",
      method: "POST",
      path,
      params: { id: nonExistentId },
      caller: currentSession,
    });

    const req = new Request(`http://localhost:3000${path}`, { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: nonExistentId }) });
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 404, 6, "Status code is 404");
    assertTest(body.error?.code === ErrorCode.NOT_FOUND, 6, "Error code is NOT_FOUND");
  }

  // ─── CASE 7: 200 OK HAPPY PATH (EDITOR) ───────────────────────────────────
  {
    currentSession = sampleEditorSession;
    const path = API_ENDPOINTS.ADMIN.POST_PUBLISH(validPostId);
    logRequest({
      caseNum: 7,
      description: "Successfully publish post with 200 OK by editor",
      method: "POST",
      path,
      params: { id: validPostId },
      caller: currentSession,
    });

    const req = new Request(`http://localhost:3000${path}`, { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 200, 7, "Status code is 200");
    assertTest(body.ok === true, 7, "Response envelope ok=true");
    assertTest(body.data?.post?.status === PostStatus.PUBLISHED, 7, "Post status transitioned to PUBLISHED");
    assertTest(Boolean(body.data?.post?.publishedAt), 7, "publishedAt timestamp is populated");
    assertTest(body.data?.post?.versionId === 2, 7, "versionId is incremented");
  }

  // ─── CASE 8: 200 OK HAPPY PATH (ADMIN / OWNER) ───────────────────────────
  {
    currentSession = { ...sampleEditorSession, role: "admin", userId: "admin-master-uuid" };
    const path = API_ENDPOINTS.ADMIN.POST_PUBLISH(validPostId);
    logRequest({
      caseNum: 8,
      description: "Successfully publish post with 200 OK by admin",
      method: "POST",
      path,
      params: { id: validPostId },
      caller: currentSession,
    });

    const req = new Request(`http://localhost:3000${path}`, { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 200, 8, "Status code is 200");
    assertTest(body.ok === true, 8, "Response envelope ok=true");
    assertTest(body.data?.post?.status === PostStatus.PUBLISHED, 8, "Post status is PUBLISHED");
  }

  // ─── CASE 9: 500 INTERNAL RESILIENCE ──────────────────────────────────────
  {
    currentSession = sampleEditorSession;
    const errorId = "00000000-0000-4000-8000-000000000000";
    const path = API_ENDPOINTS.ADMIN.POST_PUBLISH(errorId);
    logRequest({
      caseNum: 9,
      description: "Handle unexpected failure gracefully with 500 INTERNAL",
      method: "POST",
      path,
      params: { id: errorId },
      caller: currentSession,
    });

    mockPostsService.publishPost = async () => {
      throw new Error("Unhandled crash");
    };

    const req = new Request(`http://localhost:3000${path}`, { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: errorId }) });
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 500, 9, "Status code is 500");
    assertTest(body.error?.code === ErrorCode.INTERNAL, 9, "Error code is INTERNAL");
  }

  // ─── SUMMARY ──────────────────────────────────────────────────────────────
  logSection(`VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  if (failCount > 0) {
    process.exit(1);
  }
}

runBlackboxSuite().catch((err) => {
  console.error("FATAL BLACK-BOX RUNNER CRASH:", err);
  process.exit(1);
});
