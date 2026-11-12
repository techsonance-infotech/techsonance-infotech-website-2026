import "server-only";
import { getEnv } from "@/lib/env";
import type { KeyBrokerService } from "../ai/key-broker.service";
import { logger } from "@/lib/logger";

export class CloudflareImageAdapter {
  readonly name = "cloudflare";
  readonly model = "@cf/leonardo/lucid-origin";

  constructor(private keyBroker?: KeyBrokerService) {}

  async isConfigured(): Promise<boolean> {
    if (this.keyBroker) {
      const hasDb = await this.keyBroker.hasActiveCredential("cloudflare");
      if (hasDb) return true;
    }
    const env = getEnv();
    return !!(env.CF_ACCOUNT_ID && env.CF_API_TOKEN);
  }

  async generateImage(
    prompt: string,
    options: { width?: number; height?: number; model?: string } = {},
  ): Promise<Buffer> {
    let accountId: string | undefined;
    let apiToken: string | undefined;
    let credentialId: string | undefined;
    let claimedModel: string | undefined;

    // 1. Prioritize database credential vault via KeyBrokerService
    if (this.keyBroker) {
      try {
        const claimed = await this.keyBroker.claimKey("cloudflare");
        if (claimed) {
          credentialId = claimed.credentialId;
          claimedModel = claimed.model;
          const rawKey = claimed.key.trim();
          if (rawKey.startsWith("{")) {
            try {
              const parsed = JSON.parse(rawKey) as {
                accountId?: string;
                apiToken?: string;
                CF_ACCOUNT_ID?: string;
                CF_API_TOKEN?: string;
              };
              accountId = parsed.accountId || parsed.CF_ACCOUNT_ID;
              apiToken = parsed.apiToken || parsed.CF_API_TOKEN;
            } catch {
              // Parse error, ignore
            }
          } else if (rawKey.includes(":")) {
            const parts = rawKey.split(":");
            accountId = parts[0]?.trim();
            apiToken = parts.slice(1).join(":")?.trim();
          } else {
            apiToken = rawKey;
          }
        }
      } catch (err) {
        logger.warn("CloudflareImageAdapter: DB key claim failed, trying env", {
          error: String(err),
        });
      }
    }

    // 2. Hybrid Fallback: environment variables
    if (!accountId || !apiToken) {
      const env = getEnv();
      accountId = accountId || env.CF_ACCOUNT_ID;
      apiToken = apiToken || env.CF_API_TOKEN;
    }

    if (!accountId || !apiToken) {
      throw new Error(
        "Cloudflare AI credentials not configured (Account ID or API Token missing in database and environment)",
      );
    }

    // Normalize accountId (lowercase and whitespace trim only; bad characters are caught by validation)
    accountId = accountId.toLowerCase().trim();
    apiToken = apiToken.trim();

    const targetModel = options.model || claimedModel || this.model;

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${targetModel}`;

    // Cloudflare Workers AI schema payload adaptation:
    // - FLUX.2 models (flux-2-dev, flux-2-klein-9b, flux-2-klein-4b) require multipart/form-data (FormData)
    // - FLUX.1 [schnell] strictly accepts JSON: { prompt: string, steps?: number }
    // - Other diffusion models (Leonardo / SDXL) accept JSON: { prompt, width, height, num_steps, guidance }
    const isFlux2Multipart =
      targetModel.includes("flux-2") || targetModel.includes("klein");

    let fetchHeaders: Record<string, string>;
    let fetchBody: FormData | string;

    if (isFlux2Multipart) {
      const form = new FormData();
      form.append("prompt", prompt);
      form.append("width", String(Math.min(options.width ?? 1280, 1920)));
      form.append("height", String(Math.min(options.height ?? 720, 1920)));
      if (targetModel.includes("flux-2-dev")) {
        form.append("steps", "25");
      }
      // Omit Content-Type so fetch automatically sets the multipart boundary header
      fetchHeaders = {
        Authorization: `Bearer ${apiToken}`,
      };
      fetchBody = form;
    } else {
      let requestBody: Record<string, unknown>;
      if (targetModel.includes("flux-1-schnell")) {
        requestBody = {
          prompt,
          steps: 4,
        };
      } else {
        const width = options.width ?? 1280;
        const height = options.height ?? 720;
        const isLeonardo =
          targetModel.includes("leonardo") ||
          targetModel.includes("lucid") ||
          targetModel.includes("phoenix");
        requestBody = {
          prompt,
          width,
          height,
          ...(isLeonardo
            ? { num_steps: 25, guidance: 4.5 }
            : targetModel.includes("schnell")
              ? { steps: 4 }
              : { num_steps: 20 }),
        };
      }
      fetchHeaders = {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      };
      fetchBody = JSON.stringify(requestBody);
    }

    const res = await fetch(url, {
      method: "POST",
      headers: fetchHeaders,
      body: fetchBody,
      signal: AbortSignal.timeout(45000), // 45s timeout
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
        await this.keyBroker.reportFailure("cloudflare", credentialId, failureKind, {
          errorMessage: errText,
        });
      }
      const cleanMessage = parseCloudflareErrorMessage(res.status, errText);
      throw new Error(cleanMessage);
    }

    // Report success to update usage and keep account healthy
    if (this.keyBroker && credentialId) {
      await this.keyBroker.reportSuccess(credentialId);
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      if (data.result?.image) {
        return Buffer.from(data.result.image, "base64");
      }
      throw new Error("Unexpected JSON format from Cloudflare AI image response");
    }

    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }
}

function parseCloudflareErrorMessage(status: number, rawText: string): string {
  try {
    const data = JSON.parse(rawText) as { errors?: Array<{ message?: string; code?: number }> };
    const firstErr = data.errors?.[0];
    if (firstErr?.message) {
      return `Cloudflare AI (${status}): ${firstErr.message}${firstErr.code ? ` (code ${firstErr.code})` : ""}`;
    }
  } catch {
    // raw fallback
  }
  return `Cloudflare AI (${status}): ${rawText.replace(/\s+/g, " ").slice(0, 150)}`;
}
