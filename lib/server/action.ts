import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import { AppError, ErrorCode, toFieldErrors } from "@/lib/errors";
import { mapDbError } from "@/lib/dbErrors";
import { fail, ok, type Result } from "@/lib/result";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/server/requestContext";
import { requireUser, getOptionalUser, type SessionPayload } from "@/lib/server/auth";
import { enforceRateLimit, type RateLimitPolicy } from "@/lib/server/rateLimit";

type Def<I extends z.ZodType, O extends z.ZodType, U> = {
  input: I;
  output: O;
  handler: (ctx: { input: z.output<I>; user: U; requestId: string }) => Promise<z.input<O>>;
};

async function execute<I extends z.ZodType, O extends z.ZodType, U>(
  def: Def<I, O, U>,
  authenticate: (requestId: string) => Promise<U>,
  raw: unknown,
): Promise<Result<z.output<O>>> {
  const requestId = await getRequestId();
  try {
    const user = await authenticate(requestId); // 1. authenticate (+ rate limit for public)
    const input = def.input.safeParse(raw); // 2. validate
    if (!input.success) {
      return fail({
        code: ErrorCode.VALIDATION,
        message: "Invalid input",
        fieldErrors: toFieldErrors(input.error),
        requestId,
      });
    }
    const data = await def.handler({ input: input.data, user, requestId }); // 3. authorise + act + invalidate
    const out = def.output.safeParse(data); // 4. parse output (strips extra columns)
    if (!out.success) throw new AppError(ErrorCode.INTERNAL, "Response drift", { cause: out.error });
    return ok(out.data);
  } catch (e) {
    unstable_rethrow(e); // never swallow redirect/notFound
    const err = mapDbError(e); // AppError passes through; driver errors are classified
    if (err.code === ErrorCode.INTERNAL) logger.error("action failed", { requestId, cause: e });
    else if (err.code === ErrorCode.UNAVAILABLE) logger.warn("action unavailable", { requestId, cause: e });
    return fail({
      code: err.code,
      message: err.code === ErrorCode.INTERNAL ? "Something went wrong" : err.message,
      requestId,
      ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
      ...(err.retryAfterSec !== undefined ? { retryAfterSec: err.retryAfterSec } : {}),
    });
  }
}

export function runAction<I extends z.ZodType, O extends z.ZodType>(
  def: Def<I, O, SessionPayload>,
) {
  return (raw: unknown) => execute(def, () => requireUser(), raw);
}

/** Unauthenticated forms (contact, careers, booking). Rate limiting is mandatory. */
export function runPublicAction<I extends z.ZodType, O extends z.ZodType>(
  policy: RateLimitPolicy,
  def: Def<I, O, SessionPayload | null>,
) {
  return (raw: unknown) =>
    execute(
      def,
      async (requestId) => {
        await enforceRateLimit(policy, requestId);
        return getOptionalUser();
      },
      raw,
    );
}
