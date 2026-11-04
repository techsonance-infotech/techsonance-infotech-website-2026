import "server-only";
import { inject } from "@needle-di/core";
import { eq } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "../di/tokens";
import type { Database } from "../database/index";
import { generationJobsTable, type GenerationJob } from "../database/schema/ai/generation-job.schema";
import { jobStepsTable } from "../database/schema/ai/job-step.schema";
import { postsTable } from "../database/schema/core/post.schema";
import { sitesTable } from "../database/schema/core/site.schema";
import { AIWriterService, type OutlineResult, type MetadataResult } from "./ai-writer.service";
import { ImageStepService, type ThumbnailGenerationResult } from "./image/image-step.service";
import { ApprovalService } from "./approval.service";
import { getEnv } from "../env";

export class JobOrchestratorService {
  constructor(
    private db: Database = inject(DRIZZLE_DB_TOKEN),
    private aiWriter: AIWriterService = inject(AIWriterService),
    private imageStep: ImageStepService = inject(ImageStepService),
    private approvalService: ApprovalService = inject(ApprovalService),
  ) {}

  private async getOrCreateSiteId(requestedSiteId?: string): Promise<string> {
    if (requestedSiteId) return requestedSiteId;

    const env = getEnv();
    if (env.AI_BLOG_SITE_ID) return env.AI_BLOG_SITE_ID;

    const existingSite = await this.db.query.sitesTable.findFirst();
    if (existingSite) return existingSite.id;

    // Create default site if none exists
    const [newSite] = await this.db
      .insert(sitesTable)
      .values({
        name: "TechSonance Infotech",
        slug: "techsonance",
        domain: "techsonance.co.in",
      })
      .returning();

    return newSite.id;
  }

  /**
   * Enqueues a new autonomous blog post generation job
   */
  async createJob(options: {
    topicText: string;
    category?: string;
    siteId?: string;
  }): Promise<GenerationJob> {
    const siteId = await this.getOrCreateSiteId(options.siteId);

    const [job] = await this.db
      .insert(generationJobsTable)
      .values({
        siteId,
        topicText: options.topicText,
        category: options.category || "Engineering",
        status: "QUEUED",
        currentStep: "outline",
      })
      .returning();

    return job;
  }

  /**
   * Executes the 6-step autonomous generation pipeline
   */
  async executeJob(jobId: string): Promise<{ success: boolean; postId?: string; error?: string }> {
    const [job] = await this.db.select().from(generationJobsTable).where(eq(generationJobsTable.id, jobId)).limit(1)

    if (!job.id) {
      return { success: false, error: "Job not found" };
    }

    const now = new Date();
    await this.db
      .update(generationJobsTable)
      .set({
        status: "RUNNING",
        attempt: (job.attempt || 0) + 1,
        leaseExpiresAt: new Date(Date.now() + 180_000), // 3 min lease
        updatedAt: now,
      })
      .where(eq(generationJobsTable.id, jobId));

    try {
      // Step 1: Outline
      await this.updateJobStep(jobId, "outline");
      const outlineKey = `${jobId}:outline:${job.version}`;
      let outline = await this.getCachedStepData<OutlineResult>(outlineKey);
      if (!outline) {
        outline = await this.aiWriter.generateOutline(job.topicText, {
          category: job.category || undefined,
        });
        await this.saveStep(jobId, "outline", outlineKey, outline);
      }

      // Step 2: Section generation
      await this.updateJobStep(jobId, "sections");
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
          await this.saveStep(jobId, `section_${i + 1}`, sectionKey, { content: sectionMarkdown });
        } else {
          sectionMarkdown = cached.content;
        }

        sections.push(sectionMarkdown);
      }

      const fullDraft = sections.join("\n\n");

      // Step 3: Metadata & SEO
      await this.updateJobStep(jobId, "meta");
      const metaKey = `${jobId}:meta:${job.version}`;
      let meta = await this.getCachedStepData<MetadataResult>(metaKey);
      if (!meta) {
        meta = await this.aiWriter.generateMetadata(fullDraft, job.topicText);
        await this.saveStep(jobId, "meta", metaKey, meta);
      }

      // Step 4: AI Thumbnail Generation
      await this.updateJobStep(jobId, "image");
      const imageKey = `${jobId}:image:${job.version}`;
      let imageRes = await this.getCachedStepData<ThumbnailGenerationResult>(imageKey);
      if (!imageRes) {
        imageRes = await this.imageStep.generateThumbnail(meta.imagePrompt, {
          title: meta.title,
          jobId,
        });
        await this.saveStep(jobId, "image", imageKey, imageRes);
      }

      // Step 5: Content Validation
      await this.updateJobStep(jobId, "validate");
      this.aiWriter.validateArticle({
        title: meta.title,
        content: fullDraft,
        slug: meta.slug,
      });

      // Step 6: Save as Pending and Dispatch Approval Request
      await this.updateJobStep(jobId, "save-pending");
      const [post] = await this.db
        .insert(postsTable)
        .values({
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
        })
        .returning();

      // Create Tokenized Approval & Send Review Email
      const approval = await this.approvalService.createApprovalRequest(post.id, job.version);
      await this.approvalService.sendApprovalEmail(approval.token, post);

      // Mark Job Completed
      await this.db
        .update(generationJobsTable)
        .set({
          status: "COMPLETED",
          currentStep: "completed",
          resultPostId: post.id,
          updatedAt: new Date(),
        })
        .where(eq(generationJobsTable.id, jobId));

      return { success: true, postId: post.id };
    } catch (err) {
      console.error(`Generation Job ${jobId} failed:`, err);
      await this.db
        .update(generationJobsTable)
        .set({
          status: "FAILED",
          errorDetails: { error: err instanceof Error ? err.message : String(err) },
          updatedAt: new Date(),
        })
        .where(eq(generationJobsTable.id, jobId));

      return {
        success: false,
        error: err instanceof Error ? err.message : "Generation failed",
      };
    }
  }

  private async updateJobStep(jobId: string, currentStep: string) {
    await this.db
      .update(generationJobsTable)
      .set({ currentStep, updatedAt: new Date() })
      .where(eq(generationJobsTable.id, jobId));
  }

  private async getCachedStepData<T = any>(idempotencyKey: string): Promise<T | null> {
    const [step] = await this.db.select().from(jobStepsTable).where(eq(jobStepsTable.idempotencyKey, idempotencyKey)).limit(1);
    return step?.status === "DONE" ? ((step.outputData as unknown) as T) : null;
  }

  private async saveStep(
    jobId: string,
    stepName: string,
    idempotencyKey: string,
    outputData: unknown,
  ) {
    await this.db
      .insert(jobStepsTable)
      .values({
        jobId,
        stepName,
        idempotencyKey,
        status: "DONE",
        outputData: outputData as Record<string, unknown>,
      })
      .onConflictDoUpdate({
        target: jobStepsTable.idempotencyKey,
        set: {
          status: "DONE",
          outputData: outputData as Record<string, unknown>,
          updatedAt: new Date(),
        },
      });
  }
}
