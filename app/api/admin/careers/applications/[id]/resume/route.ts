import "server-only";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { ApplicationsService } from "@/lib/services/applications.service";
import { applicationResumeParamsSchema } from "@/lib/contracts/admin-applications.contract";
import { AppError, ErrorCode, STATUS_BY_CODE, toFieldErrors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";
import { getRequestId } from "@/lib/server/requestContext";
import { isAllowedOrigin } from "@/lib/utils/text";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
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

  // 3. Strict UUID parameter validation
  const rawParams = await params;
  const paramValidation = applicationResumeParamsSchema.safeParse(rawParams);

  if (!paramValidation.success) {
    const fieldErrors = toFieldErrors(paramValidation.error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.VALIDATION,
          message: "Invalid application ID parameter",
          fieldErrors,
          requestId,
        },
        code: ErrorCode.VALIDATION,
        message: "Invalid application ID parameter",
      },
      {
        status: 400,
        headers: { "x-request-id": requestId },
      },
    );
  }

  const { id } = paramValidation.data;

  // 4. Role Authorization check (Recruiter, Hiring Manager, Admin, Owner)
  const allowedRoles = ["recruiter", "hiring_manager", "admin", "owner", "superadmin"];
  if (session.role && !allowedRoles.includes(session.role.toLowerCase())) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.FORBIDDEN,
          message: "Forbidden: insufficient permissions to access candidate resumes",
          requestId,
        },
        code: ErrorCode.FORBIDDEN,
        message: "Forbidden: insufficient permissions to access candidate resumes",
      },
      {
        status: 403,
        headers: { "x-request-id": requestId },
      },
    );
  }

  // 5. Generate signed URL via ApplicationsService
  try {
    const applicationsService = container.get(ApplicationsService);
    const signedUrl = await applicationsService.getSignedResumeUrl(id, session.role);

    return NextResponse.json(
      {
        ok: true,
        data: {
          signedUrl,
        },
        signedUrl,
      },
      {
        status: 200,
        headers: {
          "x-request-id": requestId,
          "Cache-Control": "no-store, private",
        },
      },
    );
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

    logger.error("Resume download error", { error: String(error), applicationId: id, requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: CAREER_ERRORS.FAILED_GENERATE_RESUME_LINK,
          requestId,
        },
        code: ErrorCode.INTERNAL,
        message: CAREER_ERRORS.FAILED_GENERATE_RESUME_LINK,
      },
      {
        status: 500,
        headers: { "x-request-id": requestId },
      },
    );
  }
}
