import "server-only";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { approveJobParamsSchema, approveJobBodySchema } from "@/lib/contracts/admin-jobs.contract";
import { AppError, ErrorCode, STATUS_BY_CODE, toFieldErrors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";
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
            message: "Forbidden origin",
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
          message: "Forbidden origin",
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
            message: CAREER_ERRORS.UNAUTHORIZED,
            requestId,
          },
          code: ErrorCode.UNAUTHENTICATED,
          message: CAREER_ERRORS.UNAUTHORIZED,
        },
        { status: 401, headers },
      );
    }

    if (session.role !== "owner" && session.role !== "admin") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: CAREER_ERRORS.FORBIDDEN_ADMIN_OR_OWNER,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
          message: CAREER_ERRORS.FORBIDDEN_ADMIN_OR_OWNER,
        },
        { status: 403, headers },
      );
    }

    // 3. Params validation
    const rawParams = await params;
    const paramsResult = approveJobParamsSchema.safeParse(rawParams);
    if (!paramsResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: "Invalid job ID parameter",
            fieldErrors: toFieldErrors(paramsResult.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
          message: "Invalid job ID parameter",
        },
        { status: 400, headers },
      );
    }
    const { id } = paramsResult.data;

    // 4. Body validation (optional comment)
    let comment: string | undefined;
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      let rawBody: unknown;
      try {
        const text = await req.text();
        rawBody = text ? JSON.parse(text) : {};
      } catch {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: ErrorCode.BAD_REQUEST,
              message: "Malformed JSON payload",
              requestId,
            },
            code: ErrorCode.BAD_REQUEST,
            message: "Malformed JSON payload",
          },
          { status: 400, headers },
        );
      }

      const bodyResult = approveJobBodySchema.safeParse(rawBody);
      if (!bodyResult.success) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: ErrorCode.VALIDATION,
              message: "Invalid approval request body",
              fieldErrors: toFieldErrors(bodyResult.error),
              requestId,
            },
            code: ErrorCode.VALIDATION,
            message: "Invalid approval request body",
          },
          { status: 400, headers },
        );
      }
      comment = bodyResult.data.comment;
    }

    // 5. Execution
    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const jobsService = container.get(AdminJobsService);
    const updated = await jobsService.approveJob(id, session.userId, comment, ipAddress);

    return NextResponse.json(
      {
        ok: true,
        data: {
          job: updated,
        },
        job: updated,
      },
      { status: 200, headers },
    );
  } catch (error: unknown) {
    if (error instanceof AppError) {
      const status = STATUS_BY_CODE[error.code] || 400;
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
          message: error.message,
        },
        { status, headers },
      );
    }

    logger.error("Admin approve job error", { error: String(error), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: CAREER_ERRORS.FAILED_APPROVE_JOB,
          requestId,
        },
        code: ErrorCode.INTERNAL,
        message: CAREER_ERRORS.FAILED_APPROVE_JOB,
      },
      { status: 500, headers },
    );
  }
}
