import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminTelemetryService } from "@/lib/services/admin-telemetry.service";
import { AdminTopicsService } from "@/lib/services/admin-topics.service";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { MediaService } from "@/lib/services/media.service";
import { BlogSchedulerService } from "@/lib/services/blog-scheduler.service";
import { GenerationJobsRepository } from "@/lib/repositories/generation-jobs.repository";
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
  const generationJobsRepo = container.get(GenerationJobsRepository);

  // 1. Run Careers Lifecycle Sweep (publish scheduled roles & close expired roles)
  let careersSweep = { publishedCount: 0, closedCount: 0 };
  try {
    careersSweep = await jobsService.sweepExpiredAndScheduledJobs();
  } catch (sweepErr) {
    logger.warn(`Careers lifecycle sweep encountered non-blocking error: ${String(sweepErr)}`);
  }

  // 2. Run Stalled Generation Job Recovery Sweep (recovers jobs stuck in RUNNING limbo)
  let stalledRecovery = { recovered: 0, failed: 0 };
  try {
    stalledRecovery = await generationJobsRepo.recoverStalledJobs();
    if (stalledRecovery.recovered > 0 || stalledRecovery.failed > 0) {
      logger.info("Stalled generation jobs swept", stalledRecovery);
    }
  } catch (recoveryErr) {
    logger.warn(
      `Stalled generation job sweep encountered non-blocking error: ${String(recoveryErr)}`,
    );
  }

  // 3. Run Media Recycle Bin Sweep (permanently cleans up assets in bin for >= 15-30 days)
  try {
    const mediaService = container.get(MediaService);
    const mediaBinSweep = await mediaService.cleanupExpiredTrash();
    if (mediaBinSweep.purgedCount > 0) {
      logger.info("Media recycle bin sweep purged expired assets", {
        purgedCount: mediaBinSweep.purgedCount,
        checkedCount: mediaBinSweep.checkedCount,
      });
    }
  } catch (mediaErr) {
    logger.warn(`Media recycle bin sweep encountered non-blocking error: ${String(mediaErr)}`);
  }

  try {
    const summary = await telemetry.getTelemetrySummary();
    const scheduler = container.get(BlogSchedulerService);

    // 4. Evaluate randomized daytime schedule (2 to 3 blogs per week, random order & daytime timing)
    const scheduleEvaluation = scheduler.evaluateSchedule(
      summary.weeklyPostsUsed,
      summary.dailyPostsUsed,
    );

    if (!scheduleEvaluation.shouldGenerate) {
      logger.info("Autonomous cron skipped by randomized daytime schedule", {
        reason: scheduleEvaluation.reason,
        weekKey: scheduleEvaluation.weekKey,
        weeklyTarget: scheduleEvaluation.weeklyTarget,
        weeklyUsageRatio: scheduleEvaluation.weeklyUsageRatio,
        scheduledDays: scheduleEvaluation.scheduledDays,
        currentTime: scheduleEvaluation.currentTimeFormatted,
        isDaytime: scheduleEvaluation.isDaytime,
      });

      return NextResponse.json({
        success: true,
        skipped: true,
        reason: scheduleEvaluation.reason,
        schedule: {
          weekKey: scheduleEvaluation.weekKey,
          weeklyTarget: scheduleEvaluation.weeklyTarget,
          scheduledDays: scheduleEvaluation.scheduledDays,
          currentTime: scheduleEvaluation.currentTimeFormatted,
          isDaytime: scheduleEvaluation.isDaytime,
          usage: scheduleEvaluation.weeklyUsageRatio,
        },
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

    logger.info("Autonomous cron triggered job on randomized daytime schedule", {
      jobId: targetJobId,
      topicTitle: targetTopicTitle,
      weekKey: scheduleEvaluation.weekKey,
      weeklyTarget: scheduleEvaluation.weeklyTarget,
      weeklyUsageRatio: scheduleEvaluation.weeklyUsageRatio,
      scheduledTime: scheduleEvaluation.todaySlot?.targetTimeFormatted,
      currentTime: scheduleEvaluation.currentTimeFormatted,
    });

    return NextResponse.json({
      success: true,
      action: "job_started",
      jobId: targetJobId,
      topic: targetTopicTitle,
      schedule: {
        weekKey: scheduleEvaluation.weekKey,
        weeklyTarget: scheduleEvaluation.weeklyTarget,
        scheduledTime: scheduleEvaluation.todaySlot?.targetTimeFormatted,
        currentTime: scheduleEvaluation.currentTimeFormatted,
      },
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
