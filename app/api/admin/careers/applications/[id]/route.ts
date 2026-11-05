import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { ApplicationsService } from "@/lib/services/applications.service";
import type { ApplicationStatus } from "@/lib/database/enum/content.enum";
import { AppError, STATUS_BY_CODE } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: CAREER_ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    const applicationsService = container.get(ApplicationsService);
    const application = await applicationsService.getApplicationById(id);

    return NextResponse.json({ ok: true, application });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    logger.error("Get application error", { error: String(error) });
    return NextResponse.json({ error: CAREER_ERRORS.FAILED_GET_APPLICATION }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: CAREER_ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    const body = await req.json();
    const applicationsService = container.get(ApplicationsService);
    let updated: unknown;

    if (body.status) {
      const newStage = body.status as ApplicationStatus;
      updated = await applicationsService.updateStage(
        id,
        newStage,
        body.rejectionReason,
        session.userId,
      );
    }

    if (body.internalNotes !== undefined || body.rating !== undefined) {
      updated = await applicationsService.updateNotesAndRating(
        id,
        body.internalNotes,
        body.rating,
        session.userId,
      );
    }

    return NextResponse.json({ ok: true, application: updated });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    logger.error("Update application error", { error: String(error) });
    return NextResponse.json({ error: CAREER_ERRORS.FAILED_UPDATE_APPLICATION }, { status: 500 });
  }
}
