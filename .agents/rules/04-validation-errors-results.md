---
trigger: always_on
---

# 04 — Validation, Errors/Result, Server Actions & Logging (Zod 4)

Owns: Zod conventions, `ErrorCode` enum, `AppError`/`Result`, `runAction`, form parsing, and logging. Contracts: `08`; Resilience: `11`.

## 0. Version & Syntax Invariant Matrix

| Topic | Active Tech | Breaking Point / Critical Syntax |
| --- | --- | --- |
| **Schema Engine** | Zod 4 (`zod`) | APIs: `z.uuid()`, `z.url()`, `z.iso.datetime()`. Error messages: `{ error: "…" }`. |
| **Inbound Bounds** | Strict Parsing | Mandatory `z.strictObject()` on inbound inputs. Bounded strings/arrays/numbers. |
| **Error Codes** | `lib/errors.ts` | **MANDATORY ENUM**: `ErrorCode` (never raw string union literals). |
| **Result Pattern** | `lib/result.ts` | Discriminated union: `{ ok: true, data: T } \| { ok: false, error: ErrorPayload }`. |
| **Server Action** | `lib/server/action.ts` | All mutations wrapped in `runAction(schema, action)`. |
| **Logger** | `lib/logger.ts` | Structured logging via `logger.{info,warn,error}`. No bare `console.log`. |

## 1. Mandatory `ErrorCode` Enum

Error codes MUST use the `ErrorCode` enum from `lib/errors.ts`. Never use raw string union literals (`"NOT_FOUND"`, `"CONFLICT"`).
- **Available members**: `BAD_REQUEST`, `VALIDATION`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA`, `RATE_LIMITED`, `UNAVAILABLE`, `INTERNAL`.
- **Throws**: `throw new AppError(ErrorCode.NOT_FOUND, "Job not found");`
- **Result failure**: `fail({ code: ErrorCode.UNAUTHENTICATED, message: "Invalid credentials" });`
- Eliminates typos (e.g. typing `"UNAUTHORIZED"` instead of `"UNAUTHENTICATED"`), ensuring compile-time safety across actions, routes, and UI.

## 2. Zod 4 Validation Rules

- `import { z } from "zod";` Zod 4 APIs only.
- Strict inbound shapes: Use `z.strictObject()` for bodies, params, query, headers, and events. `z.object()` is reserved for client-side reads of additive server payloads.
- Always apply bounds: Strings `.trim().min(1).max(N)`, integers `.int().min().max()`, arrays `.max()`.
- Coercion: `z.coerce.*` is restricted to string inputs (FormData, query parameters). Never coerce booleans blindly (use enum transforms).
- Boundary safety: Use `safeParse`/`safeParseAsync` at every boundary. `.parse()` is permitted only in boot-time env validation and tests.
- Closed sets: Derive from enum constants via `z.enum(VALUES_ARRAY)`.
- Derive TypeScript types directly from schemas: `z.input<typeof Schema>` (inbound) and `z.output<typeof Schema>` (parsed).

## 3. Errors & Result Architecture

- **`AppError`**: Inherits from `Error`. Carries `code: ErrorCode`, safe `message`, optional `fieldErrors`, optional `retryAfterSec`, and optional `cause`.
- **`Result<T>`**: Standard functional wrapper `{ ok: true, data: T } | { ok: false, error: ErrorPayload }`.
- Services throw `AppError` on domain rule violations; repositories map driver errors to `AppError` using `mapDbError`.
- Action and route wrappers catch `AppError` and format it into clean `{ ok: false, error }` envelopes without leaking raw database details or stack traces.

## 4. Server Actions (`lib/server/action.ts`)

- Every mutating Server Action is wrapped with `runAction(schema, handler)`.
- Request pipeline: Authenticate → Rate limit (Upstash/memory) → Parse input via Zod schema → Execute service → Return `Result<T>`.
- Client forms parse actions with `useActionState(action, initialState)`.
- Helper `formDataToObject` parses multi-value fields and numeric strings safely before validation.

## 5. Structured Logging (`lib/logger.ts`)

- Never use bare `console.log`, `console.error`, or `console.warn` anywhere in application code.
- Import `logger` from `lib/logger.ts`.
- Include structured context: `logger.info({ userId, jobId }, "Application submitted")`.
- Redact secrets, tokens, passwords, and sensitive PII from log arguments.
