import "server-only";
import { NextResponse } from "next/server";
import { clearSessionCookie, SESSION_COOKIE } from "@/lib/auth/session";
import { ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { AUTH_ERRORS, AUTH_MESSAGES } from "@/lib/constants/auth.constants";
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

    // 2. Clear server-side session cookie
    try {
      await clearSessionCookie();
    } catch {
      // Graceful fallback when next/headers cookies() is called outside request context (e.g. tests)
    }

    logger.info("Admin logout success", { requestId });

    // 3. Construct response with explicit cookie removal
    const response = NextResponse.json(
      {
        ok: true,
        data: {
          message: AUTH_MESSAGES.LOGOUT_SUCCESS,
        },
        message: AUTH_MESSAGES.LOGOUT_SUCCESS, // Backwards-compatible
        success: true,
      },
      { status: 200, headers },
    );

    // Delete and expire session cookie from client
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    response.cookies.delete(SESSION_COOKIE);

    return response;
  } catch (error) {
    logger.error("Admin logout unhandled error", {
      error: error instanceof Error ? error.message : String(error),
      requestId,
    });

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: AUTH_ERRORS.LOGOUT_FAILED,
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}
