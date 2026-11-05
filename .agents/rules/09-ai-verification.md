# 09 — AI Verification & Anti-Hallucination (MANDATORY)

Owns: how agents verify facts, the trap list, evidence rules, report format. **Evidence over memory:** any claim about this repo or a library ("this column exists", "this prop is available", "tests pass") needs an artefact opened or run in this session. No artefact, no claim.

## 1. Verify before you write

| About to use… | Verify by… |
| --- | --- |
| Package or import | `package.json` + lockfile; installed `.d.ts`/`package.json` in `node_modules`. Absent: `npm view <name> version` before proposing (`07`) |
| Library API (Next 16, React 19, Zod 4, Tailwind 4, Drizzle, Supabase) | installed type definitions; training memory is not evidence |
| Table or column | `lib/database/schema/*.schema.ts` **and** latest `drizzle/*.sql` |
| Env var | `lib/env/{public,server}.ts`, `.env.example` |
| Route, contract, action, event, schema, enum | open `lib/contracts/*`, `lib/validations/*`, `lib/constants/enums/*`, `app/**` |
| Component or prop | open the component file; never infer props from its name |
| Design token / Tailwind class | `app/globals.css` `@theme`; v4 names (`05`) |
| Script or config key | `package.json` scripts; installed `NextConfig` type |
| File path or helper | graph/glob; `AGENTS.md` registry |
| Icon name | exports of installed `lucide-react` |

If a check is impossible (tool missing, no network/access): say "unverified", state the assumption, and ask or choose the smallest change the compiler can check.

## 2. Known traps (training data is older than this stack)

Do **not** write: `middleware.ts` (use `proxy.ts`); sync `params`/`searchParams`/`cookies()`/`headers()`; `forwardRef`; `Context.Provider`; `useFormState` (use `useActionState`); `getServerSideProps`/Pages Router; `next lint`; `next/legacy/image`; single-arg `revalidateTag`; assuming `fetch` is cached by default; `getSession()` for authorization; `@supabase/auth-helpers-*`; cookie `get/set/remove` adapters; Zod 3 patterns (`z.string().email()`, `message:`/`required_error`, `.format()`, `.flatten()`, `z.string().url()`); `bg-gradient-to-r`, `bg-opacity-*`, `flex-shrink-*`, `tailwind.config.js`; `@types/sharp`; `import * as Icons`; `.withMetadata()` on uploads; `^`/`~` versions; generated Supabase `Database` types for rows (we use Drizzle).

## 3. Hallucinations must fail loudly

Invented column/table → `typecheck` (Drizzle types); request/response field → contract schemas, contract tests, drift `INTERNAL` log; form field name → form test (`name` = schema key); env var → `lib/env/*` boot failure + `.env.example` diff; event type → exhaustive `satisfies` map; prop/import/package → `typecheck`, `lint`, `knip`; skipped wrapper or layer violation → `check:boundaries`; missing RLS → `check:boundaries` + `test:rls`. Never bypass these.

## 4. Self-check before saying "done"

1. Re-open every changed file; confirm it matches your claim.
2. Run the DoD commands (`AGENTS.md` §5) and paste real summary lines. Never say a command passed unless you ran it.
3. Walk the wiring checklist (`08` §8) for each new flow.
4. Each new exported symbol has callers; each new schema has tests.
5. No secret, key or personal data in code, logs, tests, docs.
6. Re-read the request; list anything not done.

## 5. Report template (final message of every task)

```
Changed: <files and one-line purpose each>
Verified (evidence): <command → result>; <file:line opened for each claim>
Impact: <risk level and callers per 00, or "docs-only">
Not verified / assumptions: <list, or "none">
Left to do: <list, or "none">
Rule conflicts found: <list, or "none">
```

## 6. Stop and ask when

- The request conflicts with a rule (state rule and conflict), or two rule files disagree (apply the stricter, stop, propose the doc fix).
- Impact is HIGH/CRITICAL (`00`), or the change touches auth, RLS, payments, migrations or a shared contract.
- Requirements are ambiguous in a way that changes a schema, contract or table.
- A needed verification is impossible here.

## 7. Prohibited

- Claiming tests/builds/impact analysis ran when they did not.
- Fabricating versions, URLs, packages, API signatures or error messages.
- Summarising unopened files; `// ...rest unchanged` placeholders in delivered code.
- Fixing unrelated code, reformatting untouched files, editing rule files outside the task.
- Silent workarounds: swallowed errors, broad `try/catch`, `any`/assertions, disabled lint, loosened schemas.
- Copying a rule-file sample without type-checking it against installed versions.

## 8. Reviewer pass (every PR)

Open the diff only: is each report claim backed by a command or file? New endpoint/action: contract/schema, wrapper, auth, rate limit, strict input, parsed output, error mapping, tests for all outcome classes. New table: RLS, negative tests. New form: `name`s, `fieldErrors`, shared limits, idempotency key. New client flow: `callApi`/Server Component, all UI states, abort/timeout. Search the diff for §2 traps and the NEVER list.
