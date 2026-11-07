import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminTopicsService } from "@/lib/services/admin-topics.service";
import {
  listAiTopicsQuerySchema,
  createAiTopicSchema,
} from "@/lib/contracts/admin-ai-topics.contract";
import { AppError, ErrorCode, toFieldErrors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { AI_TOPICS_ERRORS } from "@/lib/constants/ai.constants";
import { getRequestId } from "@/lib/server/requestContext";
import { isAllowedOrigin } from "@/lib/utils/text";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
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
            message: AI_TOPICS_ERRORS.FORBIDDEN_ORIGIN,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
        },
        { status: 403, headers },
      );
    }

    // 2. Auth session check (Viewer+ allowed)
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
            requestId,
          },
          code: ErrorCode.UNAUTHENTICATED,
        },
        { status: 401, headers },
      );
    }

    // 3. Parse query parameters
    const url = new URL(req.url);
    const queryObj = Object.fromEntries(url.searchParams.entries());
    const parseResult = listAiTopicsQuerySchema.safeParse(queryObj);

    const query = parseResult.success ? parseResult.data : { limit: 50, offset: 0 };

    // 4. Fetch topics from service
    const topicsService = container.get(AdminTopicsService);
    const result = await topicsService.listTopics({
      status: query.status,
      search: query.search,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          topics: result.topics,
          total: result.total,
        },
        topics: result.topics, // Backwards-compatible
        total: result.total,
      },
      { status: 200, headers },
    );
  } catch (err: unknown) {
    logger.error("Admin list AI topics error", { error: String(err), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: AI_TOPICS_ERRORS.LIST_FAILED,
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}

export async function POST(req: NextRequest) {
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
            message: AI_TOPICS_ERRORS.FORBIDDEN_ORIGIN,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
        },
        { status: 403, headers },
      );
    }

    // 2. Auth session check
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
            requestId,
          },
          code: ErrorCode.UNAUTHENTICATED,
        },
        { status: 401, headers },
      );
    }

    // 3. RBAC permission check: Editor+ required to create topics
    if (!auth.hasPermission(session.role, "editor")) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: AI_TOPICS_ERRORS.FORBIDDEN_ROLE,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
        },
        { status: 403, headers },
      );
    }

    // 4. Request payload validation
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      rawBody = {};
    }

    const parseResult = createAiTopicSchema.safeParse(rawBody);
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
        { status: 422, headers },
      );
    }

    const data = parseResult.data;
    const topicsService = container.get(AdminTopicsService);
    const created = await topicsService.createTopic(data);

    return NextResponse.json(
      {
        ok: true,
        data: {
          topic: created,
        },
        topic: created, // Backwards-compatible
        success: true,
      },
      { status: 201, headers },
    );
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: err.code,
            message: err.message,
            requestId,
          },
          code: err.code,
        },
        { status: err.code === ErrorCode.FORBIDDEN ? 403 : 500, headers },
      );
    }

    logger.error("Admin create AI topic error", { error: String(err), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: AI_TOPICS_ERRORS.CREATE_FAILED,
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}
