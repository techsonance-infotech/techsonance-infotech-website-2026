import "server-only";
import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { adminRevalidateBodySchema } from "@/lib/contracts/admin-revalidate.contract";
import { AppError, ErrorCode, STATUS_BY_CODE, toFieldErrors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
  DEFAULT_REVALIDATE_TAGS,
  REVALIDATE_ERRORS,
  REVALIDATE_MESSAGES,
} from "@/lib/constants/revalidate.constants";
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
    // 1. Origin verification
    const origin = req.headers.get("origin");
    if (origin && !isAllowedOrigin(origin)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: REVALIDATE_ERRORS.FORBIDDEN_ORIGIN,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
        },
        { status: 403, headers },
      );
    }

    // 2. Authentication check
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.UNAUTHENTICATED,
            message: REVALIDATE_ERRORS.UNAUTHORIZED,
            requestId,
          },
          code: ErrorCode.UNAUTHENTICATED,
        },
        { status: 401, headers },
      );
    }

    // 3. Authorization (RBAC): Editor+ required
    if (!authService.hasPermission(session.role, "editor")) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: REVALIDATE_ERRORS.FORBIDDEN_ROLE,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
        },
        { status: 403, headers },
      );
    }

    // 4. Request payload parsing and validation
    let rawBody: unknown = {};
    const text = await req.text();
    if (text && text.trim().length > 0) {
      try {
        rawBody = JSON.parse(text);
      } catch {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: ErrorCode.BAD_REQUEST,
              message: "Invalid JSON body format",
              requestId,
            },
            code: ErrorCode.BAD_REQUEST,
          },
          { status: 400, headers },
        );
      }
    }

    const parseResult = adminRevalidateBodySchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: REVALIDATE_ERRORS.VALIDATION_FAILED,
            fieldErrors: toFieldErrors(parseResult.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 422, headers },
      );
    }

    const { tags: customTags, paths: customPaths } = parseResult.data;

    // Default to standard site tags if no specific tags or paths requested
    const tagsToRevalidate =
      customTags && customTags.length > 0
        ? customTags
        : !customPaths || customPaths.length === 0
          ? [...DEFAULT_REVALIDATE_TAGS]
          : [];

    const pathsToRevalidate = customPaths ?? [];

    // 5. Execute tag revalidations
    for (const tag of tagsToRevalidate) {
      try {
        revalidateTag(tag, "default");
      } catch {
        // Fallback for standalone/test execution where Next cache context isn't bound
      }
    }

    // 6. Execute path revalidations
    for (const path of pathsToRevalidate) {
      try {
        revalidatePath(path);
      } catch {
        // Fallback for standalone/test execution where Next cache context isn't bound
      }
    }

    const timestamp = new Date().toISOString();

    logger.info("Admin revalidate cache success", {
      userId: session.userId,
      role: session.role,
      revalidatedTags: tagsToRevalidate,
      revalidatedPaths: pathsToRevalidate,
      requestId,
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          revalidatedTags: tagsToRevalidate,
          revalidatedPaths: pathsToRevalidate,
          timestamp,
          message: REVALIDATE_MESSAGES.REVALIDATE_SUCCESS,
        },
        // Backwards-compatible fields
        revalidated: tagsToRevalidate,
        timestamp,
        success: true,
      },
      { status: 200, headers },
    );
  } catch (error) {
    if (error instanceof AppError) {
      const status = STATUS_BY_CODE[error.code] ?? 500;
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

    logger.error("Admin revalidate unhandled error", {
      error: error instanceof Error ? error.message : String(error),
      requestId,
    });

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: REVALIDATE_ERRORS.REVALIDATE_FAILED,
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}
