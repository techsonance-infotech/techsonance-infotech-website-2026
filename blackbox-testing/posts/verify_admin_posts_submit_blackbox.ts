/**
 * verify_admin_posts_submit_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for POST /api/admin/blog/posts/[id]/submit
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handler directly (POST from app/api/admin/blog/posts/[id]/submit/route).
 * 2. Mandatory request logging (Method, Path, Params, Payload, Caller Context).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix: Auth, Origin Check, Param Validation, Role RBAC (Viewer vs Author vs Editor),
 *    404 Not Found, Happy Path, and 500 Resilience.
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import "../preload.cjs";
import { POST } from "@/app/api/admin/blog/posts/[id]/submit/route";
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
  logSection("STARTING HARDCORE BLACK-BOX VERIFICATION: POST /api/admin/blog/posts/[id]/submit");

  resetRootContainer();

  const validPostId = "c1111111-2222-4333-8444-555555555555";
  const nonExistentId = "c9999999-9999-4999-8999-999999999999";

  const sampleAuthorSession = {
    userId: "author-uuid-1111",
    email: "author@techsonance.co.in",
    role: "author" as const,
    site: { id: "site-uuid-1111" },
  };

  const sampleDraftPost = {
    id: validPostId,
    siteId: "site-uuid-1111",
    slug: "typescript-5-8-guide",
    title: "TypeScript 5.8: Modern Compiler Enhancements",
    excerpt: "Exploring new checks, flags, and speedups in TypeScript.",
    content: "Deep architectural dive into the updated type inference engine.",
    status: PostStatus.DRAFT,
    tags: ["typescript", "javascript", "tooling"],
    readTime: "4 min read",
    versionId: 1,
    publishedAt: null,
    createdBy: "author-uuid-1111",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let currentSession: any = sampleAuthorSession;

  const mockAuthService = {
    getCurrentSession: async () => currentSession,
  };

  const mockPostsService = {
    submitForReview: async (id: string, actorId?: string, _ip?: string) => {
      if (id === nonExistentId) {
        throw new AppError(ErrorCode.NOT_FOUND, `Post with id "${id}" not found`);
      }
      if (id === "throw-500-error") {
        throw new Error("Simulated database failure");
      }
      return {
        ...sampleDraftPost,
        status: PostStatus.IN_REVIEW,
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
    const path = API_ENDPOINTS.ADMIN.BLOG.POST_SUBMIT(validPostId);
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
    currentSession = sampleAuthorSession;
    const path = API_ENDPOINTS.ADMIN.BLOG.POST_SUBMIT(validPostId);
    logRequest({
      caseNum: 2,
      description: "Reject untrusted origin with 403 FORBIDDEN",
      method: "POST",
      path,
      params: { id: validPostId },
      caller: { session: sampleAuthorSession, origin: "https://evil-untrusted-site.com" },
    });

    const req = new Request(`http://localhost:3000${path}`, {
      method: "POST",
      headers: { origin: "https://evil-untrusted-site.com" },
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
    currentSession = { ...sampleAuthorSession, role: "viewer" };
    const path = API_ENDPOINTS.ADMIN.BLOG.POST_SUBMIT(validPostId);
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

  // ─── CASE 4: 400 VALIDATION (INVALID UUID) ────────────────────────────────
  {
    currentSession = sampleAuthorSession;
    const path = API_ENDPOINTS.ADMIN.BLOG.POST_SUBMIT("invalid-not-uuid");
    logRequest({
      caseNum: 4,
      description: "Reject invalid UUID param with 400 VALIDATION",
      method: "POST",
      path,
      params: { id: "invalid-not-uuid" },
      caller: currentSession,
    });

    const req = new Request(`http://localhost:3000${path}`, { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: "invalid-not-uuid" }) });
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 400, 4, "Status code is 400");
    assertTest(body.error?.code === ErrorCode.VALIDATION, 4, "Error code is VALIDATION");
    assertTest(Boolean(body.error?.fieldErrors?.id), 4, "fieldErrors contains 'id'");
  }

  // ─── CASE 5: 404 NOT FOUND ────────────────────────────────────────────────
  {
    currentSession = sampleAuthorSession;
    const path = API_ENDPOINTS.ADMIN.BLOG.POST_SUBMIT(nonExistentId);
    logRequest({
      caseNum: 5,
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

    assertTest(res.status === 404, 5, "Status code is 404");
    assertTest(body.error?.code === ErrorCode.NOT_FOUND, 5, "Error code is NOT_FOUND");
  }

  // ─── CASE 6: 200 OK HAPPY PATH (AUTHOR) ───────────────────────────────────
  {
    currentSession = sampleAuthorSession;
    const path = API_ENDPOINTS.ADMIN.BLOG.POST_SUBMIT(validPostId);
    logRequest({
      caseNum: 6,
      description: "Successfully submit post for review with 200 OK by author",
      method: "POST",
      path,
      params: { id: validPostId },
      caller: currentSession,
    });

    const req = new Request(`http://localhost:3000${path}`, { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 200, 6, "Status code is 200");
    assertTest(body.ok === true, 6, "Response envelope ok=true");
    assertTest(body.data?.post?.status === PostStatus.IN_REVIEW, 6, "Post status transitioned to IN_REVIEW");
    assertTest(body.data?.post?.versionId === 2, 6, "versionId is incremented");
  }

  // ─── CASE 7: 200 OK HAPPY PATH (EDITOR / ADMIN) ───────────────────────────
  {
    currentSession = { ...sampleAuthorSession, role: "editor", userId: "editor-uuid-7777" };
    const path = API_ENDPOINTS.ADMIN.BLOG.POST_SUBMIT(validPostId);
    logRequest({
      caseNum: 7,
      description: "Successfully submit post for review with 200 OK by editor",
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
    assertTest(body.data?.post?.status === PostStatus.IN_REVIEW, 7, "Post status is IN_REVIEW");
  }

  // ─── CASE 8: 500 INTERNAL RESILIENCE ──────────────────────────────────────
  {
    currentSession = sampleAuthorSession;
    const errorId = "00000000-0000-4000-8000-000000000000";
    const path = API_ENDPOINTS.ADMIN.BLOG.POST_SUBMIT(errorId);
    logRequest({
      caseNum: 8,
      description: "Handle unexpected failure gracefully with 500 INTERNAL",
      method: "POST",
      path,
      params: { id: errorId },
      caller: currentSession,
    });

    mockPostsService.submitForReview = async () => {
      throw new Error("Simulated unhandled exception");
    };

    const req = new Request(`http://localhost:3000${path}`, { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: errorId }) });
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 500, 8, "Status code is 500");
    assertTest(body.error?.code === ErrorCode.INTERNAL, 8, "Error code is INTERNAL");
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
