---
trigger: always_on
---

# AGENTS.md (Part 1 of 2) — Techsonance Website 2026

Master rules for every AI agent and developer. Read first. **Part 1: principles, facts, precedence, Definition of Done, NEVER. Part 2 (`AGENTS-2.md`): layers and import matrix, canonical registry, owner map.** Section numbers are shared across both parts. These two files win on precedence, layers, Definition of Done and the NEVER list. Every rule has one owner file (`AGENTS-2.md` §8); other files link to it and never restate it.

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

1. Shared-DB safety (`03` §2) 2. This file 3. The owner file (`AGENTS-2.md` §8) 4. Everything else.

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
- Leave a DB call in a repository without a `try/catch` mapping to `mapDbError` (`12` §2).
- Hardcode a string literal (message, event name, config key) in a service, repository or route; it goes in a constants file first (`12` §1).
- Let a service call Drizzle/ORM directly or import table schemas; that is the repository's job (`12` §4).
- Extend a shared interface instead of creating a new one when the caller has a distinct use case (`12` §3).
- Cache HTTP responses in middleware keyed by IP or URL — user-scoped caching lives in the service layer only (`12` §7).
