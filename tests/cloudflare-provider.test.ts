import { describe, it, expect, vi } from "vitest";
import { CloudflareProvider } from "@/lib/llm/providers/cloudflare.provider";
import { AiProviderId } from "@/lib/constants/enums/ai.enum";

describe("CloudflareProvider - Dual Purpose LLM Provider", () => {
  it("should initialize with id, default model and parsed account ID from apiKey string", () => {
    const provider = new CloudflareProvider({
      id: AiProviderId.CLOUDFLARE,
      apiKey: "3a4f89b21c4e70d1891a238f4560b21a:secret-api-token-value",
      model: "@cf/meta/llama-3.3-70b-instruct",
    });

    expect(provider.id).toBe("cloudflare");
    expect(provider.enabled()).toBe(true);
  });

  it("should support JSON string credentials with accountId and apiToken", () => {
    const provider = new CloudflareProvider({
      id: AiProviderId.CLOUDFLARE,
      apiKey: JSON.stringify({
        accountId: "my-cf-acc-id",
        apiToken: "my-cf-token",
      }),
      model: "@cf/meta/llama-3.1-8b-instruct",
    });

    expect(provider.enabled()).toBe(true);
  });

  it("should create a derived provider with withApiKey and model override", () => {
    const base = new CloudflareProvider({
      id: AiProviderId.CLOUDFLARE,
      accountId: "acc-123",
      apiKey: "base-token",
      model: "@cf/meta/llama-3.1-8b-instruct",
    });

    const derived = base.withApiKey(
      "acc-456:new-token-abc",
      "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
    );

    expect(derived.enabled()).toBe(true);
  });

  it("should report disabled if accountId or token is missing", () => {
    const provider = new CloudflareProvider({
      id: AiProviderId.CLOUDFLARE,
      apiKey: "",
      accountId: "",
    });

    expect(provider.enabled()).toBe(false);
  });
});
