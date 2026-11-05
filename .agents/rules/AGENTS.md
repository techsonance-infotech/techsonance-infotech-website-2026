# AGENTS.md — Techsonance Website 2026

Master rules for every AI agent and developer. Read first. This file wins on precedence, layers, Definition of Done and the NEVER list. Every rule has one owner file (§8); other files link to it and never restate it.

## 1. Principles

1. **Contract-first, typed end to end.** DB row → `ResponseDto` (wire) → `ViewModel` (UI); `RequestDto` flows back. Every hop is a schema or a typed mapper (`08`). A Row is never sent to a client; a DTO is never passed to a presentational component.
2. **Validate on both sides.** Server parses every request and response DTO. Client pre-validates requests, parses every response, then maps to a view model before rendering (`08`).
3. **Nothing is assumed.** No field, argument, column or response key exists unless a declared type says so. Optional data is typed `| undefined` and has a fallback (`01`).
4. **Closed sets are enums, fixed values are constants** (`01` §3). No `string` for an option, no hardcoded literal.
5. **Failures are designed.** Every data view handles loading, empty, error, partial, stale, forbidden, offline (`05`, `11`). Fail fast with typed `AppError` (`04`).
6. **Evidence over memory** (`09`). Scripts do the repetitive checks (`07`).

## 2. Project facts (⚠ re-verify per `09`)

- Next.js 16 App Router, React 19, TypeScript strict, Zod 4, Tailwind 4 (⚠ `package.json`).
- Root layout, **no `src/`**: `app/ components/ features/ lib/ public/ drizzle/ scripts/`. Alias `@/*` → `./*` (⚠ `tsconfig.json`).
- Data: Supabase Postgres via **Drizzle + postgres.js**, Supavisor transaction pooler `:6543`, `prepare: false`. Supabase Auth for identity only; supabase-js never reads/writes tables. Row types come from Drizzle `$inferSelect`.
- **Shared database** with HRMS, ERP, CMS. Our objects carry `ts_web_`; everything else is untouchable (`03` §2).
- DI: Needle DI, stateless singleton services. Developers use Windows/PowerShell: scripts are Node `.mjs`.

## 3. Precedence

Stricter rule wins. If two files disagree: stop, report (`09` §6), propose the doc fix.
1. Shared-DB safety (`03` §2) 2. This file 3. The owner file (§8) 4. Everything else.

## 4. Layers and import direction

Request path: browser → `proxy.ts` → `app/` page or `features/<d>/actions.ts` → `lib/server` wrapper (`runAction`/`handleRoute`) → `lib/services` → `lib/repositories` → `lib/database` → Postgres.

| Layer | Folder | Owns | Must not |
| --- | --- | --- | --- |
| Foundation | `lib/{env,config,constants,utils,types,validations,contracts,http,api,hooks,client-storage}`, `lib/{errors,dbErrors,result,logger,errorCopy,motion}.ts`, `lib/di/tokens.ts`, `lib/supabase/client.ts` | enums, constants, schemas, types, errors, pure helpers | I/O at import time; import another layer |
| Supabase | `lib/supabase/{server,admin}.ts` | server client factories | be imported by UI |
| Database | `lib/database` | pool, Drizzle schema, `withTransaction` | business rules |
| Repositories | `lib/repositories` | every Drizzle query | auth, HTTP, email |
| Services | `lib/services` | rules, authorization, transactions, third parties, row → ResponseDto mappers | import `drizzle-orm`/table schemas; touch `Request`, `FormData`, cookies |
| DI | `lib/di` | container wiring | logic |
| Server runtime | `lib/server` | `runAction`, `handleRoute`, auth, rate limit, request context | domain logic |
| Features | `features/<d>` | UI, hooks, `actions.ts`, `queries.ts`, DTO → ViewModel mappers | import repositories/database |
| Components | `components` | shared presentation of view models | fetch data; import server layers |
| App | `app` | routes, layouts, boundaries | logic beyond composition |

| ↓ imports → | Found. | Supabase | Database | Repos | Services | DI | Server | Components | Features |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Foundation | ✓ | | | | | | | | |
| Supabase | ✓ | ✓ | | | | | | | |
| Database | ✓ | | ✓ | | | | | | |
| Repositories | ✓ | | ✓ | ✓ | | | | | |
| Services | ✓ | ✓ | `transaction.ts` only | ✓ | ✓ | | | | |
| DI | ✓ | | ✓ | ✓ | ✓ | ✓ | | | |
| Server | ✓ | ✓ | | | ✓ | ✓ | ✓ | | |
| Components | ✓ | | | | | | | ✓ | |
| Features | ✓ | | | | ✓ | ✓ | ✓ | ✓ | ✓ |
| App | ✓ | | | | ✓ | ✓ | ✓ | ✓ | ✓ |

