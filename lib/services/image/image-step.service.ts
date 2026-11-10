import "server-only";
import { inject } from "@needle-di/core";
import { MediaService } from "../media.service";
import { AIWriterService } from "../ai-writer.service";
import { CloudflareImageAdapter } from "./cloudflare-image.adapter";
import { OpenAIImageAdapter } from "./openai-image.adapter";
import { GeminiImageAdapter } from "./gemini-image.adapter";
import { PollinationsImageAdapter } from "./pollinations.adapter";
import { KeyBrokerService } from "../ai/key-broker.service";
import { getEnv } from "@/lib/env";
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
  isManualAdmin?: boolean;
}

export class ImageStepService {
  private cfAdapter: CloudflareImageAdapter;
  private openAiAdapter: OpenAIImageAdapter;
  private geminiAdapter: GeminiImageAdapter;
  private pollinationsAdapter: PollinationsImageAdapter;

  constructor(
    private mediaService: MediaService = inject(MediaService),
    private aiWriter?: AIWriterService,
    private keyBroker?: KeyBrokerService,
  ) {
    if (!this.aiWriter) {
      try {
        this.aiWriter = inject(AIWriterService);
      } catch {
        // Safe when constructed directly in unit tests without DI container
      }
    }
    if (!this.keyBroker) {
      try {
        this.keyBroker = inject(KeyBrokerService);
      } catch {
        // Safe when constructed directly in unit tests without DI container
      }
    }

    this.cfAdapter = new CloudflareImageAdapter(this.keyBroker);
    this.openAiAdapter = new OpenAIImageAdapter(this.keyBroker);
    this.geminiAdapter = new GeminiImageAdapter(this.keyBroker);
    this.pollinationsAdapter = new PollinationsImageAdapter();
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
    let lastGeneratedBuffer: Buffer | null = null;
    let lastGeneratedProvider = "pollinations";
    let lastGeneratedPrompt = currentPrompt;

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

      // Dynamically select only configured, active providers (never run unconfigured or exhausted providers)
      const isCfReady =
        typeof this.cfAdapter.isConfigured === "function"
          ? await this.cfAdapter.isConfigured()
          : true;
      const isGeminiReady =
        typeof this.geminiAdapter.isConfigured === "function"
          ? await this.geminiAdapter.isConfigured()
          : true;
      const isOpenAiReady =
        typeof this.openAiAdapter.isConfigured === "function"
          ? await this.openAiAdapter.isConfigured()
          : true;

      // Check if Pollinations is explicitly enabled via DB or env; default false to avoid unwanted watermark stamps
      let isPollinationsEnabled = false;
      if (this.keyBroker) {
        isPollinationsEnabled = await this.keyBroker.hasActiveCredential("pollinations");
      }
      if (!isPollinationsEnabled) {
        isPollinationsEnabled = getEnv().ENABLE_POLLINATIONS_FALLBACK === "true";
      }

      // Tier 1: Cloudflare Workers AI (FLUX via DB rotation or env)
      if (isCfReady && !buffer) {
        try {
          buffer = await this.cfAdapter.generateImage(currentPrompt, { width: 1280, height: 720 });
          providerName = "cloudflare";
        } catch (cfError) {
          logger.warn(`Attempt ${attempt}: Cloudflare generation bypassed/failed`, {
            error: String(cfError),
          });
        }
      }

      // Tier 2: Google Gemini / Imagen (via DB key broker or env)
      if (isGeminiReady && !buffer) {
        try {
          buffer = await this.geminiAdapter.generateImage(currentPrompt, { width: 1280, height: 720 });
          providerName = "gemini";
        } catch (geminiError) {
          logger.warn(`Attempt ${attempt}: Gemini image generation bypassed/failed`, {
            error: String(geminiError),
          });
        }
      }

      // Tier 3: OpenAI DALL-E 3 (via DB key broker or env)
      if (isOpenAiReady && !buffer) {
        try {
          buffer = await this.openAiAdapter.generateImage(currentPrompt, { width: 1280, height: 720 });
          providerName = "openai";
        } catch (openAiError) {
          logger.warn(`Attempt ${attempt}: OpenAI DALL-E bypassed/failed`, {
            error: String(openAiError),
          });
        }
      }

      // Tier 4: Pollinations.ai (ONLY when explicitly enabled or active in database)
      if (isPollinationsEnabled && !buffer) {
        try {
          providerName = "pollinations";
          buffer = await this.pollinationsAdapter.generateImage(currentPrompt, {
            width: 1280,
            height: 720,
          });
        } catch (pollinationsError) {
          logger.error(`Attempt ${attempt}: Pollinations.ai generation failed`, {
            error: String(pollinationsError),
          });
        }
      }

      if (!buffer) {
        continue;
      }

      lastGeneratedBuffer = buffer;
      lastGeneratedProvider = providerName;
      lastGeneratedPrompt = currentPrompt;

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
            // Intermediate rejected buffer is kept in memory for manual admin fallback
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

    // 4. For manual admin sessions: deliver the best generated buffer rather than blocking with fallback card
    if (context.isManualAdmin && lastGeneratedBuffer) {
      try {
        const uploadRes = await this.mediaService.uploadImage(lastGeneratedBuffer, {
          folder: "techsonance-blog-ai",
        });

        logger.info("Admin manual generation delivered image despite strict critic warnings", {
          provider: lastGeneratedProvider,
          issues: lastIssues,
        });

        return {
          url: uploadRes.secureUrl,
          provider: lastGeneratedProvider,
          prompt: lastGeneratedPrompt,
          alt,
          thumbnailMissing: false,
        };
      } catch (uploadError) {
        logger.error("Cloudinary upload of manual admin thumbnail failed", {
          error: String(uploadError),
        });
      }
    }

    // 5. Graceful fallback placeholder for automated background queue workers
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
