# 03 — Database, Isolation, Queries, Migrations, Auth & Web Security (Drizzle on Supabase)

Owns: access model, shared-DB isolation, pooler, client, schema, queries, transactions, SQLSTATE mapping, migrations, RLS, auth, env, web security. Failure policy: `11`. (Merges former 03/03b/03c; section numbers kept.)

## 1. Access model

| Concern | Tool | Location |
| --- | --- | --- |
| Login, session, JWT | Supabase Auth via `@supabase/ssr` | `lib/supabase/*`, `lib/server/auth.ts` |
| Table reads/writes | Drizzle + postgres.js | `lib/database`, called only from `lib/repositories` |
| Storage, Realtime | supabase-js | `lib/supabase/*` |

## 2. Shared-database isolation (CRITICAL)

Shared with HRMS, ERP, CMS.
- Everything we create is `ts_web_*`: tables, indexes, constraints, enum types, triggers, functions, policies. Nothing else may be created, altered, dropped or read.
- `drizzle.config.ts`: `tablesFilter: ["ts_web_*"]`, own journal `ts_web_drizzle_migrations` (⚠ confirm keys against installed `drizzle-kit`).
- Allowed: `drizzle-kit generate | migrate | check`. **Forbidden: `push`, `pull`, `drop`.**
- **Dedicated runtime role** (recommended): runtime connects as `ts_web_app`, not `postgres`:
  ```sql
  create user ts_web_app with password '<strong>' bypassrls;
  grant usage on schema public to ts_web_app;
  alter role ts_web_app set statement_timeout = '10s';
  alter role ts_web_app set lock_timeout = '5s';
  alter role ts_web_app set idle_in_transaction_session_timeout = '15s';
  ```
  Grant per table inside each migration; never `alter default privileges` (it would grant other apps' future tables). Verify timeouts via the pooler with `show statement_timeout`. Until the role exists, every statement must still touch only `ts_web_*`.

| Var | Role | Endpoint | Used by |
| --- | --- | --- | --- |
| `DATABASE_URL` | `ts_web_app` (`postgres` until created) | transaction pooler `:6543` | runtime |
| `DIRECT_URL` | migration owner | session pooler `:5432` or `db.<ref>.supabase.co:5432` | drizzle-kit only |

Supavisor username is `<role>.<project-ref>`; URL-encode password special characters.

## 3. Transaction-pooler constraints

`prepare: false` is mandatory. No session state: no `SET` (use `SET LOCAL` in a transaction), `LISTEN/NOTIFY`, session advisory locks (use `pg_advisory_xact_lock`), temp tables, cross-statement cursors. Pool size per instance: 10 default, 3 serverless.

## 4. Client (`lib/database/index.ts`)

- Lazy singleton on `globalThis`; nothing connects at import time (incl. `next build`).
- `ssl: "require"` for non-local hosts; set `connect_timeout`, `idle_timeout`, `max_lifetime`.
- Production without `DATABASE_URL` throws at first use; never falls back to localhost.
- `getDrizzleDb(url)` with a custom URL returns an independent client; caller closes it (`db.$client.end()`).
- Services never import the `db` proxy; they get an executor from DI or `withTransaction`.

## 5. Schema conventions

```ts
// lib/database/schema/columns.ts  (imports only drizzle-orm)
import { pgTableCreator, timestamp, uuid } from "drizzle-orm/pg-core";
export const tsWebTable = pgTableCreator((name) => `ts_web_${name}`);
export const idColumn = () => uuid("id").primaryKey().defaultRandom();
export const createdAtColumn = () =>
  timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow();
export const updatedAtColumn = () =>
  timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date());
```

```ts
// lib/database/schema/booking.schema.ts
import { sql } from "drizzle-orm";
import { check, index, integer, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { BOOKING_STATUS_VALUES } from "../../constants/enums/booking-status.enum";
import { createdAtColumn, idColumn, tsWebTable, updatedAtColumn } from "./columns";

export const bookings = tsWebTable(
  "consultation_bookings",
  {
    id: idColumn(),
    email: text("email").notNull(),
    slotStart: timestamp("slot_start", { withTimezone: true, mode: "date" }).notNull(),
    status: text("status").notNull().default("pending"),
    version: integer("version").notNull().default(1), // optimistic concurrency
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (t) => [
    uniqueIndex("ts_web_consultation_bookings_slot_uq").on(t.slotStart).where(sql`${t.status} <> 'cancelled'`),
    index("ts_web_consultation_bookings_email_idx").on(t.email),
    check("ts_web_consultation_bookings_status_chk", sql.raw(`status in (${BOOKING_STATUS_VALUES.map((s) => `'${s}'`).join(",")})`)),
  ],
);
export type BookingRow = typeof bookings.$inferSelect;
export type NewBookingRow = typeof bookings.$inferInsert;
```

- Every table: `id uuid`, `created_at`/`updated_at timestamptz`, `not null` by default, FKs with explicit `onDelete`, check constraints mirroring Zod bounds, indexes on FKs and every filter/sort column.
- Enums = `text` + check from the shared `*_VALUES` array (`01` §3). Money and time types: `01` §2.
- Admin-edited rows carry `version`; updates use `where id = $1 and version = $2` and bump it.
- Soft delete only where recovery is required; the repository filters `deleted_at`, never callers.
- Row types are exported from the schema file; never hand-write a duplicate. Zod schemas are hand-written, never derived from tables.

## 6. Query rules and Drizzle footguns

1. **`update`/`delete` always have a non-optional `where`.** `.where(undefined)` matches every row. Repository functions take the identifying value as a required parameter.
2. Guard `inArray(col, ids)` with `if (ids.length === 0) return []`.
3. Select needed columns; relational `with` specifies `columns`. No unbounded `select()` on user-facing paths.
4. Paginate every list: keyset on `(created_at, id)`, `limit ≤ 100` (+1 row for `nextCursor`). No offset on mutable lists; avoid exact `count(*)` on large tables.
5. Bulk inserts chunk to `floor(60000 / columnCount)` rows (postgres.js limit 65 534 params).
6. Escape `%`, `_`, `\` in `ilike` input.
7. Absence: `.limit(1)`, check `rows[0]`, service throws `AppError("NOT_FOUND")`. Validate ids with `idSchema` first so a malformed uuid never reaches Postgres (`22P02`).
8. Idempotent creates rely on a unique constraint (`on conflict do nothing` + `returning`, or catch `23505`), not check-then-insert.
9. Lost updates: `version` guard; 0 rows updated → `CONFLICT`.
10. `numeric`/`bigint` arrive as strings: convert in the mapper.
11. No raw SQL with interpolated input; `sql` template parameters only. Enum-typed filters only (parsed before the repository).
12. No network calls, email or `redirect()` inside a transaction.

## 7. Transactions (`lib/database/transaction.ts`)

```ts
import "server-only";
import { AppError } from "@/lib/errors";
import { dbErrorInfo, mapDbError } from "@/lib/dbErrors";
import { getDrizzleDb, type Database, type DbTransaction } from "./index";

export type { Database, DbTransaction };

const RETRYABLE = new Set(["40001", "40P01"]); // serialization failure, deadlock
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Runs `fn` atomically; retries serialization failures and deadlocks with jitter. `fn` must be safe to re-run. */
export async function withTransaction<T>(
  fn: (tx: DbTransaction) => Promise<T>,
  opts: { retries?: number; database?: Database } = {},
): Promise<T> {
  const retries = opts.retries ?? 2;
  const database = opts.database ?? getDrizzleDb();
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await database.transaction(fn);
    } catch (e) {
      const info = dbErrorInfo(e);
      const retryable = info !== undefined && RETRYABLE.has(info.code);
      if (!retryable || attempt >= retries) throw e instanceof AppError ? e : mapDbError(e);
      await sleep(25 * 2 ** attempt + Math.random() * 25);
    }
  }
}
```

Use a transaction when two or more writes must succeed together or a read-then-write must not race. Business `AppError`s thrown inside roll back and pass through. ⚠ type-check against installed drizzle.

## 8. SQLSTATE mapping (`lib/dbErrors.ts`)

```ts
import { AppError } from "@/lib/errors";