`scripts/check-boundaries.mjs` enforces: this table; `"use client"` files import no server layer; server layers start with `import "server-only"`; `drizzle-orm`/`postgres` only in database + repositories; `process.env` only in `lib/env`; no `console.*`; no `fetch("/api…")` outside `lib/api`; no `../../`; type bans (`01`); folder/naming rules (`10`); route files use `handleRoute`/`handleWebhook`, actions use `runAction`; each contract's `path` matches its route and is referenced; new table migrations enable RLS.

Responsibilities:
- **Action/route**: authenticate → rate limit → parse request DTO → one service call → parse response DTO → map errors. No queries, no business rules.
- **Service**: authorizes (role + ownership), enforces rules, opens `withTransaction` for atomic multi-writes, calls third parties, returns response DTOs, throws `AppError`. Never returns raw rows.
- **Repository**: one file per aggregate; first param is an executor (`Database | DbTransaction`); returns Drizzle row types; never swallows errors.
- **Mappers**: pure, typed, no I/O. Server `lib/services/<d>.mapper.ts`; client `features/<d>/view-models.ts`.

## 5. Definition of Done

Run and paste the real summary lines (`09` §4):
```
npm run check      # typecheck, lint, format:check, boundaries, unused, test (07 §5)
npm run build
npm run db:check   # when schema or migrations changed
```
- [ ] Impact analysis for each modified exported symbol; `detect_changes` matched scope; graphs refreshed if structure changed (`00`)
- [ ] New data flow walked through the wiring checklist (`08`)
- [ ] Every new failure path has an outcome in `11` §1 and a test
- [ ] Enums/constants used, no literals (`01` §3); UI has all async states (`05`)
- [ ] Schema change: migration reviewed, `ts_web_` prefix, grants/RLS, rollback note (`03` §9)
- [ ] `.env.example` in sync with `lib/env/*`; no secret/token/PII in code, logs, fixtures

## 6. NEVER

- Touch anything in the DB that is not `ts_web_*`; run `drizzle-kit push`/`pull`; `update`/`delete` without a mandatory `where`.
- Authorize from `getSession()`, cookies, `user_metadata` or hidden UI.
- Read `process.env` outside `lib/env` and root config (`lib/database/index.ts` bootstrap excepted).
- Import `server-only` code into a client component, or `drizzle-orm` into a service.
- Return raw `Error`, SQL, stacks or constraint names to a client.
- Use `any`, casual `unknown`, `as X`, `!`, `@ts-ignore`, empty `catch {}`, `console.*`.
- Type an option as `string`; hardcode an option value, message, path, header, limit or user-facing text.
- Read a field that no declared type contains; render a response that was not parsed.
- Use a stale-stack pattern from `09` §2 (`middleware.ts`, sync `params`/`cookies()`, Zod 3, `bg-gradient-to-r`, …).
- Weaken a type, schema, test or lint rule to make a check pass.
- Edit `components/ui` primitives or tool-generated files (`.claude/skills`).
- Claim a command passed that you did not run.

## 7. Canonical registry

| Thing | Path |
| --- | --- |
| DB client, pool, `getDrizzleDb` | `lib/database/index.ts` |
| Transactions with retry | `lib/database/transaction.ts` |
| Drizzle schema barrel | `lib/database/schema/index.schema.ts` |
| Enums (one per file) | `lib/constants/enums/<name>.enum.ts` |
| Other constants, copy, paths | `lib/constants/<d>.constants.ts`, `lib/errorCopy.ts` |
| Enum Zod schemas | `lib/validations/enums.schema.ts` |
| `AppError`, `Result`, SQLSTATE map | `lib/errors.ts`, `lib/result.ts`, `lib/dbErrors.ts` |
| Contracts and registry | `lib/contracts/<d>.contract.ts`, `lib/contracts/registry.ts` |
| Action / route wrappers | `lib/server/action.ts`, `lib/server/route.ts` |
| Client API helper | `lib/api/callApi.ts` |
| Auth helpers | `lib/server/auth.ts` |
| DI container, tokens | `lib/di/container.ts`, `lib/di/tokens.ts` |
| Env | `lib/env/{public,server}.ts` |
| Widget error boundary | `components/feedback/WidgetBoundary.tsx` |
| Migrations, rollbacks | `drizzle/*.sql`, `drizzle/rollback/` |
| Check scripts | `scripts/check-*.mjs` |

## 8. Owner map

| Topic | File |
| --- | --- |
| Graph tools, impact analysis, risk levels | `00` |
| Types, `any`/`unknown`, enums, constants, symbol names, lint | `01` |
| Next.js and React rules | `02` |
| DB access, isolation, schema, queries, transactions, SQLSTATE, migrations, RLS, auth, env, web security | `03` |
| Zod, `AppError`, `Result`, actions, form parsing, logging | `04` |
| UI states, forms UI, crash handling, Tailwind, motion, a11y | `05` |
| Performance, images, SEO | `06` |
| Git, scripts, dependencies, tests, CI | `07` |
| DTO pipeline, contracts, `handleRoute`, `callApi`, wiring checklist | `08` |
| Verification, traps, reports | `09` |
| Folders, file naming, DI wiring | `10` |
| Failure policy, API/DB edge cases, observability, failure tests | `11` |
