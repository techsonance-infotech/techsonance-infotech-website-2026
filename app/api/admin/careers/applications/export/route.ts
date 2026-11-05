import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { ApplicationsService } from "@/lib/services/applications.service";
import { AppError, STATUS_BY_CODE } from "@/lib/errors";

export async function GET(req: Request) {
  try {
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId") || undefined;

    const applicationsService = container.get(ApplicationsService);
    const csvData = await applicationsService.exportApplicationsCsv(jobId);

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = jobId
      ? `applications-${jobId}-${timestamp}.csv`
      : `applications-all-${timestamp}.csv`;

    return new Response(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    console.error("Export applications CSV error:", error);
    return NextResponse.json({ error: "Failed to export applications" }, { status: 500 });
  }
}
