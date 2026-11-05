import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { createJobSchema } from "@/lib/validations/careers";
import { logger } from "@/lib/logger";
import { AppError, STATUS_BY_CODE } from "@/lib/errors";
import { CAREER_ERRORS, NIL_SITE_ID } from "@/lib/constants/careers.constants";
import type { JobStatus } from "@/lib/database/enum";

export async function GET(req: Request) {
  try {
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: CAREER_ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") || undefined) as JobStatus | undefined;
    const search = searchParams.get("search") || undefined;
    const siteId = searchParams.get("siteId") || session.site?.id || undefined;
    const limit = Number(searchParams.get("limit")) || 50;
    const offset = Number(searchParams.get("offset")) || 0;

    const jobsService = container.get(AdminJobsService);
    const result = await jobsService.listJobs({
      status,
      search,
      siteId,
      limit,
      offset,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    logger.error("List jobs error", { error: String(error) });
    return NextResponse.json({ error: CAREER_ERRORS.FAILED_LIST_JOBS }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: CAREER_ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    const body = await req.json();
    logger.info(
      `[API Admin Jobs] Received job creation request for: "${body?.title}" (slug: "${body?.slug}")`,
    );

    const parseResult = createJobSchema.safeParse(body);
    if (!parseResult.success) {
      logger.warn(
        `[API Admin Jobs] Validation failed for "${body?.title}":`,
        parseResult.error.format(),
      );
      return NextResponse.json(
        { error: CAREER_ERRORS.VALIDATION_FAILED, details: parseResult.error.format() },
        { status: 400 },
      );
    }

    const siteId = parseResult.data.siteId || session.site?.id || NIL_SITE_ID;

    const jobsService = container.get(AdminJobsService);
    const job = await jobsService.createJob(
      {
        ...parseResult.data,
        siteId,
      } as any,
      session.userId,
    );

    logger.info(`[API Admin Jobs] Created job successfully: ID="${job.id}", slug="${job.slug}"`);
    return NextResponse.json({ ok: true, job }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    logger.error(`[API Admin Jobs] Create job error: ${String(error)}`);
    return NextResponse.json({ error: CAREER_ERRORS.FAILED_CREATE_JOB }, { status: 500 });
  }
}
