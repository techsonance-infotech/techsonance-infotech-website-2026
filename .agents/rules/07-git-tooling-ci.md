# 07 — Git, Tooling, Dependencies, Testing & CI

Owns: commits, scripts, dependencies, tests, CI. The `check` script below is the single definition of "green" referenced by `AGENTS.md`.

## 1. Commits (commitlint + conventional commits)

Format `type(scope): imperative summary`, header ≤ 72 chars, lowercase type, no trailing period.

- Types: `feat fix perf refactor docs style test build ci chore revert`.
- Scopes: `auth db repo services di ui api contracts deps config rules resilience`.
- Breaking: `feat(api)!: …` plus a `BREAKING CHANGE:` footer with migration steps.
- Body explains why, wraps at 100 chars; reference issues (`Closes #123`). One logical change per commit. Never `--no-verify`.
- `commitlint.config.ts`: `export default { extends: ["@commitlint/config-conventional"] };`

## 2. Branching and PRs

- Trunk-based: short-lived `type/short-description` branches off `main`; `main` protected (PR + green CI + review, no force-push).
- PRs ≤ ~400 changed lines. Description: what/why, screenshots for UI, impact note (`00`), migration and rollback notes, test evidence.
- Squash-merge with a conventional title.
- Schema migrations ship in the same PR as the code that needs them and stay backward-compatible with the previous deploy (`03c` §9).

## 3. Husky and Windows

- `.husky/pre-commit` → `npx lint-staged`; `.husky/commit-msg` → `npx --no -- commitlint --edit "$1"`; `.husky/pre-push` → `npm run typecheck`.
- Hooks are a convenience; **CI is the authority**.
- Windows: commit `.gitattributes` with `* text=auto eol=lf` so hook scripts never get CRLF. All repo scripts are Node (`scripts/*.mjs`), not bash.

## 4. lint-staged and formatting

```json
{
  "*.{ts,tsx,js,jsx,mjs}": ["oxlint --fix --deny-warnings", "prettier --write"],
  "*.{json,md,css,yml,yaml}": ["prettier --write"]
}
```

Prettier with `prettier-plugin-tailwindcss` is the only formatter.

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

Never edit `check` to drop a step. There is deliberately no `db:push` and no `db:pull` script (`03` §2).

## 6. Dependency policy

- Exact versions (no `^`/`~`); one committed lockfile; `engines` (Node LTS) and `.nvmrc`; `npm ci` in CI. ⚠ the dev machine reports Node 26.x: pin the LTS that CI and the host use.
- Before adding a package: native alternative? maintained? bundle cost? license? bundled types? security record? Verify the exact name on the registry (`09`).
- Runtime deps in `dependencies`, tooling/types in `devDependencies`. No `@types/sharp`.
- Major upgrades in a dedicated PR with the migration guide read and full checks run.
- `npm audit --omit=dev` plus Dependabot/Renovate (grouped, weekly). No duplicate libraries (second animation lib, validator, icon set). ⚠ the project references both framer-motion (`05`) and GSAP/Lenis (`10`): confirm in `package.json` which are installed and list them in the registry; do not add a third.

**Required now:** `server-only`, `drizzle-orm`, `drizzle-kit`, `postgres`, `@needle-di/core`, `zod`, `vitest`, `@testing-library/react`, `jsdom`, `@playwright/test`, `prettier`, `prettier-plugin-tailwindcss`, `knip`, `@sentry/nextjs` (before launch), `@next/bundle-analyzer`, `@upstash/ratelimit`, `supabase` CLI (dev).

## 7. Testing policy

- Pyramid: many unit tests (utils, Zod schemas, mappers, services with a test container), some integration tests (actions/routes against a local Postgres with migrations applied), few E2E (booking, contact, login, admin critical paths).
- Every bug fix ships with a regression test; every non-trivial schema has valid/invalid/boundary tests (`04`).
- **Failure-path tests are mandatory** (`11b` §6).
- Contract tests (`08`) for every contract. Form tests assert input `name` equals schema key and that `fieldErrors` render next to the right inputs.
- **Database tests**: repositories run against a real local Postgres (`supabase start`, migrations applied through `drizzle-kit migrate`); cover uniqueness, `version` conflicts, empty-array guards, keyset pagination ordering, and that no query touches non-`ts_web_` tables. pgTAP (`test:rls`) proves anon/authenticated are denied on every `ts_web_*` table.
- Type tests (`expectTypeOf`) for `Result`, contracts, mappers.
- Deterministic: no real network, time or randomness. No large DOM snapshots. Query by role/label.
- Coverage ≥ 80% on `lib/` (a floor, not a goal). `server-only` is aliased to an empty module in the Vitest config.

## 8. CI (all required for merge)

1. Install (`npm ci`, cached) → 2. `typecheck` → 3. `lint` → 4. `format:check` → 5. `check:boundaries` → 6. `check:unused` → 7. `test` → 8. `next build`
9. Start local Supabase, run `drizzle-kit migrate` against it, `drizzle-kit check`, then `drizzle-kit generate` and fail if `git status --porcelain drizzle` is non-empty (schema/migration drift); run `test:rls`.
10. E2E on the preview deployment and Lighthouse CI against the budgets in `06`.
11. `npm audit --omit=dev` (fail on high+) and secret scanning.
- Preview deployment per PR; production deploys only from `main` after green CI, with an instant rollback path. Concurrency group cancels superseded runs; minimal `permissions:`; secrets via environment protection.
- Production migrations are applied by a separate, manually approved job using `DIRECT_URL`, before the new code is promoted.

## 9. Environments

- Separate Supabase projects for dev, staging, prod; never point local dev at prod data. Runtime and migration credentials differ (`03` §2).
- `.env.example` stays in sync with `lib/env/*` in the same PR; CI diffs variable names.
- Feature flags for risky releases; remove after rollout.
