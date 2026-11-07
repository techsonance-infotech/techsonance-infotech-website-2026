import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminTelemetryService } from "@/lib/services/admin-telemetry.service";
import { isAllowedOrigin } from "@/lib/utils/text";
import { AI_USAGE_ERRORS } from "@/lib/constants/ai.constants";
import { AppError, ErrorCode, STATUS_BY_CODE } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && !isAllowedOrigin(origin)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.FORBIDDEN,
          message: AI_USAGE_ERRORS.FORBIDDEN_ORIGIN,
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
          message: AI_USAGE_ERRORS.UNAUTHORIZED,
        },
      },
      { status: 401 },
    );
  }

  try {
    const telemetryService = container.get(AdminTelemetryService);
    const summary = await telemetryService.getTelemetrySummary();

    return NextResponse.json(
      {
        ok: true,
        data: summary,
        ...summary,
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

    logger.error(AI_USAGE_ERRORS.LOAD_FAILED, {
      err: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: AI_USAGE_ERRORS.LOAD_FAILED,
        },
      },
      { status: 500 },
    );
  }
}
