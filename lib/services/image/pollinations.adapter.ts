import "server-only";

export class PollinationsImageAdapter {
  readonly name = "pollinations";
  readonly defaultModel = "black-forest-labs/flux.1-schnell";

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
    const model = options.model || this.defaultModel;

    const seed = Math.floor(Math.random() * 9999999);

    // 1. Try gen.pollinations.ai (supports API key or free token if accepted)
    try {
      const headers: Record<string, string> = {};
      if (options.apiKey) {
        headers["Authorization"] = `Bearer ${options.apiKey}`;
      }

      const url = `https://gen.pollinations.ai/image/${encodeURIComponent(
        prompt,
      )}?model=${encodeURIComponent(model)}&width=${width}&height=${height}&nologo=true&enhance=false&private=true&seed=${seed}`;

      const res = await fetch(url, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(25000),
      });

      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        return this.cleanWatermark(Buffer.from(arrayBuf), width, height);
      }
    } catch {
      // Fall through to open endpoint fallback
    }

    // 2. Open Pollinations fallback endpoint (free tier, no token required)
    const openUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      prompt,
    )}?model=flux&width=${width}&height=${height}&nologo=true&enhance=false&private=true&seed=${seed}`;

    const openRes = await fetch(openUrl, {
      method: "GET",
      signal: AbortSignal.timeout(25000),
    });

    if (!openRes.ok) {
      throw new Error(
        `Pollinations.ai error (${openRes.status}): ${openRes.statusText}`,
      );
    }

    const arrayBuf = await openRes.arrayBuffer();
    return this.cleanWatermark(Buffer.from(arrayBuf), width, height);
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
