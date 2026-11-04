import "server-only";

export class PollinationsImageAdapter {
  readonly name = "pollinations";
  readonly model = "flux";

  async generateImage(
    prompt: string,
    options: { width?: number; height?: number } = {},
  ): Promise<Buffer> {
    const width = options.width ?? 1200;
    const height = options.height ?? 630;

    const url = `https://gen.pollinations.ai/image/${encodeURIComponent(
      prompt,
    )}?model=flux&width=${width}&height=${height}&nologo=true`;

    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(25000), // 25s timeout
    });

    if (!res.ok) {
      throw new Error(`Pollinations.ai error (${res.status}): ${res.statusText}`);
    }

    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }
}
