import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminTopicsService } from "@/lib/services/admin-topics.service";

export async function POST(req: NextRequest) {
  const container = getContainer();
  const auth = container.get(AdminAuthService);
  const session = await auth.getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let category = "Full-Stack & Agentic AI";
    try {
      const body = await req.json();
      if (body.category && typeof body.category === "string") {
        category = body.category;
      }
    } catch {
      // Body is optional
    }

    const topicsService = container.get(AdminTopicsService);
    const suggested = await topicsService.suggestTopicsWithAI(category);

    return NextResponse.json({ success: true, count: suggested.length, topics: suggested });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to suggest topics" },
      { status: 500 },
    );
  }
}
