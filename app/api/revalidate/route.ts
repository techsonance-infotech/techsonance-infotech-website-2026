import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import crypto from "node:crypto";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

const revalidateSchema = z.object({
  tags: z.array(z.string().min(1)).min(1, "At least one tag is required"),
});

export async function POST(req: Request) {
  try {
    const env = getEnv();

    const secretHeader = req.headers.get("x-revalidate-secret");
    const configuredSecret = env.REVALIDATE_SECRET;

    if (!configuredSecret || !secretHeader) {
      return NextResponse.json(
        { error: "Unauthorized: invalid or missing revalidation secret" },
        { status: 401 },
      );
    }

    const secretBuffer = Buffer.from(secretHeader);
    const configuredBuffer = Buffer.from(configuredSecret);

    if (
      secretBuffer.length !== configuredBuffer.length ||
      !crypto.timingSafeEqual(secretBuffer, configuredBuffer)
    ) {
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
    logger.error("Revalidation error", { error: String(error) });
    return NextResponse.json(
      { error: "Internal server error during cache revalidation" },
      { status: 500 },
    );
  }
}
