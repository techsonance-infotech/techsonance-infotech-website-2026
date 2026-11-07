import "server-only";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { ApplicationsService } from "@/lib/services/applications.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import {
  exportCandidateDataQuerySchema,
  purgeCandidateDataBodySchema,
} from "@/lib/contracts/admin-careers-compliance.contract";
import { AppError, ErrorCode, STATUS_BY_CODE, toFieldErrors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { CAREER_ERRORS, CAREER_COMPLIANCE_MESSAGES } from "@/lib/constants/careers.constants";
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
    // 1. Origin verification
    const origin = req.headers.get("origin");
    if (origin && !isAllowedOrigin(origin)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: CAREER_ERRORS.FORBIDDEN_ORIGIN,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
        },
        { status: 403, headers },
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
        },
        { status: 401, headers },
      );
    }

    // 3. RBAC permission check (Admin or Owner role required for compliance export)
    if (!authService.hasPermission(session.role, "admin")) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: CAREER_ERRORS.FORBIDDEN_COMPLIANCE_EXPORT,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
        },
        { status: 403, headers },
      );
    }

    // 4. Query parameters validation
    const { searchParams } = new URL(req.url);
    const queryObj = { email: searchParams.get("email") ?? undefined };

    const parseResult = exportCandidateDataQuerySchema.safeParse(queryObj);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: CAREER_ERRORS.CANDIDATE_EMAIL_REQUIRED,
            fieldErrors: toFieldErrors(parseResult.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 422, headers },
      );
    }

    const { email } = parseResult.data;
    const applicationsService = container.get(ApplicationsService);
    const candidateData = await applicationsService.exportCandidateData(email);

    logger.info("Compliance candidate data exported", {
      adminId: session.userId,
      adminRole: session.role,
      candidateEmail: email,
      requestId,
    });

    return NextResponse.json(
      {
        ok: true,
        data: candidateData,
        candidateData, // Backwards-compatible
        success: true,
        message: CAREER_COMPLIANCE_MESSAGES.EXPORT_SUCCESS,
      },
      { status: 200, headers },
    );
  } catch (error: unknown) {
    if (error instanceof AppError) {
      const status = STATUS_BY_CODE[error.code] ?? 400;
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
            requestId,
          },
          code: error.code,
        },
        { status, headers },
      );
    }

    logger.error("GDPR compliance export unhandled error", {
      error: error instanceof Error ? error.message : String(error),
      requestId,
    });

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: CAREER_ERRORS.FAILED_EXPORT_COMPLIANCE,
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
    // 1. Origin verification
    const origin = req.headers.get("origin");
    if (origin && !isAllowedOrigin(origin)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: CAREER_ERRORS.FORBIDDEN_ORIGIN,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
        },
        { status: 403, headers },
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
        },
        { status: 401, headers },
      );
    }

    // 3. RBAC permission check (Admin or Owner role required for candidate purge)
    if (!authService.hasPermission(session.role, "admin")) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: CAREER_ERRORS.FORBIDDEN_COMPLIANCE_PURGE,
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

    const parseResult = purgeCandidateDataBodySchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: CAREER_ERRORS.CANDIDATE_EMAIL_REQUIRED_GDPR,
            fieldErrors: toFieldErrors(parseResult.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 422, headers },
      );
    }

    const { email } = parseResult.data;
    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const applicationsService = container.get(ApplicationsService);
    const result = await applicationsService.purgeCandidateData(email, session.userId, ipAddress);

    logger.info("Compliance candidate data purged", {
      adminId: session.userId,
      adminRole: session.role,
      candidateEmail: email,
      deletedApplicationsCount: result.deletedApplicationsCount,
      deletedTalentPoolCount: result.deletedTalentPoolCount,
      deletedFilesCount: result.deletedFilesCount,
      requestId,
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          ...result,
          message: CAREER_COMPLIANCE_MESSAGES.PURGE_SUCCESS,
        },
        result, // Backwards-compatible
        success: true,
        message: CAREER_COMPLIANCE_MESSAGES.PURGE_SUCCESS,
      },
      { status: 200, headers },
    );
  } catch (error: unknown) {
    if (error instanceof AppError) {
      const status = STATUS_BY_CODE[error.code] ?? 400;
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
            requestId,
          },
          code: error.code,
        },
        { status, headers },
      );
    }

    logger.error("GDPR compliance purge unhandled error", {
      error: error instanceof Error ? error.message : String(error),
      requestId,
    });

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: CAREER_ERRORS.FAILED_PURGE_CANDIDATE,
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}
