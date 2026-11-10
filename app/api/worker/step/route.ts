import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/di/container";
import { JobOrchestratorService } from "@/lib/services/job-orchestrator.service";
import { getQStashReceiver } from "@/lib/services/qstash.service";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

const stepSchema = z.object({
  jobId: z.uuid(),
  step: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const env = getEnv();
    const rawBody = await req.text();
    const authHeader = req.headers.get("x-worker-secret") || req.headers.get("x-revalidate-secret");
    const upstashSignature = req.headers.get("upstash-signature");

    let isAuthorized = Boolean(
      (env.REVALIDATE_SECRET && authHeader === env.REVALIDATE_SECRET) ||
      (env.CRON_SECRET && authHeader === env.CRON_SECRET)
    );

    // Verify QStash receiver signature if present
    if (!isAuthorized && upstashSignature) {
      const receiver = getQStashReceiver();
      if (receiver) {
        try {
          const isValid = await receiver.verify({
            signature: upstashSignature,
            body: rawBody,
            url: req.url,
          });
          if (isValid) isAuthorized = true;
        } catch (verifyErr) {
          logger.warn("QStash signature verification failed", { error: String(verifyErr) });
        }
      } else {
        // Fallback for QStash token presence
        isAuthorized = true;
      }
    }

    if (process.env.NODE_ENV === "production" && !isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = {};
    }

    const parseResult = stepSchema.safeParse(parsedBody);

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
    logger.error("Worker step error", { error: err });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal step error" },
      { status: 500 },
    );
  }
}
