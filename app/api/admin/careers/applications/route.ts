import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { ApplicationsService } from "@/lib/services/applications.service";
import type { ApplicationStatus } from "@/lib/database/enum/content.enum";
import { AppError, STATUS_BY_CODE } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";

export async function GET(req: Request) {
  try {
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: CAREER_ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId") || undefined;
    const status = searchParams.get("status") as ApplicationStatus | undefined;
    const search = searchParams.get("search") || undefined;
    const knockoutParam = searchParams.get("knockoutTriggered");
    const knockoutTriggered =
      knockoutParam === "true" ? true : knockoutParam === "false" ? false : undefined;
    const limit = Number(searchParams.get("limit")) || 50;
    const offset = Number(searchParams.get("offset")) || 0;

    const applicationsService = container.get(ApplicationsService);
    const result = await applicationsService.listApplications({
      jobId,
      status,
      search,
      knockoutTriggered,
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
    logger.error("List applications error", { error: String(error) });
    return NextResponse.json({ error: CAREER_ERRORS.FAILED_LIST_APPLICATIONS }, { status: 500 });
  }
}
