---
trigger: always_on
---

# 03 — Database, Isolation, Queries, Migrations, Auth & Web Security (Drizzle on Supabase)

Owns: access model, shared-DB isolation, pooler, client, schema, queries, transactions, SQLSTATE mapping, migrations, RLS, auth, env, web security, repository + database layer rules (§11). Failure policy: `11`. (Canonical implementations in `lib/database/` and `lib/repositories/`).

## 1. Project Stack & Version Breaking Points

If any version ambiguity arises, this project operates on the following core versions and breaking syntax rules. Agents must immediately adopt the v2/latest syntax:

| Component           | Main Version        | Breaking Point / Syntax Transition                                                                                                                                                                                                                                             |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Drizzle ORM**     | `^0.38.0` (RQB v2)  | **v1 callback -> v2 object syntax**: `where: { id: 1 }` (not `(u, { eq }) => eq(u.id, 1)`). `orderBy: { id: "asc" }`. Relational filters: `where: { posts: { content: { like: 'M%' } } }`. Relational pagination: `with: { comments: { offset: 3, limit: 3 } }`.               |
| **Drizzle Scoping** | RQB v2              | **Mandatory `(t)` callback scoping**: Column references in relational callbacks (`orderBy`, `where.RAW`, `extras`) **MUST** use callback param `(t)` (e.g. `(t) => sql\`${t.id} asc\``, `where: { RAW: (t) => ... }`), **NEVER** imported table objects.                       |
| **postgres.js**     | `^3.4.5`            | Connects via Supabase Supavisor transaction pooler on port `:6543`.                                                                                                                                                                                                            |
| **Supabase Pooler** | Transaction `:6543` | **`prepare: false` is mandatory**: Prepared statements / prefetching fail on transaction pooling. Must use `postgres(url, { prepare: false })`.                                                                                                                                |
| **Needle DI**       | `@needle-di/core`   | **Single-type DI injection**: Repositories inject `private db: Database = inject(DRIZZLE_DB_TOKEN)`. **NEVER** carry dual signature overloads (`executor?: Database \| DbTransaction`), never use `(executor as any)`, and never write defensive `if (this.db.select)` checks. |
| **Next.js & React** | Next 16, React 19   | App Router, Server Components by default, async `params` and `cookies()`.                                                                                                                                                                                                      |

## 2. Shared-Database Isolation (CRITICAL)

The database is shared with HRMS, ERP, CMS.

- **Prefix Isolation**: Everything we create is `ts_web_*`: tables, indexes, constraints, enum types, triggers, functions, policies. Nothing else may be created, altered, dropped, or read.
- `drizzle.config.ts`: `tablesFilter: ["ts_web_*"]`, migration journal `ts_web_drizzle_migrations`.
- **Tooling restrictions**: Allowed: `drizzle-kit generate | migrate | check`. **FORBIDDEN: `push`, `pull`, `drop`.**
- **Runtime role**: Connects as `ts_web_app` with `bypassrls`, 10s statement timeout, 5s lock timeout. Grants applied per table in migrations; never `alter default privileges`.
- **Connection strings**: `DATABASE_URL` targets port `:6543` (runtime pooler). `DIRECT_URL` targets port `:5432` (migrations only).

## 3. Transaction-Pooler Constraints & Client (`lib/database/index.ts`)

- `prepare: false` is mandatory.
- No session state: no `SET` (use `SET LOCAL` in transactions), `LISTEN/NOTIFY`, session advisory locks (use `pg_advisory_xact_lock`), temp tables, cross-statement cursors.
- Pool max: default 10 (serverless / edge default 3).
- Lazy singleton on `globalThis`; nothing connects at build/import time.
- Production without `DATABASE_URL` throws immediately; never falls back to localhost.

## 4. Schema Conventions (`lib/database/schema/`)

- Table creator: `tsWebTable = pgTableCreator((name) => \`ts_web_\${name}\`)`.
- Standard columns: `id uuid` default random PK, `created_at` and `updated_at` timestamptz mode date (`$onUpdate` for updated_at).
- Every foreign key specifies explicit `onDelete`.
- Enums are stored as `text` with SQL check constraints mirroring domain values (`lib/constants/enums/*`).
- Admin-mutable rows carry `version integer default 1` for optimistic locking.
- Soft-delete only when business recovery is required (`deleted_at`); repositories filter it unconditionally.
- Schema files export row types via `typeof table.$inferSelect` and `typeof table.$inferInsert`. Hand-written duplicates are forbidden.

## 5. Query Rules & Drizzle Footguns

