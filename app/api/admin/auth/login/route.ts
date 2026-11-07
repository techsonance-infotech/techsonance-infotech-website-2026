import "server-only";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { RateLimiterService } from "@/lib/services/ratelimit.service";
import { createSessionToken, setSessionCookie, SESSION_COOKIE } from "@/lib/auth/session";
import { adminLoginBodySchema } from "@/lib/contracts/admin-auth.contract";
import { AppError, ErrorCode, STATUS_BY_CODE, toFieldErrors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
  AUTH_ERRORS,
  AUTH_LIMITS,
  AUTH_MESSAGES,
} from "@/lib/constants/auth.constants";
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
            message: AUTH_ERRORS.FORBIDDEN_ORIGIN,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
        },
        { status: 403, headers },
      );
    }

    // 2. Rate limiting (anti brute-force)
    const container = getContainer();
    const rateLimiter = container.get(RateLimiterService);
    const clientIp = rateLimiter.getClientIp(req);

    const rateLimitResult = await rateLimiter.check(`admin:login:${clientIp}`, {
      maxRequests: AUTH_LIMITS.MAX_LOGIN_ATTEMPTS,
      windowSeconds: AUTH_LIMITS.LOGIN_WINDOW_SECONDS,
    });

    if (!rateLimitResult.success) {
      const retryAfter = rateLimitResult.retryAfter ?? AUTH_LIMITS.LOGIN_WINDOW_SECONDS;
      headers.set("Retry-After", String(retryAfter));

      logger.warn("Admin login rate limit exceeded", {
        clientIp,
        retryAfter,
        requestId,
      });

      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.RATE_LIMITED,
            message: AUTH_ERRORS.RATE_LIMITED,
            retryAfterSec: retryAfter,
            requestId,
          },
          code: ErrorCode.RATE_LIMITED,
        },
        { status: 429, headers },
      );
    }

    // 3. Payload validation
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      rawBody = {};
    }

    const parseResult = adminLoginBodySchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: AUTH_ERRORS.VALIDATION_FAILED,
            fieldErrors: toFieldErrors(parseResult.error),
            requestId,
          },
          code: ErrorCode.VALIDATION,
        },
        { status: 422, headers },
      );
    }

    // 4. Authenticate credentials
    const { email, password } = parseResult.data;
    const authService = container.get(AdminAuthService);
    const user = await authService.authenticate(email, password);

    // 5. Generate secure session token and issue HTTP-only cookie
    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    try {
      await setSessionCookie(token);
    } catch {
      // Graceful fallback when next/headers cookies() is called outside request context (e.g. tests)
    }

    const userDto = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    logger.info("Admin login success", {
      userId: user.id,
      email: user.email,
      role: user.role,
      clientIp,
      requestId,
    });

    const response = NextResponse.json(
      {
        ok: true,
        data: {
          user: userDto,
          message: AUTH_MESSAGES.LOGIN_SUCCESS,
        },
        user: userDto, // Backwards-compatible
        message: AUTH_MESSAGES.LOGIN_SUCCESS,
        success: true,
      },
      { status: 200, headers },
    );

    // Ensure cookie is attached to response headers
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    if (error instanceof AppError) {
      const status = STATUS_BY_CODE[error.code] ?? 500;
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
          error_message: error.message, // Backwards-compatible
        },
        { status, headers },
      );
    }

    logger.error(AUTH_ERRORS.LOGIN_FAILED, {
      error: error instanceof Error ? error.message : String(error),
      requestId,
    });

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: AUTH_ERRORS.LOGIN_FAILED,
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}
