---
trigger: always_on
---

# 12 — Backend Compliance Directive (Repository, Service & Constants Rules)

Owns: hardcoded-string policy, DB-error handling in repositories, constants placement, separation of concerns enforcement, file-size discipline, auth/ownership checks, response-caching prohibition, shared-interface discipline. Typing and `any`/enum rules: `01`. DB layer rules: `03`. Failure policy: `11`. Layers and import matrix: `AGENTS-2.md §4`.

## 0. Project Main Versions & Syntax Breaking Points

When reading or generating backend code, agents must immediately align with the project's active versions and breaking syntax boundaries:

| Dependency / Tool            | Project Version     | Breaking Point / Syntax Transition                                                                                                                                                                                                                  |
| ---------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Drizzle ORM**              | `^0.38.0` (RQB v2)  | **RQB v1 -> v2**: `where: { id: 1 }` (object, not callback). `orderBy: { id: "asc" }`. Cross-relation filter: `where: { posts: { content: { like: 'M%' } } }`. Relation offset: `with: { comments: { offset: 3, limit: 3 } }`.                      |
| **Drizzle Callback Scoping** | RQB v2              | **Mandatory `(t)`**: Table columns in relational query callbacks (`orderBy`, `where.RAW`, `extras`) **MUST** use callback param `(t)` (e.g. `(t) => sql\`${t.id} asc\``), **NEVER** imported table objects.                                         |
| **Supabase Pooler**          | Transaction `:6543` | **`prepare: false` is mandatory**: Supavisor transaction pooler breaks on prepared statements. Use `postgres(url, { prepare: false })`.                                                                                                             |
| **Needle DI**                | `@needle-di/core`   | **Single-source DI**: Repositories inject `private db: Database = inject(DRIZZLE_DB_TOKEN)`. **NEVER** overload with `executor?: Database \| DbTransaction`, never use `(executor as any)`, and never write defensive `if (this.db.select)` checks. |
| **Next.js & React**          | Next 16, React 19   | App Router, Server Actions, async `params` and `cookies()`.                                                                                                                                                                                         |

## 1. No hardcoded strings — constants placement

- Fixed strings that carry meaning (error messages, log messages, config keys, event names, feature settings, copy) live in constants files; **never** inline in services, repositories, actions, or route handlers.
- **Domain-specific** (error codes, messages, validation constants, feature settings) → `lib/constants/<domain>.constants.ts`.
- **Cross-cutting / shared by 2+ independent domains** (`api.constants.ts`, `validation.constants.ts`, `cache.constants.ts`, `rate-limit.constants.ts`, `http-status.constants.ts`) → `lib/constants/`.

## 2. Repository rules (extends `03 §11`)

Every `lib/repositories/*.repository.ts` file MUST:

1. **Guard every DB call with structured error handling**: Wrap each Drizzle operation in `try/catch`; map to `AppError` via `mapDbError(err, { context, id })` from `lib/dbErrors.ts`; never let raw driver/DB errors surface to services.
2. **Validate before writing**: Never pass raw unvalidated payloads straight into insert/update. Reject malformed inputs before they reach the DB.
3. **Validate DB-returned data before use**: Guard returned rows/objects for null/undefined before accessing properties.
4. **Throw `AppError("NOT_FOUND", …)` in services**: Repositories return `Row | null` for expected lookups; services throw domain NOT_FOUND errors.
5. **Transactions for multi-write atomicity**: Use `withTransaction` from `lib/database/transaction.ts` when two or more related writes must succeed together.
6. **`where` is mandatory on every `update` and `delete`**: Bare updates or deletes without a `where` clause are build-breaking violations.
7. **Return Drizzle row types only**: Repositories return `Row`, `Row | null`, or `Row[]`. Mappers and DTOs belong in the service layer.
8. **Clean Needle DI injection & Zero `any`**:
   - Inject `private db: Database = inject(DRIZZLE_DB_TOKEN)`.
   - Do NOT carry dual signatures or overloaded parameters (`executor?: Database | DbTransaction`).
   - NEVER use `(executor as any)`, `(this.db as any)`, or loose type assertions.
   - For transactional operations, pass `tx: DbTransaction` explicitly as a typed parameter.
   - NEVER write defensive `if (this.db.select)` or `if (this.db.query...)` branches.

