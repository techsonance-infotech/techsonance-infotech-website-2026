---
trigger: always_on
---

# AGENTS.md (Part 1 of 2) — Master Invariants & Boundaries

Master rules for every AI agent. Part 1: principles, facts, precedence, DoD, NEVER. Part 2 (`AGENTS-2.md`): layers, import matrix, canonical registry.

## 0. Version & Syntax Invariant Matrix

| Topic | Active Tech | Breaking Point / Critical Syntax |
| --- | --- | --- |
| **Framework** | Next 16, React 19 | App Router, Server Components default. Async `params` & `cookies()`. |
| **ORM** | Drizzle `^0.38` (RQB v2) | Object syntax: `where: { id: 1 }`. Mandatory callback `(t)` scoping. |
| **Database** | Supabase Postgres (:6543) | Pooler: `prepare: false`. Shared DB: ONLY modify `ts_web_*` / `ts_ai_*`. |
| **DI** | Needle DI (`@needle-di/core`) | `inject(DRIZZLE_DB_TOKEN)`. Zero dual signatures, zero `any`, zero `if (this.db.select)`. |
| **Architecture** | 3-Tier Layering | Controller (`app/api/**`) -> Service (`lib/services/`) -> Repository (`lib/repositories/`). |
| **Boundaries** | Client/Server Isolation | `"use client"` never imports server layers. Types in `@/lib/types/`, enums in `@/lib/constants/enums/`. |
| **Environment** | `lib/env/{public,server}` | No bare `process.env`. Access via `getEnv()` / `getPublicEnv()`. |
| **AppError** | `lib/errors.ts` | Enum `ErrorCode`: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION`. |
| **Validation** | Zod 4 | Bounds on everything. `z.strictObject()` on inbound inputs. |

## 1. Principles

1. **Contract-first**: DB row → `ResponseDto` → `ViewModel`; `RequestDto` flows back. DTOs never pass directly to presentational UI.
2. **Dual validation**: Server parses all requests/responses. Client pre-validates inputs & parses API responses before view-model mapping.
3. **No assumptions**: Unspecified fields are typed `| undefined` with explicit fallbacks.
4. **Enums over strings**: Closed sets use TypeScript `enum`s from `lib/constants/enums/`.
5. **Designed failures**: UI handles loading, empty, error, partial, stale, forbidden, offline. Throw typed `AppError`.
6. **Evidence over memory**: Verify with automated test scripts before claiming completion.

## 2. Project Facts

- Next.js 16, React 19, TypeScript strict, Zod 4, Tailwind 4.
- Root layout (no `src/`): `app/`, `components/`, `features/`, `lib/`, `drizzle/`, `scripts/`.
- Data: Supabase Postgres via Drizzle + `postgres.js`, Supavisor pooler `:6543`, `prepare: false`.
- Shared DB: only touch tables prefixed with `ts_web_` or `ts_ai_`.
- DI: Needle DI stateless singletons.

## 3. Precedence & Definition of Done

Stricter rule wins: 1. Shared-DB safety (`03`) 2. This file 3. Owner rule file (`AGENTS-2.md`) 4. Everything else.

**Required Verification Commands:**
```bash
npm run typecheck                  # tsc --noEmit
node scripts/check-boundaries.mjs  # client/server & layer boundary check
npm test                           # vitest run (all unit test suites)
npm run build                      # next build
```

## 4. NEVER

- Touch any non-`ts_web_*`/`ts_ai_*` DB table; run `drizzle-kit push`/`pull`; bare `update`/`delete` without `where`.
- Authorize from `getSession()`, cookies, or untrusted client metadata.
- Read `process.env` outside `lib/env` (exception: `NODE_ENV`).
- Import `server-only` code into client components, or `drizzle-orm` into services/controllers.
- Return raw `Error`, SQL, or stack traces to clients.
- Use `any`, loose `unknown`, `as any`, `!`, `@ts-ignore`, empty `catch {}`, or `console.*`.
- Type options as raw `string`; hardcode messages, paths, headers, or limits.
- Carry overloaded repository signatures (`executor?: Database | DbTransaction`) or defensive `if (this.db.select)`.
- Use obsolete stack patterns (`middleware.ts`, sync `cookies()`, Zod 3, `bg-gradient-to-r`).
- Hardcode strings in services/repos/routes (use `lib/constants/`).
- Let services run Drizzle queries directly or import table schemas (delegate to repository).
