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
    const versions = await jobsService.listVersions(id);

    return NextResponse.json({ ok: true, versions });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    logger.error("List versions error", { error: String(error) });
    return NextResponse.json({ error: CAREER_ERRORS.FAILED_LIST_VERSIONS }, { status: 500 });
  }
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
    const versionId = body?.versionId;
    if (!versionId || typeof versionId !== "string") {
      return NextResponse.json({ error: CAREER_ERRORS.VERSION_ID_REQUIRED }, { status: 400 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const jobsService = container.get(AdminJobsService);
    const restored = await jobsService.restoreVersion(id, versionId, session.userId, ipAddress);

    return NextResponse.json({ ok: true, job: restored });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    logger.error("Restore version error", { error: String(error) });
    return NextResponse.json({ error: CAREER_ERRORS.FAILED_RESTORE_VERSION }, { status: 500 });
  }
}
