import "server-only";
import { inject } from "@needle-di/core";
import {
  AdminTopicsRepository,
  type ListAdminTopicsOptions,
} from "@/lib/repositories/admin-topics.repository";
import type { Topic } from "@/lib/database/schema/index.schema";
import { AiTopicStatus } from "@/lib/database/enum/ai.enum";
import { AIWriterService } from "./ai-writer.service";
import { JobOrchestratorService } from "./job-orchestrator.service";
import { logger } from "../logger";
import { AppError, ErrorCode } from "@/lib/errors";

export interface ListTopicsOptions extends ListAdminTopicsOptions {}

export class AdminTopicsService {
  constructor(
    private readonly topicsRepo: AdminTopicsRepository = inject(AdminTopicsRepository),
    private readonly aiWriter: AIWriterService = inject(AIWriterService),
    private readonly jobOrchestrator: JobOrchestratorService = inject(JobOrchestratorService),
  ) {}

  private async getDefaultSiteId(): Promise<string> {
    return this.topicsRepo.getDefaultSiteId();
  }

  async listTopics(options: ListTopicsOptions = {}): Promise<{ topics: Topic[]; total: number }> {
    try {
      await this.topicsRepo.reconcileCompletedTopics();
    } catch (err) {
      logger.warn("Non-blocking topic status reconciliation error", { error: String(err) });
    }
    return this.topicsRepo.listTopics(options);
  }

  async getTopicById(id: string): Promise<Topic | null> {
    return this.topicsRepo.findById(id);
  }

  async createTopic(data: {
    title: string;
    keywords?: string[];
    category?: string;
    targetAudience?: string;
    difficulty?: string;
    priority?: number;
    notes?: string;
    suggestedBy?: "ai" | "admin";
  }): Promise<Topic> {
    const siteId = await this.getDefaultSiteId();

    return this.topicsRepo.create({
      siteId,
      title: data.title.trim(),
      keywords: data.keywords ?? [],
      category: data.category ?? "Engineering",
      targetAudience: data.targetAudience ?? "Tech Leads & Engineers",
      difficulty: data.difficulty ?? "intermediate",
      priority: data.priority ?? 0,
      suggestedBy: data.suggestedBy ?? "admin",
      status: data.suggestedBy === "admin" ? AiTopicStatus.ACCEPTED : AiTopicStatus.SUGGESTED,
      notes: data.notes ?? null,
    });
  }

  async updateTopicStatus(id: string, status: AiTopicStatus): Promise<Topic> {
    const updated = await this.topicsRepo.update(id, {
      status,
      updatedAt: new Date(),
    });

    if (!updated) {
      throw new AppError(ErrorCode.NOT_FOUND, `Topic not found: ${id}`);
    }

    return updated;
  }

  async deleteTopic(id: string): Promise<void> {
    const success = await this.topicsRepo.delete(id);
    if (!success) {
      throw new AppError(ErrorCode.NOT_FOUND, `Topic not found: ${id}`);
    }
  }

