import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminTopicsService } from "@/lib/services/admin-topics.service";
import {
  aiTopicParamsSchema,
  updateAiTopicStatusSchema,
} from "@/lib/contracts/admin-ai-topics.contract";
import { AppError, ErrorCode, toFieldErrors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { AI_TOPICS_ERRORS } from "@/lib/constants/ai.constants";
import { getRequestId } from "@/lib/server/requestContext";
import { isAllowedOrigin } from "@/lib/utils/text";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
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

    // 2. Auth check (Viewer+ allowed)
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

    // 3. Validate params ID
    const rawParams = await params;
    const parsedParams = aiTopicParamsSchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: "Invalid topic ID format",
            fieldErrors: toFieldErrors(parsedParams.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 422, headers },
      );
    }

    const { id } = parsedParams.data;
    const topicsService = container.get(AdminTopicsService);
    const topic = await topicsService.getTopicById(id);

    if (!topic) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: AI_TOPICS_ERRORS.TOPIC_NOT_FOUND,
            requestId,
          },
          code: ErrorCode.NOT_FOUND,
        },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: { topic },
        topic, // Backward compatibility
      },
      { status: 200, headers },
    );
  } catch (err: unknown) {
    logger.error("Admin get AI topic by ID error", { error: String(err), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: "Failed to retrieve topic details",
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
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

    // 2. Auth check
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

    // 3. RBAC: Editor+ required
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

    // 4. Validate params ID
    const rawParams = await params;
    const parsedParams = aiTopicParamsSchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: "Invalid topic ID format",
            fieldErrors: toFieldErrors(parsedParams.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 422, headers },
      );
    }

    // 5. Parse body
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      rawBody = {};
    }

    const parsedBody = updateAiTopicStatusSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: "Valid status required",
            fieldErrors: toFieldErrors(parsedBody.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 422, headers },
      );
    }

    const { id } = parsedParams.data;
    const { status } = parsedBody.data;
    const topicsService = container.get(AdminTopicsService);
    const updated = await topicsService.updateTopicStatus(id, status);

    return NextResponse.json(
      {
        ok: true,
        data: { topic: updated },
        topic: updated, // Backward compatibility
        success: true,
      },
      { status: 200, headers },
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
        { status: err.code === "NOT_FOUND" ? 404 : 500, headers },
      );
    }

    logger.error("Admin update AI topic error", { error: String(err), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: AI_TOPICS_ERRORS.UPDATE_FAILED,
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    // 2. Auth check
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

    // 3. RBAC: Editor+ required
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

    // 4. Validate params ID
    const rawParams = await params;
    const parsedParams = aiTopicParamsSchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: "Invalid topic ID format",
            fieldErrors: toFieldErrors(parsedParams.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 422, headers },
      );
    }

    const { id } = parsedParams.data;
    const topicsService = container.get(AdminTopicsService);
    await topicsService.deleteTopic(id);

    return NextResponse.json(
      {
        ok: true,
        data: { success: true },
        success: true, // Backward compatibility
      },
      { status: 200, headers },
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
        { status: err.code === "NOT_FOUND" ? 404 : 500, headers },
      );
    }

    logger.error("Admin delete AI topic error", { error: String(err), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: AI_TOPICS_ERRORS.DELETE_FAILED,
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}
