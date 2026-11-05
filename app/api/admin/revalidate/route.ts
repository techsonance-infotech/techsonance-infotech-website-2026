import "server-only";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";

const revalidateSchema = z.object({
  tags: z.array(z.string().min(1)).default(["posts", "jobs"]),
});

export async function POST(req: Request) {
  try {
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let tags = ["posts", "jobs"];
    try {
      const rawBody = await req.json();
      const parsed = revalidateSchema.safeParse(rawBody);
      if (parsed.success) {
        tags = parsed.data.tags;
      }
    } catch {
      // Use defaults if empty body
    }

    for (const tag of tags) {
      revalidateTag(tag, "default");
    }

    return NextResponse.json({
      ok: true,
      revalidated: tags,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin revalidate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
