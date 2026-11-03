# 08 — Contracts & End-to-End Validation

Owns: API contracts, `handleRoute`/`handleWebhook`, `callApi`, API headers, events, drift checks, the Feature Wiring Checklist. Zod conventions and `Result` are in `04`.

**Principle:** every packet that crosses a boundary has a Zod schema, both sides import the *same* schema, and a script fails the build if wiring drifts.

## Boundary matrix (nothing crosses unvalidated)
| Boundary | Validated by | Schema lives in |
|---|---|---|
| Form → Server Action | `runAction` input (`formDataToObject`) | `validations/<d>.ts` |
| Action result → UI | `runAction` output parse; typed `Result<T>` | `validations/<d>.ts` |
| Browser → route (params, query, body, headers) | `handleRoute` | `contracts/<d>.ts` |
| Route → browser | `handleRoute` parses `response`; `callApi` parses again | `contracts/<d>.ts` |
| Page `params`/`searchParams` | `safeParse` then `notFound()`/defaults (`02`) | `validations/<d>.ts` |
| Cookies, headers | header schemas | `lib/http/headers.ts` |
| Webhooks | raw body + signature, then schema | `contracts/<d>.ts` |
| `jsonb`, RPC args/results | Zod on read and write (`03`) | `validations/<d>.ts` |
| Uploads | `imageFileSchema` + sharp (`06`) | `validations/upload.ts` |
| Realtime, `postMessage`, `CustomEvent`, `BroadcastChannel`, browser storage | event/stored-value schema | `validations/events.ts` |
| Env | boot validation (`03`) | `lib/env/*` |
| Third-party API and AI/LLM output | schema; treated as untrusted data | `validations/<d>.ts` |

LLM or tool output is never trusted: parse it with a strict schema, bound its length, and never execute or render it as HTML.

