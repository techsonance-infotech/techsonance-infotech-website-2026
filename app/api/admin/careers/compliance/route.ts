import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { ApplicationsService } from "@/lib/services/applications.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
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

    if (session.role !== "owner" && session.role !== "admin") {
      return NextResponse.json(
        { error: CAREER_ERRORS.FORBIDDEN_COMPLIANCE_EXPORT },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email || !email.trim()) {
      return NextResponse.json({ error: CAREER_ERRORS.CANDIDATE_EMAIL_REQUIRED }, { status: 400 });
    }

    const applicationsService = container.get(ApplicationsService);
    const candidateData = await applicationsService.exportCandidateData(email.trim());

    return NextResponse.json({ ok: true, data: candidateData });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    logger.error("GDPR export error", { error: String(error) });
    return NextResponse.json({ error: CAREER_ERRORS.FAILED_EXPORT_COMPLIANCE }, { status: 500 });
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

    if (session.role !== "owner" && session.role !== "admin") {
      return NextResponse.json(
        { error: CAREER_ERRORS.FORBIDDEN_COMPLIANCE_PURGE },
        { status: 403 },
      );
    }

    const body = await req.json();
    const email = body?.email;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: CAREER_ERRORS.CANDIDATE_EMAIL_REQUIRED_GDPR },
        { status: 400 },
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const applicationsService = container.get(ApplicationsService);
    const result = await applicationsService.purgeCandidateData(
      email.trim(),
      session.userId,
      ipAddress,
    );

    return NextResponse.json({ ok: true, result });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    logger.error("GDPR purge error", { error: String(error) });
    return NextResponse.json({ error: CAREER_ERRORS.FAILED_PURGE_CANDIDATE }, { status: 500 });
  }
}
