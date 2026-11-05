---
trigger: always_on
---

# AGENTS-2.md (Part 2 of 2) — Layers, Registry & Owner Map

Continues `AGENTS.md` (principles, facts, precedence §1–3, Definition of Done §5, NEVER §6). Same precedence applies; section numbers are kept.

## 4. Layers and import direction

Request path: browser → `proxy.ts` → `app/` page or `features/<d>/actions.ts` → `lib/server` wrapper (`runAction`/`handleRoute`) → `lib/services` → `lib/repositories` → `lib/database` → Postgres.

| Layer          | Folder                                                                                                                                                                                                | Owns                                                                         | Must not                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Foundation     | `lib/{env,config,constants,utils,types,validations,contracts,http,api,hooks,client-storage}`, `lib/{errors,dbErrors,result,logger,errorCopy,motion}.ts`, `lib/di/tokens.ts`, `lib/supabase/client.ts` | enums, constants, schemas, types, errors, pure helpers                       | I/O at import time; import another layer                                 |
| Supabase       | `lib/supabase/{server,admin}.ts`                                                                                                                                                                      | server client factories                                                      | be imported by UI                                                        |
| Database       | `lib/database`                                                                                                                                                                                        | pool, Drizzle schema, `withTransaction`                                      | business rules                                                           |
| Repositories   | `lib/repositories`                                                                                                                                                                                    | every Drizzle query                                                          | auth, HTTP, email                                                        |
| Services       | `lib/services`                                                                                                                                                                                        | rules, authorization, transactions, third parties, row → ResponseDto mappers | import `drizzle-orm`/table schemas; touch `Request`, `FormData`, cookies |
| DI             | `lib/di`                                                                                                                                                                                              | container wiring                                                             | logic                                                                    |
| Server runtime | `lib/server`                                                                                                                                                                                          | `runAction`, `handleRoute`, auth, rate limit, request context                | domain logic                                                             |
| Features       | `features/<d>`                                                                                                                                                                                        | UI, hooks, `actions.ts`, `queries.ts`, DTO → ViewModel mappers               | import repositories/database                                             |
| Components     | `components`                                                                                                                                                                                          | shared presentation of view models                                           | fetch data; import server layers                                         |
| App            | `app`                                                                                                                                                                                                 | routes, layouts, boundaries                                                  | logic beyond composition                                                 |

| ↓ imports →  | Found. | Supabase | Database              | Repos | Services | DI  | Server | Components | Features |
| ------------ | ------ | -------- | --------------------- | ----- | -------- | --- | ------ | ---------- | -------- |
| Foundation   | ✓      |          |                       |       |          |     |        |            |          |
| Supabase     | ✓      | ✓        |                       |       |          |     |        |            |          |
| Database     | ✓      |          | ✓                     |       |          |     |        |            |          |
| Repositories | ✓      |          | ✓                     | ✓     |          |     |        |            |          |
| Services     | ✓      | ✓        | `transaction.ts` only | ✓     | ✓        |     |        |            |          |
| DI           | ✓      |          | ✓                     | ✓     | ✓        | ✓   |        |            |          |
| Server       | ✓      | ✓        |                       |       | ✓        | ✓   | ✓      |            |          |
| Components   | ✓      |          |                       |       |          |     |        | ✓          |          |
| Features     | ✓      |          |                       |       | ✓        | ✓   | ✓      | ✓          | ✓        |
| App          | ✓      |          |                       |       | ✓        | ✓   | ✓      | ✓          | ✓        |

`scripts/check-boundaries.mjs` enforces: this table; `"use client"` files import no server layer; server layers start with `import "server-only"`; `drizzle-orm`/`postgres` only in database + repositories; `process.env` only in `lib/env`; no `console.*`; no `fetch("/api…")` outside `lib/api`; no `../../`; type bans (`01`); folder/naming rules (`10`); route files use `handleRoute`/`handleWebhook`, actions use `runAction`; each contract's `path` matches its route and is referenced; new table migrations enable RLS.

Responsibilities:

- **Action/route**: authenticate → rate limit → parse request DTO → one service call → parse response DTO → map errors. No queries, no business rules.
- **Service**: authorizes (role + ownership), enforces rules, opens `withTransaction` for atomic multi-writes, calls third parties, returns response DTOs, throws `AppError`. Never returns raw rows.
- **Repository**: one file per aggregate; first param is an executor (`Database | DbTransaction`); returns Drizzle row types; never swallows errors.
- **Mappers**: pure, typed, no I/O. Server `lib/services/<d>.mapper.ts`; client `features/<d>/view-models.ts`.

## 7. Canonical registry

| Thing                              | Path                                                         |
| ---------------------------------- | ------------------------------------------------------------ |
| DB client, pool, `getDrizzleDb`    | `lib/database/index.ts`                                      |
| Transactions with retry            | `lib/database/transaction.ts`                                |
| Drizzle schema barrel              | `lib/database/schema/index.schema.ts`                        |
| Enums (one per file)               | `lib/constants/enums/<name>.enum.ts`                         |
| Other constants, copy, paths       | `lib/constants/<d>.constants.ts`, `lib/errorCopy.ts`         |
| Enum Zod schemas                   | `lib/validations/enums.schema.ts`                            |
| `AppError`, `Result`, SQLSTATE map | `lib/errors.ts`, `lib/result.ts`, `lib/dbErrors.ts`          |
| Contracts and registry             | `lib/contracts/<d>.contract.ts`, `lib/contracts/registry.ts` |
| Action / route wrappers            | `lib/server/action.ts`, `lib/server/route.ts`                |
| Client API helper                  | `lib/api/callApi.ts`                                         |
| Auth helpers                       | `lib/server/auth.ts`                                         |
| DI container, tokens               | `lib/di/container.ts`, `lib/di/tokens.ts`                    |
| Env                                | `lib/env/{public,server}.ts`                                 |
| Widget error boundary              | `components/feedback/WidgetBoundary.tsx`                     |
| Migrations, rollbacks              | `drizzle/*.sql`, `drizzle/rollback/`                         |
| Check scripts                      | `scripts/check-*.mjs`                                        |

## 8. Owner map

| Topic                                                                                                                                                                                                                | File |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Graph tools, impact analysis, risk levels                                                                                                                                                                            | `00` |
| Types, `any`/`unknown`, enums, constants, symbol names, lint                                                                                                                                                         | `01` |
| Next.js and React rules                                                                                                                                                                                              | `02` |
| DB access, isolation, schema, queries, transactions, SQLSTATE, repository + DB layer rules (`03` §14), migrations, RLS, auth, env, web security                                                                      | `03` |
| Zod, `AppError`, `Result`, actions, form parsing, logging                                                                                                                                                            | `04` |
| UI states, forms UI, crash handling, Tailwind, motion, a11y                                                                                                                                                          | `05` |
| Performance, images, SEO                                                                                                                                                                                             | `06` |
| Git, scripts, dependencies, tests, CI                                                                                                                                                                                | `07` |
| DTO pipeline, contracts, `handleRoute`, `callApi`, wiring checklist                                                                                                                                                  | `08` |
| Verification, traps, reports                                                                                                                                                                                         | `09` |
| Folders, file naming, DI wiring                                                                                                                                                                                      | `10` |
| Failure policy, API/DB edge cases, observability, failure tests                                                                                                                                                      | `11` |
| Hardcoded-string policy, DB-error handling in repos, constants placement, separation-of-concerns enforcement, file-size discipline, auth/ownership checks, response-caching prohibition, shared-interface discipline | `12` |
