# 07 — Git, Tooling, Dependencies, Testing & CI

Owns: commits, scripts, dependencies, tests, CI. The `check` script below is the single definition of "green" referenced by `AGENTS.md`.

## Commits (commitlint + conventional commits)

Format: `type(scope): imperative summary`, header ≤ 72 chars, lowercase type, no trailing period.

- Types: `feat`, `fix`, `perf`, `refactor`, `docs`, `style`, `test`, `build`, `ci`, `chore`, `revert`.
- Scope = area: `auth`, `db`, `ui`, `api`, `contracts`, `deps`, `config`, `rules` (e.g. `fix(auth): reject expired callback codes`).
- Breaking change: `feat(api)!: …` plus a `BREAKING CHANGE:` footer explaining migration.
- Body explains **why**, wraps at 100 chars; reference issues (`Closes #123`).
- One logical change per commit; no "wip" or mixed refactor+feature commits. Never `--no-verify`.
- `commitlint.config.ts`: `export default { extends: ["@commitlint/config-conventional"] };`

## Branching & PRs

- Trunk-based: short-lived `type/short-description` branches off `main`; `main` is always deployable and protected (PR + passing CI + review, no force-push).
- PRs ≤ ~400 changed lines where possible. Description: what/why, screenshots for UI, impact note (`00`), migration notes, test evidence, risk/rollback.
- Squash-merge with a conventional-commit title.
- Schema migrations ship in the same PR as the code that needs them and stay backward-compatible with the previous deploy (expand → migrate → contract). Contract changes follow the same rule: add optional fields first, remove only after clients no longer send/read them (`08`).

## Husky hooks

- `.husky/pre-commit` → `npx lint-staged`
- `.husky/commit-msg` → `npx --no -- commitlint --edit "$1"`
- `.husky/pre-push` → `npm run typecheck`
- Hooks are fast and a convenience; **CI is the authority** and re-runs everything.

## lint-staged and formatting

```json
{
  "*.{ts,tsx,js,jsx,mjs}": ["oxlint --fix --deny-warnings", "prettier --write"],
  "*.{json,md,css,yml,yaml}": ["prettier --write"]
}
```

Formatter is **Prettier** with `prettier-plugin-tailwindcss` (the one formatter; never debated in review).

```
Never edit `check` to drop a step. Scripts only reference tools listed under "Required now".

## Dependency policy
- **Exact versions** (no `^`/`~`); one committed lockfile; `engines` (Node LTS) and `.nvmrc`; `npm ci` in CI.
- Before adding a package answer: can native/platform do it? Maintained (recent releases, >1 maintainer)? Bundle cost? License? Bundled types? Security record? If unsure, don't add it. Verify the exact package name on the registry first (`09`).
- Runtime deps → `dependencies`; tooling/types → `devDependencies`. `@types/*` only when the package has no bundled types (**not** `sharp`).
- Major upgrades: dedicated PR, read the migration guide, run full checks, never mixed with feature work.
- `npm audit --omit=dev` plus Dependabot/Renovate (grouped, weekly).
- No duplicates of an existing package (second animation lib, validator, icon set, class-merge util).

## Required now (install in the first tooling PR; not for rule readers to install ad hoc)
| Need | Package |
|---|---|
| Server-only guard | `server-only` |
| Unit/integration tests | `vitest`, `@testing-library/react`, `jsdom` |
| E2E tests | `@playwright/test` |
| Formatting | `prettier`, `prettier-plugin-tailwindcss` |
| Unused exports/files | `knip` |
| Error tracking | `@sentry/nextjs` (before production launch) |
| Bundle inspection | `@next/bundle-analyzer` |
| Rate limiting | `@upstash/ratelimit` (or equivalent) |

## Testing policy
- Pyramid: many **unit** tests (utils, Zod schemas, services, mappers), some **integration** tests (Server Actions/route handlers against local Supabase via `supabase start`), few **E2E** (login, core money/critical flows).
- Every bug fix ships with a regression test. Every non-trivial Zod schema has valid/invalid/boundary tests (`04`).
- **Contract tests** (`08`) run for every contract: path params ↔ schema keys, response schema not `any`/`unknown`, fixture round-trip through `envelopeSchema`, method/body consistency. Each route/action gets one integration test per outcome class: success, `VALIDATION`, `UNAUTHENTICATED`, `FORBIDDEN`.
- Form tests assert input `name` values equal schema keys and that server `fieldErrors` render next to the right inputs.
- **RLS tests are mandatory** per table (pgTAP): allowed and denied cases (`03`).
- Type tests (`expectTypeOf`) for `Result`, contracts, and DTO mappers (`01`).
- Deterministic: no real network/time/randomness (mock clock, fixtures). No snapshot tests of large DOM trees. Query by role/label.
- Coverage ≥ 80% on `lib/` and `server/`; a floor, not a goal.

## CI pipeline (GitHub Actions or equivalent), all required for merge
1. Install (frozen lockfile) with cache → 2. `typecheck` → 3. `lint` → 4. `format:check` → 5. `check:boundaries` → 6. `check:unused` → 7. `test` → 8. `next build`
9. `db:types:check` (against a shadow/local DB after migrations) and `test:rls`
10. E2E against the preview deployment (critical paths) and Lighthouse CI against the budgets in `06`
11. `npm audit --omit=dev` (fail on high+) and secret scanning (gitleaks/push protection)
12. `supabase db lint` / migration dry-run on a shadow DB
- Preview deployment per PR; production deploy only from `main` after green CI; instant rollback path.
- Concurrency group cancels superseded runs. Minimal `permissions:`; secrets via environment protection rules.

## Environments & config
- Separate Supabase projects for `dev`, `staging`, `prod`; never point local dev at prod data.
- `.env.example` stays in sync with `lib/env/public.ts` and `lib/env/server.ts` in the same PR as any new variable; CI diffs the variable names.
- Feature flags for risky releases; remove flags after rollout.

```
