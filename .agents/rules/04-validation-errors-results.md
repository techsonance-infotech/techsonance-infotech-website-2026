# 04 — Validation, Errors/Result, Server Actions, Forms & Logging (Zod 4)

Owns: Zod conventions, `AppError`/`Result`, `runAction`, form parsing, logging. Contracts, `handleRoute`, `callApi` are in `08`; failure policy in `11`; DB error mapping in `03b` §8.

## 1. Zod 4 rules

- `import { z } from "zod";` Zod 4 APIs only: `z.uuid()`, `z.url()`, `z.iso.datetime()`; messages via `{ error: "…" }`.
- Email: `z.string().trim().toLowerCase().pipe(z.email())`.
- `z.strictObject()` for **every inbound shape** (body, query, params, form, headers, events). `z.object()` only for client-read responses and third-party payloads (take only the fields we use).
- `z.coerce.*` only on string inputs (FormData, query, params), always bounded. Never coerce booleans: `z.enum(["true","false"]).transform((v) => v === "true")`.
- `safeParse`/`safeParseAsync` at every boundary. `.parse` only in tests, boot-time env validation, and `.catch()`-guarded page params (`02`).
- **Bounds on everything**: strings `.trim().min(1).max(N)`, numbers `.int().min().max()`, arrays `.max()`, records with bounded keys.
- Enums are `as const` arrays from `lib/constants/<d>.constants.ts`, shared by `z.enum`, UI options and DB check constraints.
- Types derive from schemas: `z.input` (wire/form) and `z.output` (parsed).
- Layout: `lib/validations/{primitives,upload,events}.schema.ts` and `<domain>.schema.ts`; form helpers in `lib/utils/formData.ts`.
- Schemas are pure. Transforms only normalise. Existence, uniqueness, ownership checks live in services.
- Cross-field rules use `.superRefine`/`.check` with `path` set.
- Server validation is mandatory even when the client validated.
- Tests per non-trivial schema: valid, invalid, boundary (min, max, max+1), whitespace/unicode, unknown key.

## 2. Errors and Result (single definition)

```ts
// lib/errors.ts
import type { z } from "zod";

export const ERROR_CODES = [
  "BAD_REQUEST", "VALIDATION", "UNAUTHENTICATED", "FORBIDDEN", "NOT_FOUND", "CONFLICT",
  "PAYLOAD_TOO_LARGE", "UNSUPPORTED_MEDIA", "RATE_LIMITED", "UNAVAILABLE", "INTERNAL",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export const STATUS_BY_CODE = {
  BAD_REQUEST: 400, VALIDATION: 422, UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404,
  CONFLICT: 409, PAYLOAD_TOO_LARGE: 413, UNSUPPORTED_MEDIA: 415, RATE_LIMITED: 429,
  UNAVAILABLE: 503, INTERNAL: 500,
} as const satisfies Record<ErrorCode, number>;

export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fieldErrors: FieldErrors | undefined;
  readonly retryAfterSec: number | undefined; // set for RATE_LIMITED and UNAVAILABLE
  constructor(
    code: ErrorCode,
    message: string, // must be safe for end users
    opts: { fieldErrors?: FieldErrors; retryAfterSec?: number; cause?: unknown } = {},
  ) {
    super(message, { cause: opts.cause });
    this.code = code;
    this.fieldErrors = opts.fieldErrors;
    this.retryAfterSec = opts.retryAfterSec;
  }
}

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
```

```ts
// lib/result.ts
import type { ErrorCode, FieldErrors } from "@/lib/errors";

export type ErrorPayload = {
  code: ErrorCode;
  message: string;
  fieldErrors?: FieldErrors;
  retryAfterSec?: number;
  requestId?: string;
};
export type Result<T = void> = { ok: true; data: T } | { ok: false; error: ErrorPayload };
export const ok = <T>(data: T): Result<T> => ({ ok: true, data });
export const fail = (error: ErrorPayload): Result<never> => ({ ok: false, error });
```

- Expected failures are **returned** as `Result`; unexpected ones are logged once and become generic `INTERNAL`. HTTP status always comes from `STATUS_BY_CODE`.
- Services throw `AppError`. Anything else reaching a wrapper goes through `mapDbError` (`03b` §8): unique/FK → `CONFLICT`, connection/timeout/deadlock → `UNAVAILABLE`, unknown → `INTERNAL`.
- Never return raw `Error`, driver errors, SQL text, constraint names or stacks to the client.
- The same `Result` shape serves actions, route envelopes (`08`) and `callApi`.
- `UNAVAILABLE` and `INTERNAL` are the only retryable-by-user codes; the UI shows a retry control (`11b` §4).

## 3. `runAction` (`lib/server/action.ts`)

