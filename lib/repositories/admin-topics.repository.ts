import "server-only";
import { inject } from "@needle-di/core";
import { and, count, desc, eq, exists, ilike, or, sql } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { Database } from "@/lib/database/index";
import {
  topicsTable,
  generationJobsTable,
  postsTable,
  sitesTable,
  type Topic,
  type InsertTopic,
} from "@/lib/database/schema/index.schema";
import { AiTopicStatus, AiJobStatus } from "@/lib/database/enum/ai.enum";
import { mapDbError } from "@/lib/dbErrors";

export interface ListAdminTopicsOptions {
  status?: AiTopicStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export class AdminTopicsRepository {
  constructor(private db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  async getDefaultSiteId(): Promise<string> {
    try {
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
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminTopicsRepository.getDefaultSiteId",
      });
    }
  }

  async listTopics(
    options: ListAdminTopicsOptions = {},
  ): Promise<{ topics: Topic[]; total: number }> {
    const { status, search, limit = 50, offset = 0 } = options;

    const conditions = [];
    if (status) conditions.push(eq(topicsTable.status, status));
    if (search && search.trim()) {
      conditions.push(ilike(topicsTable.title, `%${search.trim()}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    try {
      const [topics, totalResult] = await Promise.all([
        this.db
          .select()
          .from(topicsTable)
          .where(whereClause)
          .orderBy(desc(topicsTable.priority), desc(topicsTable.createdAt))
          .limit(limit)
          .offset(offset),
        this.db.select({ cnt: count() }).from(topicsTable).where(whereClause),
      ]);

      return {
        topics,
        total: totalResult[0]?.cnt ?? 0,
      };
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminTopicsRepository.listTopics",
      });
    }
  }

  async findById(id: string): Promise<Topic | null> {
    if (!id || !id.trim()) return null;

    try {
      const [topic] = await this.db
        .select()
        .from(topicsTable)
        .where(eq(topicsTable.id, id))
        .limit(1);

      return topic ?? null;
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminTopicsRepository.findById",
        id,
      });
    }
  }

  async findByTitle(title: string): Promise<Topic | null> {
    if (!title || !title.trim()) return null;

    try {
      const [topic] = await this.db
        .select()
        .from(topicsTable)
        .where(eq(topicsTable.title, title.trim()))
        .limit(1);

      return topic ?? null;
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminTopicsRepository.findByTitle",
      });
    }
  }

  async reconcileCompletedTopics(): Promise<number> {
    try {
      const completedJobExists = exists(
        this.db
          .select({ id: generationJobsTable.id })
          .from(generationJobsTable)
          .where(
            and(
              eq(generationJobsTable.status, AiJobStatus.COMPLETED),
              or(
                eq(generationJobsTable.topicId, topicsTable.id),
                sql`LOWER(TRIM(${generationJobsTable.topicText})) = LOWER(TRIM(${topicsTable.title}))`,
              ),
            ),
          ),
      );

      const matchingPostExists = exists(
        this.db
          .select({ id: postsTable.id })
          .from(postsTable)
          .where(sql`LOWER(TRIM(${postsTable.title})) = LOWER(TRIM(${topicsTable.title}))`),
      );

      const updated = await this.db
        .update(topicsTable)
        .set({
          status: AiTopicStatus.GENERATED,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(topicsTable.status, AiTopicStatus.QUEUED),
            or(completedJobExists, matchingPostExists),
          ),
        )
        .returning({ id: topicsTable.id });

      return updated.length;
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminTopicsRepository.reconcileCompletedTopics",
      });
    }
  }

  async create(data: InsertTopic): Promise<Topic> {
    try {
      const [created] = await this.db.insert(topicsTable).values(data).returning();
      return created;
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminTopicsRepository.create",
      });
    }
  }

  async update(id: string, patch: Partial<InsertTopic>): Promise<Topic | null> {
    if (!id || !id.trim()) return null;

    try {
      const [updated] = await this.db
        .update(topicsTable)
        .set({
          ...patch,
          updatedAt: new Date(),
        })
        .where(eq(topicsTable.id, id))
        .returning();

      return updated ?? null;
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminTopicsRepository.update",
        id,
      });
    }
  }

  async delete(id: string): Promise<boolean> {
    if (!id || !id.trim()) return false;

    try {
      const [deleted] = await this.db.delete(topicsTable).where(eq(topicsTable.id, id)).returning();

      return !!deleted;
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminTopicsRepository.delete",
        id,
      });
    }
  }
}
