import "server-only";
import { inject } from "@needle-di/core";
import { MediaService } from "../media.service";
import { AIWriterService } from "../ai-writer.service";
import { CloudflareImageAdapter } from "./cloudflare-image.adapter";
import { PollinationsImageAdapter } from "./pollinations.adapter";
import { logger } from "@/lib/logger";

export interface ThumbnailGenerationResult {
  url: string;
  provider: string;
  prompt: string;
  alt: string;
  thumbnailMissing: boolean;
}

export interface HeroImagePipelineContext {
  title?: string;
  summary?: string;
  category?: string;
  keywords?: string[];
  contentExcerpt?: string;
  jobId?: string;
  topic?: string;
}

export class ImageStepService {
  private cfAdapter = new CloudflareImageAdapter();
  private pollinationsAdapter = new PollinationsImageAdapter();

  constructor(
    private mediaService: MediaService = inject(MediaService),
    private aiWriter?: AIWriterService,
  ) {
    if (!this.aiWriter) {
      try {
        this.aiWriter = inject(AIWriterService);
      } catch {
        // Safe when constructed directly in unit tests without DI container
      }
    }
  }

  /**
   * Generates a 16:9 hero image adhering to the production specification:
   * 1. Stage A: Visual brief extraction from article metadata
   * 2. Stage B: Single-paragraph FLUX prompt composition (no Midjourney tokens, ending with 'no text, no letters')
   * 3. Stage C: Provider fallback chain (Cloudflare Workers AI -> Pollinations FLUX) at 1280x720
   * 4. Stage D: Upload to permanent storage (Cloudinary)
   * Note: Vision LLM verification is bypassed per requirement; admin review via email & UI serves as the quality gate.
   */
  async generateThumbnail(
    basePrompt: string,
    context: HeroImagePipelineContext = {},
  ): Promise<ThumbnailGenerationResult> {
    const title = context.title || "TechSonance Engineering";
    let finalPrompt = "";

    // 1. Stage A & B: If rich article context and aiWriter are available, synthesize visual brief & compose FLUX prompt
    if (this.aiWriter && (context.summary || context.contentExcerpt)) {
      try {
        const visualBrief = await this.aiWriter.generateVisualBrief({
          title,
          summary: context.summary,
          category: context.category,
          keywords: context.keywords,
          contentExcerpt: context.contentExcerpt,
        });

        finalPrompt = await this.aiWriter.composeFluxPrompt(title, visualBrief);
      } catch (promptErr) {
        logger.warn("Visual brief / compose prompt error, falling back to curated template", {
          error: String(promptErr),
        });
      }
    }

    // Fallback prompt composition if visual brief generation was skipped or threw
    if (!finalPrompt) {
      const cleanBase = basePrompt
        .replace(/--ar\s+\d+:\d+/gi, "")
        .replace(/--\w+/g, "")
        .replace(/\b(8k|octane render|trending on artstation|unreal engine)\b/gi, "")
        .trim();

      finalPrompt = `Minimalist modern isometric 3D editorial illustration representing ${title}, deep royal blue and electric cyan accents, subtle ambient glow, high-end agency aesthetic: ${cleanBase}, no text, no letters`;
    }

    const alt = `Hero illustration for ${title}`;
    let buffer: Buffer | null = null;
    let providerName = "cloudflare";

    // 2. Stage C: Provider fallback chain (1280x720, 16:9)
    try {
      buffer = await this.cfAdapter.generateImage(finalPrompt, { width: 1280, height: 720 });
    } catch (cfError) {
      logger.warn("Cloudflare Workers AI generation failed, falling back to Pollinations.ai", {
        error: cfError,
      });

      try {
        providerName = "pollinations";
        buffer = await this.pollinationsAdapter.generateImage(finalPrompt, {
          width: 1280,
          height: 720,
        });
      } catch (pollinationsError) {
        logger.error("Pollinations.ai generation also failed", { error: pollinationsError });
      }
    }

    // 3. Stage D: Permanent Cloudinary storage upload
    if (buffer) {
      try {
        const uploadRes = await this.mediaService.uploadImage(buffer, {
          folder: "techsonance-blog-ai",
        });

        return {
          url: uploadRes.secureUrl,
          provider: providerName,
          prompt: finalPrompt,
          alt,
          thumbnailMissing: false,
        };
      } catch (uploadError) {
        logger.error("Cloudinary upload of generated hero image failed", { error: uploadError });
      }
    }

    // 4. Graceful fallback placeholder
    return {
      url: "/images/blog/default-hero.jpg",
      provider: "fallback-card",
      prompt: finalPrompt,
      alt,
      thumbnailMissing: true,
    };
  }
}
