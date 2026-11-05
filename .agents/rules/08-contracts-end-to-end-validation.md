# 08 — Contracts, End-to-End Validation & Feature Wiring

Owns: API contracts, `handleRoute`, `callApi`, API headers, events, the pipeline Row → ResponseDto → ViewModel, and the feature wiring checklist. Zod conventions and `Result`: `04`. Webhooks, idempotency, rate limits: `11` §2.

**Principle:** every packet crossing a boundary has a Zod schema; both sides import the *same* schema; drift checks (`AGENTS.md` §4) fail the build.

## 1. Pipeline

`Row` (Drizzle) → service mapper → `ResponseDto` (server parses before sending) → wire → `callApi` parses → `features/<d>/view-models.ts` → `ViewModel` → UI. Request: form/UI → client pre-validate → `RequestDto` → server strict parse. The client never renders an unparsed response.

## 2. Boundary matrix

| Boundary | Validated by | Schema location |
| --- | --- | --- |
| Form → Server Action | `runAction` input (`formDataToObject`) | `lib/validations/<d>.schema.ts` |
| Action result → UI | `runAction` output parse, typed `Result<T>` | `lib/validations/<d>.schema.ts` |
| Browser ↔ Route | `handleRoute` (params, query, body, headers) both ways; `callApi` parses again | `lib/contracts/<d>.contract.ts` |
| Page params / query | `safeParse` then `notFound()`/defaults (`02`) | `lib/validations/<d>.schema.ts` |
| Cookies, headers | header schemas | `lib/http/headers.ts` |
| Webhooks | raw body + signature, then schema | `lib/contracts/<d>.contract.ts` |
| `jsonb`, RPC args/results | Zod on read and write | `lib/validations/<d>.schema.ts` |
| Uploads | `imageFileSchema` + sharp (`06`) | `lib/validations/upload.schema.ts` |
| Realtime, storage, `CustomEvent`, `BroadcastChannel` | event schema, origin allowlist | `lib/validations/events.schema.ts` |
| Env | boot validation (`03` §12) | `lib/env/*` |
| AI / third-party output | strict schema, bounded length, untrusted | `lib/validations/<d>.schema.ts` |

## 3. Contract definition (`lib/contracts/define.ts`)

```ts
import { z } from "zod";
import { ERROR_CODES } from "@/lib/errors";
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type Contract<P extends z.ZodObject, Q extends z.ZodObject, B extends z.ZodType, R extends z.ZodType> = {
  readonly method: HttpMethod;
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
  retryAfterSec: z.number().int().optional(),
  requestId: z.string().max(64).optional(),
});
export const envelopeSchema = <R extends z.ZodType>(data: R) =>
  z.discriminatedUnion("ok", [
    z.object({ ok: z.literal(true), data }),
    z.object({ ok: z.literal(false), error: errorPayloadSchema }),
  ]);
```

- Inbound shapes (`params`, `query`, `body`) are strict. `response` is parsed on the server (strips DB columns) and tolerates additive fields on the client.
- Paginated responses: `{ items, nextCursor: string | null }`, `limit ≤ 100`.
- Closed-set params/query values use enum schemas (`01` §3).

## 4. `handleRoute` invariants (`lib/server/route.ts`)

Every step returns the standard envelope with the status from `STATUS_BY_CODE`:
1. Resolve `requestId` (echo on response, log).
2. Reject method/media mismatches (`UNSUPPORTED_MEDIA`) and oversized bodies (`PAYLOAD_TOO_LARGE`) before buffering.
3. Parse header schema; require `Idempotency-Key` when `idempotent: true`.
4. Auth per `contract.auth`; rate limit by user or IP.
5. Parse params, query, body (malformed JSON → `BAD_REQUEST`; schema failure → `VALIDATION` + `fieldErrors`).
6. Run the handler; the service authorizes ownership (RLS is not the control, `03` §10).
7. Parse the result with `contract.response`; failure → `INTERNAL` and a logged drift diff.
8. Return `{ ok: true, data }` with status, `Cache-Control: private, no-store`, `x-request-id`.
9. `unstable_rethrow(e)` first; `AppError` maps to the envelope; unhandled errors log once → `INTERNAL`.

Mutations only via POST/PUT/PATCH/DELETE; GET is side-effect free. Idempotent replay and webhooks: `11` §2.

## 5. `callApi` invariants (`lib/api/callApi.ts`)

- `callApi(contract, input, opts?) → Promise<Result<z.output<R>>>`; the only client helper for `/api`. Never throws.
- Pre-validates input, serializes params/query, attaches `x-request-id` and `Idempotency-Key`.
- Default timeout 15 s (`AbortSignal.timeout`). Retries idempotent GETs only (max 2); never POST without an idempotency key.
- Parses with `envelopeSchema(contract.response)`; parse failure → `fail({ code: "INTERNAL", … })`. Network failure/timeout → `UNAVAILABLE`.
- Passes `fieldErrors` through to forms; honors `Retry-After` on 429/503.

## 6. Headers (`lib/http/headers.ts`, names are constants)

| Header | Direction | Rule |
| --- | --- | --- |
| `x-request-id` | req/res | UUID; set by `proxy.ts` if absent; in every log |
| `content-type` | req | `application/json` or `multipart/form-data`, else 415 |
| `idempotency-key` | req | UUID; required when `idempotent: true` |
| `cache-control` | res | `private, no-store` by default |
| `retry-after` | res | seconds, on 429 and 503 |
| `authorization` | req | external API clients only; browsers use cookies |

## 7. Events (`lib/validations/events.schema.ts`)

```ts
export const appEventSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("post.created"), id: idSchema, at: z.iso.datetime() }),
]);
export type AppEvent = z.infer<typeof appEventSchema>;
```
One union per channel family; handler maps use `satisfies` for exhaustiveness. Parse every incoming payload and check origins against an allowlist. Payloads carry ids and timestamps, never secrets/PII.

## 8. Feature wiring checklist

1. `lib/constants/enums/*.enum.ts` / `<d>.constants.ts` → `lib/validations/<d>.schema.ts` (+ tests).
2. `lib/database/schema/<d>.schema.ts` → export from `index.schema.ts` → `npm run db:generate` → read SQL, add grants/RLS block (`03` §9).
3. `lib/repositories/<d>.repository.ts`, `lib/services/<d>.service.ts` (+ `.mapper.ts` returning the ResponseDto), bind in `lib/di/container.ts` (`10` §4).
4. `lib/contracts/<d>.contract.ts` + route via `handleRoute`, and/or `features/<d>/actions.ts` via `runAction`.
5. Client: `callApi` or `useActionState`; view-model mapper; all UI states and a `WidgetBoundary` where optional (`05`).
6. Tests: success, `VALIDATION`, `UNAUTHENTICATED`, `FORBIDDEN`, `CONFLICT`, `UNAVAILABLE`, response drift (`11` §5); contract test; form test.
7. Update `.env.example`; run `npm run check`; refresh graphs (`00`); report per `09` §5.

Every row is done or explicitly "not applicable (why)".
