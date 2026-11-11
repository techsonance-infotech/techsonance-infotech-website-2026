import "server-only";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { JobOrchestratorService } from "@/lib/services/job-orchestrator.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import {
  adminPostParamsSchema,
  aiReviseAdminPostSchema,
} from "@/lib/contracts/admin-posts.contract";
import { logger } from "@/lib/logger";
import { AppError, ErrorCode, STATUS_BY_CODE, toFieldErrors } from "@/lib/errors";
import { POST_ERRORS } from "@/lib/constants/posts.constants";
import { getRequestId } from "@/lib/server/requestContext";
import { isAllowedOrigin } from "@/lib/utils/text";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
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
            message: POST_ERRORS.FORBIDDEN_ORIGIN,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
        },
        { status: 403, headers },
      );
    }

    // 2. Auth check
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.UNAUTHENTICATED,
            message: POST_ERRORS.UNAUTHORIZED,
            requestId,
          },
          code: ErrorCode.UNAUTHENTICATED,
        },
        { status: 401, headers },
      );
    }

    // 3. RBAC check (editor or higher required)
    if (!authService.hasPermission(session.role, "editor")) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: "Insufficient permissions to execute AI content revision",
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
        },
        { status: 403, headers },
      );
    }

    // 4. Parameter validation
    const resolvedParams = await params;
    const paramsResult = adminPostParamsSchema.safeParse(resolvedParams);
    if (!paramsResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: POST_ERRORS.INVALID_ID,
            fieldErrors: toFieldErrors(paramsResult.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 400, headers },
      );
    }

    const { id } = paramsResult.data;

    // 5. Body validation
    const rawBody = await req.json().catch(() => ({}));
    const bodyResult = aiReviseAdminPostSchema.safeParse(rawBody);
    if (!bodyResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: "Invalid revision instructions",
            fieldErrors: toFieldErrors(bodyResult.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 400, headers },
      );
    }

    const { instruction, targetSectionHeading, autoPublish } = bodyResult.data;

    // 6. Execution via JobOrchestratorService
    const orchestrator = container.get(JobOrchestratorService);
    const result = await orchestrator.revisePostContent({
      postId: id,
      instruction,
      targetSectionHeading,
      autoPublish,
    });

    return NextResponse.json(
      {
        ok: true,
        data: result,
        message: "Content revision completed successfully by agent pipeline",
      },
      { status: 200, headers },
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
            fieldErrors: error.fieldErrors,
            requestId,
          },
          code: error.code,
        },
        { status: STATUS_BY_CODE[error.code] || 400, headers },
      );
    }

    logger.error("AI content revision error", { error: String(error), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: "Failed to execute AI content revision",
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}
