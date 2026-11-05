import "server-only";
import { inject } from "@needle-di/core";
import { AdminTelemetryRepository } from "@/lib/repositories/admin-telemetry.repository";
import type { UsageEvent, InsertUsageEvent } from "@/lib/database/schema/index.schema";
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
  constructor(
    private readonly telemetryRepo: AdminTelemetryRepository = inject(AdminTelemetryRepository),
  ) {}

  async recordEvent(event: InsertUsageEvent): Promise<UsageEvent> {
    return this.telemetryRepo.insertEvent(event);
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

    const aggregates = await this.telemetryRepo.getTelemetryAggregates(startOfToday, startOfWeek);

    return {
      tokensToday: aggregates.tokensToday,
      tokensThisWeek: aggregates.tokensThisWeek,
      dailyPostsUsed: aggregates.dailyPostsUsed,
      dailyPostCap: dailyCap,
      weeklyPostsUsed: aggregates.weeklyPostsUsed,
      weeklyPostCap: weeklyCap,
      totalJobs: aggregates.totalJobs,
      activeJobs: aggregates.activeJobs,
      providerStats: aggregates.providerStats,
      recentEvents: aggregates.recentEvents,
    };
  }
}
