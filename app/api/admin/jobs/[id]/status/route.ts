import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { jobStatusTransitionSchema } from "@/lib/validations/careers";
import { logger } from "@/lib/logger";
import { AppError, STATUS_BY_CODE } from "@/lib/errors";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: CAREER_ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = jobStatusTransitionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: CAREER_ERRORS.VALIDATION_FAILED, details: parseResult.error.format() },
        { status: 400 },
      );
    }

    const jobsService = container.get(AdminJobsService);
    const updated = await jobsService.transitionStatus(
      id,
      parseResult.data.targetStatus,
      { userId: session.userId, role: session.role },
      parseResult.data.comment,
    );

    return NextResponse.json({ ok: true, job: updated });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    logger.error("Job status transition error", { error: String(error) });
    return NextResponse.json(
      { error: CAREER_ERRORS.FAILED_UPDATE_JOB_STATUS },
      { status: 400 },
    );
  }
}
