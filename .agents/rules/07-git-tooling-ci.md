# 07 — Git, Tooling, Dependencies, Testing & CI

Owns: commits, scripts, dependencies, tests, CI. The `check` script (§5) is the single definition of "green" referenced by `AGENTS.md`.

## 1. Commits (commitlint, conventional)

`type(scope): imperative summary`, header ≤ 72 chars, lowercase type, no trailing period.

- Types: `feat fix perf refactor docs style test build ci chore revert`. Scopes: `auth db repo services di ui api contracts deps config rules resilience`.
- Breaking: `feat(api)!: …` + `BREAKING CHANGE:` footer with migration steps.
- Body explains why (wrap 100); reference issues. One logical change per commit. Never `--no-verify`.
- `commitlint.config.ts`: `export default { extends: ["@commitlint/config-conventional"] };`

## 2. Branching and PRs

- Trunk-based: short-lived `type/short-description` branches off protected `main` (PR + green CI + review, no force-push). Squash-merge with a conventional title.
- PRs ≤ ~400 changed lines. Description: what/why, UI screenshots, impact note (`00`), migration + rollback notes, test evidence.
- Migrations ship in the same PR as the code needing them, backward-compatible with the previous deploy (`03` §9).

## 3. Husky, Windows, formatting

- `.husky/pre-commit` → `npx lint-staged`; `commit-msg` → `npx --no -- commitlint --edit "$1"`; `pre-push` → `npm run typecheck`. Hooks are convenience; **CI is the authority**.
- `.gitattributes`: `* text=auto eol=lf`. All repo scripts are Node `scripts/*.mjs`, never bash-only.
- lint-staged: `*.{ts,tsx,js,jsx,mjs}` → `oxlint --fix --deny-warnings`, `prettier --write`; `*.{json,md,css,yml,yaml}` → `prettier --write`. Prettier + `prettier-plugin-tailwindcss` is the only formatter.

## 4. Environments

Separate Supabase projects for dev/staging/prod; never point local dev at prod data. `.env.example` stays in sync with `lib/env/*` in the same PR (CI diffs variable names). Feature flags for risky releases, removed after rollout.

## 5. Scripts (`package.json`)

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "oxlint --deny-warnings",
    "format:check": "prettier --check .",
    "check:boundaries": "node scripts/check-boundaries.mjs",
    "check:unused": "knip",
    "test": "vitest run",
    "check": "npm run typecheck && npm run lint && npm run format:check && npm run check:boundaries && npm run check:unused && npm run test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:check": "drizzle-kit check",
    "db:ping": "node scripts/db-check.mjs",
    "test:rls": "supabase test db"
  }
}
```

Never edit `check` to drop a step. No `db:push`/`db:pull` scripts (`03` §2). Enum/constant/contract drift is enforced by `check:boundaries`, lint and tests, not separate scripts.

## 6. Dependencies

- Exact versions (no `^`/`~`), one lockfile, `engines` + `.nvmrc` (Node LTS), `npm ci` in CI. ⚠ dev machine reports Node 26.x: pin the LTS CI and host use.
- Before adding a package: native alternative? maintained? bundle cost? license? types? security record? Verify the exact name on the registry (`09`). Runtime deps in `dependencies`, tooling/types in `devDependencies`. No `@types/sharp`.
- Major upgrades in a dedicated PR. `npm audit --omit=dev` + Dependabot/Renovate (grouped, weekly). No duplicate libraries (second animation lib, validator, icon set). ⚠ both framer-motion and GSAP/Lenis are referenced: confirm in `package.json` which are installed, list them here, add no third.
- **Required**: `server-only`, `drizzle-orm`, `drizzle-kit`, `postgres`, `@needle-di/core`, `zod`, `vitest`, `@testing-library/react`, `jsdom`, `@playwright/test`, `prettier`, `prettier-plugin-tailwindcss`, `knip`, `@sentry/nextjs` (before launch), `@next/bundle-analyzer`, `@upstash/ratelimit`, `supabase` CLI (dev).

## 7. Testing

- Pyramid: many unit tests (utils, Zod schemas, mappers, services with a test container), some integration (actions/routes against local Postgres with migrations applied), few E2E (booking, contact, login, admin).
- Every bug fix ships a regression test. Schemas: valid/invalid/boundary (`04`). **Failure-path tests are mandatory** (`11` §5). Contract test per contract. Form tests assert input `name` = schema key and `fieldErrors` render beside the right inputs.
- **DB tests**: repositories run against real local Postgres (`supabase start` + `drizzle-kit migrate`): uniqueness, `version` conflicts, empty-array guards, keyset ordering, and that no query touches non-`ts_web_` tables. pgTAP (`test:rls`) proves anon/authenticated denied on every `ts_web_*` table.
- `expectTypeOf` tests for `Result`, contracts, mappers. Deterministic: no real network/time/randomness; no large DOM snapshots; query by role/label.
- Coverage ≥ 80% on `lib/` (a floor). `server-only` aliased to an empty module in Vitest config.

## 8. CI (all required for merge)

1. `npm ci` (cached) → `typecheck` → `lint` → `format:check` → `check:boundaries` → `check:unused` → `test` → `next build`.
2. Local Supabase: `drizzle-kit migrate`, `drizzle-kit check`, then `drizzle-kit generate` and fail if `git status --porcelain drizzle` is non-empty (drift); run `test:rls`.
3. E2E on the preview deployment; Lighthouse CI against `06` budgets.
4. `npm audit --omit=dev` (fail on high+) and secret scanning.

Preview deployment per PR; production deploys only from `main` after green CI with instant rollback. Concurrency group cancels superseded runs; minimal `permissions:`; secrets via environment protection. Production migrations run in a separate, manually approved job using `DIRECT_URL`, before the new code is promoted.
