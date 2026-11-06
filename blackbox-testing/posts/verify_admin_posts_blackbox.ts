/**
 * verify_admin_posts_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for GET & POST /api/admin/posts
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handlers directly (GET, POST from app/api/admin/posts/route).
 * 2. Mandatory request logging (Method, Path, Payload/Query, Caller Context).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix: Origin Check, Auth, Role Authorization (Viewer Denied),
 *    Input Validation, Conflict Handling (Duplicate Slug), Happy Path (GET & POST), and 500 Error Handling.
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import { GET, POST } from "@/app/api/admin/posts/route";
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
  payload?: Record<string, unknown>;
  query?: Record<string, unknown>;
  caller: Record<string, unknown>;
}) {
  console.log(`\n----------------------------------------------------------------------`);
  console.log(`[TEST CASE ${details.caseNum}] ${details.description}`);
  console.log(`Incoming Request:`);
  console.log(`  Method:  ${details.method}`);
  console.log(`  Path:    ${details.path}`);
  if (details.query) console.log(`  Query:   ${JSON.stringify(details.query)}`);
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
  logSection("STARTING HARDCORE BLACK-BOX VERIFICATION: GET & POST /api/admin/posts");

  resetRootContainer();

  const sampleAdminSession = {
    userId: "admin-uuid-1111",
    email: "editor@techsonance.co.in",
    role: "editor",
    site: { id: "site-uuid-1111" },
  };

  const samplePost = {
    id: "post-uuid-2222",
    siteId: "site-uuid-1111",
    slug: "nextjs-16-deep-dive",
    title: "Next.js 16 Deep Dive: Architecture and Performance",
    excerpt: "Exploring Next.js 16 innovations and App Router patterns.",
    content: "Comprehensive overview of server actions, streaming, and caching.",
    status: PostStatus.DRAFT,
    tags: ["nextjs", "react", "architecture"],
    readTime: "5 min read",
    createdBy: "admin-uuid-1111",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let currentSession: any = sampleAdminSession;

  const mockAuthService = {
    getCurrentSession: async () => currentSession,
  };

  const mockPostsService = {
    listPosts: async (options: any) => {
      return {
        posts: [samplePost],
        total: 1,
      };
    },
    createPost: async (data: any, actorId?: string, ipAddress?: string) => {
      if (data.title === "Server Error Post") {
        throw new Error("Simulated storage/database failure");
      }
      if (data.slug === "existing-post") {
        throw new AppError(ErrorCode.CONFLICT, 'A post with slug "existing-post" already exists', {
          fieldErrors: { slug: ["Slug is already taken"] },
        });
      }
      return {
        ...samplePost,
        ...data,
        id: "post-uuid-new-9999",
        siteId: data.siteId || "site-uuid-1111",
        createdBy: actorId || sampleAdminSession.userId,
      };
    },
  };

  const container = getContainer();
  container.bind({ provide: AdminAuthService, useValue: mockAuthService as unknown as AdminAuthService });
  container.bind({ provide: AdminPostsService, useValue: mockPostsService as unknown as AdminPostsService });

  const BASE_URL = "http://localhost:3000";

  // ─── Case 1: GET Unauthenticated ─────────────────────────────────────────────
  {
    currentSession = null;
    logRequest({
      caseNum: 1,
      description: "GET without session cookie / authentication",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.POSTS,
      caller: { auth: "none" },
    });

    const req = new Request(`${BASE_URL}${API_ENDPOINTS.ADMIN.POSTS}`, { method: "GET" });
    const res = await GET(req);
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 401, 1, "Status code is 401 Unauthorized");
    assertTest(body.ok === false, 1, "Envelope ok is false");
    assertTest(body.error?.code === ErrorCode.UNAUTHENTICATED, 1, "Error code is UNAUTHENTICATED");
  }

  // ─── Case 2: GET Forbidden Origin ────────────────────────────────────────────
  {
    currentSession = sampleAdminSession;
    logRequest({
      caseNum: 2,
      description: "GET with forbidden / untrusted origin",
      method: "GET",
      path: API_ENDPOINTS.ADMIN.POSTS,
      caller: { origin: "https://evil-unauthorized-domain.com" },
    });

    const req = new Request(`${BASE_URL}${API_ENDPOINTS.ADMIN.POSTS}`, {
      method: "GET",
      headers: { origin: "https://evil-unauthorized-domain.com" },
    });
    const res = await GET(req);
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 403, 2, "Status code is 403 Forbidden");
    assertTest(body.error?.code === ErrorCode.FORBIDDEN, 2, "Error code is FORBIDDEN");
  }

  // ─── Case 3: GET Invalid Query Parameters ────────────────────────────────────
  {
    logRequest({
      caseNum: 3,
      description: "GET with invalid query parameters (limit out of bounds)",
      method: "GET",
      path: `${API_ENDPOINTS.ADMIN.POSTS}?limit=9999&status=INVALID`,
      query: { limit: 9999, status: "INVALID" },
      caller: { session: sampleAdminSession.email },
    });

    const req = new Request(`${BASE_URL}${API_ENDPOINTS.ADMIN.POSTS}?limit=9999&status=INVALID`, {
      method: "GET",
    });
    const res = await GET(req);
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 400, 3, "Status code is 400 Bad Request");
    assertTest(body.error?.code === ErrorCode.VALIDATION, 3, "Error code is VALIDATION");
    assertTest(!!body.error?.fieldErrors, 3, "Field errors are detailed");
  }

  // ─── Case 4: GET Happy Path (List Posts) ─────────────────────────────────────
  {
    logRequest({
      caseNum: 4,
      description: "GET posts list with pagination and search filter",
      method: "GET",
      path: `${API_ENDPOINTS.ADMIN.POSTS}?status=DRAFT&limit=10&offset=0&search=Nextjs`,
      query: { status: "DRAFT", limit: 10, offset: 0, search: "Nextjs" },
      caller: { session: sampleAdminSession.email, role: sampleAdminSession.role },
    });

    const req = new Request(
      `${BASE_URL}${API_ENDPOINTS.ADMIN.POSTS}?status=DRAFT&limit=10&offset=0&search=Nextjs`,
      { method: "GET" },
    );
    const res = await GET(req);
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 200, 4, "Status code is 200 OK");
    assertTest(body.ok === true, 4, "Envelope ok is true");
    assertTest(Array.isArray(body.data?.posts), 4, "data.posts is an array");
    assertTest(body.data?.total === 1, 4, "data.total is returned accurately");
    assertTest(res.headers.get("x-request-id") !== null, 4, "x-request-id header is injected");
  }

  // ─── Case 5: POST Unauthenticated ────────────────────────────────────────────
  {
    currentSession = null;
    logRequest({
      caseNum: 5,
      description: "POST without session / unauthenticated",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.POSTS,
      payload: { title: "Test", slug: "test", content: "Valid content string" },
      caller: { auth: "none" },
    });

    const req = new Request(`${BASE_URL}${API_ENDPOINTS.ADMIN.POSTS}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test", slug: "test", content: "Valid content string" }),
    });
    const res = await POST(req);
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 401, 5, "Status code is 401 Unauthorized");
    assertTest(body.error?.code === ErrorCode.UNAUTHENTICATED, 5, "Error code is UNAUTHENTICATED");
  }

  // ─── Case 6: POST Forbidden Origin ───────────────────────────────────────────
  {
    currentSession = sampleAdminSession;
    logRequest({
      caseNum: 6,
      description: "POST with foreign origin",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.POSTS,
      payload: { title: "Test", slug: "test", content: "Valid content string" },
      caller: { origin: "https://attacker.site" },
    });

    const req = new Request(`${BASE_URL}${API_ENDPOINTS.ADMIN.POSTS}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: "https://attacker.site",
      },
      body: JSON.stringify({ title: "Test", slug: "test", content: "Valid content string" }),
    });
    const res = await POST(req);
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 403, 6, "Status code is 403 Forbidden");
    assertTest(body.error?.code === ErrorCode.FORBIDDEN, 6, "Error code is FORBIDDEN");
  }

  // ─── Case 7: POST Viewer Role Denied ─────────────────────────────────────────
  {
    currentSession = {
      ...sampleAdminSession,
      role: "viewer",
    };
    logRequest({
      caseNum: 7,
      description: "POST with viewer role (permission denied)",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.POSTS,
      payload: { title: "Test", slug: "test", content: "Valid content string" },
      caller: { session: currentSession.email, role: currentSession.role },
    });

    const req = new Request(`${BASE_URL}${API_ENDPOINTS.ADMIN.POSTS}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test", slug: "test", content: "Valid content string" }),
    });
    const res = await POST(req);
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 403, 7, "Status code is 403 Forbidden for viewer role");
    assertTest(body.error?.code === ErrorCode.FORBIDDEN, 7, "Error code is FORBIDDEN");
  }

  // ─── Case 8: POST Invalid Payload Validation ─────────────────────────────────
  {
    currentSession = sampleAdminSession;
    const invalidPayload = {
      title: "X", // < 3 chars
      slug: "Invalid Slug With Spaces", // regex fail
      content: "Short", // < 10 chars
    };
    logRequest({
      caseNum: 8,
      description: "POST with invalid payload (short title, malformed slug)",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.POSTS,
      payload: invalidPayload,
      caller: { session: currentSession.email, role: currentSession.role },
    });

    const req = new Request(`${BASE_URL}${API_ENDPOINTS.ADMIN.POSTS}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidPayload),
    });
    const res = await POST(req);
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 400, 8, "Status code is 400 Validation Error");
    assertTest(body.error?.code === ErrorCode.VALIDATION, 8, "Error code is VALIDATION");
    assertTest(!!body.error?.fieldErrors?.title, 8, "title error captured");
    assertTest(!!body.error?.fieldErrors?.slug, 8, "slug error captured");
    assertTest(!!body.error?.fieldErrors?.content, 8, "content error captured");
  }

  // ─── Case 9: POST Slug Collision (Duplicate) ─────────────────────────────────
  {
    const duplicatePayload = {
      title: "Existing Post Title",
      slug: "existing-post",
      content: "Valid article content describing a topic with duplicate slug.",
    };
    logRequest({
      caseNum: 9,
      description: "POST with existing slug causing 409 Conflict",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.POSTS,
      payload: duplicatePayload,
      caller: { session: currentSession.email, role: currentSession.role },
    });

    const req = new Request(`${BASE_URL}${API_ENDPOINTS.ADMIN.POSTS}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(duplicatePayload),
    });
    const res = await POST(req);
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 409, 9, "Status code is 409 Conflict");
    assertTest(body.error?.code === ErrorCode.CONFLICT, 9, "Error code is CONFLICT");
    assertTest(!!body.error?.fieldErrors?.slug, 9, "fieldErrors.slug returned on conflict");
  }

  // ─── Case 10: POST Happy Path ────────────────────────────────────────────────
  {
    const validPostPayload = {
      title: "Next.js 16 Deep Dive: Architecture and Performance",
      slug: "nextjs-16-deep-dive",
      excerpt: "Exploring Next.js 16 innovations and App Router patterns.",
      content: "Comprehensive overview of server actions, streaming, and caching.",
      tags: ["nextjs", "react", "architecture"],
      readTime: "5 min read",
      status: PostStatus.DRAFT,
    };
    logRequest({
      caseNum: 10,
      description: "POST new post successfully (201 Created)",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.POSTS,
      payload: validPostPayload,
      caller: { session: currentSession.email, role: currentSession.role },
    });

    const req = new Request(`${BASE_URL}${API_ENDPOINTS.ADMIN.POSTS}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPostPayload),
    });
    const res = await POST(req);
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 201, 10, "Status code is 201 Created");
    assertTest(body.ok === true, 10, "Envelope ok is true");
    assertTest(body.data?.post?.slug === "nextjs-16-deep-dive", 10, "Created post slug matches");
    assertTest(body.data?.post?.id !== undefined, 10, "Created post id is present");
  }

  // ─── Case 11: POST Internal Server Error ─────────────────────────────────────
  {
    const crashPayload = {
      title: "Server Error Post",
      slug: "server-error-post",
      content: "Content that triggers internal simulated storage error.",
    };
    logRequest({
      caseNum: 11,
      description: "POST with simulated database failure (500 Internal Server Error)",
      method: "POST",
      path: API_ENDPOINTS.ADMIN.POSTS,
      payload: crashPayload,
      caller: { session: currentSession.email, role: currentSession.role },
    });

    const req = new Request(`${BASE_URL}${API_ENDPOINTS.ADMIN.POSTS}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(crashPayload),
    });
    const res = await POST(req);
    const body = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 500, 11, "Status code is 500 Internal Server Error");
    assertTest(body.ok === false, 11, "Envelope ok is false");
    assertTest(body.error?.code === ErrorCode.INTERNAL, 11, "Error code is INTERNAL");
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
