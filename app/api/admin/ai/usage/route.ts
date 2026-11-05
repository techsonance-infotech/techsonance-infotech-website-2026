import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminTelemetryService } from "@/lib/services/admin-telemetry.service";

export async function GET() {
  const container = getContainer();
  const auth = container.get(AdminAuthService);
  const session = await auth.getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const telemetryService = container.get(AdminTelemetryService);
    const summary = await telemetryService.getTelemetrySummary();

    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load telemetry" },
      { status: 500 },
    );
  }
}
