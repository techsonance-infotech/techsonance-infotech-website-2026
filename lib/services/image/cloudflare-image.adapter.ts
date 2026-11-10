import "server-only";
import { getEnv } from "@/lib/env";
import type { KeyBrokerService } from "../ai/key-broker.service";
import { logger } from "@/lib/logger";

export class CloudflareImageAdapter {
  readonly name = "cloudflare";
  readonly model = "@cf/black-forest-labs/flux-1-schnell";

  constructor(private keyBroker?: KeyBrokerService) {}

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

    const width = options.width ?? 1280;
    const height = options.height ?? 720;
    const targetModel = options.model || claimedModel || this.model;

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${targetModel}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        width,
        height,
        ...(targetModel.includes("schnell") || targetModel.includes("klein")
          ? { num_steps: 4 }
          : {}),
      }),
      signal: AbortSignal.timeout(35000), // 35s timeout
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
      throw new Error(`Cloudflare AI image error (${res.status}): ${errText}`);
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
