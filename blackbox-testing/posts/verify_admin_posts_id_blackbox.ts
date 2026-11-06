/**
 * verify_admin_posts_id_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for GET, PATCH, DELETE /api/admin/posts/[id]
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handlers directly (GET, PATCH, DELETE from app/api/admin/posts/[id]/route).
 * 2. Mandatory request logging (Method, Path, Params, Payload, Caller Context).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix: Auth, Origin Check, Param Validation, Role RBAC (Viewer on PATCH, Author on DELETE),
 *    Conflict Handling (Duplicate Slug on PATCH), 404 Not Found, Happy Path, and 500 Resilience.
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import "../preload.cjs";
import { GET, PATCH, DELETE } from "@/app/api/admin/posts/[id]/route";
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
  logSection("STARTING HARDCORE BLACK-BOX VERIFICATION: GET, PATCH, DELETE /api/admin/posts/[id]");

  resetRootContainer();

  const validPostId = "b1111111-2222-4333-8444-555555555555";
  const nonExistentId = "b9999999-9999-4999-8999-999999999999";

  const sampleAdminSession = {
    userId: "admin-uuid-1111",
    email: "editor@techsonance.co.in",
    role: "editor",
    site: { id: "site-uuid-1111" },
  };

  const samplePost = {
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
    createdBy: "admin-uuid-1111",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let currentSession: any = sampleAdminSession;

  const mockAuthService = {
    getCurrentSession: async () => currentSession,
    hasPermission: (role: string, required: string) => {
      if (required === "editor") {
        return ["editor", "admin", "owner"].includes(role);
      }
      return false;
    },
  };

  const mockPostsService = {
    getPostById: async (id: string) => {
      if (id === validPostId) return samplePost;
      return null;
    },
    updatePost: async (id: string, updates: any) => {
      if (id !== validPostId) {
        throw new AppError(ErrorCode.NOT_FOUND, `Post with id "${id}" not found`);
      }
      if (updates.slug === "conflicting-slug") {
        throw new AppError(
          ErrorCode.CONFLICT,
          `A post with slug "${updates.slug}" already exists`,
          { fieldErrors: { slug: ["Slug is already taken"] } },
        );
      }
      return {
        ...samplePost,
        ...updates,
        versionId: (samplePost.versionId || 1) + 1,
      };
    },
    deletePost: async (id: string) => {
      if (id === "b5555555-5555-4555-8555-555555555555") {
        throw new Error("Simulated storage / database timeout");
      }
      if (id === validPostId) return true;
      return false;
    },
  };

  const container = getContainer();
  container.bind({ provide: AdminAuthService, useValue: mockAuthService as unknown as AdminAuthService });
  container.bind({ provide: AdminPostsService, useValue: mockPostsService as unknown as AdminPostsService });

  const BASE_URL = "http://localhost:3000";

  // ─── Case 1: GET Unauthenticated ─────────────────────────────────────────────
  {
    currentSession = null;
    const path = API_ENDPOINTS.ADMIN.POST(validPostId);
    logRequest({
      caseNum: 1,
      description: "GET /api/admin/posts/[id] without session cookie / unauthenticated",
      method: "GET",
      path,
      params: { id: validPostId },
      caller: { auth: "none" },
    });

    const req = new Request(`${BASE_URL}${path}`, { method: "GET" });
    const res = await GET(req, { params: Promise.resolve({ id: validPostId }) });
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 401, 1, "Status code is 401 Unauthorized");
    assertTest(body.error?.code === ErrorCode.UNAUTHENTICATED, 1, "Error code is UNAUTHENTICATED");
  }

  // ─── Case 2: GET Forbidden Origin ────────────────────────────────────────────
  {
    currentSession = sampleAdminSession;
    const path = API_ENDPOINTS.ADMIN.POST(validPostId);
    logRequest({
      caseNum: 2,
      description: "GET /api/admin/posts/[id] with foreign / untrusted origin",
      method: "GET",
      path,
      params: { id: validPostId },
      caller: { origin: "https://evil-unauthorized.com" },
    });

    const req = new Request(`${BASE_URL}${path}`, {
      method: "GET",
      headers: { origin: "https://evil-unauthorized.com" },
    });
    const res = await GET(req, { params: Promise.resolve({ id: validPostId }) });
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 403, 2, "Status code is 403 Forbidden");
    assertTest(body.error?.code === ErrorCode.FORBIDDEN, 2, "Error code is FORBIDDEN");
  }

  // ─── Case 3: GET Invalid UUID Param ──────────────────────────────────────────
  {
    const path = "/api/admin/posts/invalid-non-uuid";
    logRequest({
      caseNum: 3,
      description: "GET /api/admin/posts/[id] with invalid non-UUID parameter",
      method: "GET",
      path,
      params: { id: "invalid-non-uuid" },
      caller: { session: sampleAdminSession.email },
    });

    const req = new Request(`${BASE_URL}${path}`, { method: "GET" });
    const res = await GET(req, { params: Promise.resolve({ id: "invalid-non-uuid" }) });
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 400, 3, "Status code is 400 Bad Request");
    assertTest(body.error?.code === ErrorCode.VALIDATION, 3, "Error code is VALIDATION");
  }

  // ─── Case 4: GET 404 Not Found ───────────────────────────────────────────────
  {
    const path = API_ENDPOINTS.ADMIN.POST(nonExistentId);
    logRequest({
      caseNum: 4,
      description: "GET /api/admin/posts/[id] for non-existent post",
      method: "GET",
      path,
      params: { id: nonExistentId },
      caller: { session: sampleAdminSession.email },
    });

    const req = new Request(`${BASE_URL}${path}`, { method: "GET" });
    const res = await GET(req, { params: Promise.resolve({ id: nonExistentId }) });
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 404, 4, "Status code is 404 Not Found");
    assertTest(body.error?.code === ErrorCode.NOT_FOUND, 4, "Error code is NOT_FOUND");
  }

  // ─── Case 5: GET Happy Path ──────────────────────────────────────────────────
  {
    const path = API_ENDPOINTS.ADMIN.POST(validPostId);
    logRequest({
      caseNum: 5,
      description: "GET /api/admin/posts/[id] returns post successfully (200 OK)",
      method: "GET",
      path,
      params: { id: validPostId },
      caller: { session: sampleAdminSession.email, role: sampleAdminSession.role },
    });

    const req = new Request(`${BASE_URL}${path}`, { method: "GET" });
    const res = await GET(req, { params: Promise.resolve({ id: validPostId }) });
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 200, 5, "Status code is 200 OK");
    assertTest(body.ok === true, 5, "Envelope ok is true");
    assertTest(body.data?.post?.id === validPostId, 5, "Returned post id matches");
    assertTest(res.headers.get("x-request-id") !== null, 5, "x-request-id header injected");
  }

  // ─── Case 6: PATCH Unauthenticated ───────────────────────────────────────────
  {
    currentSession = null;
    const path = API_ENDPOINTS.ADMIN.POST(validPostId);
    logRequest({
      caseNum: 6,
      description: "PATCH /api/admin/posts/[id] without session / unauthenticated",
      method: "PATCH",
      path,
      params: { id: validPostId },
      payload: { title: "Updated Title" },
      caller: { auth: "none" },
    });

    const req = new Request(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Title" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: validPostId }) });
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 401, 6, "Status code is 401 Unauthorized");
    assertTest(body.error?.code === ErrorCode.UNAUTHENTICATED, 6, "Error code is UNAUTHENTICATED");
  }

  // ─── Case 7: PATCH Viewer Role Denied ─────────────────────────────────────────
  {
    currentSession = { ...sampleAdminSession, role: "viewer" };
    const path = API_ENDPOINTS.ADMIN.POST(validPostId);
    logRequest({
      caseNum: 7,
      description: "PATCH /api/admin/posts/[id] with viewer role (permission denied)",
      method: "PATCH",
      path,
      params: { id: validPostId },
      payload: { title: "Updated Title" },
      caller: { session: currentSession.email, role: currentSession.role },
    });

    const req = new Request(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Title" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: validPostId }) });
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 403, 7, "Status code is 403 Forbidden for viewer role");
    assertTest(body.error?.code === ErrorCode.FORBIDDEN, 7, "Error code is FORBIDDEN");
  }

  // ─── Case 8: PATCH Invalid Payload ───────────────────────────────────────────
  {
    currentSession = sampleAdminSession;
    const path = API_ENDPOINTS.ADMIN.POST(validPostId);
    const invalidPayload = {
      title: "X", // < 3 chars
      slug: "Invalid Slug with spaces",
      content: "Short", // < 10 chars
    };
    logRequest({
      caseNum: 8,
      description: "PATCH /api/admin/posts/[id] with malformed payload (short title, bad slug)",
      method: "PATCH",
      path,
      params: { id: validPostId },
      payload: invalidPayload,
      caller: { session: currentSession.email, role: currentSession.role },
    });

    const req = new Request(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidPayload),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: validPostId }) });
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 400, 8, "Status code is 400 Bad Request");
    assertTest(body.error?.code === ErrorCode.VALIDATION, 8, "Error code is VALIDATION");
    assertTest(!!body.error?.fieldErrors?.title, 8, "title error captured");
    assertTest(!!body.error?.fieldErrors?.slug, 8, "slug error captured");
    assertTest(!!body.error?.fieldErrors?.content, 8, "content error captured");
  }

  // ─── Case 9: PATCH Slug Conflict (409) ────────────────────────────────────────
  {
    const path = API_ENDPOINTS.ADMIN.POST(validPostId);
    logRequest({
      caseNum: 9,
      description: "PATCH /api/admin/posts/[id] causing slug collision (409 Conflict)",
      method: "PATCH",
      path,
      params: { id: validPostId },
      payload: { slug: "conflicting-slug" },
      caller: { session: currentSession.email, role: currentSession.role },
    });

    const req = new Request(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "conflicting-slug" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: validPostId }) });
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 409, 9, "Status code is 409 Conflict");
    assertTest(body.error?.code === ErrorCode.CONFLICT, 9, "Error code is CONFLICT");
    assertTest(!!body.error?.fieldErrors?.slug, 9, "fieldErrors.slug returned on conflict");
  }

  // ─── Case 10: PATCH Happy Path (200 OK) ──────────────────────────────────────
  {
    const path = API_ENDPOINTS.ADMIN.POST(validPostId);
    const updatePayload = {
      title: "Next.js 16 Architecture & Performance Guide (Updated)",
      readTime: "7 min read",
    };
    logRequest({
      caseNum: 10,
      description: "PATCH /api/admin/posts/[id] updates post and increments versionId (200 OK)",
      method: "PATCH",
      path,
      params: { id: validPostId },
      payload: updatePayload,
      caller: { session: currentSession.email, role: currentSession.role },
    });

    const req = new Request(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatePayload),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: validPostId }) });
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 200, 10, "Status code is 200 OK");
    assertTest(body.ok === true, 10, "Envelope ok is true");
    assertTest(body.data?.post?.title === "Next.js 16 Architecture & Performance Guide (Updated)", 10, "Title updated");
    assertTest(body.data?.post?.versionId === 2, 10, "versionId incremented to 2");
  }

  // ─── Case 11: DELETE Author Role Denied (403) ─────────────────────────────────
  {
    currentSession = { ...sampleAdminSession, role: "author" };
    const path = API_ENDPOINTS.ADMIN.POST(validPostId);
    logRequest({
      caseNum: 11,
      description: "DELETE /api/admin/posts/[id] with author role (Editor+ required)",
      method: "DELETE",
      path,
      params: { id: validPostId },
      caller: { session: currentSession.email, role: currentSession.role },
    });

    const req = new Request(`${BASE_URL}${path}`, { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: validPostId }) });
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 403, 11, "Status code is 403 Forbidden for author role");
    assertTest(body.error?.code === ErrorCode.FORBIDDEN, 11, "Error code is FORBIDDEN");
  }

  // ─── Case 12: DELETE 404 Not Found ───────────────────────────────────────────
  {
    currentSession = sampleAdminSession;
    const path = API_ENDPOINTS.ADMIN.POST(nonExistentId);
    logRequest({
      caseNum: 12,
      description: "DELETE /api/admin/posts/[id] for non-existent post",
      method: "DELETE",
      path,
      params: { id: nonExistentId },
      caller: { session: currentSession.email, role: currentSession.role },
    });

    const req = new Request(`${BASE_URL}${path}`, { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: nonExistentId }) });
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 404, 12, "Status code is 404 Not Found");
    assertTest(body.error?.code === ErrorCode.NOT_FOUND, 12, "Error code is NOT_FOUND");
  }

  // ─── Case 13: DELETE Happy Path (200 OK) ─────────────────────────────────────
  {
    const path = API_ENDPOINTS.ADMIN.POST(validPostId);
    logRequest({
      caseNum: 13,
      description: "DELETE /api/admin/posts/[id] deletes post with audit logging (200 OK)",
      method: "DELETE",
      path,
      params: { id: validPostId },
      caller: { session: currentSession.email, role: currentSession.role },
    });

    const req = new Request(`${BASE_URL}${path}`, { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: validPostId }) });
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 200, 13, "Status code is 200 OK");
    assertTest(body.ok === true, 13, "Envelope ok is true");
    assertTest(body.data?.success === true, 13, "success flag is true");
    assertTest(body.message === "Post deleted successfully", 13, "Success message returned");
  }

  // ─── Case 14: DELETE 500 Internal Server Failure ─────────────────────────────
  {
    const crashId = "b5555555-5555-4555-8555-555555555555";
    const path = API_ENDPOINTS.ADMIN.POST(crashId);
    logRequest({
      caseNum: 14,
      description: "DELETE /api/admin/posts/[id] simulated unexpected database failure",
      method: "DELETE",
      path,
      params: { id: crashId },
      caller: { session: currentSession.email, role: currentSession.role },
    });

    const req = new Request(`${BASE_URL}${path}`, { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: crashId }) });
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 500, 14, "Status code is 500 Internal Server Error");
    assertTest(body.ok === false, 14, "Envelope ok is false");
    assertTest(body.error?.code === ErrorCode.INTERNAL, 14, "Error code is INTERNAL");
  }

  // ─── Summary ────────────────────────────────────────────────────────────────
  logSection(`BLACK-BOX VERIFICATION SUMMARY: ${passCount} Passed, ${failCount} Failed`);

  if (failCount > 0) {
    console.error(`\n❌ TEST SUITE FAILED with ${failCount} failed assertions.`);
    process.exit(1);
  } else {
    console.log(`\n✅ ALL ${passCount} BLACK-BOX TEST CASES PASSED WITH 100% SUCCESS.`);
    process.exit(0);
  }
}

runBlackboxSuite().catch((err) => {
  console.error("FATAL ERROR IN BLACK-BOX TEST SUITE:", err);
  process.exit(1);
});
