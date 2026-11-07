import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminPromptsService } from "@/lib/services/admin-prompts.service";
import {
  updateAiPromptBodySchema,
  updateAiPromptParamsSchema,
} from "@/lib/contracts/admin-ai-prompts.contract";
import { AppError, ErrorCode, STATUS_BY_CODE, toFieldErrors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { AI_PROMPTS_ERRORS, AI_PROMPTS_MESSAGES } from "@/lib/constants/ai.constants";
import { getRequestId } from "@/lib/server/requestContext";
import { isAllowedOrigin } from "@/lib/utils/text";

export const runtime = "nodejs";

// ─── GET /api/admin/ai/prompts ─────────────────────────────────────────────
// Viewer+ role: returns all active prompt template configurations.

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("x-request-id", requestId);
  headers.set("Cache-Control", "private, no-store");

  // 1. Origin check
  const origin = req.headers.get("origin");
  if (origin && !isAllowedOrigin(origin)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.FORBIDDEN,
          message: AI_PROMPTS_ERRORS.FORBIDDEN_ORIGIN,
          requestId,
        },
      },
      { status: 403, headers },
    );
  }

  // 2. Auth session check (Viewer+ allowed to read)
  const container = getContainer();
  const auth = container.get(AdminAuthService);
  const session = await auth.getCurrentSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.UNAUTHENTICATED,
          message: AI_PROMPTS_ERRORS.UNAUTHORIZED,
          requestId,
        },
      },
      { status: 401, headers },
    );
  }

  try {
    const promptsService = container.get(AdminPromptsService);
    const templates = await promptsService.listTemplates();

    return NextResponse.json(
      {
        ok: true,
        data: {
          templates,
          total: templates.length,
        },
        // Backwards-compatible flat fields
        templates,
        total: templates.length,
      },
      { status: 200, headers },
    );
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: err.code, message: err.message, requestId },
        },
        { status: STATUS_BY_CODE[err.code] ?? 500, headers },
      );
    }

    logger.error(AI_PROMPTS_ERRORS.LIST_FAILED, {
      error: err instanceof Error ? err.message : String(err),
      requestId,
    });

    return NextResponse.json(
      {
        ok: false,
        error: { code: ErrorCode.INTERNAL, message: AI_PROMPTS_ERRORS.LIST_FAILED, requestId },
      },
      { status: 500, headers },
    );
  }
}

// ─── PATCH /api/admin/ai/prompts?id=<uuid> ────────────────────────────────
// Editor+ role: updates a specific prompt template by its UUID.
// The template ID is passed as a query parameter `id`.

export async function PATCH(req: NextRequest) {
  const requestId = await getRequestId();
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("x-request-id", requestId);
  headers.set("Cache-Control", "private, no-store");

  // 1. Origin check
  const origin = req.headers.get("origin");
  if (origin && !isAllowedOrigin(origin)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.FORBIDDEN,
          message: AI_PROMPTS_ERRORS.FORBIDDEN_ORIGIN,
          requestId,
        },
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
          message: AI_PROMPTS_ERRORS.UNAUTHORIZED,
          requestId,
        },
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
          message: AI_PROMPTS_ERRORS.FORBIDDEN_ROLE,
          requestId,
        },
      },
      { status: 403, headers },
    );
  }

  // 4. Validate `id` query param
  const url = new URL(req.url);
  const paramsParseResult = updateAiPromptParamsSchema.safeParse({
    id: url.searchParams.get("id"),
  });

  if (!paramsParseResult.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.VALIDATION,
          message: AI_PROMPTS_ERRORS.INVALID_ID,
          fieldErrors: toFieldErrors(paramsParseResult.error),
          requestId,
        },
      },
      { status: 422, headers },
    );
  }

  const { id } = paramsParseResult.data;

  // 5. Validate request body
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    rawBody = {};
  }

  const bodyParseResult = updateAiPromptBodySchema.safeParse(rawBody);
  if (!bodyParseResult.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.VALIDATION,
          message: AI_PROMPTS_ERRORS.VALIDATION_FAILED,
          fieldErrors: toFieldErrors(bodyParseResult.error),
          requestId,
        },
      },
      { status: 422, headers },
    );
  }

  try {
    const promptsService = container.get(AdminPromptsService);
    const updated = await promptsService.updateTemplate(id, bodyParseResult.data);

    if (!updated) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: AI_PROMPTS_ERRORS.TEMPLATE_NOT_FOUND,
            requestId,
          },
        },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: { template: updated },
        // Backwards-compatible flat fields
        template: updated,
        success: true,
        message: AI_PROMPTS_MESSAGES.TEMPLATE_UPDATED,
      },
      { status: 200, headers },
    );
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: err.code, message: err.message, requestId },
        },
        { status: STATUS_BY_CODE[err.code] ?? 500, headers },
      );
    }

    logger.error(AI_PROMPTS_ERRORS.UPDATE_FAILED, {
      id,
      error: err instanceof Error ? err.message : String(err),
      requestId,
    });

    return NextResponse.json(
      {
        ok: false,
        error: { code: ErrorCode.INTERNAL, message: AI_PROMPTS_ERRORS.UPDATE_FAILED, requestId },
      },
      { status: 500, headers },
    );
  }
}
