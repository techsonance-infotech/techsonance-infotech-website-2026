import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { updateJobSchema } from "@/lib/validations/careers";
import { logger } from "@/lib/logger";
import { AppError, STATUS_BY_CODE } from "@/lib/errors";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";
import type { InsertJob } from "@/lib/database/schema/index.schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: CAREER_ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    const jobsService = container.get(AdminJobsService);
    const job = await jobsService.getJobById(id);

    if (!job) {
      return NextResponse.json({ error: CAREER_ERRORS.JOB_NOT_FOUND }, { status: 404 });
    }

    return NextResponse.json({ ok: true, job });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    logger.error("Get job error", { error: String(error) });
    return NextResponse.json({ error: CAREER_ERRORS.FAILED_GET_JOB }, { status: 500 });
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
    const parseResult = updateJobSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: CAREER_ERRORS.VALIDATION_FAILED, details: parseResult.error.format() },
        { status: 400 },
      );
    }

    const jobsService = container.get(AdminJobsService);
    const updated = await jobsService.updateJob(
      id,
      parseResult.data as Partial<InsertJob>,
      session.userId,
    );

    return NextResponse.json({ ok: true, job: updated });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    logger.error("Update job error", { error: String(error) });
    return NextResponse.json({ error: CAREER_ERRORS.FAILED_UPDATE_JOB }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: CAREER_ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    const jobsService = container.get(AdminJobsService);
    await jobsService.deleteJob(id, session.userId);

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    logger.error("Delete job error", { error: String(error) });
    return NextResponse.json({ error: CAREER_ERRORS.FAILED_DELETE_JOB }, { status: 500 });
  }
}
