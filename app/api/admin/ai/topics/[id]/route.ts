import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminTopicsService } from "@/lib/services/admin-topics.service";
import { AiTopicStatus } from "@/lib/database/enum/ai.enum";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const container = getContainer();
  const auth = container.get(AdminAuthService);
  const session = await auth.getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const status = body.status as AiTopicStatus;

    if (!status || !Object.values(AiTopicStatus).includes(status)) {
      return NextResponse.json({ error: "Valid status required" }, { status: 400 });
    }

    const topicsService = container.get(AdminTopicsService);
    const updated = await topicsService.updateTopicStatus(id, status);

    return NextResponse.json({ success: true, topic: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update topic" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const container = getContainer();
  const auth = container.get(AdminAuthService);
  const session = await auth.getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const topicsService = container.get(AdminTopicsService);
    await topicsService.deleteTopic(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete topic" },
      { status: 500 }
    );
  }
}
