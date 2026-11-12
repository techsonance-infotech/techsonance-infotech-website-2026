import "server-only";
import { getEnv } from "@/lib/env";
import type { KeyBrokerService } from "../ai/key-broker.service";
import { logger } from "@/lib/logger";

export class GeminiImageAdapter {
  readonly name = "gemini";
  readonly defaultModel = "models/gemini-3.1-flash-image";

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
    let claimedModel: string | undefined;

    // 1. Prioritize database credential vault via KeyBrokerService
    if (this.keyBroker) {
      try {
        const claimed = await this.keyBroker.claimKey("gemini");
        if (claimed) {
          apiKey = claimed.key.trim();
          credentialId = claimed.credentialId;
          if (
            claimed.model &&
            (claimed.model.includes("image") ||
              claimed.model.includes("imagen") ||
              claimed.model.includes("nano-banana"))
          ) {
            claimedModel = claimed.model.trim();
          }
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

    const model = options.model || claimedModel || this.defaultModel;
    const cleanModel = model.replace(/^models\//, "");

    // 3. Try predict endpoint ONLY when explicitly targeting an Imagen model
    if (cleanModel.startsWith("imagen")) {
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
    }

    // 4. Multimodal generateContent using the configured Gemini image model (fallback if predict wasn't used)
    const targetGenModel = cleanModel.startsWith("imagen") ? "gemini-3.1-flash-image" : cleanModel;
    const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetGenModel}:generateContent`;
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
      const cleanMessage = parseGeminiErrorMessage(genRes.status, errText);
      throw new Error(cleanMessage);
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

function parseGeminiErrorMessage(status: number, rawText: string): string {
  try {
    const data = JSON.parse(rawText) as {
      error?: { message?: string; status?: string; code?: number };
    };
    const msg = data.error?.message;
    if (msg) {
      if (
        status === 429 ||
        data.error?.status === "RESOURCE_EXHAUSTED" ||
        msg.includes("Quota exceeded")
      ) {
        return "Google Gemini (429): Quota limit reached on Free Tier (RESOURCE_EXHAUSTED)";
      }
      const firstLine = msg.split("\n")[0]?.trim() || msg;
      return `Google Gemini (${status}): ${firstLine.slice(0, 150)}`;
    }
  } catch {
    // raw fallback
  }
  return `Google Gemini (${status}): ${rawText.replace(/\s+/g, " ").slice(0, 150)}`;
}
