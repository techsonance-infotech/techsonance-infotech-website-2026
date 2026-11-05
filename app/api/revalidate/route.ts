import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getEnv } from "@/lib/env";

const revalidateSchema = z.object({
  tags: z.array(z.string().min(1)).min(1, "At least one tag is required"),
});

export async function POST(req: Request) {
  try {
    const env = getEnv();

    const secretHeader = req.headers.get("x-revalidate-secret");
    if (!env.REVALIDATE_SECRET || secretHeader !== env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized: invalid or missing revalidation secret" },
        { status: 401 },
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parseResult = revalidateSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.format() },
        { status: 400 },
      );
    }

    const { tags } = parseResult.data;

    for (const tag of tags) {
      revalidateTag(tag, "default");
    }

    return NextResponse.json({
      ok: true,
      revalidated: tags,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Internal server error during cache revalidation" },
      { status: 500 },
    );
  }
}
