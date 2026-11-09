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
    const width = options.width ?? 1200;
    const height = options.height ?? 630;
    const model = options.model || this.defaultModel;

    // 1. Try gen.pollinations.ai (supports API key or free token if accepted)
    try {
      const headers: Record<string, string> = {};
      if (options.apiKey) {
        headers["Authorization"] = `Bearer ${options.apiKey}`;
      }

      const url = `https://gen.pollinations.ai/image/${encodeURIComponent(
        prompt,
      )}?model=${encodeURIComponent(model)}&width=${width}&height=${height}&nologo=true`;

      const res = await fetch(url, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(25000),
      });

      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        return Buffer.from(arrayBuf);
      }
    } catch {
      // Fall through to open endpoint fallback
    }

    // 2. Open Pollinations fallback endpoint (free tier, no token required)
    const openUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      prompt,
    )}?model=flux&width=${width}&height=${height}&nologo=true`;

    const openRes = await fetch(openUrl, {
      method: "GET",
      signal: AbortSignal.timeout(25000),
    });

    if (!openRes.ok) {
      throw new Error(`Pollinations.ai error (${openRes.status}): ${openRes.statusText}`);
    }

    const arrayBuf = await openRes.arrayBuffer();
    return Buffer.from(arrayBuf);
  }
}