## 3. Modifying shared TypeScript interfaces

- Caller has distinct use case or different shape → **create a new interface**; do not pollute the shared one.
- Same use case and identical upstream source → **extend the existing interface**.
- Never extend a shared interface merely to avoid creating a new type.

## 4. Separation of concerns (strict)

| Layer                              | Allowed                                                                                    | Forbidden                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `app/api/**/route.ts`              | Parse request → one service call → serialize response                                      | DB queries, business rules, auth checks                              |
| `lib/services/*.service.ts`        | Business rules, auth (role + ownership), orchestration, calling repos, throwing `AppError` | Drizzle/ORM calls, importing `drizzle-orm` or table schemas directly |
| `lib/repositories/*.repository.ts` | All Drizzle queries, joins, mutations, transactions                                        | Business rules, HTTP concerns, email, auth                           |

Violations fail `npm run check` (`scripts/check-boundaries.mjs`) and break the build.

## 5. File size limit

- No file grows past **~250 lines**. Split cohesive groups of methods into `<domain>-<feature>.repository.ts` or `<domain>-<feature>.service.ts` in the same directory.
- Do not create a new file for trivial additions while existing domain files have room.

## 6. Authentication & authorization

- Handlers touching user-owned data verify **identity** (authentication) **and permissions** (authorization).
- Ownership check is mandatory on read/update/delete of user data: `resource.ownerId === currentUser.id`.
- Where **existence itself is sensitive**, return `NOT_FOUND` rather than `FORBIDDEN`.
- Authorization lives exclusively in **services**, never in repositories or route handlers.

## 7. No HTTP response caching in middleware

- Never cache HTTP responses in global or route middleware keyed by IP or URL; it leaks user-scoped data across shared IPs.
- Response caching belongs only in the **service layer**, scoped by verified user and resource ID.
- Authenticated user-scoped routes emit `Cache-Control: private, no-store`.

## 8. Enums for matching & validation

Any value checked or validated across multiple files must be an `enum` from `lib/constants/enums/<name>.enum.ts` (or `lib/database/enum/`). Never duplicate raw string literals.

## 9. Drizzle Relational Query Builder (RQB v2) & Scoping Reference

- **Object-based filters & ordering**:
  - `where`: `where: { id: jobId, email: normalizedEmail }`
  - `orderBy`: `orderBy: { createdAt: "desc" }`
  - Relational filter: `where: { posts: { content: { like: "M%" } } }`
  - Relational offset: `with: { comments: { offset: 3, limit: 3 } }`
- **Mandatory `(t)` Callback Scoping**:
  Inside relational queries, column references in callbacks (`orderBy`, `where.RAW`, `extras`) MUST use the callback parameter `(t)` to preserve SQL table aliases.
  - ❌ `where: { RAW: sql\`LOWER(${users.name}) LIKE 'john%'\` }`
  - ✅ `where: { RAW: (t) => sql\`LOWER(${t.name}) LIKE 'john%'\` }`
  - ✅ `extras: { count: (t) => db.$count(posts, eq(posts.authorId, t.id)) }`

## 10. Code-generation checklist (repository additions)

Before completing any repository method:

- [ ] DB call wrapped in `try/catch` mapping via `mapDbError`?
- [ ] Meaningful string literals placed in constants?
- [ ] Input data validated before Drizzle call?
- [ ] Returned data checked for null/undefined before use?
- [ ] Expected missing record handled (returns `null`, service throws `AppError`)?
- [ ] Dependent multi-writes wrapped in `withTransaction`?
- [ ] Every `update` and `delete` has an explicit `where` clause?
- [ ] Relational queries use RQB v2 object syntax (`where: { id }`, `orderBy: { id: "asc" }`)?
- [ ] Relational query callbacks reference columns via `(t)`, NEVER imported table objects?
- [ ] Injects `this.db` cleanly without `(executor as any)` or defensive `if (this.db.select)` checks?
- [ ] Return type is a Drizzle row type (not a DTO)?
- [ ] File stays under ~550 lines?
