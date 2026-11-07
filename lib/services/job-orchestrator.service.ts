import "server-only";
import { inject } from "@needle-di/core";
import { GenerationJobsRepository } from "../repositories/generation-jobs.repository";
import { AdminPostsRepository } from "../repositories/admin-posts.repository";
import {
  AiJobStatus,
  AiJobStep,
  type GenerationJob,
} from "../database/schema/ai/generation-job.schema";
import { AIWriterService, type OutlineResult, type MetadataResult } from "./ai-writer.service";
import { ImageStepService, type ThumbnailGenerationResult } from "./image/image-step.service";
import { ApprovalService } from "./approval.service";
import { logger } from "../logger";

export class JobOrchestratorService {
  constructor(
    private jobsRepo: GenerationJobsRepository = inject(GenerationJobsRepository),
    private postsRepo: AdminPostsRepository = inject(AdminPostsRepository),
    private aiWriter: AIWriterService = inject(AIWriterService),
    private imageStep: ImageStepService = inject(ImageStepService),
    private approvalService: ApprovalService = inject(ApprovalService),
  ) {}

  /**
   * Lists recent AI generation jobs
   */
  async listJobs(limit: number = 30): Promise<GenerationJob[]> {
    return await this.jobsRepo.listRecent(limit);
  }

  /**
   * Enqueues a new autonomous blog post generation job
   */
  async createJob(options: {
    topicText: string;
    category?: string;
    siteId?: string;
  }): Promise<GenerationJob> {
    const siteId = await this.jobsRepo.getOrCreateSiteId(options.siteId);

    return await this.jobsRepo.create({
      siteId,
      topicText: options.topicText,
      category: options.category || "Engineering",
      status: AiJobStatus.QUEUED,
      currentStep: AiJobStep.OUTLINE,
    });
  }

  /**
   * Executes the 6-step autonomous generation pipeline
   */
  async executeJob(jobId: string): Promise<{ success: boolean; postId?: string; error?: string }> {
    const job = await this.jobsRepo.findById(jobId);

    if (!job?.id) {
      return { success: false, error: "Job not found" };
    }

    await this.jobsRepo.update(jobId, {
      status: AiJobStatus.RUNNING,
      attempt: (job.attempt || 0) + 1,
      leaseExpiresAt: new Date(Date.now() + 180_000), // 3 min lease
    });

    try {
      // Step 1: Outline
      await this.jobsRepo.update(jobId, { currentStep: AiJobStep.OUTLINE });
      const outlineKey = `${jobId}:outline:${job.version}`;
      let outline = await this.getCachedStepData<OutlineResult>(outlineKey);
      if (!outline) {
        outline = await this.aiWriter.generateOutline(job.topicText, {
          category: job.category || undefined,
        });
        await this.jobsRepo.upsertStep(jobId, "outline", outlineKey, outline);
      }

      // Step 2: Section generation
      await this.jobsRepo.update(jobId, { currentStep: AiJobStep.SECTIONS });
      const sections: string[] = [];
      const headings = outline.headings || [];

      for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];
        const sectionKey = `${jobId}:section_${i + 1}:${job.version}`;
        const cached = await this.getCachedStepData<{ content: string }>(sectionKey);
        let sectionMarkdown: string;

        if (!cached || !cached.content) {
          sectionMarkdown = await this.aiWriter.generateSection(heading, {
            topic: job.topicText,
            outline: headings,
            keyPoints: outline.keyPoints?.[heading],
            previousSectionsSummary: sections.slice(-2).join("\n\n"),
          });
          await this.jobsRepo.upsertStep(jobId, `section_${i + 1}`, sectionKey, {
            content: sectionMarkdown,
          });
        } else {
          sectionMarkdown = cached.content;
        }

        sections.push(sectionMarkdown);
      }

      const fullDraft = sections.join("\n\n");

      // Step 3: Metadata & SEO
      await this.jobsRepo.update(jobId, { currentStep: AiJobStep.META });
      const metaKey = `${jobId}:meta:${job.version}`;
      let meta = await this.getCachedStepData<MetadataResult>(metaKey);
      if (!meta) {
        meta = await this.aiWriter.generateMetadata(fullDraft, job.topicText);
        await this.jobsRepo.upsertStep(jobId, "meta", metaKey, meta);
      }

      // Step 4: AI Thumbnail Generation
      await this.jobsRepo.update(jobId, { currentStep: AiJobStep.IMAGE });
      const imageKey = `${jobId}:image:${job.version}`;
      let imageRes = await this.getCachedStepData<ThumbnailGenerationResult>(imageKey);
      if (!imageRes) {
        imageRes = await this.imageStep.generateThumbnail(meta.imagePrompt, {
          title: meta.title,
          jobId,
        });
        await this.jobsRepo.upsertStep(jobId, "image", imageKey, imageRes);
      }

      // Step 5: Content Validation
      await this.jobsRepo.update(jobId, { currentStep: AiJobStep.VALIDATE });
      this.aiWriter.validateArticle({
        title: meta.title,
        content: fullDraft,
        slug: meta.slug,
      });

      // Step 6: Save as Pending and Dispatch Approval Request
      await this.jobsRepo.update(jobId, { currentStep: AiJobStep.SAVE_PENDING });
      const post = await this.postsRepo.createPostWithAudit({
        siteId: job.siteId,
        title: meta.title,
        slug: meta.slug,
        content: fullDraft,
        excerpt: meta.excerpt,
        heroImage: imageRes.url,
        thumbnailMissing: imageRes.thumbnailMissing,
        thumbnailProvider: imageRes.provider,
        thumbnailPrompt: imageRes.prompt,
        thumbnailAlt: imageRes.alt,
        aiGenerated: true,
        aiJobId: jobId,
        tags: meta.tags,
        readTime: meta.readTime,
        status: "IN_REVIEW",
        seo: {
          metaTitle: meta.seoTitle,
          metaDescription: meta.seoDescription,
        },
      });

      // Create Tokenized Approval & Send Review Email
      const approval = await this.approvalService.createApprovalRequest(post.id, job.version);
      await this.approvalService.sendApprovalEmail(approval.token, post);

      // Mark Job Completed
      await this.jobsRepo.update(jobId, {
        status: AiJobStatus.COMPLETED,
        currentStep: AiJobStep.COMPLETED,
        resultPostId: post.id,
      });

      return { success: true, postId: post.id };
    } catch (err) {
      logger.error(`Generation Job ${jobId} failed:`, {
        error: err instanceof Error ? err.message : String(err),
      });

      await this.jobsRepo.update(jobId, {
        status: AiJobStatus.FAILED,
        errorDetails: { error: err instanceof Error ? err.message : String(err) },
      });

      return {
        success: false,
        error: err instanceof Error ? err.message : "Generation failed",
      };
    }
  }

  private async getCachedStepData<T = unknown>(idempotencyKey: string): Promise<T | null> {
    const step = await this.jobsRepo.findStepByIdempotencyKey(idempotencyKey);
    return step?.status === "DONE" ? (step.outputData as unknown as T) : null;
  }
}
