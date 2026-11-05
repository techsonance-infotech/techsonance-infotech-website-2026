import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AppError, STATUS_BY_CODE } from "@/lib/errors";
import { logger } from "@/lib/logger";
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

    if (session.role !== "owner" && session.role !== "admin") {
      return NextResponse.json({ error: CAREER_ERRORS.FORBIDDEN_ADMIN_OR_OWNER }, { status: 403 });
    }

    const body = await req.json();
    const comment = body?.comment;
    if (!comment || typeof comment !== "string" || !comment.trim()) {
      return NextResponse.json({ error: CAREER_ERRORS.RETURN_FEEDBACK_REQUIRED }, { status: 400 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const jobsService = container.get(AdminJobsService);
    const updated = await jobsService.returnJob(id, comment.trim(), session.userId, ipAddress);

    return NextResponse.json({ ok: true, job: updated });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    logger.error("Return job error", { error: String(error) });
    return NextResponse.json({ error: CAREER_ERRORS.FAILED_RETURN_JOB }, { status: 500 });
  }
}
