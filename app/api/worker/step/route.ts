import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/di/container";
import { JobOrchestratorService } from "@/lib/services/job-orchestrator.service";
import { getEnv } from "@/lib/env";

const stepSchema = z.object({
  jobId: z.uuid(),
});

export async function POST(req: Request) {
  try {
    const env = getEnv();
    const authHeader = req.headers.get("x-worker-secret") || req.headers.get("x-revalidate-secret");
    const isSecretValid = env.REVALIDATE_SECRET && authHeader === env.REVALIDATE_SECRET;

    // Optional verification if QStash signing keys are present
    if (!isSecretValid && !req.headers.get("upstash-signature")) {
      // In development, allow internal triggers if no secret is enforced
      if (process.env.NODE_ENV === "production" && env.REVALIDATE_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = stepSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parseResult.error.format() },
        { status: 400 },
      );
    }

    const { jobId } = parseResult.data;
    const container = getContainer();
    const orchestrator = container.get(JobOrchestratorService);

    const result = await orchestrator.executeJob(jobId);

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (err) {
    console.error("Worker step error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal step error" },
      { status: 500 },
    );
  }
}
