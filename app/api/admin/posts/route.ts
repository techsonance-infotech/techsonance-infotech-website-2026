import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/di/container";
import { AdminPostsService } from "@/lib/services/admin-posts.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { logger } from "@/lib/logger";

const createPostSchema = z.object({
  siteId: z.string().uuid().optional(),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  title: z.string().min(3),
  excerpt: z.string().optional(),
  content: z.string().min(10),
  categoryId: z.uuid().optional(),
  heroImage: z.url().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  readTime: z.string().optional().default("5 min read"),
  status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export async function GET(req: Request) {
  try {
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const siteId = searchParams.get("siteId") || session.site?.id || undefined;
    const limit = Number(searchParams.get("limit")) || 20;
    const offset = Number(searchParams.get("offset")) || 0;

    const postsService = container.get(AdminPostsService);
    const result = await postsService.listPosts({
      status,
      search,
      siteId,
      limit,
      offset,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    logger.error("List posts error", { error: String(error) });
    return NextResponse.json({ error: "Failed to list posts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = createPostSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.format() },
        { status: 400 },
      );
    }

    const siteId = parseResult.data.siteId || session.site?.id;
    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    const postsService = container.get(AdminPostsService);
    const post = await postsService.createPost(
      {
        ...parseResult.data,
        siteId,
        createdBy: session.userId,
      },
      session.userId,
    );

    return NextResponse.json({ ok: true, post }, { status: 201 });
  } catch (error) {
    logger.error("Create post error", { error: String(error) });
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
