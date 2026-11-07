import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/admin/media/upload/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { MediaService } from "@/lib/services/media.service";
import { ErrorCode } from "@/lib/errors";
import { MEDIA_ERRORS, MEDIA_LIMITS } from "@/lib/constants/media.constants";

describe("POST /api/admin/media/upload — Black Box Integration Tests", () => {
  let mockAuthService: any;
  let mockMediaService: any;

  const sampleAdminSession = {
    userId: "admin-uuid-1111",
    email: "editor@techsonance.co.in",
    role: "editor",
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

  beforeEach(() => {
    resetRootContainer();

    mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(sampleAdminSession),
    };

    mockMediaService = {
      uploadImage: vi.fn().mockImplementation(async (buffer: Buffer, options: any) => {
        return {
          secureUrl: "https://res.cloudinary.com/demo/image/upload/v1234/sample.jpg",
          publicId: `${options.folder || "blog/media"}/sample_public_id`,
          format: "jpg",
          width: 1200,
          height: 630,
          bytes: buffer.length,
        };
      }),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService });
    container.bind({ provide: MediaService, useValue: mockMediaService });
  });

  it("1. Rejects unauthenticated request with 401 UNAUTHENTICATED", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const formData = new FormData();
    formData.append("file", new Blob([validJpegBuffer], { type: "image/jpeg" }), "hero.jpg");

    const req = new Request("http://localhost:3000/api/admin/media/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    expect(json.error.message).toBe(MEDIA_ERRORS.UNAUTHORIZED);
  });

  it("2. Rejects untrusted foreign origin with 403 FORBIDDEN", async () => {
    const formData = new FormData();
    formData.append("file", new Blob([validJpegBuffer], { type: "image/jpeg" }), "hero.jpg");

    const req = new Request("http://localhost:3000/api/admin/media/upload", {
      method: "POST",
      headers: {
        origin: "https://malicious-external-site.com",
      },
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(MEDIA_ERRORS.FORBIDDEN_ORIGIN);
  });

  it("3. Rejects viewer role with 403 FORBIDDEN (Author+ required)", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      ...sampleAdminSession,
      role: "viewer",
    });

    const formData = new FormData();
    formData.append("file", new Blob([validJpegBuffer], { type: "image/jpeg" }), "hero.jpg");

    const req = new Request("http://localhost:3000/api/admin/media/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(MEDIA_ERRORS.FORBIDDEN_ROLE);
  });

  it("4. Rejects request without file with 400 BAD_REQUEST", async () => {
    const formData = new FormData();
    formData.append("folder", "blog/thumbnails");

    const req = new Request("http://localhost:3000/api/admin/media/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.BAD_REQUEST);
    expect(json.error.message).toBe(MEDIA_ERRORS.NO_FILE_PROVIDED);
  });

  it("5. Rejects file exceeding 10MB limit with 413 PAYLOAD_TOO_LARGE", async () => {
    const largeBlob = new Blob([new Uint8Array(MEDIA_LIMITS.MAX_FILE_BYTES + 1024)], {
      type: "image/jpeg",
    });
    const formData = new FormData();
    formData.append("file", largeBlob, "oversized.jpg");

    const req = new Request("http://localhost:3000/api/admin/media/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(413);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.PAYLOAD_TOO_LARGE);
    expect(json.error.message).toBe(MEDIA_ERRORS.FILE_TOO_LARGE);
  });

  it("6. Rejects unsupported MIME type (application/pdf) with 415 UNSUPPORTED_MEDIA", async () => {
    const formData = new FormData();
    formData.append("file", new Blob(["%PDF-1.4 file content"], { type: "application/pdf" }), "doc.pdf");

    const req = new Request("http://localhost:3000/api/admin/media/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(415);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNSUPPORTED_MEDIA);
    expect(json.error.message).toBe(MEDIA_ERRORS.UNSUPPORTED_MEDIA_TYPE);
  });

  it("7. Rejects executable disguised as JPEG with 415 UNSUPPORTED_MEDIA (magic byte check)", async () => {
    const formData = new FormData();
    formData.append("file", new Blob([fakeExeBuffer], { type: "image/jpeg" }), "trojan.jpg");

    const req = new Request("http://localhost:3000/api/admin/media/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(415);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNSUPPORTED_MEDIA);
    expect(json.error.message).toBe(MEDIA_ERRORS.MAGIC_BYTE_MISMATCH);
  });

  it("8. Successfully uploads valid JPEG image with 201 Created and returns secureUrl", async () => {
    const formData = new FormData();
    formData.append("file", new Blob([validJpegBuffer], { type: "image/jpeg" }), "hero.jpg");
    formData.append("folder", "blog/thumbnails");

    const req = new Request("http://localhost:3000/api/admin/media/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.secureUrl).toBe("https://res.cloudinary.com/demo/image/upload/v1234/sample.jpg");
    expect(json.data.secureUrl).toBeDefined();
    expect(json.data.publicId).toBe("blog/thumbnails/sample_public_id");
    expect(mockMediaService.uploadImage).toHaveBeenCalled();
  });

  it("9. Successfully uploads valid PNG image with 201 Created", async () => {
    const formData = new FormData();
    formData.append("file", new Blob([validPngBuffer], { type: "image/png" }), "diagram.png");

    const req = new Request("http://localhost:3000/api/admin/media/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.secureUrl).toBeDefined();
  });

  it("10. Successfully uploads valid WebP image with 201 Created", async () => {
    const formData = new FormData();
    formData.append("file", new Blob([validWebpBuffer], { type: "image/webp" }), "banner.webp");

    const req = new Request("http://localhost:3000/api/admin/media/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.secureUrl).toBeDefined();
  });

  it("11. Returns 500 INTERNAL on unexpected upload service crash", async () => {
    mockMediaService.uploadImage.mockRejectedValueOnce(new Error("Cloudinary connection reset"));

    const formData = new FormData();
    formData.append("file", new Blob([validJpegBuffer], { type: "image/jpeg" }), "hero.jpg");

    const req = new Request("http://localhost:3000/api/admin/media/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.INTERNAL);
    expect(json.error.message).toBe(MEDIA_ERRORS.FAILED_UPLOAD_MEDIA);
  });
});
