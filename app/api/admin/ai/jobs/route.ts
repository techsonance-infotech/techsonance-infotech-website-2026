import "server-only";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { JobOrchestratorService } from "@/lib/services/job-orchestrator.service";
import {
  createAiJobSchema,
  listAiJobsQuerySchema,
} from "@/lib/contracts/admin-ai-jobs.contract";
import { AppError, ErrorCode, toFieldErrors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { AI_JOBS_ERRORS, AI_JOBS_MESSAGES } from "@/lib/constants/ai.constants";
import { getRequestId } from "@/lib/server/requestContext";
import { isAllowedOrigin } from "@/lib/utils/text";

export const runtime = "nodejs";

export async function GET(req: Request) {
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

    // 3. Query params validation
    const url = new URL(req.url);
    const rawLimit = url.searchParams.get("limit");
    const parsedQuery = listAiJobsQuerySchema.safeParse(
      rawLimit ? { limit: rawLimit } : {},
    );

    const limit = parsedQuery.success ? parsedQuery.data.limit ?? 30 : 30;

    // 4. Fetch AI jobs from service
    const orchestrator = container.get(JobOrchestratorService);
    const jobs = await orchestrator.listJobs(limit);

    return NextResponse.json(
      {
        ok: true,
        data: {
          jobs,
          count: jobs.length,
        },
        jobs, // Backward compatibility for legacy clients
      },
      { status: 200, headers },
    );
  } catch (err: unknown) {
    logger.error("Admin list AI jobs error", { error: String(err), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: AI_JOBS_ERRORS.LIST_FAILED,
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}

export async function POST(req: Request) {
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

    // 3. RBAC permission check: Editor+ required to trigger AI jobs
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

    // 4. Request payload validation
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      rawBody = {};
    }

    const parseResult = createAiJobSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: "Validation failed",
            fieldErrors: toFieldErrors(parseResult.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 422, headers },
      );
    }

    const { topicText, category, siteId } = parseResult.data;
    const orchestrator = container.get(JobOrchestratorService);

    const job = await orchestrator.createJob({
      topicText,
      category,
      siteId,
    });

    // Enqueue 6-step generation in background
    orchestrator.executeJob(job.id).catch((e) => {
      logger.error(`Background AI generation job ${job.id} execution failed`, {
        error: String(e),
        requestId,
      });
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          job,
          message: AI_JOBS_MESSAGES.JOB_ENQUEUED,
        },
        job, // Backward compatibility
        message: AI_JOBS_MESSAGES.JOB_ENQUEUED,
      },
      { status: 201, headers },
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
        { status: err.code === ErrorCode.FORBIDDEN ? 403 : 500, headers },
      );
    }

    logger.error("Admin trigger AI job error", { error: String(err), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: AI_JOBS_ERRORS.TRIGGER_FAILED,
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}
