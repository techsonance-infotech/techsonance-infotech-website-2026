# 03c — Migrations, RLS, Auth, Secrets & Web Security

Continues `03` and `03b` (§9–13). Owns: migration safety on the shared DB, RLS stance, authentication/authorization, env, security headers.

## 9. Migrations on a live shared DB

- Flow: edit schema → `npm run db:generate` → **read the SQL** → commit → apply with `db:migrate` over `DIRECT_URL`. Never edit the database from the dashboard.
- Each migration with a new table ends with:
  ```sql
  alter table ts_web_x enable row level security;
  revoke all on ts_web_x from anon, authenticated;
  grant select, insert, update, delete on ts_web_x to ts_web_app;
  ```
- Expand → migrate → contract: add nullable or defaulted columns first, backfill in batches, enforce `not null` (via `check … not valid` then `validate constraint`) in a later release, drop only after no deployed code reads the column.
- No table rewrites or long locks: avoid type changes and non-concurrent index builds on large tables; migrations start with `set lock_timeout = '5s';`. `create index concurrently` cannot run inside drizzle's migration transaction: for large tables use a documented manual runbook.
- Every risky migration has `drizzle/rollback/<n>-<name>.sql`. Drizzle has no automatic down.
- Run the Supabase advisors after schema changes and fix findings.

## 10. RLS stance

The runtime connection bypasses RLS (`postgres` or `ts_web_app … bypassrls`). Therefore:

- **Authorization lives in services** (role + ownership), and is tested there. RLS is not the control for the Drizzle path.
- RLS is still enabled on every `ts_web_*` table with **no policies**, plus `revoke` from `anon`/`authenticated`, so the public PostgREST API cannot read or write them even with the anon key.
- If a table must be read from the browser (Realtime on an admin screen), add explicit per-operation policies (`to authenticated`, `(select auth.uid())`, `using` + `with check`) and pgTAP tests.
- pgTAP (`supabase/tests/ts_web_rls.test.sql`): for every table matching `ts_web_%`, anon and authenticated both get denied/zero rows; the runtime role can perform the granted operations.

## 11. Authentication and authorization

- Identity from `supabase.auth.getUser()` or verified `getClaims()`. Never `getSession()` alone.
- `lib/server/auth.ts` (wrapped in `React.cache`): `requireUser()`, `getOptionalUser()`, `requireRole(role)`. Roles live in `app_metadata`, parsed with a Zod enum; unknown or missing role → no access (fail closed).
- Every action, route and service method checks auth itself; proxy redirects and hidden UI are not security.
- Ownership is checked in the service on every read and write by id (`where id = $1 and owner_id = $2`), so a guessed id cannot reach another user's row. Admin routes use `requireRole("admin")` and write `ts_web_audit_log` rows for mutations.
- Server Supabase client: per request, `getAll`/`setAll` cookie adapter, `await cookies()`.
- Post-login `next` uses `nextPathSchema` (same-origin relative path, `.catch("/")`).
- Expired session inside an action → `UNAUTHENTICATED`; UI redirects to `/login?next=…` (`11` §1).

## 12. Secrets and environment

- `.env.example` documents every variable; `.env.local` is git-ignored; both URLs and roles in §2 are documented there.
- `lib/env/public.ts` reads `NEXT_PUBLIC_*` by literal access then parses with Zod. `lib/env/server.ts` starts with `import "server-only"`, validates all server vars, and is imported at boot by `instrumentation.ts` so a bad deploy fails fast.
- Secrets (`SUPABASE_SERVICE_ROLE_KEY`, DB URLs, Upstash tokens) are never `NEXT_PUBLIC_`, never logged, never sent to the client. Rotate anything ever committed or logged.
- Separate Supabase projects (or at minimum separate roles/credentials) for dev, staging, prod.

## 13. Web security baseline

- CSP with nonces set in `proxy.ts` (start report-only); `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `frame-ancestors 'none'`.
- CSRF: Server Actions check Origin; `serverActions.allowedOrigins` minimal; custom mutating handlers are non-GET and verify Origin/auth. No `Access-Control-Allow-Origin: *` on credentialed endpoints.
- Rate-limit auth, upload, chat, booking and contact endpoints (`11` §2).
- Escape user content rendered as HTML; no `eval`/`new Function`.
- Webhooks: constant-time signature check before parsing; idempotent by event id.
- Never log PII, tokens, passwords or full bodies; client errors are generic.
- `npm audit --omit=dev` in CI.
