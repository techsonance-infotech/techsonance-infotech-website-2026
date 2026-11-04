# 08 — Contracts & End-to-End Validation

Owns: API contracts, `handleRoute`/`handleWebhook`, `callApi`, API headers, events, drift checks, and Feature Wiring Checklist. Zod conventions and `Result` are in `04`.
**Principle:** Every packet crossing a boundary has a Zod schema. Both sides import the *same* schema; drift checks fail the build if wiring drifts.
## Boundary Matrix
| Boundary | Validated by | Schema Location |
|---|---|---|
| Form → Server Action | `runAction` input (`formDataToObject`) | `validations/<d>.ts` |
| Action result → UI | `runAction` output parse; typed `Result<T>` | `validations/<d>.ts` |
| Browser → Route | `handleRoute` (params, query, body, headers) | `contracts/<d>.ts` |
| Route → Browser | `handleRoute` parses response; `callApi` parses again | `contracts/<d>.ts` |
| Page params / query | `safeParse` then `notFound()` / defaults (`02`) | `validations/<d>.ts` |
| Cookies, headers | Header schemas | `lib/http/headers.ts` |
| Webhooks | Raw body + signature, then schema | `contracts/<d>.ts` |
| `jsonb`, RPC args/results | Zod on read and write (`03`) | `validations/<d>.ts` |
| Uploads | `imageFileSchema` + sharp (`06`) | `validations/upload.ts` |
| Realtime, storage events | Event / stored-value schema | `validations/events.ts` |
| Env | Boot validation (`03`) | `lib/env/*` |
| AI / LLM / Third-party output | Strict schema, bound length, treated as untrusted | `validations/<d>.ts` |
## Contract Definition (`lib/contracts/define.ts`)
```ts
import { z } from "zod";
import { ERROR_CODES } from "@/lib/errors";
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type Contract<P extends z.ZodObject, Q extends z.ZodObject, B extends z.ZodType, R extends z.ZodType> = {readonly method: HttpMethod;
  readonly path: `/api/${string}`;
  readonly auth: "required" | "optional" | "none";
  readonly params: P;
  readonly query: Q;
  readonly body: B;
  readonly response: R;
  readonly status?: 200 | 201;
  readonly idempotent?: boolean;
};
export const defineContract = <P extends z.ZodObject, Q extends z.ZodObject, B extends z.ZodType, R extends z.ZodType>(
  c: Contract<P, Q, B, R>,
): Contract<P, Q, B, R> => c;
export const noParams = z.strictObject({});
export const noQuery = z.strictObject({});
export const noBody = z.undefined();
export const errorPayloadSchema = z.object({
  code: z.enum(ERROR_CODES),
  message: z.string().max(500),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  requestId: z.string().max(64).optional(),
});
export const envelopeSchema = <R extends z.ZodType>(data: R) =>
  z.discriminatedUnion("ok", [
    z.object({ ok: z.literal(true), data }),
    z.object({ ok: z.literal(false), error: errorPayloadSchema }),
  ]);
```
- Inbound shapes (`params`, `query`, `body`) are strict; `response` strips DB columns on server, allows additive fields on client.
- Paginated responses return `{ items, nextCursor: string | null }` (`limit` ≤ 100).
## `handleRoute` Invariants (`server/route.ts`)
Each step returns the standard envelope matching `STATUS_BY_CODE`:
1. **Request ID**: Resolve `requestId` (echo on response, include in logs).
2. **Pre-check**: Reject method/media-type mismatches (`UNSUPPORTED_MEDIA`) and oversized payloads (`PAYLOAD_TOO_LARGE`).
3. **Headers**: Parse header schema; require `Idempotency-Key` when `idempotent: true`.
4. **Auth & Rate Limits**: Check auth per `contract.auth` (`required` → `requireUser`); rate-limit by user or IP.
5. **Parse Input**: Parse params, query, and body (malformed JSON → `BAD_REQUEST`; invalid schema → `VALIDATION` with `fieldErrors`).
6. **Execution**: Run handler (service authorizes ownership; RLS enforces at DB).
7. **Response Validation**: Parse result with `contract.response`. Schema failure returns `INTERNAL` and logs drift.
8. **Response Output**: Return `{ ok: true, data }` with status code, `Cache-Control: private, no-store`, and `x-request-id`.
9. **Error Handling**: `unstable_rethrow(e)` first; `AppError` maps to envelope; unhandled errors log once and return `INTERNAL`.
- **Idempotency**: Replays return stored response (24h cache); body mismatch returns `CONFLICT`.
- **Webhooks**: Read raw body, verify signature (constant-time), parse event; unknown types return 200.
- Mutations only via POST/PUT/PATCH/DELETE; GET handlers are side-effect free.

