---
trigger: always_on
---

# 08 — Contracts, End-to-End Validation & Feature Wiring

Owns: API contracts, `handleRoute`, `callApi`, headers, envelope validation, and feature wiring checklist. Zod conventions: `04`; Failure policies: `11`.

## 0. Version & Syntax Invariant Matrix

| Topic | Active Tech | Breaking Point / Critical Syntax |
| --- | --- | --- |
| **Schema Engine** | Zod 4 | `z.strictObject()` on inbound inputs. `z.enum()` with constant arrays/enums. |
| **API Envelope** | Discriminated Union | `{ ok: true, data }` or `{ ok: false, error: ErrorPayload }`. |
| **Error Codes** | `lib/errors.ts` | Enum `ErrorCode`: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION`. |
| **Route Handler** | `lib/server/route.ts` | All routes wrapped with `handleRoute(contract, handler)`. |
| **Client Fetch** | `lib/api/callApi.ts` | All `/api` requests use `callApi(contract, input)`. Never throws; returns `Result<T>`. |

## 1. End-to-End Data Pipeline

- **Server-to-Client**: `Row` (Drizzle) → Service Mapper → `ResponseDto` (parsed before wire) → `callApi` (parses on receipt) → `features/<d>/view-models.ts` → `ViewModel` → Presentational UI.
- **Client-to-Server**: Form/UI → Pre-validation → `RequestDto` → `handleRoute` strict parse → Service logic.
- **Invariants**: Raw DB rows are never leaked to the client. Unparsed responses are never rendered.

## 2. Boundary Validation Matrix

| Boundary | Validated By | Schema Location |
| --- | --- | --- |
| Form → Action | `runAction` input parser | `lib/validations/<d>.schema.ts` |
| Action → UI | `runAction` output parse (`Result<T>`) | `lib/validations/<d>.schema.ts` |
| Client ↔ Route | `handleRoute` & `callApi` | `lib/contracts/<d>.contract.ts` |
| Route Params/Query | `safeParse` + `notFound()` | `lib/validations/<d>.schema.ts` |
| Webhooks | Signature verification + raw body parse | `lib/contracts/<d>.contract.ts` |
| File Uploads | `imageFileSchema` + sharp verification | `lib/validations/upload.schema.ts` |
| System Events | Discriminated union schema | `lib/validations/events.schema.ts` |

## 3. Contract Definition (`lib/contracts/define.ts`)

- Contracts specify: `method` (`GET`/`POST`/`PUT`/`PATCH`/`DELETE`), `path` (`/api/...`), `auth` (`"required"` | `"optional"` | `"none"`), `params`, `query`, `body`, `response`, and optional `idempotent: boolean`.
- Use helpers: `noParams = z.strictObject({})`, `noQuery = z.strictObject({})`, `noBody = z.undefined()`.
- Error payload schema: validates `code: z.enum(ERROR_CODES)`, `message`, `fieldErrors?`, `retryAfterSec?`, `requestId?`.
- Envelope helper: `envelopeSchema(dataSchema)` creates the `{ ok: true, data } | { ok: false, error }` union.
- Paginated responses must adhere to: `{ items: T[], nextCursor: string | null }`, with `limit <= 100`.

## 4. `handleRoute` Invariants (`lib/server/route.ts`)

Every route step executes safely within `handleRoute`:
1. Echoes or creates `x-request-id` header for request tracing.
2. Enforces media types (`UNSUPPORTED_MEDIA`) and bounds body size (`PAYLOAD_TOO_LARGE`).
3. Enforces authentication (`contract.auth`) and applies rate limiting by IP/user.
4. Strictly parses params, query, and body. Throws `ErrorCode.VALIDATION` with `fieldErrors` on failure.
5. Invokes service logic. Service checks resource ownership (RLS is not the application auth layer).
6. Validates output against `contract.response` before returning JSON. Logs any schema drift.
7. Emits `Cache-Control: private, no-store` on authenticated mutations.

## 5. `callApi` Invariants (`lib/api/callApi.ts`)

- Primary client fetch abstraction: `callApi(contract, input) -> Promise<Result<T>>`.
- Pre-validates payloads on the client before dispatch. Never throws; maps network faults to `ErrorCode.UNAVAILABLE`.
- Injects `x-request-id` and `Idempotency-Key` headers when required.
- Parses response against `envelopeSchema(contract.response)`.

## 6. Feature Wiring Checklist

1. **Enums & Constants**: Declare in `lib/constants/enums/` and schemas in `lib/validations/`.
2. **Database Schema**: Add table in `lib/database/schema/<d>.schema.ts` with `ts_web_*` prefix; export from `index.schema.ts`.
3. **Repository & Service**: Implement `lib/repositories/<d>.repository.ts` (Drizzle queries) and `lib/services/<d>.service.ts` (business rules + DTO mapper).
4. **DI Registration**: Register singletons in `lib/di/container.ts`.
5. **Contract & Route**: Define `lib/contracts/<d>.contract.ts` and controller in `app/api/<route>/route.ts`.
6. **UI Integration**: Call via `callApi` or `useActionState`; map DTO to `ViewModel`; handle all 6 async states.
7. **Verification**: Run `npm run typecheck`, `node scripts/check-boundaries.mjs`, and `npm test`.
