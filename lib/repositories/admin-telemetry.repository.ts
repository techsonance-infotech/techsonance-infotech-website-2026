import "server-only";
import { inject } from "@needle-di/core";
import { and, desc, eq, gte, or, sql } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { Database } from "@/lib/database/index";
import {
  usageEventsTable,
  generationJobsTable,
  postsTable,
  type UsageEvent,
  type InsertUsageEvent,
} from "@/lib/database/schema/index.schema";
import { AiJobStatus } from "@/lib/database/enum/ai.enum";
import { mapDbError } from "@/lib/dbErrors";

export class AdminTelemetryRepository {
  constructor(private db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  async insertEvent(event: InsertUsageEvent): Promise<UsageEvent> {
    try {
      const [inserted] = await this.db.insert(usageEventsTable).values(event).returning();
      return inserted;
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminTelemetryRepository.insertEvent",
      });
    }
  }

  async getTelemetryAggregates(startOfToday: Date, startOfWeek: Date) {
    try {
      const [
        tokenTodayRes,
        tokenWeekRes,
        dailyPostsRes,
        weeklyPostsRes,
        totalJobsRes,
        activeJobsRes,
        providerStatsRes,
        recentEvents,
      ] = await Promise.all([
        this.db
          .select({ sum: sql<number>`COALESCE(SUM(total_tokens), 0)::int` })
          .from(usageEventsTable)
          .where(gte(usageEventsTable.timestamp, startOfToday)),
        this.db
          .select({ sum: sql<number>`COALESCE(SUM(total_tokens), 0)::int` })
          .from(usageEventsTable)
          .where(gte(usageEventsTable.timestamp, startOfWeek)),
        this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(postsTable)
          .where(
            and(eq(postsTable.status, "PUBLISHED"), gte(postsTable.publishedAt, startOfToday)),
          ),
        this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(postsTable)
          .where(and(eq(postsTable.status, "PUBLISHED"), gte(postsTable.publishedAt, startOfWeek))),
        this.db.select({ count: sql<number>`count(*)::int` }).from(generationJobsTable),
        this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(generationJobsTable)
          .where(
            or(
              eq(generationJobsTable.status, AiJobStatus.RUNNING),
              eq(generationJobsTable.status, AiJobStatus.QUEUED),
            ),
          ),
        this.db
          .select({
            provider: usageEventsTable.provider,
            totalCalls: sql<number>`count(*)::int`,
            successCalls: sql<number>`COALESCE(SUM(CASE WHEN ${usageEventsTable.status} = 'SUCCESS' THEN 1 ELSE 0 END), 0)::int`,
            avgDurationMs: sql<number>`COALESCE(AVG(${usageEventsTable.durationMs}), 0)::int`,
          })
          .from(usageEventsTable)
          .groupBy(usageEventsTable.provider),
        this.db.select().from(usageEventsTable).orderBy(desc(usageEventsTable.timestamp)).limit(20),
      ]);

      return {
        tokensToday: tokenTodayRes[0]?.sum ?? 0,
        tokensThisWeek: tokenWeekRes[0]?.sum ?? 0,
        dailyPostsUsed: dailyPostsRes[0]?.count ?? 0,
        weeklyPostsUsed: weeklyPostsRes[0]?.count ?? 0,
        totalJobs: totalJobsRes[0]?.count ?? 0,
        activeJobs: activeJobsRes[0]?.count ?? 0,
        providerStats: providerStatsRes || [],
        recentEvents: recentEvents || [],
      };
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminTelemetryRepository.getTelemetryAggregates",
      });
    }
  }
}
