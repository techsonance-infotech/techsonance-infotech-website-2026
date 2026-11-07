import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminTopicsService } from "@/lib/services/admin-topics.service";
import { isAllowedOrigin } from "@/lib/utils/text";
import { aiTopicParamsSchema } from "@/lib/contracts/admin-ai-topics.contract";
import { AI_TOPICS_ERRORS, AI_TOPICS_MESSAGES } from "@/lib/constants/ai.constants";
import { AppError, ErrorCode, STATUS_BY_CODE } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const rawParams = await params;
  const parsedParams = aiTopicParamsSchema.safeParse(rawParams);
  if (!parsedParams.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsedParams.error.issues) {
      const key = issue.path.join(".") || "id";
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.BAD_REQUEST,
          message: "Invalid topic ID format",
          fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const { id } = parsedParams.data;

  try {
    const topicsService = container.get(AdminTopicsService);
    const result = await topicsService.launchTopicGeneration(id);

    logger.info(AI_TOPICS_MESSAGES.TOPIC_LAUNCHED, {
      actorId: session.userId,
      topicId: id,
      jobId: result.jobId,
    });

    return NextResponse.json(
      {
        ok: true,
        success: true,
        jobId: result.jobId,
        message: AI_TOPICS_MESSAGES.TOPIC_LAUNCHED,
        data: {
          success: true,
          jobId: result.jobId,
          message: AI_TOPICS_MESSAGES.TOPIC_LAUNCHED,
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

    logger.error(AI_TOPICS_ERRORS.LAUNCH_FAILED, {
      topicId: id,
      err: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: AI_TOPICS_ERRORS.LAUNCH_FAILED,
        },
      },
      { status: 500 },
    );
  }
}
