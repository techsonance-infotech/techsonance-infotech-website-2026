import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobsService = container.get(AdminJobsService);
    const versions = await jobsService.listVersions(id);

    return NextResponse.json({ ok: true, versions });
  } catch (error: any) {
    console.error("List versions error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list versions" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const versionId = body?.versionId;
    if (!versionId || typeof versionId !== "string") {
      return NextResponse.json(
        { error: "Valid versionId is required" },
        { status: 400 },
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const jobsService = container.get(AdminJobsService);
    const restored = await jobsService.restoreVersion(
      id,
      versionId,
      session.userId,
      ipAddress,
    );

    return NextResponse.json({ ok: true, job: restored });
  } catch (error: any) {
    console.error("Restore version error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to restore version" },
      { status: 500 },
    );
  }
}
