import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminPostsService } from "@/lib/services/admin-posts.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Editor, Admin, Owner can publish
    if (!authService.hasPermission(session.role, "editor")) {
      return NextResponse.json({ error: "Forbidden: editor or higher required" }, { status: 403 });
    }

    const postsService = container.get(AdminPostsService);
    const post = await postsService.publishPost(id, session.userId);

    return NextResponse.json({ ok: true, post });
  } catch (error) {
    console.error("Publish post error:", error);
    return NextResponse.json({ error: "Failed to publish post" }, { status: 500 });
  }
}
