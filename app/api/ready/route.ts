import "server-only";
import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/database";

export const runtime = "nodejs";

/**
 * GET /api/ready
 * Container & Kubernetes readiness probe.
 * Verifies live database connection via Supavisor pooler (:6543) without auth.
 */
export async function GET() {
  const isConnected = await checkDatabaseConnection(2500);

  if (!isConnected) {
    return NextResponse.json(
      {
        status: "unavailable",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  }

  return NextResponse.json(
    {
      status: "ready",
      database: "connected",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
