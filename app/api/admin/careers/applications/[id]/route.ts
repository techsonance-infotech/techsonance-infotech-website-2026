import "server-only";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { ApplicationsService } from "@/lib/services/applications.service";
import { updateApplicationPatchSchema } from "@/lib/contracts/admin-applications.contract";
import type { ApplicationStatus } from "@/lib/database/enum/content.enum";
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

    const { id } = await params;
    if (!id || !id.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: "Application ID is required",
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 400, headers },
      );
    }

    const applicationsService = container.get(ApplicationsService);
    const application = await applicationsService.getApplicationById(id);

    if (!application) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: CAREER_ERRORS.APPLICATION_NOT_FOUND,
            requestId,
          },
          code: ErrorCode.NOT_FOUND,
        },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: { application },
        application,
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
    logger.error("Get application error", { error: String(error), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: CAREER_ERRORS.FAILED_GET_APPLICATION,
          requestId,
        },
        code: ErrorCode.INTERNAL,
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

    const { id } = await params;
    const body = await req.json();

    const parseResult = updateApplicationPatchSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: "Invalid application update payload",
            fieldErrors: toFieldErrors(parseResult.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 400, headers },
      );
    }

    const { status, rejectionReason, internalNotes, rating } = parseResult.data;
    const applicationsService = container.get(ApplicationsService);
    let updated: unknown = null;

    if (status) {
      updated = await applicationsService.updateStage(
        id,
        status as ApplicationStatus,
        rejectionReason,
        session.userId,
      );
    }

    if (internalNotes !== undefined || rating !== undefined) {
      updated = await applicationsService.updateNotesAndRating(
        id,
        internalNotes,
        rating ?? undefined,
        session.userId,
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: { application: updated },
        application: updated,
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
    logger.error("Update application error", { error: String(error), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: CAREER_ERRORS.FAILED_UPDATE_APPLICATION,
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}
