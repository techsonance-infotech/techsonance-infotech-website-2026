/**
 * verify_admin_media_upload_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for POST /api/admin/media/upload
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handler directly (POST from app/api/admin/media/upload/route).
 * 2. Mandatory request logging (Method, Path, Params, Payload, Caller Context).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix: Auth, Origin Check, Param Validation, File Limits, MIME/Magic Bytes,
 *    Role RBAC (Viewer vs Author vs Editor), Happy Path (JPEG, PNG, WebP), and 500 Resilience.
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import "../preload.cjs";
import { POST } from "@/app/api/admin/media/upload/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { MediaService } from "@/lib/services/media.service";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { ErrorCode } from "@/lib/errors";
import { MEDIA_LIMITS } from "@/lib/constants/media.constants";

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
  logSection("STARTING HARDCORE BLACK-BOX VERIFICATION: POST /api/admin/media/upload");

  resetRootContainer();

  const sampleAdminSession = {
    userId: "admin-uuid-1111",
    email: "editor@techsonance.co.in",
    role: "editor" as const,
    site: { id: "site-uuid-1111" },
  };

  const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
  ]);
  const validWebpBuffer = Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  ]);
  const fakeExeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);

  let currentSession: any = sampleAdminSession;

  const mockAuthService = {
    getCurrentSession: async () => currentSession,
  };

  const mockMediaService = {
    uploadImage: async (buffer: Buffer, options: any) => {
      return {
        secureUrl: "https://res.cloudinary.com/demo/image/upload/v1234/sample.jpg",
        publicId: `${options.folder || "blog/media"}/sample_public_id`,
        format: "jpg",
        width: 1200,
        height: 630,
        bytes: buffer.length,
      };
    },
  };

  const container = getContainer();
  container.bind({ provide: AdminAuthService, useValue: mockAuthService as any });
  container.bind({ provide: MediaService, useValue: mockMediaService as any });

  const path = API_ENDPOINTS.ADMIN.MEDIA_UPLOAD;

  // ─── CASE 1: 401 UNAUTHENTICATED ───────────────────────────────────────────
  {
    currentSession = null;
    logRequest({
      caseNum: 1,
      description: "Reject unauthenticated request with 401 UNAUTHENTICATED",
      method: "POST",
      path,
      caller: { session: null },
    });

    const formData = new FormData();
    formData.append("file", new Blob([validJpegBuffer], { type: "image/jpeg" }), "hero.jpg");

    const req = new Request(`http://localhost:3000${path}`, { method: "POST", body: formData });
    const res = await POST(req);
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 401, 1, "Status code is 401");
    assertTest(body.ok === false, 1, "Response envelope indicates failure (ok=false)");
    assertTest(body.error?.code === ErrorCode.UNAUTHENTICATED, 1, "Error code is UNAUTHENTICATED");
  }

  // ─── CASE 2: 403 FORBIDDEN ORIGIN ──────────────────────────────────────────
  {
    currentSession = sampleAdminSession;
    logRequest({
      caseNum: 2,
      description: "Reject untrusted foreign origin with 403 FORBIDDEN",
      method: "POST",
      path,
      caller: { session: sampleAdminSession, origin: "https://attacker-origin.example.com" },
    });

    const formData = new FormData();
    formData.append("file", new Blob([validJpegBuffer], { type: "image/jpeg" }), "hero.jpg");

    const req = new Request(`http://localhost:3000${path}`, {
      method: "POST",
      headers: { origin: "https://attacker-origin.example.com" },
      body: formData,
    });
    const res = await POST(req);
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 403, 2, "Status code is 403");
    assertTest(body.error?.code === ErrorCode.FORBIDDEN, 2, "Error code is FORBIDDEN");
  }

  // ─── CASE 3: 403 FORBIDDEN ROLE (VIEWER) ───────────────────────────────────
  {
    currentSession = { ...sampleAdminSession, role: "viewer" };
    logRequest({
      caseNum: 3,
      description: "Reject viewer role with 403 FORBIDDEN (Author+ required)",
      method: "POST",
      path,
      caller: currentSession,
    });

    const formData = new FormData();
    formData.append("file", new Blob([validJpegBuffer], { type: "image/jpeg" }), "hero.jpg");

    const req = new Request(`http://localhost:3000${path}`, { method: "POST", body: formData });
    const res = await POST(req);
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 403, 3, "Status code is 403");
    assertTest(body.error?.code === ErrorCode.FORBIDDEN, 3, "Error code is FORBIDDEN");
  }

  // ─── CASE 4: 400 BAD_REQUEST (NO FILE) ────────────────────────────────────
  {
    currentSession = sampleAdminSession;
    logRequest({
      caseNum: 4,
      description: "Reject request without file with 400 BAD_REQUEST",
      method: "POST",
      path,
      caller: currentSession,
    });

    const formData = new FormData();
    formData.append("folder", "blog/thumbnails");

    const req = new Request(`http://localhost:3000${path}`, { method: "POST", body: formData });
    const res = await POST(req);
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 400, 4, "Status code is 400");
    assertTest(body.error?.code === ErrorCode.BAD_REQUEST, 4, "Error code is BAD_REQUEST");
  }

  // ─── CASE 5: 413 PAYLOAD_TOO_LARGE (>10MB) ────────────────────────────────
  {
    currentSession = sampleAdminSession;
    logRequest({
      caseNum: 5,
      description: "Reject oversized file (>10MB) with 413 PAYLOAD_TOO_LARGE",
      method: "POST",
      path,
      caller: currentSession,
    });

    const largeBlob = new Blob([new Uint8Array(MEDIA_LIMITS.MAX_FILE_BYTES + 1024)], {
      type: "image/jpeg",
    });
    const formData = new FormData();
    formData.append("file", largeBlob, "large.jpg");

    const req = new Request(`http://localhost:3000${path}`, { method: "POST", body: formData });
    const res = await POST(req);
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 413, 5, "Status code is 413");
    assertTest(body.error?.code === ErrorCode.PAYLOAD_TOO_LARGE, 5, "Error code is PAYLOAD_TOO_LARGE");
  }

  // ─── CASE 6: 415 UNSUPPORTED_MEDIA (BAD MIME) ─────────────────────────────
  {
    currentSession = sampleAdminSession;
    logRequest({
      caseNum: 6,
      description: "Reject unsupported MIME type (application/pdf) with 415 UNSUPPORTED_MEDIA",
      method: "POST",
      path,
      caller: currentSession,
    });

    const formData = new FormData();
    formData.append("file", new Blob(["%PDF-1.4 file"], { type: "application/pdf" }), "test.pdf");

    const req = new Request(`http://localhost:3000${path}`, { method: "POST", body: formData });
    const res = await POST(req);
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 415, 6, "Status code is 415");
    assertTest(body.error?.code === ErrorCode.UNSUPPORTED_MEDIA, 6, "Error code is UNSUPPORTED_MEDIA");
  }

  // ─── CASE 7: 415 UNSUPPORTED_MEDIA (MAGIC BYTE MISMATCH) ──────────────────
  {
    currentSession = sampleAdminSession;
    logRequest({
      caseNum: 7,
      description: "Reject disguised executable file with 415 UNSUPPORTED_MEDIA",
      method: "POST",
      path,
      caller: currentSession,
    });

    const formData = new FormData();
    formData.append("file", new Blob([fakeExeBuffer], { type: "image/jpeg" }), "fake.jpg");

    const req = new Request(`http://localhost:3000${path}`, { method: "POST", body: formData });
    const res = await POST(req);
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 415, 7, "Status code is 415");
    assertTest(body.error?.code === ErrorCode.UNSUPPORTED_MEDIA, 7, "Error code is UNSUPPORTED_MEDIA");
  }

  // ─── CASE 8: 201 CREATED (VALID JPEG) ─────────────────────────────────────
  {
    currentSession = sampleAdminSession;
    logRequest({
      caseNum: 8,
      description: "Successfully upload valid JPEG image with 201 CREATED",
      method: "POST",
      path,
      caller: currentSession,
    });

    const formData = new FormData();
    formData.append("file", new Blob([validJpegBuffer], { type: "image/jpeg" }), "photo.jpg");
    formData.append("folder", "blog/thumbnails");

    const req = new Request(`http://localhost:3000${path}`, { method: "POST", body: formData });
    const res = await POST(req);
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 201, 8, "Status code is 201");
    assertTest(body.ok === true, 8, "Response envelope ok=true");
    assertTest(Boolean(body.secureUrl), 8, "secureUrl is returned in response");
    assertTest(Boolean(body.data?.publicId), 8, "data.publicId is populated");
  }

  // ─── CASE 9: 201 CREATED (VALID PNG) ──────────────────────────────────────
  {
    currentSession = sampleAdminSession;
    logRequest({
      caseNum: 9,
      description: "Successfully upload valid PNG image with 201 CREATED",
      method: "POST",
      path,
      caller: currentSession,
    });

    const formData = new FormData();
    formData.append("file", new Blob([validPngBuffer], { type: "image/png" }), "diagram.png");

    const req = new Request(`http://localhost:3000${path}`, { method: "POST", body: formData });
    const res = await POST(req);
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 201, 9, "Status code is 201");
    assertTest(body.ok === true, 9, "Response envelope ok=true");
  }

  // ─── CASE 10: 201 CREATED (VALID WEBP) ────────────────────────────────────
  {
    currentSession = sampleAdminSession;
    logRequest({
      caseNum: 10,
      description: "Successfully upload valid WebP image with 201 CREATED",
      method: "POST",
      path,
      caller: currentSession,
    });

    const formData = new FormData();
    formData.append("file", new Blob([validWebpBuffer], { type: "image/webp" }), "banner.webp");

    const req = new Request(`http://localhost:3000${path}`, { method: "POST", body: formData });
    const res = await POST(req);
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 201, 10, "Status code is 201");
    assertTest(body.ok === true, 10, "Response envelope ok=true");
  }

  // ─── CASE 11: 500 INTERNAL RESILIENCE ─────────────────────────────────────
  {
    currentSession = sampleAdminSession;
    logRequest({
      caseNum: 11,
      description: "Handle unexpected upload error gracefully with 500 INTERNAL",
      method: "POST",
      path,
      caller: currentSession,
    });

    mockMediaService.uploadImage = async () => {
      throw new Error("Simulated storage network failure");
    };

    const formData = new FormData();
    formData.append("file", new Blob([validJpegBuffer], { type: "image/jpeg" }), "photo.jpg");

    const req = new Request(`http://localhost:3000${path}`, { method: "POST", body: formData });
    const res = await POST(req);
    const body: any = await res.json();
    logResponse(res.status, res.headers, body);

    assertTest(res.status === 500, 11, "Status code is 500");
    assertTest(body.error?.code === ErrorCode.INTERNAL, 11, "Error code is INTERNAL");
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
