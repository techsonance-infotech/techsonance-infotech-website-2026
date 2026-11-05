# 11 — Resilience: Failure Policy, API & Database Rules

Owns: what happens when things fail (policy table §1), API/server rules (§2), database edge cases (§3). UI crash handling, observability and required tests are in `11b` (sections 4–6 keep their numbers). Every new feature must fit §1.

## 1. Failure policy

| Failure | Detected by | Server outcome | User sees | Logged |
|---|---|---|---|---|
| Invalid input | Zod `safeParse` | `VALIDATION` 422 + `fieldErrors` | inline field errors, input preserved | no |
| Session expired / missing | `requireUser` | `UNAUTHENTICATED` 401 | redirect to `/login?next=<path>` | no |
| Not allowed | service role/ownership check | `FORBIDDEN` 403 | "no access" panel | warn (+ audit for admin) |
| Missing resource / bad id | service, `idSchema` | `NOT_FOUND` 404 | `not-found` UI | no |
| Unique / stale version / FK | `23505`, `23503`, version check | `CONFLICT` 409 | specific message + refresh/choose-again action | no |
| Too many requests | rate limiter | `RATE_LIMITED` 429 + `Retry-After` | submit disabled with countdown | info |
| DB or third party down, timeout, deadlock, pool exhausted | `mapDbError`, timeouts | `UNAVAILABLE` 503 + `Retry-After` | "temporarily unavailable" + retry button | warn |
| Unexpected exception | catch-all in wrapper | `INTERNAL` 500 + `requestId` | generic error with reference id | error |
| Render crash in a route | `error.tsx` | n/a | error panel + retry (`reset`) | error |
| Crash in an optional widget | `WidgetBoundary` | n/a | widget replaced by compact fallback; page lives | error |
| Crash in root layout | `global-error.tsx` | n/a | minimal full-page error + reload | error |
| Stale deployment / chunk load failure | error text match | n/a | one automatic reload, then reload prompt | warn |
| Network offline / fetch failure | `callApi` catches `TypeError`/abort | client-side `UNAVAILABLE` | offline banner + retry | no |

`UNAVAILABLE` and `INTERNAL` are the only user-retryable codes. Never show SQL, stack, table or constraint names.

## 2. API and server rules

1. **Time budgets.** Every route/action declares `export const maxDuration` (default 30 s, Vercel) and uses less: DB statements ≤ 10 s (role timeout, `03` §2), third-party calls ≤ 8 s (`AbortSignal.timeout`), pool `connect_timeout` ≤ 8 s. Pass `request.signal` into long work so client aborts stop it.
2. **Body caps before buffering.** Reject by `Content-Length`, then enforce the same cap while reading the stream (`PAYLOAD_TOO_LARGE`). Malformed JSON → `BAD_REQUEST`, never 500.
3. **Third-party calls** (email, calendar, AI, CRM) go through one helper per provider in `lib/services`, each with: timeout, max 2 retries with jittered backoff **only for idempotent calls or calls carrying an idempotency key**, response parsed with a strict Zod schema, and a small circuit breaker (after 5 consecutive failures, fail fast for 30 s, then probe). A provider outage returns `UNAVAILABLE`; it never hangs a request.
4. **Side effects after commit.** Email, webhooks and analytics run via `after()` once the DB commit succeeded. Must-deliver messages (booking confirmation, contact notification) are written to `ts_web_outbox` **inside the same transaction** and sent by a retrying worker/cron; a failed email never fails or rolls back the booking.
5. **Idempotency.** Create endpoints/actions require an idempotency key (`z.uuid()`). Keys live in `ts_web_idempotency_keys(scope, key, request_hash, response jsonb, expires_at)` behind an `idempotency.service.ts`; replay returns the stored response, a different body with the same key returns `CONFLICT`; rows expire after 24 h and are purged by a scheduled job.
6. **Rate limits** (`lib/server/rateLimit.ts`, Upstash): auth, contact, booking, chat, careers upload. If the limiter backend errors, fall back to a per-instance in-memory limiter and log a warning; never throw and never silently disable. Always send `Retry-After`.
7. **Streaming (chat/AI).** Stream errors are sent as a typed final event (`{type:"error", code}`), the stream is closed, partial text is kept client-side. Output from the model is untrusted: bounded length, schema-checked, never rendered as HTML.
8. **Webhooks.** Verify signature on the raw body, dedupe by event id, return 2xx for unknown event types, 5xx only for retryable failures.
9. **Health.** `GET /api/health` returns 200 without touching dependencies. `GET /api/ready` calls the health service (`checkDatabaseConnection`, 3 s timeout, result cached 5 s) and returns 503 when the database is down. Uptime monitoring hits `/api/ready`.
10. **Shutdown.** On long-lived hosts, `instrumentation.ts` registers `SIGTERM`/`SIGINT` handlers that call `closeDatabaseConnections()` and then exit; on serverless nothing extra is needed.
11. **Process-level errors.** `instrumentation.ts` exports `onRequestError` (⚠ verify signature in installed Next types) that forwards to the logger and Sentry with `requestId`. `unhandledRejection` is logged, never ignored.

## 3. Database edge cases

- **Pool exhaustion / pooler hiccup** (`53300`, `CONNECT_TIMEOUT`, `CONNECTION_CLOSED`): classified `UNAVAILABLE`; idempotent reads may retry once; writes are not retried unless inside `withTransaction` for serialization/deadlock (`03b` §7).
- **Cold start**: first request pays connect cost; keep `connect_timeout` ≤ 8 s and never open a pool at import time.
- **Concurrency**: slot/booking style uniqueness is a partial unique index, not check-then-insert; admin edits use `version`; read-modify-write uses `withTransaction`.
- **Double submit / retry storm**: idempotency key + disabled pending button.
- **Partial failure**: multi-table writes are one transaction; external side effects use the outbox (§2.4).
- **Pagination under writes**: keyset on `(created_at, id)`; never offset on mutable lists.
- **Data that outgrew validation** (class 22 errors): treated as `VALIDATION`, logged `warn`, fixed in the schema.
- **Unexpected nulls/shape drift**: repository results are mapped through DTO mappers and parsed by the output schema; drift is `INTERNAL` with a logged diff, never a client crash.
- **Time**: store UTC `timestamptz`; format in the UI with `Intl` and the viewer's timezone; never compare local dates on the server.
- **Migrations during traffic**: backward-compatible only (`03c` §9); the previous deploy must keep working against the new schema.
- **Supavisor misconfiguration** (`Tenant or user not found`, wrong role suffix) surfaces as `INTERNAL`; `/api/ready` fails and alerts.
