import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetEnv } from "../lib/env";
import { CloudflareImageAdapter } from "../lib/services/image/cloudflare-image.adapter";
import { PollinationsImageAdapter } from "../lib/services/image/pollinations.adapter";
import { ImageStepService } from "../lib/services/image/image-step.service";
import type { MediaService } from "../lib/services/media.service";

describe("Image Generation & Failover Services", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetEnv();
  });

  describe("CloudflareImageAdapter", () => {
    it("throws an error when CF_ACCOUNT_ID or CF_API_TOKEN is missing", async () => {
      const adapter = new CloudflareImageAdapter();
      vi.stubEnv("CF_ACCOUNT_ID", "");
      vi.stubEnv("CF_API_TOKEN", "");
      resetEnv();

      await expect(adapter.generateImage("tech blog prompt")).rejects.toThrow(
        "Cloudflare AI credentials not configured",
      );
    });

    it("successfully generates and returns an image buffer when API returns binary", async () => {
      const adapter = new CloudflareImageAdapter();
      vi.stubEnv("CF_ACCOUNT_ID", "mock-account-id");
      vi.stubEnv("CF_API_TOKEN", "mock-api-token");
      resetEnv();

      const mockBuffer = Buffer.from("fake-binary-image-data");
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (header: string) => (header === "content-type" ? "image/jpeg" : null),
        },
        arrayBuffer: async () => mockBuffer,
      } as any);

      const result = await adapter.generateImage("clean tech graphic");
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toBe("fake-binary-image-data");
    });
  });

  describe("PollinationsImageAdapter", () => {
    it("successfully fetches image buffer from Pollinations URL", async () => {
      const adapter = new PollinationsImageAdapter();
      const mockBuffer = Buffer.from("pollinations-image-data");

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => "image/jpeg" },
        arrayBuffer: async () => mockBuffer,
      } as any);

      const result = await adapter.generateImage("modern software architecture");
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toBe("pollinations-image-data");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("gen.pollinations.ai/image/"),
        expect.any(Object),
      );
    });
  });

  describe("ImageStepService (Orchestrator & Fallback Chain)", () => {
    it("uses Cloudflare as primary and uploads result to Cloudinary", async () => {
      const mockMediaService = {
        uploadImage: vi.fn().mockResolvedValue({
          secureUrl: "https://res.cloudinary.com/demo/image/upload/sample.webp",
          publicId: "sample",
        }),
      } as unknown as MediaService;

      const service = new ImageStepService(mockMediaService);

      // Mock Cloudflare success
      (service as any).cfAdapter.generateImage = vi.fn().mockResolvedValue(Buffer.from("cf-img"));

      const res = await service.generateThumbnail("distributed systems", {
        title: "Microservices 101",
      });

      expect(res.provider).toBe("cloudflare");
      expect(res.thumbnailMissing).toBe(false);
      expect(res.url).toBe("https://res.cloudinary.com/demo/image/upload/sample.webp");
      expect(res.alt).toContain("Microservices 101");
      expect(mockMediaService.uploadImage).toHaveBeenCalled();
    });

    it("falls back to Pollinations when Cloudflare throws an error", async () => {
      const mockMediaService = {
        uploadImage: vi.fn().mockResolvedValue({
          secureUrl: "https://res.cloudinary.com/demo/image/upload/fallback.webp",
          publicId: "fallback",
        }),
      } as unknown as MediaService;

      const service = new ImageStepService(mockMediaService);

      // Cloudflare is configured but fails
      (service as any).cfAdapter.isConfigured = vi.fn().mockResolvedValue(true);
      (service as any).cfAdapter.generateImage = vi
        .fn()
        .mockRejectedValue(new Error("Cloudflare rate limit exceeded"));

      // Pollinations is configured and succeeds
      (service as any).pollinationsAdapter.generateImage = vi
        .fn()
        .mockResolvedValue(Buffer.from("pollinations-img"));

      vi.stubEnv("ENABLE_POLLINATIONS_FALLBACK", "true");

      const res = await service.generateThumbnail("cloud scalability");

      expect(res.provider).toBe("pollinations");
      expect(res.thumbnailMissing).toBe(false);
      expect(res.url).toBe("https://res.cloudinary.com/demo/image/upload/fallback.webp");
    });

    it("falls back to branded placeholder when both providers fail", async () => {
      const mockMediaService = {
        uploadImage: vi.fn(),
      } as unknown as MediaService;

      const service = new ImageStepService(mockMediaService);

      (service as any).cfAdapter.generateImage = vi.fn().mockRejectedValue(new Error("CF failed"));
      (service as any).pollinationsAdapter.generateImage = vi
        .fn()
        .mockRejectedValue(new Error("Pollinations failed"));

      const res = await service.generateThumbnail("quantum computing");

      expect(res.thumbnailMissing).toBe(true);
      expect(res.provider).toBe("fallback-card");
      expect(res.url).toBe("/images/blog/default-hero.jpg");
      expect(mockMediaService.uploadImage).not.toHaveBeenCalled();
    });
  });
});
