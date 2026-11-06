import "server-only";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminPostsService } from "@/lib/services/admin-posts.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import {
  adminPostParamsSchema,
  updateAdminPostSchema,
} from "@/lib/contracts/admin-posts.contract";
import { logger } from "@/lib/logger";
import { AppError, ErrorCode, STATUS_BY_CODE, toFieldErrors } from "@/lib/errors";
import { POST_ERRORS, POST_AUTHOR_ROLES } from "@/lib/constants/posts.constants";
import { getRequestId } from "@/lib/server/requestContext";
import { isAllowedOrigin } from "@/lib/utils/text";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
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

    // 3. Param validation
    const resolvedParams = await params;
    const paramsResult = adminPostParamsSchema.safeParse(resolvedParams);
    if (!paramsResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: POST_ERRORS.INVALID_ID,
            fieldErrors: toFieldErrors(paramsResult.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 400, headers },
      );
    }

    const { id } = paramsResult.data;

    // 4. Execution via Service layer
    const postsService = container.get(AdminPostsService);
    const post = await postsService.getPostById(id);

    if (!post) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: POST_ERRORS.NOT_FOUND,
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
        data: { post },
        post,
      },
      { status: 200, headers },
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
            fieldErrors: error.fieldErrors,
            requestId,
          },
          code: error.code,
        },
        { status: STATUS_BY_CODE[error.code] || 400, headers },
      );
    }

    logger.error("Get admin post by id error", { error: String(error), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: POST_ERRORS.FAILED_GET_POST,
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
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

    // 3. Role check (author or higher required)
    if (!POST_AUTHOR_ROLES.includes(session.role as (typeof POST_AUTHOR_ROLES)[number])) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: POST_ERRORS.FORBIDDEN_ROLE,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
        },
        { status: 403, headers },
      );
    }

    // 4. Param validation
    const resolvedParams = await params;
    const paramsResult = adminPostParamsSchema.safeParse(resolvedParams);
    if (!paramsResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: POST_ERRORS.INVALID_ID,
            fieldErrors: toFieldErrors(paramsResult.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 400, headers },
      );
    }

    const { id } = paramsResult.data;

    // 5. Body parsing & validation
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.BAD_REQUEST,
            message: "Malformed JSON payload in request body",
            requestId,
          },
          code: ErrorCode.BAD_REQUEST,
        },
        { status: 400, headers },
      );
    }

    const parseResult = updateAdminPostSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: POST_ERRORS.VALIDATION_FAILED,
            fieldErrors: toFieldErrors(parseResult.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 400, headers },
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;

    // 6. Execution via Service layer
    const postsService = container.get(AdminPostsService);
    const updated = await postsService.updatePost(
      id,
      parseResult.data,
      session.userId,
      ipAddress,
    );

    return NextResponse.json(
      {
        ok: true,
        data: { post: updated },
        post: updated,
      },
      { status: 200, headers },
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
            fieldErrors: error.fieldErrors,
            requestId,
          },
          code: error.code,
        },
        { status: STATUS_BY_CODE[error.code] || 400, headers },
      );
    }

    logger.error("Update admin post error", { error: String(error), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: POST_ERRORS.FAILED_UPDATE_POST,
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
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

    // 3. Role check (editor or higher required to delete)
    if (!authService.hasPermission(session.role, "editor")) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: POST_ERRORS.FORBIDDEN_DELETE,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
        },
        { status: 403, headers },
      );
    }

    // 4. Param validation
    const resolvedParams = await params;
    const paramsResult = adminPostParamsSchema.safeParse(resolvedParams);
    if (!paramsResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: POST_ERRORS.INVALID_ID,
            fieldErrors: toFieldErrors(paramsResult.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 400, headers },
      );
    }

    const { id } = paramsResult.data;
    const ipAddress = req.headers.get("x-forwarded-for") || undefined;

    // 5. Execution via Service layer
    const postsService = container.get(AdminPostsService);
    const success = await postsService.deletePost(id, session.userId, ipAddress);

    if (!success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: POST_ERRORS.NOT_FOUND,
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
        data: {
          success: true,
          message: POST_ERRORS.POST_DELETED_SUCCESS,
        },
        message: POST_ERRORS.POST_DELETED_SUCCESS,
      },
      { status: 200, headers },
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
            fieldErrors: error.fieldErrors,
            requestId,
          },
          code: error.code,
        },
        { status: STATUS_BY_CODE[error.code] || 400, headers },
      );
    }

    logger.error("Delete admin post error", { error: String(error), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: POST_ERRORS.FAILED_DELETE_POST,
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}
