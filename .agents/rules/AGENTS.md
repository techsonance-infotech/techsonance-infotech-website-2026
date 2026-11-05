# AGENTS.md — Techsonance Website 2026

Master rules for every AI agent and developer. Read this first; it indexes the numbered rule files. This file wins on precedence, layers, Definition of Done and the NEVER list.

## 1. No hardcoded strings; constants placement

- Fixed strings that carry meaning (error, response and log messages, config keys, queue/event names, OpenAPI summaries/descriptions) live in constants files, never inline in services, controllers or providers.
- Domain-specific (error codes, messages, validation constants, OpenAPI docs text, feature settings) -> `lib/<domain>/constants/<domain>.constant.ts`.
- Cross-cutting, shared by multiple independent domains (`api.constant.ts` standard headers, `validation.constant.ts` global UUID/email regexes, `cache.constant.ts` Redis TTLs, `permissions.constant.ts` global RBAC, `http-status.constant.ts`) -> `lib/constants/`.
- Before writing any string literal ask: domain-specific or global? Put it in the right constants file immediately, never "temporarily" inline.

## 2. Strict typing & validation

1. Zero `any` / `unknown` / implicit typing. Every variable, parameter, return type, DTO and object shape has an explicit, precise type; no quick-fix `any` casts.
2. After defining or editing types, check that file for type errors immediately; do not batch type-checking to the end.
3. Fix a type mismatch completely in the current file before touching the next file or step; never leave a known type error behind.
4. **Barrel imports for database schemas & enums:** Always import database schema tables and models from `lib/database/schema/index.schema.js` and enums from `lib/database/enum/index.enum.js`. Never bypass index barrels to import individual schema files via deep relative paths (e.g. `lib/database/schema/core/*.schema.js`).

## 1. Project facts

Taken from the project's own code. Items marked ⚠ must be re-verified (`09`) before you rely on them.

- Stack: Next.js 16 App Router, React 19, TypeScript strict, Zod 4, Tailwind 4. ⚠ exact versions in `package.json`.
- Layout is **root-level, no `src/`**: `app/ components/ features/ lib/ public/ drizzle/ scripts/`. Alias `@/*` → `./*`. ⚠ `tsconfig.json` `paths` must match (older rule text said `./src/*`).
- Data: Supabase Postgres through **Drizzle ORM + postgres.js** (`lib/database`). Runtime URL is the Supavisor transaction pooler (`:6543`, `prepare: false`). Supabase Auth supplies identity. supabase-js is not used for table reads or writes.
- **Shared database.** HRMS, ERP and CMS use the same Supabase project. Website objects carry the `ts_web_` prefix; everything else is untouchable (`03` §2).
- DI: Needle DI (`lib/di`). Services are stateless singletons; request data travels as arguments.
- Developers work on Windows/PowerShell: repo scripts are Node (`.mjs`), never bash-only.

## 2. Precedence

When two rules disagree, apply the stricter one, stop, and report the conflict (`09` §7). Known overlaps:

1. Safety of the shared database (`03` §2) beats everything.
2. This file (layers, Definition of Done, NEVER list).
3. `10` owns directories, file naming and DI wiring. The naming table in `01` is superseded by `10` §3.
4. `03`/`03b`/`03c` database, auth, env, security · `04` errors/validation · `08` contracts and wrappers · `11`/`11b` failure handling.
5. All other files (`00`, `01`, `02`, `05`, `06`, `07`, `09`).

## 3. Layers and import direction

Request path: browser → `proxy.ts` → `app/` page or `features/<d>/actions.ts` → `lib/server` wrapper (`runAction` / `handleRoute`) → `lib/services` → `lib/repositories` → `lib/database` → Postgres.

| Layer | Folder | Owns | Must not |
|---|---|---|---|
| Foundation | `lib/{env,config,constants,utils,types,validations,contracts,http,api,hooks,client-storage}`, `lib/{errors,dbErrors,result,logger,cache-tags,errorCopy,motion}.ts`, `lib/di/tokens.ts`, `lib/supabase/client.ts` | schemas, types, errors, pure helpers | do I/O at import time; import any other layer |
| Supabase | `lib/supabase/{server,admin}.ts` | server client factories | be imported by UI |
| Database | `lib/database` | pool, Drizzle schema, `withTransaction` | hold business rules |
| Repositories | `lib/repositories` | every Drizzle query | check auth, know HTTP, send email |
| Services | `lib/services` | business rules, authorization, transactions, third-party calls, DTO mapping | import `drizzle-orm` or table schemas; touch `Request`, `FormData`, cookies |
| DI | `lib/di` | container wiring | hold logic |
| Server runtime | `lib/server` | `runAction`, `handleRoute`, auth, rate limit, request context | hold domain logic |
| Features | `features/<domain>` | UI, hooks, `actions.ts` (writes), `queries.ts` (reads) | import repositories or database |
| Components | `components` | shared presentation | fetch data; import server layers |
| App | `app` | routes, layouts, boundaries | hold logic beyond composition |