```ts
import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { z } from "zod";
import { AppError, toFieldErrors } from "@/lib/errors";
import { mapDbError } from "@/lib/dbErrors";
import { fail, ok, type Result } from "@/lib/result";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/server/requestContext";
import { requireUser, getOptionalUser } from "@/lib/server/auth";
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
      return fail({ code: "VALIDATION", message: "Invalid input", fieldErrors: toFieldErrors(input.error), requestId });
    }
    const data = await def.handler({ input: input.data, user, requestId }); // 3. authorise + act + invalidate
    const out = def.output.safeParse(data); // 4. parse output (strips extra columns)
    if (!out.success) throw new AppError("INTERNAL", "Response drift", { cause: out.error });
    return ok(out.data);
  } catch (e) {
    unstable_rethrow(e); // never swallow redirect/notFound
    const err = mapDbError(e); // AppError passes through; driver errors are classified
    if (err.code === "INTERNAL") logger.error("action failed", { requestId, cause: e });
    else if (err.code === "UNAVAILABLE") logger.warn("action unavailable", { requestId, cause: e });
    return fail({
      code: err.code,
      message: err.code === "INTERNAL" ? "Something went wrong" : err.message,
      requestId,
      ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
      ...(err.retryAfterSec !== undefined ? { retryAfterSec: err.retryAfterSec } : {}),
    });
  }
}

export function runAction<I extends z.ZodType, O extends z.ZodType>(def: Def<I, O, User>) {
  return (raw: unknown) => execute(def, () => requireUser(), raw);
}

/** Unauthenticated forms (contact, careers, booking). Rate limiting is mandatory. */
export function runPublicAction<I extends z.ZodType, O extends z.ZodType>(
  policy: RateLimitPolicy,
  def: Def<I, O, User | null>,
) {
  return (raw: unknown) =>
    execute(
      def,
      async (requestId) => {
        await enforceRateLimit(policy, requestId); // throws AppError("RATE_LIMITED", …, { retryAfterSec })
        return getOptionalUser();
      },
      raw,
    );
}
```

Order is fixed: authenticate → (rate limit) → validate → authorise → act → invalidate → parse output → return. ⚠ type-check against installed Next/Supabase types (`09`).

## 4. Server Action usage (`features/<d>/actions.ts`)

```ts
"use server";
import { runPublicAction } from "@/lib/server/action";
import { getContainer } from "@/lib/di/container";
import { BookingService } from "@/lib/services/booking.service";
import { createBookingSchema, createdBookingSchema } from "@/lib/validations/booking.schema";
import { echoValues, formDataToObject, type FormState } from "@/lib/utils/formData";

export async function createBookingAction(_prev: FormState<{ id: string }> | null, formData: FormData): Promise<FormState<{ id: string }>> {
  const raw = formDataToObject(formData);
  const result = await runPublicAction({ key: "booking:create", limit: 5, windowSec: 600 }, {
    input: createBookingSchema,
    output: createdBookingSchema,
    handler: ({ input, requestId }) => getContainer().get(BookingService).create(input, { requestId }),
  })(raw);
  return { result, values: echoValues(raw) };
}
```

- Actions are public HTTP endpoints: every argument is hostile. `user_id`, `role`, `price` come from session/DB, never from input.
- `"use server"` files export only async functions. `redirect()` after success goes in the action body outside `try/catch`, only when `result.ok`.
- Actions stay thin; mutations that can be retried carry an idempotency key (`08`).

## 5. Form helpers (`lib/utils/formData.ts`)

- `formDataToObject(fd)`: repeated keys → arrays, single keys → strings, `$ACTION_*` keys skipped, files stay `File`.
- Empty string → `undefined` (`emptyToUndefined`) and checkbox handling are done in the **schema**.
- `FormState<T> = { result: Result<T>; values: Record<string, string> }`. `echoValues(raw)` returns string fields only and drops keys matching `/pass|token|secret|card|cvc|otp/i`, so a failed submit never loses what the user typed.

## 6. Client form UX (wiring in `05`)

- `<form action={formAction}>` with `useActionState`; input `name` equals the schema key (unit-tested per form).
- `maxLength`/`min`/`max`/`accept` come from exported schema constants.
- Field errors from `fieldErrors[name]`; `_form` errors in a form alert; `UNAVAILABLE`/`RATE_LIMITED` show a retry control or countdown from `retryAfterSec`.
- Disable submit while pending; create-actions carry a hidden `idempotencyKey` (`z.uuid()`) generated at render so double-clicks and retries cannot create duplicates.

## 7. Logging and observability

- One logger (`lib/logger.ts`); no `console.*`. Structured JSON `{ level, msg, code, requestId, userId?, … }` with redaction (`password|token|authorization|cookie|secret|key`). No PII or full bodies.
- Log unexpected errors once, at the boundary that handles them, with `cause`. Expected failures (validation, auth, conflict, not found) are not logged as errors. `requestId` goes back to the client so support can correlate.
- `error.tsx`/`global-error.tsx`: friendly message, retry, `digest`/`requestId`; never the raw error (`11b` §4).
- Error tracker (Sentry) wired through `instrumentation.ts` (`onRequestError`) before production launch (`11b` §5).
