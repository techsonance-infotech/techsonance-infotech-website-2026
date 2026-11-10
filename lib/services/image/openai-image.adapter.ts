import "server-only";
import { getEnv } from "@/lib/env";
import type { KeyBrokerService } from "../ai/key-broker.service";
import { logger } from "@/lib/logger";

export class OpenAIImageAdapter {
  readonly name = "openai";
  readonly defaultModel = "dall-e-3";

  constructor(private keyBroker?: KeyBrokerService) {}

  async isConfigured(): Promise<boolean> {
    if (this.keyBroker) {
      const hasDb = await this.keyBroker.hasActiveCredential("openai");
      if (hasDb) return true;
    }
    return !!getEnv().OPENAI_API_KEY;
  }

  async generateImage(
    prompt: string,
    options: { width?: number; height?: number; model?: string } = {},
  ): Promise<Buffer> {
    let apiKey: string | undefined;
    let credentialId: string | undefined;
    const model = options.model || this.defaultModel;

    // 1. Prioritize database credential vault via KeyBrokerService
    if (this.keyBroker) {
      try {
        const claimed = await this.keyBroker.claimKey("openai");
        if (claimed) {
          apiKey = claimed.key.trim();
          credentialId = claimed.credentialId;
        }
      } catch (err) {
        logger.warn("OpenAIImageAdapter: DB key claim failed, trying env", {
          error: String(err),
        });
      }
    }

    // 2. Hybrid Fallback: environment variables
    if (!apiKey) {
      apiKey = getEnv().OPENAI_API_KEY;
    }

    if (!apiKey) {
      throw new Error(
        "OpenAI API key not configured (missing in database and OPENAI_API_KEY environment)",
      );
    }

    // DALL-E 3 supports 1792x1024 (16:9 widescreen), 1024x1024, or 1024x1792
    const size = model === "dall-e-3" ? "1792x1024" : "1024x1024";

    const payload: Record<string, unknown> = {
      model,
      prompt,
      n: 1,
      size,
    };

    if (model === "dall-e-3") {
      payload.quality = "standard";
    }

    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      if (this.keyBroker && credentialId) {
        const failureKind =
          res.status === 401 || res.status === 403
            ? "AUTH_FAILED"
            : res.status === 429
              ? "RATE_LIMITED"
              : "PROVIDER_DOWN";
        await this.keyBroker.reportFailure("openai", credentialId, failureKind, {
          errorMessage: errText,
        });
      }
      throw new Error(`OpenAI DALL-E error (${res.status}): ${errText}`);
    }

    if (this.keyBroker && credentialId) {
      await this.keyBroker.reportSuccess(credentialId);
    }

    const json = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
    const b64 = json.data?.[0]?.b64_json;
    if (b64) {
      return Buffer.from(b64, "base64");
    }

    const imgUrl = json.data?.[0]?.url;
    if (imgUrl) {
      const imgRes = await fetch(imgUrl, { signal: AbortSignal.timeout(20000) });
      if (imgRes.ok) {
        return Buffer.from(await imgRes.arrayBuffer());
      }
    }

    throw new Error("OpenAI DALL-E did not return valid image content");
  }
}
