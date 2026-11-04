import "server-only";
import { inject } from "@needle-di/core";
import { MediaService } from "../media.service";
import { CloudflareImageAdapter } from "./cloudflare-image.adapter";
import { PollinationsImageAdapter } from "./pollinations.adapter";

export interface ThumbnailGenerationResult {
  url: string;
  provider: string;
  prompt: string;
  alt: string;
  thumbnailMissing: boolean;
}

export class ImageStepService {
  private cfAdapter = new CloudflareImageAdapter();
  private pollinationsAdapter = new PollinationsImageAdapter();

  constructor(private mediaService: MediaService = inject(MediaService)) {}

  async generateThumbnail(
    basePrompt: string,
    context: { title?: string; jobId?: string } = {},
  ): Promise<ThumbnailGenerationResult> {
    const styledPrompt = `Minimalist modern tech editorial illustration, sleek deep royal blue and cyan digital accents, high-end agency design aesthetic, subtle ambient lighting, clean composition: ${basePrompt} (clean abstract, no text, no letters, no words, no watermark, no logos, no faces)`;

    const alt = context.title
      ? `Illustration representing ${context.title}`
      : "Blog article featured graphic";

    let buffer: Buffer | null = null;
    let providerName = "cloudflare";

    // 1. Try Cloudflare Workers AI FLUX.1-schnell
    try {
      buffer = await this.cfAdapter.generateImage(styledPrompt, { width: 1200, height: 630 });
    } catch (cfError) {
      console.warn("Cloudflare Workers AI generation failed, falling back to Pollinations.ai:", cfError);
      
      // 2. Try Pollinations.ai FLUX fallback
      try {
        providerName = "pollinations";
        buffer = await this.pollinationsAdapter.generateImage(styledPrompt, { width: 1200, height: 630 });
      } catch (pollinationsError) {
        console.error("Pollinations.ai generation also failed:", pollinationsError);
      }
    }

    // 3. If an image was generated, upload to permanent Cloudinary storage
    if (buffer) {
      try {
        const uploadRes = await this.mediaService.uploadImage(buffer, {
          folder: "techsonance-blog-ai",
        });

        return {
          url: uploadRes.secureUrl,
          provider: providerName,
          prompt: styledPrompt,
          alt,
          thumbnailMissing: false,
        };
      } catch (uploadError) {
        console.error("Cloudinary upload of generated thumbnail failed:", uploadError);
      }
    }

    // 4. Ultimate fallback: Branded placeholder card
    return {
      url: "/images/blog/default-hero.jpg",
      provider: "fallback-card",
      prompt: styledPrompt,
      alt,
      thumbnailMissing: true,
    };
  }
}
