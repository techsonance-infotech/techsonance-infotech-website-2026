import "server-only";
import { getEnv } from "@/lib/env";

export class CloudflareImageAdapter {
  readonly name = "cloudflare";
  readonly model = "@cf/black-forest-labs/flux-1-schnell";

  async generateImage(
    prompt: string,
    options: { width?: number; height?: number } = {},
  ): Promise<Buffer> {
    const env = getEnv();
    const accountId = env.CF_ACCOUNT_ID;
    const apiToken = env.CF_API_TOKEN;

    if (!accountId || !apiToken) {
      throw new Error(
        "Cloudflare AI credentials not configured (CF_ACCOUNT_ID or CF_API_TOKEN missing)",
      );
    }

    const width = options.width ?? 1280;
    const height = options.height ?? 720;

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${this.model}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        num_steps: 4,
        width,
        height,
      }),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      throw new Error(`Cloudflare AI image error (${res.status}): ${errText}`);
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