Allowed imports (row imports column; `✓` allowed):

| ↓ imports → | Foundation | Supabase | Database | Repos | Services | DI | Server | Components | Features |
|---|---|---|---|---|---|---|---|---|---|
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

`npm run check:boundaries` enforces this table plus: `"use client"` files import no server layer; server layers start with `import "server-only"`; `drizzle-orm`/`postgres` only in database and repositories; `process.env` only in `lib/env`; no `console.*`; no raw `fetch("/api…")` outside `lib/api`; no `../../` imports; naming and folder-depth rules from `10`.

Layer responsibilities:

- **Action / route** (`runAction`, `handleRoute`): authenticate → rate limit → parse input → call one service method → parse output → map errors. No queries, no business rules.
- **Service**: authorizes (role + ownership), enforces rules, opens `withTransaction` when two or more writes must be atomic, calls third parties, returns DTOs. Throws `AppError`; never returns raw rows.
- **Repository**: one file per aggregate; functions take an executor (`Database | DbTransaction`) as the first argument so services can compose them in one transaction. Returns Drizzle row types. Never swallows errors.

## 4. Definition of Done

Run and paste the real summary lines (`09` §4):

```
npm run check            # typecheck + lint + format:check + check:boundaries + check:unused + test
npm run build
npm run db:check         # only when schema/migrations changed
```

- [ ] Impact analysis for each modified exported symbol (`00`)
- [ ] New data flow walked through the boundary matrix and wiring checklist (`08`)
- [ ] Every new failure path has a defined outcome in `11` §1 and a test
- [ ] Schema change: migration reviewed, `ts_web_` prefix, grants/RLS block present, rollback note (`03c` §9)
- [ ] `.env.example` in sync with `lib/env/*`
- [ ] No secret, token or PII in code, logs, fixtures

## 5. NEVER

- Touch, alter, drop, read or write any table/function/policy/enum that is not `ts_web_*`.
- Run `drizzle-kit push` or `drizzle-kit pull` against the shared database.
- Call `update`/`delete` without a mandatory `where` (`03b` §6).
- Authorize from `getSession()`, cookie contents, `user_metadata`, or hidden UI.
- Read `process.env` outside `lib/env` and root config files (`lib/database/index.ts` bootstrap excepted).
- Import `server-only` code into a client component, or `drizzle-orm` into a service.
- Return raw `Error`, SQL text, stack traces or constraint names to a client.
- Swallow errors (`catch {}`), `any`, `as X`, `!`, `@ts-ignore`, `console.*`.
- Create `middleware.ts`; use synchronous `params`/`cookies()`; use `forwardRef`, `useFormState`, Zod 3 patterns, `bg-gradient-to-r`.
- Weaken a type, schema, test or lint rule to make a check pass.
- Edit `components/ui` third-party primitives or `.claude/skills` generated files.
- Claim a command passed that you did not run (`09`).

## 6. Canonical registry

| Thing | Path |
|---|---|
| DB client, pool, `getDrizzleDb`, `db` | `lib/database/index.ts` |
| Transactions with retry | `lib/database/transaction.ts` |
| Drizzle schema (barrel for drizzle-kit) | `lib/database/schema/index.schema.ts` |
| Relations | `lib/database/relation.ts` |
| SQLSTATE → `AppError` | `lib/dbErrors.ts` |
| `AppError`, codes, status map | `lib/errors.ts` |
| `Result`, `ok`, `fail` | `lib/result.ts` |
| Action / route wrappers | `lib/server/action.ts`, `lib/server/route.ts` |
| Auth helpers | `lib/server/auth.ts` |
| DI container and tokens | `lib/di/container.ts`, `lib/di/tokens.ts` |
| Env | `lib/env/{public,server}.ts` |
| Error copy for UI | `lib/errorCopy.ts` |
| Widget error boundary | `components/feedback/WidgetBoundary.tsx` |
| Migrations | `drizzle/*.sql`, rollback plans in `drizzle/rollback/` |
| Boundary guard | `scripts/check-boundaries.mjs` |

## 7. Rule files

`00` code intelligence · `01` TypeScript · `02` Next/React · `03`/`03b`/`03c` database/auth/security · `04` errors/validation · `05` UI · `06` performance/SEO · `07` git/CI · `08` contracts · `09` AI verification · `10` directories/layers · `11`/`11b` failure handling.
