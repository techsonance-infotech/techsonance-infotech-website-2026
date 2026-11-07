import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminTopicsService } from "@/lib/services/admin-topics.service";
import { isAllowedOrigin } from "@/lib/utils/text";
import { suggestAiTopicsSchema } from "@/lib/contracts/admin-ai-topics.contract";
import { AI_TOPICS_ERRORS, AI_TOPICS_MESSAGES } from "@/lib/constants/ai.constants";
import { AppError, ErrorCode, STATUS_BY_CODE } from "@/lib/errors";
import { logger } from "@/lib/logger";

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
    let rawBody: unknown = {};
    try {
      const text = await req.text();
      if (text && text.trim().length > 0) {
        rawBody = JSON.parse(text);
      }
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.BAD_REQUEST,
            message: "Malformed JSON payload in request body",
          },
        },
        { status: 400 },
      );
    }

    const parsed = suggestAiTopicsSchema.safeParse(rawBody);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "body";
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: "Validation failed for topic suggestion parameters",
            fieldErrors,
          },
        },
        { status: 422 },
      );
    }

    const topicsService = container.get(AdminTopicsService);
    const suggested = await topicsService.suggestTopicsWithAI(parsed.data.category);

    logger.info(AI_TOPICS_MESSAGES.TOPICS_SUGGESTED, {
      actorId: session.userId,
      category: parsed.data.category,
      count: suggested.length,
    });

    return NextResponse.json(
      {
        ok: true,
        success: true,
        count: suggested.length,
        topics: suggested,
        data: {
          success: true,
          count: suggested.length,
          topics: suggested,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: STATUS_BY_CODE[error.code] ?? 500 },
      );
    }

    logger.error(AI_TOPICS_ERRORS.SUGGEST_FAILED, {
      err: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: AI_TOPICS_ERRORS.SUGGEST_FAILED,
        },
      },
      { status: 500 },
    );
  }
}
