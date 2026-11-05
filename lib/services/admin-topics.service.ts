import "server-only";
import { inject } from "@needle-di/core";
import { eq, desc, and, ilike, sql } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { Database } from "@/lib/database";
import { topicsTable, sitesTable, type Topic, type InsertTopic } from "@/lib/database/schema/index.schema";
import { AiTopicStatus } from "@/lib/database/enum/ai.enum";
import { AIWriterService } from "./ai-writer.service";
import { JobOrchestratorService } from "./job-orchestrator.service";
import { logger } from "../logger";

export interface ListTopicsOptions {
  status?: AiTopicStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export class AdminTopicsService {
  constructor(
    private readonly db: Database = inject(DRIZZLE_DB_TOKEN),
    private readonly aiWriter: AIWriterService = inject(AIWriterService),
    private readonly jobOrchestrator: JobOrchestratorService = inject(JobOrchestratorService)
  ) {}

  private async getDefaultSiteId(): Promise<string> {
    const existing = await this.db.query.sitesTable.findFirst();
    if (existing) return existing.id;

    const [created] = await this.db
      .insert(sitesTable)
      .values({
        name: "TechSonance Agency",
        slug: "techsonance-agency",
        domain: "techsonance.co.in",
      })
      .returning();

    return created.id;
  }

  async listTopics(options: ListTopicsOptions = {}): Promise<{ topics: Topic[]; total: number }> {
    const { status, search, limit = 50, offset = 0 } = options;

    const conditions = [];
    if (status) {
      conditions.push(eq(topicsTable.status, status));
    }
    if (search && search.trim().length > 0) {
      conditions.push(ilike(topicsTable.title, `%${search.trim()}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [topics, countResult] = await Promise.all([
      this.db
        .select()
        .from(topicsTable)
        .where(whereClause)
        .orderBy(desc(topicsTable.priority), desc(topicsTable.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(topicsTable)
        .where(whereClause),
    ]);

    return {
      topics,
      total: countResult[0]?.count ?? 0,
    };
  }

  async getTopicById(id: string): Promise<Topic | null> {
    const [topic] = await this.db
      .select()
      .from(topicsTable)
      .where(eq(topicsTable.id, id))
      .limit(1);
    return topic ?? null;
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

    const [created] = await this.db
      .insert(topicsTable)
      .values({
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
      })
      .returning();

    return created;
  }

  async updateTopicStatus(id: string, status: AiTopicStatus): Promise<Topic> {
    const [updated] = await this.db
      .update(topicsTable)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(topicsTable.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Topic not found: ${id}`);
    }

    return updated;
  }

  async deleteTopic(id: string): Promise<void> {
    await this.db.delete(topicsTable).where(eq(topicsTable.id, id));
  }

  async suggestTopicsWithAI(category = "Full-Stack & Agentic AI"): Promise<Topic[]> {
    const siteId = await this.getDefaultSiteId();

    try {
      const systemPrompt = `You are the Lead Content Strategist for TechSonance Infotech, a premier software engineering & AI innovation agency.
Suggest 4 timely, authoritative, high-ranking blog topic ideas. Target audience: CTOs, Tech Leads, Senior Engineers.
Respond strictly with a valid JSON array of objects with keys: title, keywords (3-5 strings), category, targetAudience, difficulty ('beginner' | 'intermediate' | 'advanced'), notes.`;

      const userPrompt = `Focus area / Category: ${category}`;

      const responseText = await this.aiWriter.generateRaw(systemPrompt, userPrompt);
      
      // Parse JSON from LLM response (handling potential markdown code block formatting)
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
        throw new Error("Invalid proposals payload from LLM");
      }

      const insertedTopics: Topic[] = [];
      for (const p of topicProposals) {
        if (!p.title) continue;
        const [inserted] = await this.db
          .insert(topicsTable)
          .values({
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
          })
          .returning();
        insertedTopics.push(inserted);
      }

      return insertedTopics;
    } catch (err) {
      logger.error("Failed to suggest topics via AI", { error: err });
      // Fallback: insert high-value deterministic curated topics
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

      const insertedFallbacks: Topic[] = [];
      for (const f of fallbacks) {
        const [inserted] = await this.db
          .insert(topicsTable)
          .values({
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
          })
          .returning();
        insertedFallbacks.push(inserted);
      }

      return insertedFallbacks;
    }
  }

  async launchTopicGeneration(topicId: string): Promise<{ jobId: string }> {
    const topic = await this.getTopicById(topicId);
    if (!topic) {
      throw new Error(`Topic not found: ${topicId}`);
    }

    // Mark topic as QUEUED
    await this.updateTopicStatus(topicId, AiTopicStatus.QUEUED);

    // Start autonomous pipeline
    const job = await this.jobOrchestrator.createJob({
      topicText: topic.title,
      category: topic.category ?? "Engineering",
    });

    // Run execution in the background asynchronously
    this.jobOrchestrator.executeJob(job.id).catch((err) => {
      logger.error("Autonomous execution error for topic job", { jobId: job.id, error: err });
    });

    return { jobId: job.id };
  }
}
