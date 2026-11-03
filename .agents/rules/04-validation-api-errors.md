# 04 — Validation, Result/AppError, Server Actions, Forms & Logging (Zod 4)

Owns: Zod conventions, `Result`/`AppError`, `runAction`, form parsing, logging. Contracts, `handleRoute`, `callApi`, API headers, and events are owned by `08`.

## Zod 4 rules
- `import { z } from "zod";` Zod 4 APIs only: top-level formats (`z.uuid()`, `z.url()`, `z.iso.datetime()`); messages via `{ error: "…" }`, not `message`/`required_error`.
- Normalised email: `z.string().trim().toLowerCase().pipe(z.email())`.
- `z.strictObject()` for **every inbound shape** (body, query, params, form, headers, events): unknown keys are rejected. `z.object()` only for responses read by the client (additive-safe) and third-party payloads we do not own (then take only the fields we use).
- `z.coerce.*` only where inputs are strings (FormData, query, params), always bounded (`z.coerce.number().int().min(1).max(100)`). Never coerce booleans (`"false"` is truthy): use `z.enum(["true","false"]).transform((v) => v === "true")`.
- `safeParse`/`safeParseAsync` at every boundary. `.parse` only in tests and boot-time env validation (which must fail fast).
- **Bounds on everything**: strings `.trim().min(1).max(N)`; numbers `.int().min().max()`; arrays `.max()`; records with a bounded key set. Unbounded input is a DoS vector.
- Enums: one `as const` array, used by `z.enum`, UI options, and the DB check constraint.
- Types derive from schemas: `FooInput = z.input<typeof fooSchema>`, `FooData = z.output<typeof fooSchema>`.
- Layout: `lib/validations/primitives.ts` (`idSchema`, `emailSchema`, `nextPathSchema`, `paginationQuery`, `isoDateSchema`, `moneySchema`, `slugSchema`, text helpers like `emptyToUndefined`), `upload.ts` (`06`), `events.ts` (`08`), `<domain>.ts`.
- Schemas are pure: no I/O, no side effects. Transforms only normalise (trim, lowercase, coerce). Existence, uniqueness, and ownership checks live in services, not schemas.
- Cross-field rules use `.superRefine`/`.check` with `path` set so the error attaches to a field.
- Client and server share schemas; **server validation is mandatory** even when the client validated.
- Each non-trivial schema has tests: valid, invalid, boundary (min, max, max+1), whitespace/unicode, unknown key.

## Errors and Result (single definition; others import)
```ts
// lib/errors.ts
import type { z } from "zod";
export const ERROR_CODES = ["BAD_REQUEST", "VALIDATION", "UNAUTHENTICATED", "FORBIDDEN", "NOT_FOUND",
  "CONFLICT", "PAYLOAD_TOO_LARGE", "UNSUPPORTED_MEDIA", "RATE_LIMITED", "INTERNAL"] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];
export const STATUS_BY_CODE = { BAD_REQUEST: 400, VALIDATION: 422, UNAUTHENTICATED: 401, FORBIDDEN: 403,
  NOT_FOUND: 404, CONFLICT: 409, PAYLOAD_TOO_LARGE: 413, UNSUPPORTED_MEDIA: 415, RATE_LIMITED: 429,
  INTERNAL: 500 } as const satisfies Record<ErrorCode, number>;
export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fieldErrors: FieldErrors | undefined;
  constructor(code: ErrorCode, message: string, opts: { fieldErrors?: FieldErrors; cause?: unknown } = {}) {
    super(message, { cause: opts.cause });        // message must be safe for end users
    this.code = code;
    this.fieldErrors = opts.fieldErrors;
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
export type ErrorPayload = { code: ErrorCode; message: string; fieldErrors?: FieldErrors; requestId?: string };
export type Result<T = void> = { ok: true; data: T } | { ok: false; error: ErrorPayload };
export const ok = <T>(data: T): Result<T> => ({ ok: true, data });
export const fail = (error: ErrorPayload): Result<never> => ({ ok: false, error });
```
- Expected failures (validation, auth, conflict, not found) are **returned** as `Result`; unexpected failures are logged once and become a generic `INTERNAL`. The HTTP status is always derived from `STATUS_BY_CODE`, never typed by hand.
- Never return raw `Error`, Supabase errors, or stacks to the client. `server/db-error.ts` `mapDbError(error): AppError` maps Postgres/PostgREST codes (`23505` → `CONFLICT`, `23503` → `CONFLICT`, `42501` → `FORBIDDEN`, `PGRST116` → `NOT_FOUND`, anything else → `INTERNAL` with `cause`).
- The same `Result` shape is used by actions, routes (as the response envelope, `08`), and `callApi`.

