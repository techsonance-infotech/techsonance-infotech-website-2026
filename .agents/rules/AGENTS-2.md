---
trigger: always_on
---

# AGENTS-2.md (Part 2 of 2) — Layers, Registry & Owner Map

Continues `AGENTS.md` (principles, facts, precedence, DoD, NEVER).

## 4. Layers and Import Direction

Request flow: Browser → `proxy.ts` → `app/` / `features/<d>/actions.ts` → `lib/server` (`runAction`/`handleRoute`) → `lib/services` → `lib/repositories` → `lib/database` → Postgres.

| Layer | Folder | Owns | Must NOT |
| --- | --- | --- | --- |
| **Foundation** | `lib/{env,config,constants,types,validations,contracts,http,api}` | Enums, constants, schemas, types, pure helpers | I/O at import; import server layers |
| **Supabase** | `lib/supabase/{server,admin}.ts` | Client factories | Import by UI components |
| **Database** | `lib/database` | Pool, schema, `withTransaction` | Business rules |
| **Repositories** | `lib/repositories` | Drizzle queries, rows | Business rules, auth, HTTP, email |
| **Services** | `lib/services` | Rules, auth, orchestration, row→DTO mapping | Direct Drizzle/SQL; touch Request/FormData |
| **DI** | `lib/di` | Container binding | Logic |
| **Server Runtime** | `lib/server` | `runAction`, `handleRoute`, auth | Domain rules |
| **Features / App** | `features/<d>`, `app/` | UI, hooks, pages, view models | Import repos or database |
| **Components** | `components/` | Shared presentation | Fetch data; import server layers |

Boundary enforcement (`scripts/check-boundaries.mjs`):
- `"use client"` never imports server layers.
- `drizzle-orm` and `postgres` ONLY in `lib/database` and `lib/repositories`.
- `process.env` ONLY in `lib/env`.
- No `console.*` (use `lib/logger.ts`).
- Server layers require `import "server-only"`.

## 7. Canonical Registry

| Item | Path |
| --- | --- |
| DB client & pool | `lib/database/index.ts` |
| Transactions | `lib/database/transaction.ts` |
| Schema barrel | `lib/database/schema/index.schema.ts` |
| Enums & Types | `lib/constants/enums/*.enum.ts`, `lib/types/*.types.ts` |
| AppError & Result | `lib/errors.ts`, `lib/result.ts`, `lib/dbErrors.ts` |
| Contracts | `lib/contracts/<d>.contract.ts`, `lib/contracts/define.ts` |
| Action & Route | `lib/server/action.ts`, `lib/server/route.ts` |
| Client Fetch | `lib/api/callApi.ts` |
| DI Wiring | `lib/di/container.ts`, `lib/di/tokens.ts` |
| Env Access | `lib/env/{public,server}.ts` |
| Repositories & Services | `lib/repositories/`, `lib/services/` |

## 8. Owner Map

| Topic | File |
| --- | --- |
| Graph tools & impact analysis | `00` |
| Types, enums, constants & lint | `01` |
| Next.js & React rules | `02` |
| DB, isolation, queries, RLS, repo rules | `03` |
| Zod 4, AppError, Result, actions, logging | `04` |
| UI states, Tailwind 4, a11y, crash boundaries | `05` |
| Performance, images, SEO | `06` |
| Git, scripts, CI & testing | `07` |
| Contracts, DTO pipeline, wiring checklist | `08` |
| Verification & DoD | `09` |
| Architecture & DI wiring | `10` |
| Resilience & error edge cases | `11` |
| Backend compliance & constants rules | `12` |
