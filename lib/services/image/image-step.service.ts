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
   * 4. Stage D: Critic AI Vision validation and reprompting loop (max 3 retries)
   * 5. Stage E: Upload only passing image to permanent storage (Cloudinary) with zero orphaned assets
   */
  async generateThumbnail(
    basePrompt: string,
    context: HeroImagePipelineContext = {},
  ): Promise<ThumbnailGenerationResult> {
    const title = context.title || "TechSonance Engineering";
    const maxAttempts = 3;

    // 1. Stage A: Visual brief extraction
    let visualBrief: {
      core_concept: string;
      visual_metaphor: string;
      key_objects: string[];
      mood: string;
      color_palette: string[];
      composition: string;
      must_include: string[];
      must_avoid: string[];
    } = {
      core_concept: title,
      visual_metaphor: `Isometric 3D technological architecture representing ${title}`,
      key_objects: ["servers", "data nodes", "holographic circuits"],
      mood: "futuristic, trustworthy, sleek",
      color_palette: ["deep navy", "electric cyan", "emerald"],
      composition: "isometric 16:9 landscape with focal point",
      must_include: ["geometric nodes", "soft ambient glow"],
      must_avoid: ["readable text", "letters", "watermarks", "faces"],
    };

    if (this.aiWriter) {
      try {
        visualBrief = await this.aiWriter.generateVisualBrief({
          title,
          summary: context.summary,
          category: context.category,
          keywords: context.keywords,
          contentExcerpt: context.contentExcerpt,
        });
      } catch (promptErr) {
        logger.warn("Visual brief extraction error, using curated brief", {
          error: String(promptErr),
        });
      }
    }

    // 2. Stage B: Initial prompt composition
    let currentPrompt = "";
    if (this.aiWriter) {
      try {
        currentPrompt = await this.aiWriter.composeFluxPrompt(title, visualBrief);
      } catch (composeErr) {
        logger.warn("Initial prompt composition error, falling back to clean template", {
          error: String(composeErr),
        });
      }
    }

    if (!currentPrompt) {
      const cleanBase = basePrompt
        .replace(/--ar\s+\d+:\d+/gi, "")
        .replace(/--\w+/g, "")
        .replace(/\b(8k|octane render|trending on artstation|unreal engine)\b/gi, "")
        .trim();

      currentPrompt = `Minimalist modern isometric 3D editorial illustration representing ${title}, deep royal blue and electric cyan accents, subtle ambient glow, high-end agency aesthetic: ${cleanBase}, no text, no letters`;
    }

    const alt = `Hero illustration for ${title}`;
    let lastIssues: string[] = [];
    let lastFixInstructions = "";

    // 3. Stage C & D: Generation & Critic AI Verification Loop (max 3 attempts)
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (attempt > 1 && this.aiWriter) {
        try {
          currentPrompt = await this.aiWriter.composeRetryPrompt(title, visualBrief, {
            previousPrompt: currentPrompt,
            attempt: attempt - 1,
            issues: lastIssues,
            reviewerFeedback: lastFixInstructions,
          });
        } catch (retryErr) {
          logger.warn("Compose retry prompt error, retaining previous prompt", {
            attempt,
            error: String(retryErr),
          });
        }
      }

      let buffer: Buffer | null = null;
      let providerName = "cloudflare";

      // Provider fallback chain (1280x720, 16:9)
      try {
        buffer = await this.cfAdapter.generateImage(currentPrompt, { width: 1280, height: 720 });
      } catch (cfError) {
        logger.warn(
          `Attempt ${attempt}: Cloudflare generation failed, falling back to Pollinations.ai`,
          {
            error: String(cfError),
          },
        );

        try {
          providerName = "pollinations";
          buffer = await this.pollinationsAdapter.generateImage(currentPrompt, {
            width: 1280,
            height: 720,
          });
        } catch (pollinationsError) {
          logger.error(`Attempt ${attempt}: Pollinations.ai generation also failed`, {
            error: String(pollinationsError),
          });
        }
      }

      if (!buffer) {
        continue;
      }

      // Critic AI Vision Quality Gate
      if (this.aiWriter) {
        try {
          const verification = await this.aiWriter.verifyHeroImage(buffer, {
            title,
            summary: context.summary,
            brief: visualBrief,
            attempt,
          });

          if (verification.verdict === "pass") {
            logger.info(`Critic AI verified hero image on attempt ${attempt}`, {
              scores: verification.scores,
              average: verification.average,
              provider: providerName,
            });

            // Stage E: Upload only verified, passing image to permanent storage
            try {
              const uploadRes = await this.mediaService.uploadImage(buffer, {
                folder: "techsonance-blog-ai",
              });

              return {
                url: uploadRes.secureUrl,
                provider: providerName,
                prompt: currentPrompt,
                alt,
                thumbnailMissing: false,
              };
            } catch (uploadError) {
              logger.error("Cloudinary upload of verified hero image failed", {
                error: String(uploadError),
              });
            }
          } else {
            logger.warn(`Critic AI rejected hero image on attempt ${attempt}`, {
              issues: verification.issues,
              fixInstructions: verification.fix_instructions,
              average: verification.average,
            });

            lastIssues = verification.issues;
            lastFixInstructions = verification.fix_instructions;
            // Intermediate rejected buffer is discarded in RAM — zero storage orphaned assets
          }
        } catch (verifyErr) {
          logger.warn(`Critic AI verification step threw on attempt ${attempt}`, {
            error: String(verifyErr),
          });
        }
      } else {
        // If aiWriter is not available (e.g. unit test mock), proceed with single attempt upload
        try {
          const uploadRes = await this.mediaService.uploadImage(buffer, {
            folder: "techsonance-blog-ai",
          });

          return {
            url: uploadRes.secureUrl,
            provider: providerName,
            prompt: currentPrompt,
            alt,
            thumbnailMissing: false,
          };
        } catch (uploadError) {
          logger.error("Cloudinary upload failed", { error: String(uploadError) });
        }
      }
    }

    // 4. Graceful fallback placeholder after max attempts exhausted
    logger.warn(
      `Hero image pipeline exhausted ${maxAttempts} attempts without pass. Falling back to default hero.`,
    );
    return {
      url: "/images/blog/default-hero.jpg",
      provider: "fallback-card",
      prompt: currentPrompt,
      alt,
      thumbnailMissing: true,
    };
  }
}
