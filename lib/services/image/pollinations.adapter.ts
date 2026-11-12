import "server-only";
import type { KeyBrokerService } from "../ai/key-broker.service";
import { logger } from "@/lib/logger";

export class PollinationsImageAdapter {
  readonly name = "pollinations";
  readonly defaultModel = "black-forest-labs/flux.1-schnell";

  constructor(private keyBroker?: KeyBrokerService) {}

  async generateImage(
    prompt: string,
    options: {
      width?: number;
      height?: number;
      apiKey?: string;
      model?: string;
    } = {},
  ): Promise<Buffer> {
    const width = options.width ?? 1280;
    const height = options.height ?? 720;

    let apiKey = options.apiKey;
    let credentialId: string | undefined;
    let claimedModel: string | undefined;

    if (!apiKey && this.keyBroker) {
      try {
        const claimed = await this.keyBroker.claimKey("pollinations");
        if (claimed) {
          apiKey = claimed.key.trim();
          credentialId = claimed.credentialId;
          claimedModel = claimed.model?.trim();
        }
      } catch (err) {
        logger.warn("PollinationsImageAdapter: DB key claim failed, trying anonymous fallback", {
          error: String(err),
        });
      }
    }

    const primaryModel = options.model || claimedModel || this.defaultModel;
    const genModelsToTry =
      primaryModel === this.defaultModel ? [primaryModel] : [primaryModel, this.defaultModel];

    const seed = Math.floor(Math.random() * 9999999);

    // 1. Try gen.pollinations.ai (with API key when registered; falls back to defaultModel if configured model is stale)
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    for (const model of genModelsToTry) {
      try {
        const url = `https://gen.pollinations.ai/image/${encodeURIComponent(
          prompt,
        )}?model=${encodeURIComponent(model)}&width=${width}&height=${height}&nologo=true&enhance=false&private=true&seed=${seed}`;

        const res = await fetch(url, {
          method: "GET",
          headers,
          signal: AbortSignal.timeout(25000),
        });

        if (res.ok) {
          if (this.keyBroker && credentialId) {
            await this.keyBroker.reportSuccess(credentialId);
          }
          const arrayBuf = await res.arrayBuffer();
          return this.cleanWatermark(Buffer.from(arrayBuf), width, height);
        }
      } catch {
        // Try next gen.pollinations.ai model or fall through to open endpoint
      }
    }

    // 2. Open Pollinations fallback endpoint chain
    const modelsToTry: (string | undefined)[] = ["flux", "z-image-turbo", undefined];

    for (const fbModel of modelsToTry) {
      try {
        const modelQuery = fbModel ? `&model=${encodeURIComponent(fbModel)}` : "";
        const openUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          prompt,
        )}?width=${width}&height=${height}&nologo=true&enhance=false&private=true&seed=${seed}${modelQuery}`;

        const openRes = await fetch(openUrl, {
          method: "GET",
          signal: AbortSignal.timeout(25000),
        });

        if (openRes.ok) {
          const arrayBuf = await openRes.arrayBuffer();
          return this.cleanWatermark(Buffer.from(arrayBuf), width, height);
        }
      } catch {
        // Try next fallback model
      }
    }

    throw new Error("Pollinations.ai generation exhausted all model fallbacks");
  }

  /**
   * Automatically strips free-tier watermark stamps from the bottom edge
   * and resizes cleanly to the target 16:9 aspect ratio.
   */
  private async cleanWatermark(
    rawBuffer: Buffer,
    targetWidth: number,
    targetHeight: number,
  ): Promise<Buffer> {
    try {
      const sharp = (await import("sharp")).default;
      const meta = await sharp(rawBuffer).metadata();
      const currentWidth = meta.width || targetWidth;
      const currentHeight = meta.height || targetHeight;
      const cropHeight = Math.floor(currentHeight * 0.94);

      return await sharp(rawBuffer)
        .extract({ left: 0, top: 0, width: currentWidth, height: cropHeight })
        .resize(targetWidth, targetHeight, { fit: "cover" })
        .jpeg({ quality: 92 })
        .toBuffer();
    } catch {
      return rawBuffer;
    }
  }
}
