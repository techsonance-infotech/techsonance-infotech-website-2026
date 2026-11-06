import "server-only";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { ApplicationsService } from "@/lib/services/applications.service";
import { listApplicationsQuerySchema } from "@/lib/contracts/admin-applications.contract";
import { AppError, ErrorCode, STATUS_BY_CODE, toFieldErrors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";
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
            message: "Forbidden origin",
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
            message: CAREER_ERRORS.UNAUTHORIZED,
            requestId,
          },
          code: ErrorCode.UNAUTHENTICATED,
        },
        { status: 401, headers },
      );
    }

    // 3. Query parsing with strict Zod 4 schema
    const { searchParams } = new URL(req.url);
    const rawQuery = Object.fromEntries(searchParams.entries());
    const parseResult = listApplicationsQuerySchema.safeParse(rawQuery);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: "Invalid query parameters",
            fieldErrors: toFieldErrors(parseResult.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 400, headers },
      );
    }

    const { jobId, status, search, knockoutTriggered, limit, offset } = parseResult.data;

    // 4. Execution
    const applicationsService = container.get(ApplicationsService);
    const result = await applicationsService.listApplications({
      jobId,
      status,
      search,
      knockoutTriggered,
      limit,
      offset,
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          applications: result.applications,
          total: result.total,
        },
        applications: result.applications,
        total: result.total,
      },
      { status: 200, headers },
    );
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
            requestId,
            ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
          },
          code: error.code,
        },
        { status: STATUS_BY_CODE[error.code] || 400, headers },
      );
    }
    logger.error("List applications error", { error: String(error), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: CAREER_ERRORS.FAILED_LIST_APPLICATIONS,
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}
