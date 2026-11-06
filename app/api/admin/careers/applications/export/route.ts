import "server-only";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { ApplicationsService } from "@/lib/services/applications.service";
import { exportApplicationsQuerySchema } from "@/lib/contracts/admin-applications.contract";
import { AppError, ErrorCode, STATUS_BY_CODE, toFieldErrors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";
import { getRequestId } from "@/lib/server/requestContext";
import { isAllowedOrigin } from "@/lib/utils/text";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const requestId = await getRequestId();

  // 1. Origin verification
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
      {
        status: 403,
        headers: { "x-request-id": requestId },
      },
    );
  }

  // 2. Authentication check
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
      {
        status: 401,
        headers: { "x-request-id": requestId },
      },
    );
  }

  // 3. Strict Role-Based Access Control (Admin / Owner required for bulk candidate export)
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
      {
        status: 403,
        headers: { "x-request-id": requestId },
      },
    );
  }

  // 4. Query parameter validation
  const { searchParams } = new URL(req.url);
  const rawQuery = {
    jobId: searchParams.get("jobId") || undefined,
  };

  const queryValidation = exportApplicationsQuerySchema.safeParse(rawQuery);
  if (!queryValidation.success) {
    const fieldErrors = toFieldErrors(queryValidation.error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.VALIDATION,
          message: "Invalid export query parameters",
          fieldErrors,
          requestId,
        },
        code: ErrorCode.VALIDATION,
        message: "Invalid export query parameters",
      },
      {
        status: 400,
        headers: { "x-request-id": requestId },
      },
    );
  }

  const { jobId } = queryValidation.data;

  // 5. Generate CSV and archive to storage bucket
  try {
    const applicationsService = container.get(ApplicationsService);
    const { csvData, filename, rowCount, storagePath } =
      await applicationsService.generateApplicationsCsv(jobId, session.userId);

    // If client explicitly requests JSON (e.g. API client/automation)
    const acceptHeader = req.headers.get("accept") || "";
    if (acceptHeader.includes("application/json")) {
      return NextResponse.json(
        {
          ok: true,
          data: {
            filename,
            csvData,
            rowCount,
            storagePath,
          },
          filename,
          rowCount,
          storagePath,
        },
        {
          status: 200,
          headers: {
            "x-request-id": requestId,
            "x-export-row-count": String(rowCount),
            ...(storagePath ? { "x-export-storage-path": storagePath } : {}),
            "Cache-Control": "no-store, private",
          },
        },
      );
    }

    // Default: stream real CSV file attachment for direct browser download
    return new Response(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "x-request-id": requestId,
        "x-export-row-count": String(rowCount),
        ...(storagePath ? { "x-export-storage-path": storagePath } : {}),
        "Cache-Control": "no-store, private",
      },
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      const httpStatus = STATUS_BY_CODE[error.code] || 400;
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
            requestId,
          },
          code: error.code,
          message: error.message,
        },
        {
          status: httpStatus,
          headers: { "x-request-id": requestId },
        },
      );
    }

    logger.error("Export applications CSV error", { error: String(error), jobId, requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: CAREER_ERRORS.FAILED_EXPORT_APPLICATIONS,
          requestId,
        },
        code: ErrorCode.INTERNAL,
        message: CAREER_ERRORS.FAILED_EXPORT_APPLICATIONS,
      },
      {
        status: 500,
        headers: { "x-request-id": requestId },
      },
    );
  }
}
