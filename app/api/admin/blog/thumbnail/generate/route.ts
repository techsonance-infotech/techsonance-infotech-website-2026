import "server-only";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { ImageStepService } from "@/lib/services/image/image-step.service";
import { AdminPostsRepository } from "@/lib/repositories/admin-posts.repository";
import { generateThumbnailInputSchema } from "@/lib/contracts/admin-posts.contract";
import { logger } from "@/lib/logger";
import { AppError, ErrorCode, STATUS_BY_CODE, toFieldErrors } from "@/lib/errors";
import { POST_ERRORS } from "@/lib/constants/posts.constants";
import { getRequestId } from "@/lib/server/requestContext";
import { isAllowedOrigin } from "@/lib/utils/text";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const requestId = await getRequestId();
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("x-request-id", requestId);
  headers.set("Cache-Control", "private, no-store");

  try {
    // 1. Origin check
    const origin = req.headers.get("origin");
    if (origin && !isAllowedOrigin(origin)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: POST_ERRORS.FORBIDDEN_ORIGIN,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
        },
        { status: 403, headers },
      );
    }

    // 2. Auth check
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.UNAUTHENTICATED,
            message: POST_ERRORS.UNAUTHORIZED,
            requestId,
          },
          code: ErrorCode.UNAUTHENTICATED,
        },
        { status: 401, headers },
      );
    }

    // 3. Body validation
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.BAD_REQUEST,
            message: "Invalid JSON request body",
            requestId,
          },
          code: ErrorCode.BAD_REQUEST,
        },
        { status: 400, headers },
      );
    }

    const parseResult = generateThumbnailInputSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: "Validation failed",
            fieldErrors: toFieldErrors(parseResult.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 400, headers },
      );
    }

    const {
      postId,
      title,
      prompt,
      summary,
      contentExcerpt,
      category,
      keywords,
    } = parseResult.data;

    let postSummary = summary;
    let postContent = contentExcerpt;
    let postCategory = category;
    let postKeywords = keywords;

    // 4. Enrich context from repository if postId exists and fields are missing
    if (postId) {
      try {
        const postsRepo = container.get(AdminPostsRepository);
        const existing = await postsRepo.findPostById(postId);
        if (existing) {
          postSummary = postSummary || existing.excerpt || undefined;
          postContent = postContent || existing.content?.slice(0, 1500) || undefined;
          postCategory =
            postCategory ||
            (existing as { category?: { name?: string } | null }).category?.name ||
            undefined;
          postKeywords =
            postKeywords && postKeywords.length > 0
              ? postKeywords
              : existing.tags || undefined;
        }
      } catch (repoErr) {
        logger.warn("Could not load existing post context for thumbnail generation", {
          error: String(repoErr),
        });
      }
    }

    // 5. Generate thumbnail via ImageStepService with full article semantic context
    const imageStepService = container.get(ImageStepService);
    const targetPrompt = prompt && prompt.trim().length > 0 ? prompt.trim() : title;

    const result = await imageStepService.generateThumbnail(targetPrompt, {
      title,
      summary: postSummary,
      contentExcerpt: postContent,
      category: postCategory,
      keywords: postKeywords,
      jobId: postId,
    });

    // 5. Persist to DB if postId was provided
    if (postId) {
      try {
        const postsRepo = container.get(AdminPostsRepository);
        await postsRepo.updatePostWithAudit(
          postId,
          {
            heroImage: result.url,
            thumbnailMissing: result.thumbnailMissing,
            thumbnailProvider: result.provider,
            thumbnailPrompt: result.prompt,
            thumbnailAlt: result.alt,
          },
          {
            actorId: session.userId,
            action: "UPDATE",
            entityType: "post",
          },
        );
      } catch (dbError) {
        logger.warn("Could not save thumbnail directly to post record", {
          postId,
          error: dbError,
        });
      }
    }

    logger.info("Admin generated post thumbnail successfully", {
      postId,
      provider: result.provider,
      thumbnailMissing: result.thumbnailMissing,
      requestId,
    });

    return NextResponse.json(
      {
        ok: true,
        data: result,
      },
      { status: 200, headers },
    );
  } catch (error: unknown) {
    logger.error("Generate thumbnail endpoint error", { error, requestId });

    if (error instanceof AppError) {
      const status = STATUS_BY_CODE[error.code] || 500;
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
            requestId,
          },
          code: error.code,
        },
        { status, headers },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: "Internal server error generating thumbnail",
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}
