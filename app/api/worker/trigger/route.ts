import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/di/container";
import { JobOrchestratorService } from "@/lib/services/job-orchestrator.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

const triggerSchema = z.object({
  topicText: z.string().optional(),
  category: z.string().optional().default("Engineering"),
});

export async function POST(req: Request) {
  try {
    const env = getEnv();
    const container = getContainer();

    // Verify caller: check admin session OR secret header
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    const authHeader = req.headers.get("x-worker-secret") || req.headers.get("x-revalidate-secret");
    const isSecretValid = env.REVALIDATE_SECRET && authHeader === env.REVALIDATE_SECRET;

    if (!session && !isSecretValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await req.json().catch(() => ({}));
    const parsed = triggerSchema.safeParse(rawBody);
    const data = parsed.success ? parsed.data : { category: "Engineering" };

    const topic =
      data.topicText ||
      "Building Zero-Downtime Multi-Region Database Architectures with Drizzle & PostgreSQL";

    const orchestrator = container.get(JobOrchestratorService);
    const job = await orchestrator.createJob({
      topicText: topic,
      category: data.category,
    });

    // Execute the job asynchronously or synchronously
    const executionPromise = orchestrator.executeJob(job.id);

    // If caller wants synchronous response, wait for it; otherwise return job ID immediately
    const syncParam = new URL(req.url).searchParams.get("sync");
    if (syncParam === "true") {
      const result = await executionPromise;
      return NextResponse.json({ ok: true, job, result });
    }

    return NextResponse.json({
      ok: true,
      jobId: job.id,
      status: job.status,
      message: "Autonomous generation job enqueued",
    });
  } catch (err) {
    logger.error("Worker trigger error", { error: err });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