1. **Mandatory `where`**: `update` and `delete` **must always** have a non-optional `where` clause. A bare update/delete matches all rows and breaks the build.
2. **RQB v2 Object Syntax**: In `db.query.*`, use object syntax for `where` and `orderBy`. References in relational callbacks MUST use `(t)`.
3. **Array guards**: Guard `inArray(col, ids)` with `if (ids.length === 0) return []`.
4. **Select discipline**: Select only required columns; relational queries must specify `columns`. Avoid unbounded `select()` on public endpoints.
5. **Pagination**: Keyset pagination on `(created_at, id)` with `limit <= 100` (+1 row for `nextCursor`). No large mutable `offset`; avoid exact `count(*)` on large tables.
6. **Bulk inserts**: Chunk bulk inserts to `floor(60000 / columnCount)` rows (postgres.js parameter limit).
7. **Search sanitization**: Escape `%`, `_`, `\` in `ilike` inputs.
8. **Absence**: Lookups return row or `null`/`undefined`. Repositories do not throw domain errors for expected absence; services throw `AppError("NOT_FOUND")`. Validate IDs with Zod beforehand to avoid SQL `22P02`.
9. **Optimistic concurrency**: Guard updates with `where: and(eq(t.id, id), eq(t.version, version))`; bump version; return `undefined` on 0 rows updated so caller raises `AppError("CONFLICT")`.
10. **SQL injection**: No raw string interpolation; use `sql` template strings only. Enum filters must be validated before reaching the repository.

## 6. Transactions (`lib/database/transaction.ts`)

- Multi-write atomicity: Wrap dependent writes in `withTransaction(async (tx) => { ... })`.
- Automatic retry with jitter on serialization failure (`40001`) and deadlock (`40P01`).
- Domain `AppError` thrown inside triggers rollback and passes through cleanly.
- No network calls, emails, or `redirect()` inside transactions.

## 7. SQLSTATE Mapping (`lib/dbErrors.ts`)

Repositories wrap all DB calls in `try/catch` and map errors via `mapDbError(err, context)`.

- `23505` -> `AppError("CONFLICT", "That record already exists")`
- `23503` -> `AppError("CONFLICT", "A related record is missing or still in use")`
- `42501` -> `AppError("FORBIDDEN", "Not allowed")`
- `23514` / Class `22` -> `AppError("VALIDATION", "Invalid value")`
- Network/pool timeouts (`08`, `53`, `ETIMEDOUT`, `ECONNREFUSED`) -> `AppError("UNAVAILABLE")` with `retryAfterSec: 2`
- All other unhandled errors -> `AppError("INTERNAL")` with cause preserved for server logging.

## 8. Migrations on Shared Live DB

- Workflow: Edit schema -> `npm run db:generate` -> review SQL -> commit -> apply via `npm run db:migrate` using `DIRECT_URL`.
- Every new table migration must enable RLS and grant rights:
  `alter table ts_web_x enable row level security;`
  `revoke all on ts_web_x from anon, authenticated;`
  `grant select, insert, update, delete on ts_web_x to ts_web_app;`
- Non-breaking changes only (expand -> migrate -> contract). New columns must be nullable or defaulted.
- Migration lock timeout: `set lock_timeout = '5s';`. Risky migrations require rollback SQL files in `drizzle/rollback/`.

## 9. RLS & Authorization Stance

- Runtime connects via `ts_web_app` with `bypassrls`. Authorization (role + tenant/ownership checks) lives in the **service layer** and is tested there.
- RLS is enabled with no policies plus `revoke` on `anon`/`authenticated` to prevent PostgREST data leaks.
- Every read/update/delete on user-owned data must enforce `resource.ownerId === currentUser.id` in the service.

## 10. Web Security Baseline

- Identity via `supabase.auth.getUser()`, never `getSession()` alone.
- Role checks via `requireRole(role)` from `lib/server/auth.ts`.
- Server Actions check Origin; mutating routes are non-GET.
- Secrets (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are never `NEXT_PUBLIC_` or sent to the client.

## 11. Repository Layer Rules (`lib/repositories/`)

1. **Single Aggregate**: `<aggregate>.repository.ts`, marked `import "server-only"`.
2. **Clean Dependency Injection**: Inject `private db: Database = inject(DRIZZLE_DB_TOKEN)`.
   - Never carry overloaded signatures (`executor?: Database | DbTransaction`).
   - Never use `(executor as any)` or loose `any` casts.
   - Never write defensive `if (this.db.select)` or `if (this.db.query...)` branches.
   - For transactional operations, pass `tx: DbTransaction` explicitly as a typed parameter.
3. **Pure Query Concern**: No business logic, authorization, emails, HTTP objects, or DTO mapping in repositories.
4. **Return Types**: Return Drizzle row types only (`XRow`, `XRow | null`, `XRow[]`). Services map rows to Response DTOs.
5. **File Size**: Stays under ~250 lines. Split into `<domain>-<feature>.repository.ts` if exceeding limit.
