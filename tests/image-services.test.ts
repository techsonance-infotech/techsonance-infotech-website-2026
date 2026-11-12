import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetEnv } from "../lib/env";
import { CloudflareImageAdapter } from "../lib/services/image/cloudflare-image.adapter";
import { OpenAIImageAdapter } from "../lib/services/image/openai-image.adapter";
import { GeminiImageAdapter } from "../lib/services/image/gemini-image.adapter";
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

  describe("Model-Specific Payload & Vault Claims", () => {
    it("CloudflareImageAdapter sends FormData (multipart) for FLUX.2 models and JSON for flux-1-schnell", async () => {
      const adapter = new CloudflareImageAdapter();
      vi.stubEnv("CF_ACCOUNT_ID", "acc-123");
      vi.stubEnv("CF_API_TOKEN", "tok-abc");
      resetEnv();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => "image/jpeg" },
        arrayBuffer: async () => Buffer.from("img"),
      });
      global.fetch = mockFetch as any;

      await adapter.generateImage("flux 2 prompt", { model: "@cf/black-forest-labs/flux-2-dev" });
      const firstInit = mockFetch.mock.calls[0][1] as RequestInit;
      expect(firstInit.body).toBeInstanceOf(FormData);
      expect((firstInit.headers as Record<string, string>)["Content-Type"]).toBeUndefined();

      await adapter.generateImage("schnell prompt", {
        model: "@cf/black-forest-labs/flux-1-schnell",
      });
      const secondInit = mockFetch.mock.calls[1][1] as RequestInit;
      expect(typeof secondInit.body).toBe("string");
      expect((secondInit.headers as Record<string, string>)["Content-Type"]).toBe(
        "application/json",
      );
    });

    it("OpenAIImageAdapter uses gpt-image-1.5 (1536x1024) instead of legacy dall-e-3", async () => {
      const mockBroker = {
        claimKey: vi.fn().mockResolvedValue({
          key: "sk-test-123",
          credentialId: "cred-oai-1",
          model: "gpt-image-1.5",
          isFallbackEnv: false,
        }),
        reportSuccess: vi.fn(),
        reportFailure: vi.fn(),
      } as any;

      const adapter = new OpenAIImageAdapter(mockBroker);
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ b64_json: Buffer.from("oai-img").toString("base64") }] }),
      });
      global.fetch = mockFetch as any;

      const out = await adapter.generateImage("modern tech chip");
      expect(out.toString()).toBe("oai-img");

      const payload = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(payload.model).toBe("gpt-image-1.5");
      expect(payload.size).toBe("1536x1024");
      expect(payload.quality).toBe("medium");
    });

    it("GeminiImageAdapter calls generateContent on the configured model instead of hardcoding 2.5-flash", async () => {
      const mockBroker = {
        claimKey: vi.fn().mockResolvedValue({
          key: "AIza-test",
          credentialId: "cred-gem-1",
          model: "models/gemini-3.1-flash-image",
          isFallbackEnv: false,
        }),
        reportSuccess: vi.fn(),
        reportFailure: vi.fn(),
      } as any;

      const adapter = new GeminiImageAdapter(mockBroker);
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ inline_data: { mime_type: "image/jpeg", data: Buffer.from("gem-img").toString("base64") } }],
              },
            },
          ],
        }),
      });
      global.fetch = mockFetch as any;

      const out = await adapter.generateImage("neural mesh");
      expect(out.toString()).toBe("gem-img");
      expect(mockFetch.mock.calls[0][0]).toContain("/models/gemini-3.1-flash-image:generateContent");
    });

    it("PollinationsImageAdapter uses claimed API key and retries default FLUX model when stale DB model fails", async () => {
      const mockBroker = {
        claimKey: vi.fn().mockResolvedValue({
          key: "pl-secret-key",
          credentialId: "cred-pl-1",
          model: "google/gemini-nano-banana-2.1",
          isFallbackEnv: false,
        }),
        reportSuccess: vi.fn(),
      } as any;

      const adapter = new PollinationsImageAdapter(mockBroker);
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 400 })
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => "image/jpeg" },
          arrayBuffer: async () => Buffer.from("pol-flux-img"),
        });
      global.fetch = mockFetch as any;

      const out = await adapter.generateImage("clean cloud visual");
      expect(out.toString()).toBe("pol-flux-img");
      expect(mockFetch.mock.calls[0][0]).toContain("google%2Fgemini-nano-banana-2.1");
      expect(mockFetch.mock.calls[1][0]).toContain("black-forest-labs%2Fflux.1-schnell");
      expect((mockFetch.mock.calls[1][1] as RequestInit).headers).toMatchObject({
        Authorization: "Bearer pl-secret-key",
      });
      expect(mockBroker.reportSuccess).toHaveBeenCalledWith("cred-pl-1");
    });
  });
});