## `callApi` Invariants (`lib/api/call-api.ts`)
- Signature: `callApi(contract, input, opts?) → Promise<Result<z.output<R>>>`. Sole client helper for `/api`.
- Pre-validates `input`, serializes params and query, attaches `x-request-id` and `Idempotency-Key`.
- Default timeout: 15s (`AbortSignal.timeout`). Retries idempotent GETs only (max 2); never retries POST without idempotency key.
- Parses body with `envelopeSchema(contract.response)`. Failures return `fail({ code: "INTERNAL", ... })`, never throwing.
- Passes through server `fieldErrors` to forms; honors `Retry-After` on 429.
## Headers Contract (`lib/http/headers.ts`)
| Header | Direction | Rule |
|---|---|---|
| `x-request-id` | req/res | UUID; set by `proxy.ts` if absent; logged in every trace |
| `content-type` | req | `application/json` or `multipart/form-data`; else 415 |
| `idempotency-key` | req | UUID; required when `idempotent: true` |
| `cache-control` | res | `private, no-store` by default |
| `retry-after` | res | Seconds, sent on 429 and 503 |
| `authorization` | req | External API clients only; browser auth uses cookies |
## Events (`lib/validations/events.ts`)
```ts
export const appEventSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("post.created"), id: idSchema, at: z.iso.datetime() }),
]);
export type AppEvent = z.infer<typeof appEventSchema>;
```
- Discriminated union per channel family; handler maps use `satisfies`.
- Validate message origins against allowlists. Parse `CustomEvent.detail`, `BroadcastChannel`, and Realtime payloads before use.
- Payloads carry IDs and timestamps, never secrets or PII.

## Feature Wiring Checklist
1. Migration + RLS + RLS tests (`03`); run `npm run db:types`.
2. Zod schemas in `validations/<d>.ts` (+ shared limits); schema tests.
3. DTO mapper `toXDto(row)` typed from `Tables<...>`.
4. Contract in `contracts/<d>.ts` (or action schemas); contract test.
5. Service/query in `server/services|queries/<d>.ts`: auth checks, `mapDbError`.
6. Route via `handleRoute` or action via `runAction`.
7. Client: `callApi` or `useActionState` form; 4 UI states (`05`).
8. Tests: integration tests (success, validation, auth failures).
9. Update `.env.example`, verify `npm run check`, refresh graphs (`00`).

## Drift Checks (`scripts/check-boundaries.mjs`)
Fails build when:
1. Route handler skips `handleRoute`/`handleWebhook`, or action skips `runAction`.
2. Contract `path` does not match its route file, or contract is unreferenced.
3. `fetch(` targets `/api` outside `lib/api/call-api.ts`.
4. Client code imports `server/**`, `lib/env/server`, or `lib/supabase/admin|server`.
5. `server/**` file lacks `import "server-only"`.
6. `process.env` read outside `lib/env/` (config files excepted).
7. `any`, `as unknown as`, `@ts-ignore`, or `console.` appears in `src/`.
8. Table migration created without enabling RLS.
