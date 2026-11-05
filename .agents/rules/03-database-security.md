---
trigger: always_on
---

# 03 — Database, Isolation, Queries, Migrations & Security (Drizzle on Supabase)

Owns: access model, shared-DB isolation, pooler, schema, queries, transactions, SQLSTATE mapping, migrations, RLS, and repository layer rules.

## 0. Version & Syntax Invariant Matrix

| Component | Main Version | Breaking Point / Syntax Transition |
| --- | --- | --- |
| **Drizzle ORM** | `^0.38.0` (RQB v2) | Object syntax: `where: { id: 1 }`. `orderBy: { id: "asc" }`. Relational: `where: { posts: { content: { like: 'M%' } } }`. |
| **Drizzle Scoping** | RQB v2 | **Mandatory `(t)` callback scoping**: Relational callbacks (`orderBy`, `where.RAW`, `extras`) MUST use callback param `(t)` (e.g. `(t) => sql\`${t.id} asc\``), NEVER imported table objects. |
| **postgres.js** | `^3.4.5` | Supavisor pooler on port `:6543`. Direct port `:5432` for migrations only. |
| **Supabase Pooler** | Transaction `:6543` | **`prepare: false` is mandatory**: Prepared statements fail on transaction pooling. Must use `postgres(url, { prepare: false })`. |
| **Needle DI** | `@needle-di/core` | **Single-type injection**: Repositories inject `private db: Database = inject(DRIZZLE_DB_TOKEN)`. ZERO dual signatures (`executor?: Database \| DbTransaction`), zero `any`, zero `if (this.db.select)`. |

## 1. Shared-Database Isolation (CRITICAL)

The database is shared with HRMS, ERP, CMS.
- **Prefix Isolation**: All tables, indexes, constraints, enums, triggers, and policies MUST start with `ts_web_*` or `ts_ai_*`. Never touch, alter, or query anything else.
- `drizzle.config.ts`: `tablesFilter: ["ts_web_*", "ts_ai_*"]`, migration journal `ts_web_drizzle_migrations`.
- **Tooling restrictions**: Allowed: `drizzle-kit generate | migrate | check`. **FORBIDDEN: `push`, `pull`, `drop`.**
- **Runtime role**: Connects as `ts_web_app` with `bypassrls`. Grants applied per table in migrations; never `alter default privileges`.
- Connection strings: `DATABASE_URL` targets port `:6543` (runtime pooler). `DIRECT_URL` targets port `:5432` (migrations only).

## 2. Pooler Constraints & Schema

- `prepare: false` is mandatory in `postgres(url, { prepare: false })`. No session state (`SET`, temp tables).
- Standard columns: `id uuid` PK, `created_at` / `updated_at` timestamptz (`$onUpdate`), explicit FK `onDelete`.
- Row types exported via `typeof table.$inferSelect` and `typeof table.$inferInsert`. Hand-written duplicates forbidden.

## 3. Query Rules & Drizzle Footguns

1. **Mandatory `where`**: `update` and `delete` MUST always have an explicit `where` clause. Bare update/delete is build-breaking.
2. **RQB v2 Object Syntax**: In `db.query.*`, use object syntax for `where` and `orderBy`. Relational callbacks MUST use `(t)`.
3. **Array guards**: Guard `inArray(col, ids)` with `if (ids.length === 0) return []`.
4. **Pagination**: Keyset pagination on `(created_at, id)` with `limit <= 100` (+1 row for `nextCursor`).
5. **SQL injection**: No raw string interpolation; use `sql` template strings only.
6. **Absence**: Lookups return `Row | null`. Repositories do not throw domain errors for expected absence; services throw `AppError(ErrorCode.NOT_FOUND)`.
7. **Optimistic Locking**: Update with `where: and(eq(t.id, id), eq(t.version, version))`; bump version; return undefined if 0 rows updated so caller raises `CONFLICT`.

## 4. Transactions & Error Mapping

- Multi-write atomicity: Wrap dependent writes in `withTransaction(async (tx) => { ... })`. Pass `tx: DbTransaction` explicitly.
- Repositories wrap all DB calls in `try/catch` and map errors via `mapDbError(err, context)`:
  - `23505` -> `AppError(ErrorCode.CONFLICT, "That record already exists")`
  - `23503` -> `AppError(ErrorCode.CONFLICT, "A related record is missing or still in use")`
  - `42501` -> `AppError(ErrorCode.FORBIDDEN, "Not allowed")`
  - `23514` / Class `22` -> `AppError(ErrorCode.VALIDATION, "Invalid value")`
  - Network timeouts (`08`, `53`, `ETIMEDOUT`, `ECONNREFUSED`) -> `AppError(ErrorCode.UNAVAILABLE, "Service unavailable", { retryAfterSec: 2 })`
  - Unhandled errors -> `AppError(ErrorCode.INTERNAL)` with cause preserved.

## 5. Migrations, RLS & Repositories

- Migrations enable RLS and grant rights to `ts_web_app`:
  `alter table ts_web_x enable row level security; revoke all on ts_web_x from anon, authenticated; grant select, insert, update, delete on ts_web_x to ts_web_app;`
- Service layer authorizes ownership (`resource.ownerId === currentUser.id`).
- Clean Dependency Injection: Inject `private db: Database = inject(DRIZZLE_DB_TOKEN)`. No dual signatures (`executor?: Database | DbTransaction`), no loose `any`, no defensive conditionals `if (this.db.select)`.
- Pure Query Concern: No business rules, authorization, HTTP objects, or DTO mapping in repositories. Return Drizzle row types only.
- File Size: Keep under ~250 lines. Split cohesive domains into `<domain>-<feature>.repository.ts`.
