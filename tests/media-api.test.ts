import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { uploadMediaAsset } from "@/lib/api/media.api";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

describe("uploadMediaAsset client API", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("successfully uploads a media file with custom folder", async () => {
    const mockFile = new File(["dummy image content"], "hero.png", { type: "image/png" });
    const mockResponse = {
      ok: true,
      data: {
        secureUrl: "https://res.cloudinary.com/demo/image/upload/hero.png",
        publicId: "blog/thumbnails/hero",
        format: "png",
        width: 1200,
        height: 630,
        bytes: 1024,
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
    } as unknown as Response);

    const result = await uploadMediaAsset(mockFile, "blog/thumbnails");

    expect(global.fetch).toHaveBeenCalledWith(
      API_ENDPOINTS.ADMIN.MEDIA_UPLOAD,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );

    expect(result.secureUrl).toBe("https://res.cloudinary.com/demo/image/upload/hero.png");
    expect(result.publicId).toBe("blog/thumbnails/hero");
    expect(result.format).toBe("png");
  });

  it("falls back to flat properties if data envelope is not present", async () => {
    const mockFile = new File(["dummy content"], "avatar.jpg", { type: "image/jpeg" });
    const mockResponse = {
      ok: true,
      secureUrl: "https://res.cloudinary.com/demo/image/upload/avatar.jpg",
      publicId: "avatars/user-1",
      format: "jpg",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
    } as unknown as Response);

    const result = await uploadMediaAsset(mockFile);

    expect(result.secureUrl).toBe("https://res.cloudinary.com/demo/image/upload/avatar.jpg");
    expect(result.publicId).toBe("avatars/user-1");
  });

  it("throws an error when server returns !response.ok", async () => {
    const mockFile = new File(["dummy"], "bad.exe", { type: "application/x-msdownload" });
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({
        ok: false,
        error: { message: "Magic byte inspection failed" },
      }),
    } as unknown as Response);

    await expect(uploadMediaAsset(mockFile)).rejects.toThrow("Magic byte inspection failed");
  });
});
