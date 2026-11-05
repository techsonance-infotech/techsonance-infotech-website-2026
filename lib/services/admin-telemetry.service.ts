import "server-only";
import { inject } from "@needle-di/core";
import { sql, desc, gte, eq } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { Database } from "@/lib/database";
import {
  usageEventsTable,
  generationJobsTable,
  postsTable,
  type UsageEvent,
  type InsertUsageEvent,
} from "@/lib/database/schema/index.schema";
import { getEnv } from "@/lib/env";

export interface TelemetrySummary {
  tokensToday: number;
  tokensThisWeek: number;
  dailyPostsUsed: number;
  dailyPostCap: number;
  weeklyPostsUsed: number;
  weeklyPostCap: number;
  totalJobs: number;
  activeJobs: number;
  providerStats: Array<{
    provider: string;
    totalCalls: number;
    successCalls: number;
    avgDurationMs: number;
  }>;
  recentEvents: UsageEvent[];
}

export class AdminTelemetryService {
  constructor(private readonly db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  async recordEvent(event: InsertUsageEvent): Promise<UsageEvent> {
    const [inserted] = await this.db.insert(usageEventsTable).values(event).returning();
    return inserted;
  }

  async getTelemetrySummary(): Promise<TelemetrySummary> {
    const env = getEnv();
    const dailyCap = env.AI_BLOG_DAILY_CAP ?? 1;
    const weeklyCap = env.AI_BLOG_WEEKLY_CAP ?? 3;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    // 1. Tokens today & this week
    const [tokenTodayRes, tokenWeekRes] = await Promise.all([
      this.db
        .select({ sum: sql<number>`COALESCE(SUM(total_tokens), 0)::int` })
        .from(usageEventsTable)
        .where(gte(usageEventsTable.timestamp, startOfToday)),
      this.db
        .select({ sum: sql<number>`COALESCE(SUM(total_tokens), 0)::int` })
        .from(usageEventsTable)
        .where(gte(usageEventsTable.timestamp, startOfWeek)),
    ]);

    // 2. Posts generated today & this week
    const [postsTodayRes, postsWeekRes] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(postsTable)
        .where(
          sql`${postsTable.aiGenerated} = true AND ${postsTable.createdAt} >= ${startOfToday.toISOString()}`
        ),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(postsTable)
        .where(
          sql`${postsTable.aiGenerated} = true AND ${postsTable.createdAt} >= ${startOfWeek.toISOString()}`
        ),
    ]);

    // 3. Provider performance aggregation
    const providerStatsRes = await this.db
      .select({
        provider: usageEventsTable.provider,
        totalCalls: sql<number>`count(*)::int`,
        successCalls: sql<number>`count(CASE WHEN ${usageEventsTable.status} = 'SUCCESS' THEN 1 END)::int`,
        avgDurationMs: sql<number>`COALESCE(ROUND(AVG(${usageEventsTable.durationMs})), 0)::int`,
      })
      .from(usageEventsTable)
      .groupBy(usageEventsTable.provider);

    // 4. Jobs overview
    const [totalJobsRes, activeJobsRes] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)::int` }).from(generationJobsTable),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(generationJobsTable)
        .where(sql`${generationJobsTable.status} IN ('pending', 'running')`),
    ]);

    // 5. Recent events
    const recentEvents = await this.db
      .select()
      .from(usageEventsTable)
      .orderBy(desc(usageEventsTable.timestamp))
      .limit(20);

    return {
      tokensToday: tokenTodayRes[0]?.sum ?? 0,
      tokensThisWeek: tokenWeekRes[0]?.sum ?? 0,
      dailyPostsUsed: postsTodayRes[0]?.count ?? 0,
      dailyPostCap: dailyCap,
      weeklyPostsUsed: postsWeekRes[0]?.count ?? 0,
      weeklyPostCap: weeklyCap,
      totalJobs: totalJobsRes[0]?.count ?? 0,
      activeJobs: activeJobsRes[0]?.count ?? 0,
      providerStats: providerStatsRes.map((p) => ({
        provider: p.provider,
        totalCalls: p.totalCalls,
        successCalls: p.successCalls,
        avgDurationMs: p.avgDurationMs,
      })),
      recentEvents,
    };
  }
}
