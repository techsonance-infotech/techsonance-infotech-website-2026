---
trigger: always_on
---

# 12 — Backend Compliance Directive (Repository, Service & Constants Rules)

Owns: hardcoded-string policy, DB-error handling in repositories, constants placement, separation of concerns enforcement, file-size discipline, auth/ownership checks, response-caching prohibition, shared-interface discipline. Typing and `any`/enum rules: `01`. DB layer rules: `03`. Failure policy: `11`. Layers and import matrix: `AGENTS-2.md §4`.

## 0. Operating principle

No shortcuts, no skipped steps, no deferring verification. If a rule applies to the code you are about to write, satisfy it in the **current file** BEFORE moving on. "I'll fix it after" is not allowed. If unsure whether a rule applies, assume it does; ambiguity resolves to stricter compliance.

## 1. No hardcoded strings — constants placement

- Fixed strings that carry meaning (error messages, log messages, config keys, event names, feature settings, copy) live in constants files; **never** inline in services, repositories, actions or route handlers.
- **Domain-specific** (error codes, messages, validation constants, feature settings) → `lib/constants/<domain>.constants.ts`.
- **Cross-cutting / shared by 2+ independent domains** (`api.constants.ts`, `validation.constants.ts`, `cache.constants.ts`, `rate-limit.constants.ts`, `http-status.constants.ts`) → `lib/constants/`.
- Before writing any string literal ask: *domain-specific or global?* Put it in the right constants file immediately; never "temporarily" inline a string.

## 2. Repository rules (extends `03 §14`)

Every `lib/repositories/*.repository.ts` file MUST:

1. **Guard every DB call with structured error handling.** Wrap each Drizzle operation in `try/catch`; map to `AppError` via `mapDbError` from `lib/dbErrors.ts`; never let raw driver/DB errors propagate to the service layer.

   ```ts
   // ✅ correct
   async findById(id: string): Promise<Row | null> {
     try {
       const [row] = await this.db.select().from(table).where(eq(table.id, id)).limit(1);
       return row ?? null;
     } catch (err) {
       throw mapDbError(err, { context: 'findById', id });
     }
   }

   // ❌ wrong — raw error surfaces
   async findById(id: string) {
     const [row] = await this.db.select().from(table).where(eq(table.id, id)).limit(1);
     return row ?? null;
   }
   ```

2. **Validate before writing.** Never pass raw incoming data straight into an insert/update. Confirm required fields are present, non-null and correctly typed before the Drizzle call; malformed inputs must be rejected before they reach the DB.

3. **Validate DB-returned data before use.** Arrays and objects from the DB may be null/undefined; guard before accessing fields. A query that did not throw does not prove the record exists — check the returned value explicitly.

4. **Throw `AppError("NOT_FOUND", …)` for missing expected records.** A silent `null` return is only valid when the caller explicitly handles absence; document this in the method's return type.

5. **Transactions for multi-write atomicity.** Use `withTransaction` from `lib/database/transaction.ts` when two or more related writes must succeed together. Never issue dependent inserts sequentially without a transaction.

6. **`where` is mandatory on every `update` and `delete`.** A bare update/delete without a `where` clause is a build-breaking violation (see `AGENTS.md §6`).

7. **Return Drizzle row types only.** Repositories must not return DTOs, view models or mapped shapes — that is the service/mapper's job.

8. **First param supports `Database | DbTransaction`.** Every method that participates in a transaction must accept an executor argument so services can pass the transaction context.

## 3. Modifying shared TypeScript interfaces

Before adding a field to a shared interface, check the data flow:

- Module calls its own API/query, receives a different shape, or has a distinct use case → **create a new interface**; do not touch the shared one.
- Same use case as existing dependents AND same upstream source/query → **extend the existing interface**.

Never extend a shared interface just to avoid creating a new one — it silently couples unrelated features.

## 4. Separation of concerns (strict)

| Layer | Allowed | Forbidden |
|---|---|---|
| `app/api/**/route.ts` | Parse request → one service call → serialize response | Queries, business rules, auth checks |
| `lib/services/*.service.ts` | Business rules, auth (role + ownership), orchestration, calling repos, throwing `AppError` | Drizzle/ORM calls, importing `drizzle-orm` or table schemas directly |
| `lib/repositories/*.repository.ts` | All Drizzle queries, joins, mutations, transactions | Business rules, HTTP concerns, email, auth |

Violations fail `check:boundaries` and are build-breaking.

## 5. File size limit

- No file grows past **~250 lines** (project convention, `10 §2 rule 5`). At or near the limit: split a cohesive group of methods into `<domain>-<feature>.repository.ts` or `<domain>-<feature>.service.ts` in the same folder.
- Do **not** create a new file for every small addition. First check the existing same-domain same-layer file; add there while it has room.

## 6. Authentication & authorization

- Every handler touching user-owned data verifies **who** is calling (authentication) **and** whether they may act on that specific resource (authorization) — not just that a valid token exists.
- Ownership check is mandatory on every read/update/delete of user-owned content: `resource.ownerId === currentUser.id`.
- Where **existence itself is sensitive**, return `NOT_FOUND` rather than `FORBIDDEN`.
- Authorization lives in **services**, never in repositories or route handlers.

## 7. No HTTP response caching in middleware

- Never cache HTTP responses in global or route-level middleware keyed by IP, URL or headers; it leaks user-scoped data across users behind shared IPs (carrier NAT, proxies, office Wi-Fi, tunnels).
- Response caching belongs only in the **service layer**, scoped and keyed by verified user ID and resource ID.
- Authenticated user-scoped route handlers emit `Cache-Control: private, no-store`.

## 8. Enums for matching & validation

Any value checked, matched or validated across multiple files is a single `enum` from `lib/constants/enums/<name>.enum.ts` (or the cross-cutting `lib/database/enum/`) referenced everywhere. Never repeat a raw string literal across files.

## 9. Code-generation checklist (repository additions)

Before committing a new or modified repository method:

- [ ] Every DB call is in its own `try/catch` mapping to `AppError` via `mapDbError`?
- [ ] All string literals moved to constants?
- [ ] Input data validated before the Drizzle call?
- [ ] DB-returned data checked before use (null-guard)?
- [ ] Expected-missing record throws `AppError("NOT_FOUND", …)`?
- [ ] Multi-write operations wrapped in `withTransaction`?
- [ ] Every `update`/`delete` has a `where` clause?
- [ ] Return type is a Drizzle row type (not a DTO or view model)?
- [ ] File stays under 250 lines (split if needed)?
- [ ] No shared interface widened unnecessarily?
