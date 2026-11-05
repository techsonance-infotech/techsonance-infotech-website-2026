import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "owner" && session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin or Owner role required" },
        { status: 403 },
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const jobsService = container.get(AdminJobsService);
    const updated = await jobsService.approveJob(id, session.userId, ipAddress);

    return NextResponse.json({ ok: true, job: updated });
  } catch (error: any) {
    console.error("Approve job error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve job" },
      { status: 500 },
    );
  }
}
