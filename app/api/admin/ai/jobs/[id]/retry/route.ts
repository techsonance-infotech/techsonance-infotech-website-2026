import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { JobOrchestratorService } from "@/lib/services/job-orchestrator.service";
import { aiJobParamsSchema } from "@/lib/contracts/admin-ai-jobs.contract";
import { AppError, ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { AI_JOBS_ERRORS } from "@/lib/constants/ai.constants";
import { getRequestId } from "@/lib/server/requestContext";
import { isAllowedOrigin } from "@/lib/utils/text";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = await getRequestId();
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("x-request-id", requestId);
  headers.set("Cache-Control", "private, no-store");

  try {
    // 1. Origin check
    const origin = req.headers.get("origin");
    if (origin && !isAllowedOrigin(origin)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: AI_JOBS_ERRORS.FORBIDDEN_ORIGIN,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
        },
        { status: 403, headers },
      );
    }

    // 2. Auth session check
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.UNAUTHENTICATED,
            message: AI_JOBS_ERRORS.UNAUTHORIZED,
            requestId,
          },
          code: ErrorCode.UNAUTHENTICATED,
        },
        { status: 401, headers },
      );
    }

    // 3. RBAC permission check: Editor+ required to retry AI jobs
    if (!authService.hasPermission(session.role, "editor")) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: AI_JOBS_ERRORS.FORBIDDEN_ROLE,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
        },
        { status: 403, headers },
      );
    }

    // 4. Validate job id param
    const rawParams = await params;
    const parsedParams = aiJobParamsSchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: "Invalid job ID format",
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 422, headers },
      );
    }

    const { id } = parsedParams.data;
    const orchestrator = container.get(JobOrchestratorService);
    const job = await orchestrator.retryJob(id);

    logger.info("Autonomous AI generation job retry initiated", {
      jobId: id,
      actorId: session.userId,
      requestId,
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          job,
          message: "Generation job restarted and queued for execution.",
        },
        job,
      },
      { status: 200, headers },
    );
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: err.code,
            message: err.message,
            requestId,
          },
          code: err.code,
        },
        { status: err.code === ErrorCode.NOT_FOUND ? 404 : 500, headers },
      );
    }

    logger.error("Admin retry AI job error", { error: err, requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: "Failed to retry generation job",
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}