## Contract definition (`lib/contracts/define.ts`)
```ts
import { z } from "zod";
import { ERROR_CODES } from "@/lib/errors";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type Contract<P extends z.ZodObject, Q extends z.ZodObject, B extends z.ZodType, R extends z.ZodType> = {
  readonly method: HttpMethod;
  readonly path: `/api/${string}`;            // "/api/posts/:id", must mirror app/api/posts/[id]/route.ts
  readonly auth: "required" | "optional" | "none";
  readonly params: P;
  readonly query: Q;
  readonly body: B;
  readonly response: R;                        // data payload only; the envelope is added by the wrapper
  readonly status?: 200 | 201;
  readonly idempotent?: boolean;               // true: client must send Idempotency-Key
};
export type AnyContract = Contract<z.ZodObject, z.ZodObject, z.ZodType, z.ZodType>;
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
```ts
// lib/contracts/post.ts: the only place this endpoint's shape is written
export const getPostContract = defineContract({
  method: "GET", path: "/api/posts/:id", auth: "optional",
  params: z.strictObject({ id: idSchema }), query: noQuery, body: noBody, response: postSchema,
});
// app/api/posts/[id]/route.ts
export const GET = handleRoute(getPostContract, ({ params, user }) => getPost(params.id, user));
// client
const res = await callApi(getPostContract, { params: { id } });   // Result<z.output<typeof postSchema>>
```
Rules: inbound shapes (`params`, `query`, `body`) are strict; `response` and the envelope use `z.object` (strip on the server so DB columns never leak, tolerate additive fields on the client). Query and list contracts reuse the page-level query schema and `paginationQuery` (`limit` ≤ 100, opaque `cursor`); list responses are `{ items, nextCursor: string | null }`.

## `handleRoute` invariants (`server/route.ts`)
Order is fixed; each step returns the standard envelope with the status from `STATUS_BY_CODE`:
1. Resolve `requestId` (accept a valid `x-request-id`, else generate); echo it on every response.
2. Reject methods and `Content-Type` mismatches (`UNSUPPORTED_MEDIA`) and oversized bodies (`PAYLOAD_TOO_LARGE`) **before** parsing; enforce the size while reading, not only via `content-length`.
3. Parse headers with the header schema; require `Idempotency-Key` (`z.uuid()`) when `idempotent: true`.
4. Authenticate per `contract.auth` (`required` → `requireUser`); rate-limit by user or IP.
5. Parse `await ctx.params`, query (`searchParamsToObject`, duplicate keys only for array fields), and body (`req.json()` in try/catch → `BAD_REQUEST` if malformed; then strict schema → `VALIDATION` with `fieldErrors`).
6. Run the typed handler (authorise ownership in the service; RLS enforces too).
7. Parse the handler result with `contract.response`. A failure is logged as response drift and returned as `INTERNAL`, never sent raw.
8. Respond `{ ok: true, data }` with `contract.status ?? 200`, `Cache-Control: private, no-store` (public caching only with an explicit, reviewed option and `auth: "none"`), `Content-Type: application/json; charset=utf-8`, `x-request-id`; 429 adds `Retry-After`.
9. `catch`: `unstable_rethrow(e)` first, then `AppError` → mapped envelope, anything else → logged once, generic `INTERNAL`.
- Idempotency: the `(user, key, body hash)` result is stored 24h (table with RLS, accessed through the admin client); same key + same body replays the stored response, same key + different body → `CONFLICT`.
- `handleWebhook(schema, verify, handler)`: read the raw text, verify the signature (constant-time), then parse; unknown event types are acknowledged with 200 and logged; handlers are idempotent by event id; heavy work is offloaded.
- Mutations only with POST/PUT/PATCH/DELETE; GET handlers are side-effect free.

## `callApi` invariants (`lib/api/call-api.ts`)
- Signature: `callApi(contract, input, opts?) → Promise<Result<z.output<R>>>`. It is the **only** place in client code that calls your own `/api`.
- Pre-validates `input` with the contract schemas (UX only), substitutes path params with `encodeURIComponent`, serialises query, sends JSON with `Content-Type`, `x-request-id`, and `Idempotency-Key` when required.
- Timeout via `AbortSignal.timeout` (default 15s) combined with the caller's signal. Retries only idempotent GETs (max 2, backoff); never retries a POST without an idempotency key.
- Parses the body with `envelopeSchema(contract.response)`. Network failure, timeout, non-JSON, or schema mismatch → `fail({ code: "INTERNAL", … })`, never a throw. Server `error` payloads pass through unchanged so `fieldErrors` reach the form.
- Honour `Retry-After` on 429 (surface it to the UI, `05`).

## Headers contract (`lib/http/headers.ts`)
| Header | Direction | Rule |
|---|---|---|
| `x-request-id` | req/res | UUID; set by `proxy.ts` if absent; read via `getRequestId()`; in every log line and error payload |
| `content-type` | req | `application/json` for JSON bodies, `multipart/form-data` for uploads; else 415 |
| `idempotency-key` | req | UUID; required when `idempotent: true` |
| `cache-control` | res | `private, no-store` by default |
| `retry-after` | res | seconds, on 429 and 503 |
| `authorization` | req | only for non-cookie third-party clients; browser auth is cookie-based |
Header names are lowercase in schemas; incoming headers are parsed with `z.looseObject` limited to the keys we read (we do not own all headers). Security response headers (CSP etc.) are owned by `03`.

## Events (`lib/validations/events.ts`)
```ts
export const appEventSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("post.created"), id: idSchema, at: z.iso.datetime() }),
  z.strictObject({ type: z.literal("post.deleted"), id: idSchema, at: z.iso.datetime() }),
]);
export type AppEvent = z.infer<typeof appEventSchema>;
export const parseEvent = (input: unknown): Result<AppEvent> => { /* safeParse → ok/fail */ };
```
- One discriminated union per channel family; handler maps use `satisfies { [K in AppEvent["type"]]: (e: Extract<AppEvent, { type: K }>) => void }`, so a new event type fails `typecheck` until handled.
- `message` listeners check `event.origin` against a constant allowlist (and `event.source` when relevant), then `parseEvent(event.data)`. `CustomEvent.detail`, `BroadcastChannel`, Supabase Realtime `payload.new`, and values read from `localStorage` are parsed the same way; invalid ones are dropped and logged, never partially used.
- DOM events (`onChange`, `onSubmit`, `onClick`) are typed handlers (`02`); values are validated when submitted, not trusted from `e.target`.
- Event payloads carry ids and timestamps, not secrets or PII.

## Feature Wiring Checklist (in this order)
1. Migration + RLS + RLS tests (`03`); `npm run db:types`.
2. Zod schemas in `validations/<d>.ts` (+ shared limit constants); schema tests.
3. DTO mapper `toXDto(row)` typed from `Tables<…>`.
4. Contract in `contracts/<d>.ts` (or action input/output schemas); contract test.
5. Service/query in `server/services|queries/<d>.ts`: ownership check, `mapDbError`, `updateTag`.
6. `route.ts` via `handleRoute` **or** `actions.ts` via `runAction`.
7. Client: `callApi` or `useActionState` form; `name`s equal schema keys; `ERROR_COPY` shown; 4 UI states (`05`).
8. Integration tests: success, `VALIDATION`, `UNAUTHENTICATED`, `FORBIDDEN`; E2E if critical.
9. `.env.example`, docs/ADR, `npm run check`, graphs refreshed (`00`).

## Drift checks (`scripts/check-boundaries.mjs`, part of `npm run check`)
Fail the build when:
1. A `route.ts` method is not produced by `handleRoute`/`handleWebhook`, or an `actions.ts` export does not call `runAction`.
2. A contract's `path` does not match its route file path, or a contract is used by no route.
3. `fetch(` targets `/api` outside `lib/api/call-api.ts`.
4. Layer rules from `AGENTS.md` break: client files import `server/**`, `lib/env/server`, or `lib/supabase/admin|server`; a `server/**` file lacks `import "server-only"`.
5. `process.env` is read outside `lib/env/` (root config files and `scripts/` excepted); a `NEXT_PUBLIC_*` name looks secret (`03`).
6. `any`, `as unknown as`, `@ts-ignore`, `console.`, or `dangerouslySetInnerHTML` appears in `src/`.
7. A migration has `create table` without enabling RLS.
The script is plain Node with no dependencies, has its own tests with passing and failing fixtures, and is updated in the same PR as any rule it enforces. Vitest contract tests (`07`) cover the runtime side: params ↔ path, response schema strictness, envelope round-trip.
