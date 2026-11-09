import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminTopicsService } from "@/lib/services/admin-topics.service";
import { isAllowedOrigin } from "@/lib/utils/text";
import { AI_TOPICS_ERRORS } from "@/lib/constants/ai.constants";
import { AppError, ErrorCode, STATUS_BY_CODE } from "@/lib/errors";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && !isAllowedOrigin(origin)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.FORBIDDEN,
          message: AI_TOPICS_ERRORS.FORBIDDEN_ORIGIN,
        },
      },
      { status: 403 },
    );
  }

  const container = getContainer();
  const auth = container.get(AdminAuthService);
  const session = await auth.getCurrentSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.UNAUTHENTICATED,
          message: AI_TOPICS_ERRORS.UNAUTHORIZED,
        },
      },
      { status: 401 },
    );
  }

  if (!auth.hasPermission(session.role, "editor")) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.FORBIDDEN,
          message: AI_TOPICS_ERRORS.FORBIDDEN_ROLE,
        },
      },
      { status: 403 },
    );
  }

  try {
    let category = "Full-Stack & Agentic AI";
    try {
      const text = await req.text();
      if (text && text.trim().length > 0) {
        const body = JSON.parse(text);
        if (body?.category && typeof body.category === "string") {
          category = body.category;
        }
      }
    } catch {
      // Use default category
    }

    const topicsService = container.get(AdminTopicsService);
    const result = await topicsService.autoGenerateNextTopic(category);

    logger.info("Admin auto-generate triggered autonomous pipeline", {
      jobId: result.jobId,
      topicTitle: result.topicTitle,
      userId: session.userId,
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          jobId: result.jobId,
          topicId: result.topicId,
          topicTitle: result.topicTitle,
          message: `Autonomous generation launched for topic: "${result.topicTitle}"`,
        },
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: err.code,
            message: err.message,
          },
        },
        { status: STATUS_BY_CODE[err.code] || 500 },
      );
    }

    logger.error("Error triggering auto-generation", {
      error: err instanceof Error ? err.message : String(err),
    });

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: "Failed to trigger auto-generation pipeline.",
        },
      },
      { status: 500 },
    );
  }
}
