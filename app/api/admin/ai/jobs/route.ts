import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { JobOrchestratorService } from "@/lib/services/job-orchestrator.service";
import { GenerationJobsRepository } from "@/lib/repositories/generation-jobs.repository";
import { logger } from "@/lib/logger";

const createJobSchema = z.object({
  topicText: z.string().min(5, "Topic must be at least 5 characters"),
  category: z.string().optional().default("Engineering"),
});

export async function GET() {
  try {
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobsRepo = container.get(GenerationJobsRepository);
    const jobs = await jobsRepo.listRecent(30);

    return NextResponse.json({ ok: true, jobs });
  } catch (err) {
    logger.error("Admin list AI jobs error", { error: String(err) });
    return NextResponse.json({ error: "Failed to list AI jobs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = createJobSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.format() },
        { status: 400 },
      );
    }

    const { topicText, category } = parseResult.data;
    const orchestrator = container.get(JobOrchestratorService);

    const job = await orchestrator.createJob({
      topicText,
      category,
    });

    // Execute in background
    orchestrator.executeJob(job.id).catch((e) => {
      logger.error(`Background job ${job.id} execution failed`, { error: String(e) });
    });

    return NextResponse.json({
      ok: true,
      job,
      message: "Job enqueued and generation started in background",
    });
  } catch (err) {
    logger.error("Admin trigger AI job error", { error: String(err) });
    return NextResponse.json({ error: "Failed to trigger AI job" }, { status: 500 });
  }
}
