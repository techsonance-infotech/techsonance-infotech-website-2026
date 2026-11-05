import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { ApplicationsService } from "@/lib/services/applications.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AppError, STATUS_BY_CODE } from "@/lib/errors";

export async function GET(req: Request) {
  try {
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "owner" && session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin or Owner role required for compliance data export" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Candidate email query parameter is required" },
        { status: 400 },
      );
    }

    const applicationsService = container.get(ApplicationsService);
    const candidateData = await applicationsService.exportCandidateData(email.trim());

    return NextResponse.json({ ok: true, data: candidateData });
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    console.error("GDPR export error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export candidate compliance data" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "owner" && session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin or Owner role required for candidate data purge" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const email = body?.email;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Candidate email is required in request body" },
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
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    console.error("GDPR purge error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to purge candidate records" },
      { status: 500 },
    );
  }
}
