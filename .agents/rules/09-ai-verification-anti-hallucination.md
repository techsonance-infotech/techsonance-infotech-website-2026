# 09 — AI Verification & Anti-Hallucination Protocol (MANDATORY)

Owns: how agents verify facts, the trap list, evidence rules, and the report format. Applies to every AI agent, every task, before and after writing code.
**Core rule: evidence over memory.** Any statement about this repo or a library ("this column exists", "this prop is available", "tests pass") must be backed by an artefact you opened or ran in this session. No artefact, no claim.

## 1. Verify before you write

| You are about to use…                                                                                                                                                           | Verify by…                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A package or import                                                                                                                                                             | `package.json` + lockfile; open the installed `.d.ts`/`package.json` in `node_modules`. If absent: `npm view <name> version` before proposing it (`07`). |
| A library API (Next 16, React 19, Zod 4, Tailwind 4, Supabase)                                                                                                                  | Installed type definitions. Training memory is not evidence.                                                                                             |
| A table or column                                                                                                                                                               | `src/types/database.types.ts` **and** the latest `supabase/migrations/*.sql`.                                                                            |
| An env var                                                                                                                                                                      | `lib/env/public.ts`, `lib/env/server.ts`, `.env.example`.                                                                                                |
| A route, contract, action, event, or schema                                                                                                                                     | `lib/contracts/*`, `lib/validations/*`, `app/**`: open them.                                                                                             |
| A component or prop                                                                                                                                                             | Open the component file; never infer props from its name.                                                                                                |
| A design token or Tailwind class                                                                                                                                                | `app/globals.css` `@theme`; v4 class names (`05`).                                                                                                       |
| A script or config key                                                                                                                                                          | `package.json` scripts; installed `NextConfig` type for `next.config.ts` keys.                                                                           |
| A file path or helper name                                                                                                                                                      | Glob/graph; `AGENTS.md` Canonical registry.                                                                                                              |
| An icon name                                                                                                                                                                    | Exported names in the installed `lucide-react`.                                                                                                          |
| If the check cannot be done (tool missing, no network, no access): say "unverified", state what you assumed, and ask or choose the smallest change that the compiler can check. |

## 2. Known traps (training data is older than this stack)

Do **not** write: `middleware.ts` (use `proxy.ts`); synchronous `params`/`searchParams`/`cookies()`/`headers()`; `forwardRef`; `Context.Provider`; `useFormState` (use `useActionState`); `getServerSideProps`/Pages Router; `next lint`; `next/legacy/image`; single-argument `revalidateTag`; assuming `fetch` is cached by default; `getSession()` for authorisation; `@supabase/auth-helpers-*`; cookie `get/set/remove` adapters; Zod 3 patterns (`z.string().email()`, `message:`/`required_error`, `.format()`, `.flatten()`, `z.string().url()`); `bg-gradient-to-r`, `bg-opacity-*`, `flex-shrink-*`, `tailwind.config.js`; `@types/sharp`; `import * as Icons`; `.withMetadata()` on uploads; `^`/`~` versions.

## 3. Make hallucinations fail loudly

Every invented thing must hit a failing command. Rely on these, do not bypass them:

| If the AI invents…                                                                                                                | It is caught by…                                                              |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| A column or table                                                                                                                 | Generated `Database` types → `typecheck`; `db:types:check`                    |
| A request/response field                                                                                                          | Contract schemas → `typecheck`, contract tests, response-drift `INTERNAL` log |
| A form field name                                                                                                                 | Form test: input `name` = schema key                                          |
| An env var                                                                                                                        | `lib/env/*` schema → boot failure; `.env.example` diff                        |
| A new event type                                                                                                                  | Exhaustive handler map `satisfies` → `typecheck`                              |
| A component prop, import path, or package                                                                                         | `typecheck`, `lint`, `knip`                                                   |
| A skipped wrapper (`runAction`/`handleRoute`) or layer violation                                                                  | `check:boundaries`                                                            |
| A missing RLS policy                                                                                                              | `create table` check + `test:rls`                                             |
| Never weaken a type, schema, or test to make a check pass (NEVER list). If a check seems wrong, report it and propose a rule fix. |

## 4. Self-check before saying "done"

1. Re-open every file you changed; confirm it matches your claim.
2. Run the Definition of Done commands (`AGENTS.md`); paste the real summary lines. Never state that a command passed unless you ran it.
3. Walk the boundary matrix and Feature Wiring Checklist (`08`) for each new data flow; every row must be either done or explicitly "not applicable (why)".
4. Check each new exported symbol has callers (no dead code) and each new schema has tests.
5. Confirm no secret, key, or personal data entered code, logs, tests, or docs.
6. Re-read the original request and list anything not done.

## 5. Report template (final message of every task)

```
Changed: <files and one-line purpose each>
Verified (evidence): <command → result>; <file:line opened for each claim>
Impact: <risk level and callers per 00, or "docs-only">
Not verified / assumptions: <explicit list, or "none">
Left to do: <explicit list, or "none">
Rule conflicts found: <list, or "none">
```

## 6. Prohibited behaviours

- Claiming tests, builds, or impact analysis ran when they did not.
- Fabricating versions, URLs, package names, API signatures, or error messages.
- Summarising files you did not open; using `// ...rest unchanged` placeholders in delivered code.
- Fixing unrelated code, reformatting untouched files, or editing rule files outside the task.
- Silent workarounds: catching and ignoring errors, broad `try/catch`, `any`/assertions, disabling lint, loosening schemas.
- Copying a sample from the rules without type-checking it against the installed versions.

## 7. When to stop and ask

- The request conflicts with a rule (state the rule and the conflict).
- Impact analysis is HIGH/CRITICAL (`00`), or the change touches auth, RLS, payments, migrations, or a shared contract.
- Requirements are ambiguous in a way that changes a schema, contract, or table.
- Two rule files disagree: apply the stricter rule, stop, and propose the doc fix (`AGENTS.md` Precedence).
- A needed verification is impossible in the current environment.

## 8. Reviewer pass (second agent or human; run on every PR)

- Open the diff only: is each claim in the report backed by a command or file?
- For each new endpoint/action: contract or schema, wrapper, auth, rate limit, strict inbound parsing, parsed output, error mapping, tests for all outcome classes.
- For each new table: RLS, per-operation policies, negative tests, types regenerated.
- For each form: `name`s, `fieldErrors` wiring, limits from shared constants, idempotency key on create.
- For each client data flow: `callApi` or a Server Component, loading/empty/error states, abort/timeout.
- Search the diff for the Section 2 trap list and the NEVER list.
