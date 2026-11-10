import "server-only";
import { getEnv } from "@/lib/env";
import type { KeyBrokerService } from "../ai/key-broker.service";
import { logger } from "@/lib/logger";

export class GeminiImageAdapter {
  readonly name = "gemini";
  readonly defaultModel = "models/imagen-3.0-generate-002";

  constructor(private keyBroker?: KeyBrokerService) {}

  async isConfigured(): Promise<boolean> {
    if (this.keyBroker) {
      const hasDb = await this.keyBroker.hasActiveCredential("gemini");
      if (hasDb) return true;
    }
    return !!getEnv().GEMINI_API_KEY;
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
        const claimed = await this.keyBroker.claimKey("gemini");
        if (claimed) {
          apiKey = claimed.key.trim();
          credentialId = claimed.credentialId;
        }
      } catch (err) {
        logger.warn("GeminiImageAdapter: DB key claim failed, trying env", {
          error: String(err),
        });
      }
    }

    // 2. Hybrid Fallback: environment variables
    if (!apiKey) {
      apiKey = getEnv().GEMINI_API_KEY;
    }

    if (!apiKey) {
      throw new Error(
        "Gemini API key not configured (missing in database and GEMINI_API_KEY environment)",
      );
    }

    const cleanModel = model.replace(/^models\//, "");

    // 3. Try predict endpoint (Imagen 3 standard REST endpoint)
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:predict`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "16:9",
            outputOptions: { mimeType: "image/jpeg" },
          },
        }),
        signal: AbortSignal.timeout(35000),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
        };
        const b64 = data.predictions?.[0]?.bytesBase64Encoded;
        if (b64) {
          if (this.keyBroker && credentialId) {
            await this.keyBroker.reportSuccess(credentialId);
          }
          return Buffer.from(b64, "base64");
        }
      }
    } catch {
      // Fall through to multimodal generateContent endpoint
    }

    // 4. Fallback: Multimodal generateContent (Gemini Flash Image)
    const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`;
    const genRes = await fetch(genUrl, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `Generate a 16:9 landscape editorial illustration for: ${prompt}` }],
          },
        ],
      }),
      signal: AbortSignal.timeout(35000),
    });

    if (!genRes.ok) {
      const errText = await genRes.text().catch(() => "Unknown error");
      if (this.keyBroker && credentialId) {
        const failureKind =
          genRes.status === 401 || genRes.status === 403
            ? "AUTH_FAILED"
            : genRes.status === 429
              ? "RATE_LIMITED"
              : "PROVIDER_DOWN";
        await this.keyBroker.reportFailure("gemini", credentialId, failureKind, {
          errorMessage: errText,
        });
      }
      throw new Error(`Google Gemini Image error (${genRes.status}): ${errText}`);
    }

    if (this.keyBroker && credentialId) {
      await this.keyBroker.reportSuccess(credentialId);
    }

    const genData = (await genRes.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inline_data?: { mime_type: string; data: string };
            text?: string;
          }>;
        };
      }>;
    };

    const parts = genData.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inline_data?.data) {
        return Buffer.from(part.inline_data.data, "base64");
      }
    }

    throw new Error("Google Gemini Image did not return valid image parts");
  }
}
