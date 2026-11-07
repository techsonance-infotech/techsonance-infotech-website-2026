import "server-only";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { updateJobSchema } from "@/lib/validations/careers";
import { jobByIdParamsSchema } from "@/lib/contracts/admin-jobs.contract";
import { logger } from "@/lib/logger";
import { AppError, ErrorCode, STATUS_BY_CODE, toFieldErrors } from "@/lib/errors";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";
import { getRequestId } from "@/lib/server/requestContext";
import { isAllowedOrigin } from "@/lib/utils/text";
import type { InsertJob } from "@/lib/database/schema/index.schema";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ALLOWED_ADMIN_ROLES = new Set(["owner", "admin", "recruiter", "editor"]);
const DESTRUCTIVE_ADMIN_ROLES = new Set(["owner", "admin"]);

export async function GET(req: Request, { params }: RouteParams) {
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

    const role = (session.role || "").toLowerCase();
    if (!ALLOWED_ADMIN_ROLES.has(role)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: CAREER_ERRORS.FORBIDDEN_ROLE_TRANSITION,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
          message: CAREER_ERRORS.FORBIDDEN_ROLE_TRANSITION,
        },
        { status: 403, headers },
      );
    }

    // 3. Params validation
    const rawParams = await params;
    const paramsResult = jobByIdParamsSchema.safeParse(rawParams);
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

    // 4. Execution
    const jobsService = container.get(AdminJobsService);
    const job = await jobsService.getJobById(id);

    if (!job) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: CAREER_ERRORS.JOB_NOT_FOUND,
            requestId,
          },
          code: ErrorCode.NOT_FOUND,
          message: CAREER_ERRORS.JOB_NOT_FOUND,
        },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          job,
        },
        job,
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

    logger.error("Get job error", { error: String(error), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: CAREER_ERRORS.FAILED_GET_JOB,
          requestId,
        },
        code: ErrorCode.INTERNAL,
        message: CAREER_ERRORS.FAILED_GET_JOB,
      },
      { status: 500, headers },
    );
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
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

    const role = (session.role || "").toLowerCase();
    if (!ALLOWED_ADMIN_ROLES.has(role)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: CAREER_ERRORS.FORBIDDEN_ROLE_TRANSITION,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
          message: CAREER_ERRORS.FORBIDDEN_ROLE_TRANSITION,
        },
        { status: 403, headers },
      );
    }

    // 3. Params validation
    const rawParams = await params;
    const paramsResult = jobByIdParamsSchema.safeParse(rawParams);
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

    // 4. Body validation
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

    const parseResult = updateJobSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: "Job update validation failed",
            fieldErrors: toFieldErrors(parseResult.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
          message: "Job update validation failed",
        },
        { status: 400, headers },
      );
    }

    // 5. Execution
    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const jobsService = container.get(AdminJobsService);
    const updated = await jobsService.updateJob(
      id,
      parseResult.data as Partial<InsertJob>,
      session.userId,
      ipAddress,
    );

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

    logger.error("Update job error", { error: String(error), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: CAREER_ERRORS.FAILED_UPDATE_JOB,
          requestId,
        },
        code: ErrorCode.INTERNAL,
        message: CAREER_ERRORS.FAILED_UPDATE_JOB,
      },
      { status: 500, headers },
    );
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
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

    // 3. Strict role check for destructive deletion (owner or admin only)
    const role = (session.role || "").toLowerCase();
    if (!DESTRUCTIVE_ADMIN_ROLES.has(role)) {
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

    // 4. Params validation
    const rawParams = await params;
    const paramsResult = jobByIdParamsSchema.safeParse(rawParams);
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

    // 5. Execution
    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const jobsService = container.get(AdminJobsService);
    const deleted = await jobsService.deleteJob(id, session.userId, ipAddress);

    if (!deleted) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: CAREER_ERRORS.JOB_NOT_FOUND,
            requestId,
          },
          code: ErrorCode.NOT_FOUND,
          message: CAREER_ERRORS.JOB_NOT_FOUND,
        },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          success: true,
        },
        success: true,
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

    logger.error("Delete job error", { error: String(error), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: CAREER_ERRORS.FAILED_DELETE_JOB,
          requestId,
        },
        code: ErrorCode.INTERNAL,
        message: CAREER_ERRORS.FAILED_DELETE_JOB,
      },
      { status: 500, headers },
    );
  }
}
