import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminTopicsService } from "@/lib/services/admin-topics.service";
import type { AiTopicStatus } from "@/lib/database/enum/ai.enum";

export async function GET(req: NextRequest) {
  const container = getContainer();
  const auth = container.get(AdminAuthService);
  const session = await auth.getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as AiTopicStatus | null;
  const search = searchParams.get("search") || undefined;
  const limit = Number(searchParams.get("limit")) || 50;
  const offset = Number(searchParams.get("offset")) || 0;

  const topicsService = container.get(AdminTopicsService);
  const result = await topicsService.listTopics({
    status: status || undefined,
    search,
    limit,
    offset,
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const container = getContainer();
  const auth = container.get(AdminAuthService);
  const session = await auth.getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const topicsService = container.get(AdminTopicsService);
    const created = await topicsService.createTopic({
      title: body.title,
      keywords: Array.isArray(body.keywords) ? body.keywords : [],
      category: body.category || "Engineering",
      targetAudience: body.targetAudience || "Tech Leads & Engineers",
      difficulty: body.difficulty || "intermediate",
      priority: Number(body.priority) || 0,
      notes: body.notes || undefined,
      suggestedBy: "admin",
    });

    return NextResponse.json({ success: true, topic: created });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create topic" },
      { status: 500 },
    );
  }
}