export type DbErrorInfo = { code: string; constraint?: string };
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/** Walks the `cause` chain (Drizzle wraps driver errors) for a SQLSTATE or postgres.js code. */
export function dbErrorInfo(error: unknown): DbErrorInfo | undefined {
  let cur: unknown = error;
  for (let depth = 0; depth < 5 && isRecord(cur); depth += 1) {
    const code = cur["code"];
    if (typeof code === "string") {
      const constraint = cur["constraint_name"];
      return typeof constraint === "string" ? { code, constraint } : { code };
    }
    cur = cur["cause"];
  }
  return undefined;
}

const UNAVAILABLE = new Set([
  "CONNECT_TIMEOUT", "CONNECTION_CLOSED", "CONNECTION_ENDED", "CONNECTION_DESTROYED",
  "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN",
  "40001", "40P01", "55P03", "57014", "57P01", "57P02", "57P03", "53300",
]);

export function mapDbError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const code = dbErrorInfo(error)?.code;
  if (code === undefined) return new AppError("INTERNAL", "Something went wrong", { cause: error });
  if (code === "23505") return new AppError("CONFLICT", "That record already exists", { cause: error });
  if (code === "23503") return new AppError("CONFLICT", "A related record is missing or still in use", { cause: error });
  if (code === "42501") return new AppError("FORBIDDEN", "Not allowed", { cause: error });
  if (code === "23514" || code.startsWith("22")) return new AppError("VALIDATION", "Invalid value", { cause: error });
  if (UNAVAILABLE.has(code) || code.startsWith("08") || code.startsWith("53")) {
    return new AppError("UNAVAILABLE", "Service temporarily unavailable. Please retry.", { retryAfterSec: 2, cause: error });
  }
  return new AppError("INTERNAL", "Something went wrong", { cause: error }); // 23502 etc.: our bug, logged
}
```

Services translate expected conflicts into domain messages first: `if (dbErrorInfo(e)?.constraint === "ts_web_consultation_bookings_slot_uq") throw new AppError("CONFLICT", "That slot was just taken")`. Class 22 / check violations reaching the DB mean validation missed something: log `warn`, fix the schema.

## 9. Migrations on a live shared DB

- Flow: edit schema → `npm run db:generate` → **read the SQL** → commit → apply with `db:migrate` over `DIRECT_URL`. Never edit the DB from the dashboard.
- Every new table ends with:
  ```sql
  alter table ts_web_x enable row level security;
  revoke all on ts_web_x from anon, authenticated;
  grant select, insert, update, delete on ts_web_x to ts_web_app;
  ```
- Backward-compatible only (the previous deploy must keep working). Expand → migrate → contract: add nullable/defaulted columns, backfill in batches, enforce `not null` via `check … not valid` then `validate constraint` in a later release, drop only when no deployed code reads it.
- No table rewrites or long locks; migrations start with `set lock_timeout = '5s';`. `create index concurrently` cannot run in drizzle's transaction: documented manual runbook for large tables.
- Risky migrations have `drizzle/rollback/<n>-<name>.sql` (drizzle has no down). Run Supabase advisors after schema changes. Backups/PITR enabled; rollback plan documented before release.

## 10. RLS stance

The runtime connection bypasses RLS, so **authorization lives in services** (role + ownership) and is tested there. RLS is still enabled on every `ts_web_*` table with **no policies** plus `revoke` from `anon`/`authenticated`, so PostgREST cannot touch them. If a table must be read from the browser (Realtime), add explicit per-operation policies (`to authenticated`, `(select auth.uid())`, `using` + `with check`) and pgTAP tests. pgTAP (`supabase/tests/ts_web_rls.test.sql`): for every `ts_web_%` table anon/authenticated are denied; the runtime role can perform granted operations.

## 11. Authentication and authorization

- Identity from `supabase.auth.getUser()` or verified `getClaims()`; never `getSession()` alone.
- `lib/server/auth.ts` (`React.cache`): `requireUser()`, `getOptionalUser()`, `requireRole(role)`. Roles live in `app_metadata`, parsed with a Zod enum; unknown/missing → no access (fail closed).
- Every action, route and service method checks auth itself; proxy redirects and hidden UI are not security.
- Ownership is checked in the service on every read/write by id (`where id = $1 and owner_id = $2`). Admin routes use `requireRole("admin")` and write `ts_web_audit_log` for mutations.
- Server Supabase client: per request, `getAll`/`setAll` cookie adapter, `await cookies()`.
- Post-login `next` uses `nextPathSchema` (same-origin relative path, `.catch("/")`).

## 12. Secrets and environment

- `.env.example` documents every variable; `.env.local` is git-ignored.
- `lib/env/public.ts` reads `NEXT_PUBLIC_*` by literal access then parses with Zod. `lib/env/server.ts` starts with `import "server-only"`, validates all server vars, imported at boot by `instrumentation.ts` so a bad deploy fails fast.
- Secrets (`SUPABASE_SERVICE_ROLE_KEY`, DB URLs, Upstash tokens) are never `NEXT_PUBLIC_`, logged, or sent to the client. Rotate anything ever committed or logged.
- Separate Supabase projects (or at least roles/credentials) for dev, staging, prod.

## 13. Web security baseline

- `proxy.ts` sets CSP with nonces (start report-only), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `frame-ancestors 'none'`.
- CSRF: Server Actions check Origin; `serverActions.allowedOrigins` minimal; custom mutating handlers are non-GET and verify Origin/auth. No `Access-Control-Allow-Origin: *` on credentialed endpoints.
- Escape user content rendered as HTML; no `eval`/`new Function`.
- Never log PII, tokens, passwords or full bodies. Rate limits and webhooks: `11` §2.
- `npm audit --omit=dev` in CI.
