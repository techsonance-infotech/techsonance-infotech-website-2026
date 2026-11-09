import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminTelemetryService } from "@/lib/services/admin-telemetry.service";
import { AdminTopicsService } from "@/lib/services/admin-topics.service";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { AiTopicStatus } from "@/lib/database/enum/ai.enum";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const env = getEnv();
  const authHeader = req.headers.get("Authorization");
  const providedSecret = authHeader?.replace(/^Bearer\s+/i, "") || req.headers.get("x-cron-secret");

  const validSecrets = [env.CRON_SECRET, env.REVALIDATE_SECRET].filter(Boolean);

  // If a secret is configured in env, require it
  if (validSecrets.length > 0 && (!providedSecret || !validSecrets.includes(providedSecret))) {
    return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
  }

  const container = getContainer();
  const telemetry = container.get(AdminTelemetryService);
  const topicsService = container.get(AdminTopicsService);
  const jobsService = container.get(AdminJobsService);

  // 1. Run Careers Lifecycle Sweep (publish scheduled roles & close expired roles)
  let careersSweep = { publishedCount: 0, closedCount: 0 };
  try {
    careersSweep = await jobsService.sweepExpiredAndScheduledJobs();
  } catch (sweepErr) {
    logger.warn(`Careers lifecycle sweep encountered non-blocking error: ${String(sweepErr)}`);
  }

  try {
    const summary = await telemetry.getTelemetrySummary();

    // Check caps
    if (summary.dailyPostsUsed >= summary.dailyPostCap) {
      logger.info("Autonomous cron skipped: daily post cap reached", {
        used: summary.dailyPostsUsed,
        cap: summary.dailyPostCap,
      });
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Daily cap reached",
        dailyUsage: `${summary.dailyPostsUsed}/${summary.dailyPostCap}`,
      });
    }

    if (summary.weeklyPostsUsed >= summary.weeklyPostCap) {
      logger.info("Autonomous cron skipped: weekly post cap reached", {
        used: summary.weeklyPostsUsed,
        cap: summary.weeklyPostCap,
      });
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Weekly cap reached",
        weeklyUsage: `${summary.weeklyPostsUsed}/${summary.weeklyPostCap}`,
      });
    }

    // Look for next accepted topic
    const { topics } = await topicsService.listTopics({
      status: AiTopicStatus.ACCEPTED,
      limit: 1,
    });

    let targetJobId = "";
    let targetTopicTitle = "";

    if (topics.length === 0) {
      logger.info(
        "Autonomous cron: No accepted topics in backlog. Engaging Auto-Pilot synthesis...",
      );
      const autoResult = await topicsService.autoGenerateNextTopic();
      targetJobId = autoResult.jobId;
      targetTopicTitle = autoResult.topicTitle;
    } else {
      const topic = topics[0];
      const { jobId } = await topicsService.launchTopicGeneration(topic.id);
      targetJobId = jobId;
      targetTopicTitle = topic.title;
    }

    logger.info("Autonomous cron triggered job successfully", {
      jobId: targetJobId,
      topicTitle: targetTopicTitle,
    });

    return NextResponse.json({
      success: true,
      action: "job_started",
      jobId: targetJobId,
      topic: targetTopicTitle,
    });
  } catch (error) {
    logger.error("Autonomous cron failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron execution failed" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  // Allow health check / status inspection of cron endpoint
  return POST(req);
}