## `runAction` (`server/action.ts`)
```ts
import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { z } from "zod";
import { AppError, toFieldErrors } from "@/lib/errors";
import { fail, ok, type Result } from "@/lib/result";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/http/headers";
import { requireUser } from "@/server/auth";

type Def<I extends z.ZodType, O extends z.ZodType> = {
  input: I;
  output: O;
  handler: (ctx: { input: z.output<I>; user: User; requestId: string }) => Promise<z.input<O>>;
};

export function runAction<I extends z.ZodType, O extends z.ZodType>(def: Def<I, O>) {
  return async (raw: unknown): Promise<Result<z.output<O>>> => {
    const requestId = await getRequestId();
    try {
      const user = await requireUser();                                   // 1. authenticate
      const input = def.input.safeParse(raw);                             // 2. validate
      if (!input.success) {
        return fail({ code: "VALIDATION", message: "Invalid input", fieldErrors: toFieldErrors(input.error), requestId });
      }
      const data = await def.handler({ input: input.data, user, requestId }); // 3. authorise + act + invalidate
      const out = def.output.safeParse(data);                             // 4. parse output (strips extra columns)
      if (!out.success) throw new AppError("INTERNAL", "Response drift", { cause: out.error });
      return ok(out.data);
    } catch (e) {
      unstable_rethrow(e);                                                // never swallow redirect/notFound
      if (e instanceof AppError) {
        return fail({ code: e.code, message: e.message, requestId, ...(e.fieldErrors ? { fieldErrors: e.fieldErrors } : {}) });
      }
      logger.error("action failed", { requestId, cause: e });
      return fail({ code: "INTERNAL", message: "Something went wrong", requestId });
    }
  };
}
```
Order is fixed: **authenticate → validate → authorise (ownership/role) → act → invalidate → parse output → return**. A `runPublicAction` variant (user is `User | null`) exists for unauthenticated forms and **must** be rate-limited (`03`). Drift between handler and output schema is logged as `INTERNAL`, never sent raw.

## Server Action usage
```ts
"use server";
import { runAction } from "@/server/action";
import { createPostSchema, createdPostSchema } from "@/lib/validations/post";
import { echoValues, formDataToObject, type FormState } from "@/lib/validations/form-data";
import { createPost } from "@/server/services/post";

export async function createPostAction(
  _prev: FormState<{ id: string }> | null,
  formData: FormData,
): Promise<FormState<{ id: string }>> {
  const raw = formDataToObject(formData);
  const result = await runAction({
    input: createPostSchema,
    output: createdPostSchema,
    handler: ({ input, user }) => createPost(user.id, input),   // service validates ownership, writes, updateTag
  })(raw);
  return { result, values: echoValues(raw) };
}
```
- Actions are public HTTP endpoints: every argument is hostile. `user_id`, `role`, `price` are derived from session/DB, never from input schemas.
- `"use server"` files export **only async functions**. `redirect()` after success goes in the action body, outside `try/catch`, only when `result.ok`.
- Keep actions thin; logic in `server/services/<domain>.ts`; mutations idempotent where retries are possible (idempotency key, `08`).

## Form helpers (`lib/validations/form-data.ts`)
- `formDataToObject(fd)`: repeated keys become arrays, single keys stay strings, Next's internal `$ACTION_*` keys are skipped (they would fail strict schemas). Returns `unknown`-safe plain data; files stay `File`.
- HTML quirks handled in the **schema**, not the component: empty string → `undefined` for optional fields (`emptyToUndefined`), unchecked checkbox is absent (`z.literal("on").optional()` mapped to boolean), numbers arrive as strings.
- `FormState<T> = { result: Result<T>; values: Record<string, string> }`. `echoValues(raw)` returns only string fields and drops keys matching `/pass|token|secret|card|cvc|otp/i`; React resets uncontrolled forms after an action, so inputs use `defaultValue={state.values.title}`.

## Client form UX (UI wiring in `05`)
- Native `<form action={formAction}>` with `useActionState`; inputs' `name` **equals the schema key** (a unit test per form asserts this).
- Optional client pre-check: `schema.safeParse(formDataToObject(new FormData(form)))` on blur/submit for hints only; the server decides.
- `maxLength`, `min`, `max`, `accept` on inputs come from the exported schema constants (`POST_TITLE_MAX`), never retyped literals.
- Field errors from `fieldErrors[name]`; `_form` errors in a form-level alert. Disable submit while pending; create-actions carry a hidden `idempotencyKey` (`z.uuid()`) generated at render.
- Never rely on client validation alone.

## Logging & observability
- One logger (`lib/logger.ts`); no raw `console.*` (lint-enforced). Structured JSON `{ level, msg, code, requestId, userId?, … }`. A redaction list (`password|token|authorization|cookie|secret|key`) is applied to every payload. Never log PII or full bodies.
- Log unexpected errors once, at the boundary that handles them, with `cause`. `requestId` is returned to the client so support can correlate.
- `error.tsx` and `global-error.tsx` show a friendly message, retry (`reset`), and the error digest; never the raw error.
- Error tracker (e.g. Sentry) wired via `instrumentation.ts` before production launch.
