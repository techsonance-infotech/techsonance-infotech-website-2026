# 11 — Resilience: Failure Policy, API & DB Edge Cases, Observability, Failure Tests

Owns: what happens when things fail (§1), API/server rules (§2), DB edge cases (§3), observability (§4), required failure-path tests (§5). UI crash handling is in `05` §4. Every new feature must fit §1. (Merges former `11` + `11b`.)

## 1. Failure policy

| Failure | Detected by | Server outcome | User sees | Logged |
| --- | --- | --- | --- | --- |
| Invalid input | Zod `safeParse` | `VALIDATION` 422 + `fieldErrors` | inline field errors, input preserved | no |
| Session expired/missing | `requireUser` | `UNAUTHENTICATED` 401 | redirect `/login?next=<path>` | no |
| Not allowed | service role/ownership check | `FORBIDDEN` 403 | "no access" panel | warn (+ audit for admin) |
| Missing resource / bad id | service, `idSchema` | `NOT_FOUND` 404 | `not-found` UI | no |
| Unique / stale version / FK | `23505`, `23503`, version check | `CONFLICT` 409 | specific message + refresh/choose-again | no |
| Too many requests | rate limiter | `RATE_LIMITED` 429 + `Retry-After` | submit disabled with countdown | info |
| DB/third party down, timeout, deadlock, pool exhausted | `mapDbError`, timeouts | `UNAVAILABLE` 503 + `Retry-After` | "temporarily unavailable" + retry | warn |
| Unexpected exception | catch-all in wrapper | `INTERNAL` 500 + `requestId` | generic error + reference id | error |
| Render crash in a route | `error.tsx` | n/a | error panel + `reset` | error |
| Crash in optional widget | `WidgetBoundary` | n/a | compact fallback; page lives | error |
| Crash in root layout | `global-error.tsx` | n/a | minimal full-page error + reload | error |
| Stale deployment / chunk failure | error text match | n/a | one auto-reload, then prompt | warn |
| Offline / fetch failure | `callApi` catches `TypeError`/abort | client-side `UNAVAILABLE` | offline banner + retry | no |

Never show SQL, stack, table or constraint names. Retryable-by-user codes: `04` §2.

## 2. API and server rules

1. **Time budgets.** Every route/action declares `export const maxDuration` (default 30 s) and uses less: DB statements ≤ 10 s (role timeout, `03` §2), third-party calls ≤ 8 s (`AbortSignal.timeout`), pool `connect_timeout` ≤ 8 s. Pass `request.signal` into long work.
2. **Body caps before buffering.** Reject by `Content-Length`, then enforce the same cap while reading the stream (`PAYLOAD_TOO_LARGE`). Malformed JSON → `BAD_REQUEST`, never 500.
3. **Third-party calls** (email, calendar, AI, CRM): one helper per provider in `lib/services` with timeout, max 2 retries with jittered backoff **only for idempotent calls or calls carrying an idempotency key**, strict Zod parsing of the response, and a circuit breaker (5 consecutive failures → fail fast 30 s → probe). Outage → `UNAVAILABLE`; never hang a request.
4. **Side effects after commit.** Email, webhooks, analytics run via `after()` once the commit succeeded. Must-deliver messages (booking confirmation, contact notification) are written to `ts_web_outbox` **in the same transaction** and sent by a retrying worker/cron; a failed email never fails or rolls back the booking.
5. **Idempotency.** Create endpoints/actions require a key (`z.uuid()`). Keys live in `ts_web_idempotency_keys(scope, key, request_hash, response jsonb, expires_at)` behind `idempotency.service.ts`; replay returns the stored response, same key + different body → `CONFLICT`; rows expire after 24 h and a scheduled job purges them.
6. **Rate limits** (`lib/server/rateLimit.ts`, Upstash) on auth, contact, booking, chat, careers upload; policies are constants. If the limiter backend errors, fall back to a per-instance in-memory limiter and log a warning; never throw, never silently disable. Always send `Retry-After`.
7. **Streaming (chat/AI).** Errors are a typed final event (`{type:"error", code}`), stream closed, partial text kept client-side. Model output is untrusted: bounded, schema-checked, never rendered as HTML.
8. **Webhooks.** Verify the signature on the raw body in constant time before parsing, dedupe by event id, return 2xx for unknown event types, 5xx only for retryable failures.
9. **Health.** `GET /api/health` returns 200 without touching dependencies. `GET /api/ready` calls the health service (`checkDatabaseConnection`, 3 s timeout, cached 5 s) and returns 503 when the DB is down. Uptime monitoring hits `/api/ready`.
10. **Shutdown / process errors.** On long-lived hosts `instrumentation.ts` registers `SIGTERM`/`SIGINT` handlers calling `closeDatabaseConnections()`; serverless needs nothing. `instrumentation.ts` exports `onRequestError` (⚠ verify signature in installed Next types) forwarding to logger + Sentry with `requestId`; `unhandledRejection` is logged, never ignored.

## 3. Database edge cases

- **Pool exhaustion / pooler hiccup** (`53300`, `CONNECT_TIMEOUT`, `CONNECTION_CLOSED`): `UNAVAILABLE`; idempotent reads may retry once; writes retry only inside `withTransaction` for serialization/deadlock (`03` §7).
- **Cold start**: first request pays connect cost; never open a pool at import time.
- **Concurrency**: slot/booking uniqueness is a partial unique index, not check-then-insert; admin edits use `version`; read-modify-write uses `withTransaction`.
- **Double submit / retry storm**: idempotency key + disabled pending button.
- **Partial failure**: multi-table writes are one transaction; external side effects use the outbox (§2.4).
- **Data that outgrew validation** (class 22): treated as `VALIDATION`, logged `warn`, fixed in the schema.
- **Shape drift / unexpected nulls**: repository results go through mappers and the output schema; drift is `INTERNAL` with a logged diff, never a client crash.
- **Time**: UTC `timestamptz`; format with `Intl` in the viewer's timezone; never compare local dates on the server.
- **Supavisor misconfiguration** (`Tenant or user not found`, wrong role suffix) surfaces as `INTERNAL`; `/api/ready` fails and alerts.

## 4. Observability

- Every request has `x-request-id` (set in `proxy.ts`), present in logs, error responses and the error UI.
- Sentry via `instrumentation.ts`; client errors via `reportClientError` (rate-limited, redacted).
- Alerts: readiness failing > 1 min, 5xx rate, `UNAVAILABLE` rate, outbox backlog age, rate-limiter fallback active, idempotency-conflict spike. Dashboards: p95 latency per route, DB pool wait.

## 5. Required failure-path tests

Per route/action: success, `VALIDATION`, `UNAUTHENTICATED`, `FORBIDDEN`, `CONFLICT` (where uniqueness/version exists), `UNAVAILABLE` (simulate pool/timeout through a mocked repository), and a response-drift case (wrong shape → `INTERNAL`, no leak).

Also: `mapDbError` table test (every SQLSTATE in `03` §8); `withTransaction` retry (two `40001` then success; three → `UNAVAILABLE`); idempotent replay; rate-limit fallback; malformed JSON; oversize body; `inArray([])` guard; every `WidgetBoundary` fallback renders when its child throws; `error.tsx` renders with `reset`; form keeps input on `UNAVAILABLE`; chunk-reload guard runs once.
