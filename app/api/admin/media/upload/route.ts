import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { MediaService } from "@/lib/services/media.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";

export async function POST(req: Request) {
  try {
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "blog/media";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mediaService = container.get(MediaService);

    const result = await mediaService.uploadImage(buffer, {
      folder,
      tags: ["admin-upload", session.userId],
    });

    return NextResponse.json({
      ok: true,
      secureUrl: result.secureUrl,
      publicId: result.publicId,
      format: result.format,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload media" },
      { status: 500 },
    );
  }
}
