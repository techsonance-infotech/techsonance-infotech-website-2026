import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import type { Contract } from "@/lib/contracts/define";
import { AppError, ErrorCode, toFieldErrors, STATUS_BY_CODE } from "@/lib/errors";
import { mapDbError } from "@/lib/dbErrors";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/server/requestContext";
import { requireUser, getOptionalUser, type SessionPayload } from "@/lib/server/auth";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { isAllowedOrigin } from "@/lib/utils/text";

type RouteContext<
  P extends z.ZodObject<z.ZodRawShape>,
  Q extends z.ZodObject<z.ZodRawShape>,
  B extends z.ZodType,
> = {
  params: z.output<P>;
  query: z.output<Q>;
  body: z.output<B>;
  user: SessionPayload | null;
  requestId: string;
};

export function handleRoute<
  P extends z.ZodObject<z.ZodRawShape>,
  Q extends z.ZodObject<z.ZodRawShape>,
  B extends z.ZodType,
  R extends z.ZodType,
>(contract: Contract<P, Q, B, R>, handler: (ctx: RouteContext<P, Q, B>) => Promise<z.input<R>>) {
  return async (req: NextRequest, segmentData?: { params?: Promise<Record<string, string>> }) => {
    const requestId = await getRequestId();
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("x-request-id", requestId);
    headers.set("Cache-Control", contract.cacheControl ?? "private, no-store");

    try {
      // 0. Origin check
      const originHeader = req.headers.get("origin");
      if (originHeader && !isAllowedOrigin(originHeader)) {
        throw new AppError(ErrorCode.FORBIDDEN, "Forbidden origin");
      }

      // 1. Auth check
      let user: SessionPayload | null = null;
      if (contract.auth === "required") {
        user = await requireUser();
      } else if (contract.auth === "optional") {
        user = await getOptionalUser();
      }

      // 2. Rate limiting (if public or IP-based)
      if (contract.auth === "none" || !user) {
        const clientIp =
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          req.headers.get("x-real-ip")?.trim() ||
          "127.0.0.1";
        await enforceRateLimit({ key: contract.path, limit: 60, windowSec: 60 }, clientIp);
      }

      // 3. Parse Params
      const rawParams = segmentData?.params ? await segmentData.params : {};
      const paramsParsed = contract.params.safeParse(rawParams);
      if (!paramsParsed.success) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "VALIDATION",
              message: "Invalid route params",
              fieldErrors: toFieldErrors(paramsParsed.error),
              requestId,
            },
          },
          { status: STATUS_BY_CODE.VALIDATION, headers },
        );
      }

      // 4. Parse Query
      const url = new URL(req.url);
      const queryObj = Object.fromEntries(url.searchParams.entries());
      const queryParsed = contract.query.safeParse(queryObj);
      if (!queryParsed.success) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "VALIDATION",
              message: "Invalid query parameters",
              fieldErrors: toFieldErrors(queryParsed.error),
              requestId,
            },
          },
          { status: STATUS_BY_CODE.VALIDATION, headers },
        );
      }

      // 5. Parse Body
      let bodyData: unknown = undefined;
      if (req.method !== "GET" && req.method !== "HEAD") {
        try {
          bodyData = await req.json();
        } catch {
          bodyData = undefined;
        }
      }
      const bodyParsed = contract.body.safeParse(bodyData);
      if (!bodyParsed.success) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "VALIDATION",
              message: "Invalid request payload",
              fieldErrors: toFieldErrors(bodyParsed.error),
              requestId,
            },
          },
          { status: STATUS_BY_CODE.VALIDATION, headers },
        );
      }

      // 6. Execute Handler
      const data = await handler({
        params: paramsParsed.data,
        query: queryParsed.data,
        body: bodyParsed.data,
        user,
        requestId,
      });

      // 7. Parse Response
      const responseParsed = contract.response.safeParse(data);
      if (!responseParsed.success) {
        throw new AppError(ErrorCode.INTERNAL, "Response schema drift", {
          cause: responseParsed.error,
        });
      }

      return NextResponse.json(
        { ok: true, data: responseParsed.data },
        { status: contract.status ?? 200, headers },
      );
    } catch (e) {
      unstable_rethrow(e);
      const err = mapDbError(e);
      if (err.code === ErrorCode.INTERNAL) {
        logger.error("Route handler error", { requestId, cause: e, path: contract.path });
      }

      return NextResponse.json(
        {
          ok: false,
          error: {
            code: err.code,
            message: err.code === "INTERNAL" ? "Something went wrong" : err.message,
            requestId,
            ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
            ...(err.retryAfterSec !== undefined ? { retryAfterSec: err.retryAfterSec } : {}),
          },
        },
        { status: STATUS_BY_CODE[err.code] ?? 500, headers },
      );
    }
  };
}
