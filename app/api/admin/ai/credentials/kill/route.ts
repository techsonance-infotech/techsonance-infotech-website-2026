import "server-only";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminAiCredentialsService } from "@/lib/services/ai/admin-ai-credentials.service";
import { killSwitchSchema } from "@/lib/validations/ai-credential.schema";
import { AppError, ErrorCode, STATUS_BY_CODE, toFieldErrors } from "@/lib/errors";
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
    const origin = req.headers.get("origin");
    if (origin && !isAllowedOrigin(origin)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: "Cross-origin request not allowed",
            requestId,
          },
        },
        { status: 403, headers },
      );
    }

    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.UNAUTHENTICATED,
            message: "Authentication required",
            requestId,
          },
        },
        { status: 401, headers },
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = killSwitchSchema.safeParse(body);

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
        },
        { status: 422, headers },
      );
    }

    const credentialsService = container.get(AdminAiCredentialsService);
    await credentialsService.killSwitch(
      parseResult.data,
      session.userId || "admin",
      requestId,
    );

    return NextResponse.json(
      {
        ok: true,
        data: {
          success: true,
          message: "Kill-switch activated. Credential has been immediately halted.",
        },
      },
      { status: 200, headers },
    );
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: err.code,
            message: err.message,
            requestId,
          },
        },
        { status: STATUS_BY_CODE[err.code] || 500, headers },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: "Internal server error occurred",
          requestId,
        },
      },
      { status: 500, headers },
    );
  }
}