  async suggestTopicsWithAI(category = "Full-Stack & Agentic AI"): Promise<Topic[]> {
    const siteId = await this.getDefaultSiteId();

    try {
      const systemPrompt = `You are the Lead Content Strategist for TechSonance Infotech, a premier software engineering & AI innovation agency.
Suggest 4 timely, authoritative, high-ranking blog topic ideas. Target audience: CTOs, Tech Leads, Senior Engineers.
Respond strictly with a valid JSON array of objects with keys: title, keywords (3-5 strings), category, targetAudience, difficulty ('beginner' | 'intermediate' | 'advanced'), notes.`;

      const userPrompt = `Focus area / Category: ${category}`;

      const responseText = await this.aiWriter.generateRaw(systemPrompt, userPrompt);

      const cleanJson = responseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const topicProposals = JSON.parse(cleanJson) as Array<{
        title: string;
        keywords?: string[];
        category?: string;
        targetAudience?: string;
        difficulty?: string;
        notes?: string;
      }>;

      if (!Array.isArray(topicProposals) || topicProposals.length === 0) {
        throw new AppError(ErrorCode.INTERNAL, "Invalid proposals payload from LLM");
      }

      const validProposals = topicProposals.filter((p) => Boolean(p.title));
      const insertedTopics = await Promise.all(
        validProposals.map((p) =>
          this.topicsRepo.create({
            siteId,
            title: p.title,
            keywords: p.keywords ?? [],
            category: p.category ?? category,
            targetAudience: p.targetAudience ?? "Tech Leads & Engineers",
            difficulty: p.difficulty ?? "intermediate",
            status: AiTopicStatus.SUGGESTED,
            suggestedBy: "ai",
            priority: 1,
            notes: p.notes ?? null,
          }),
        ),
      );

      return insertedTopics;
    } catch (err) {
      logger.error("Failed to suggest topics via AI", { error: String(err) });
      const fallbacks = [
        {
          title: "Building Production Multi-Agent Workflows with Next.js 16 and Needle DI",
          keywords: ["Next.js 16", "Needle DI", "Multi-Agent AI", "TypeScript"],
          category: "Agentic AI",
        },
        {
          title: "Achieving Zero-Cold-Start Serverless Postgres with Drizzle ORM and Supabase",
          keywords: ["Supabase", "Drizzle ORM", "Connection Pooling", "Edge Runtime"],
          category: "Cloud Architecture",
        },
        {
          title: "Why React 19 Actions and Optimistic State Replace Client-Side Cache Overkill",
          keywords: ["React 19", "Server Actions", "useOptimistic", "Web Performance"],
          category: "Full-Stack",
        },
      ];

      const insertedFallbacks = await Promise.all(
        fallbacks.map((f) =>
          this.topicsRepo.create({
            siteId,
            title: f.title,
            keywords: f.keywords,
            category: f.category,
            targetAudience: "Engineering Teams",
            difficulty: "intermediate",
            status: AiTopicStatus.SUGGESTED,
            suggestedBy: "ai",
            priority: 0,
            notes: "Curated agency topic recommendation",
          }),
        ),
      );

      return insertedFallbacks;
    }
  }

  async launchTopicGeneration(topicId: string): Promise<{ jobId: string }> {
    const topic = await this.getTopicById(topicId);
    if (!topic) {
      throw new AppError(ErrorCode.NOT_FOUND, `Topic not found: ${topicId}`);
    }

    // Mark topic as QUEUED
    await this.updateTopicStatus(topicId, AiTopicStatus.QUEUED);

    // Start autonomous pipeline
    const job = await this.jobOrchestrator.createJob({
      topicText: topic.title,
      category: topic.category ?? "Engineering",
      siteId: topic.siteId,
      topicId: topic.id,
    });

    // Run execution in the background asynchronously
    this.jobOrchestrator.executeJob(job.id).catch((err) => {
      logger.error("Autonomous execution error for topic job", {
        jobId: job.id,
        error: String(err),
      });
    });

    return { jobId: job.id };
  }

  /**
   * Auto-Pilot: Finds the next ready topic (or synthesizes a high-ranking topic with AI if backlog is empty),
   * accepts it, and launches the autonomous blog generation pipeline in one shot.
   */
  async autoGenerateNextTopic(preferredCategory = "Full-Stack & Agentic AI"): Promise<{
    jobId: string;
    topicId: string;
    topicTitle: string;
  }> {
    // 1. Look for existing accepted topic
    let { topics } = await this.listTopics({
      status: AiTopicStatus.ACCEPTED,
      limit: 1,
    });

    // 2. If no accepted topic, look for any suggested topic
    if (topics.length === 0) {
      const suggestedResult = await this.listTopics({
        status: AiTopicStatus.SUGGESTED,
        limit: 1,
      });
      topics = suggestedResult.topics;
    }

    // 3. If backlog is completely empty, auto-suggest fresh topics using AI
    if (topics.length === 0) {
      logger.info("Auto-Pilot: Backlog empty. Synthesizing new topic ideas with AI...");
      const newlySuggested = await this.suggestTopicsWithAI(preferredCategory);
      if (newlySuggested.length > 0) {
        topics = [newlySuggested[0]];
      }
    }

    if (topics.length === 0) {
      throw new AppError(ErrorCode.INTERNAL, "Could not discover or generate any topic to launch.");
    }

    const targetTopic = topics[0];

    // Mark as accepted if needed
    if (targetTopic.status !== AiTopicStatus.ACCEPTED) {
      await this.updateTopicStatus(targetTopic.id, AiTopicStatus.ACCEPTED);
    }

    // Launch autonomous pipeline
    const { jobId } = await this.launchTopicGeneration(targetTopic.id);

    return {
      jobId,
      topicId: targetTopic.id,
      topicTitle: targetTopic.title,
    };
  }
}
