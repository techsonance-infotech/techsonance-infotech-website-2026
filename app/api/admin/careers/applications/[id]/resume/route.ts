import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { ApplicationsService } from "@/lib/services/applications.service";
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

    const applicationsService = container.get(ApplicationsService);
    const signedUrl = await applicationsService.getSignedResumeUrl(id, session.role);

    return NextResponse.json({ ok: true, signedUrl });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    logger.error("Resume download error", { error: String(error) });
    return NextResponse.json({ error: CAREER_ERRORS.FAILED_GENERATE_RESUME_LINK }, { status: 500 });
  }
}
