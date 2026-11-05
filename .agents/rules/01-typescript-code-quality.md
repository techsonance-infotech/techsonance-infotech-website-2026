# 01 — TypeScript, Enums, Constants & Code Quality

Owns: tsconfig, typing, closed sets (enums), constants, symbol naming, function design, lint. File/folder naming is in `10`; `Result`/`AppError` in `04`; contracts in `08`; layers in `AGENTS.md`.

## 1. tsconfig (required flags)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowUnreachableCode": false,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "paths": { "@/*": ["./*"] }
  }
}
```

Keep Next-generated defaults (`module`, `moduleResolution: "bundler"`, `jsx`, `incremental`, `plugins`). Never loosen a flag; fix the code. With `exactOptionalPropertyTypes`, build optional props conditionally (`...(x ? { key: x } : {})`), never assign `undefined`.

## 2. Typing rules

- **No `any`. No casual `unknown`.** `unknown` is allowed only where external data enters (request, form, event, JSON, third-party/AI output, `catch (e)`) and must be parsed (Zod `safeParse`) or narrowed immediately. Prefer generic constraints over casts.
- **No assertions**: `as` only for `as const`. No `!`, `as unknown as X`, `@ts-ignore`/`@ts-nocheck`; `@ts-expect-error` only with reason + issue link.
- **Explicit return types** on every exported function, hook, component, action and route handler. Internal helpers may infer.
- **Zero assumptions**: a field that can be missing is typed `T | undefined` (or `null` when the source says so) and handled with a fallback at the use site (`?.`, `??`). Handle `arr[0]` as `T | undefined`.
- **One source per shape**, never a hand-written duplicate: validated data → `z.input` (wire/form) / `z.output` (parsed); DB rows → Drizzle `$inferSelect`/`$inferInsert`; API shapes → contracts (`08`).
- **Mappers** convert rows to DTOs: `toPostDto(row: PostRow): z.input<typeof postSchema>`. A column rename then fails `typecheck`, not production.
- **Discriminated unions** with a literal tag (`ok`, `type`, `status`), not boolean flags; switches end with `default: return assertNever(x)` (`lib/utils/assert.ts`).
- **Branded ids** across modules: `export const postIdSchema = z.uuid().brand<"PostId">()`. Brand only after validation.
- **Time/money**: wire time is ISO-8601 (`z.iso.datetime()`), `Date` only in server code after parsing. Money is integer minor units + currency code, never floats; prices are derived on the server.
- **JSON columns**: parse with Zod on read; never narrow with `as`.
- `type` for unions/props/derived; `interface` only for declaration merging. Literal maps: `as const` + `satisfies`; exhaustive records `Record<Union, X>`.
- Expected failures return `Result<T>` or throw `AppError` (`04`); never `null`/`undefined` to mean "error".
- `import type` for type-only imports.
- **Type tests**: `expectTypeOf` for `Result`, contracts, mappers, critical helpers.

## 3. Closed sets (enums) and constants

**Closed sets.** Any value from a finite set (status, role, type, sort key, filter) is defined once and never typed as `string`:

```ts
// lib/constants/enums/job-status.enum.ts  (dependency-free)
export const JobStatus = { Open: "open", Closed: "closed", Draft: "draft" } as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];
export const JOB_STATUS_VALUES = Object.values(JobStatus) as [JobStatus, ...JobStatus[]];
```

- The `as const` object is the project's enum (we do not use the TS `enum` keyword: the same values must feed `z.enum`, UI options and DB `check` constraints, and `as const` objects do that without runtime enum quirks). One enum per file; Zod schemas in `lib/validations/enums.schema.ts` use `z.enum(JOB_STATUS_VALUES)`.
- ❌ `fetchJobs(status?: string)` → ✅ `fetchJobs(status?: JobStatus)`. Compare with `JobStatus.Open`, never `"open"`.
- **DB safety**: incoming option values are parsed against the enum schema before reaching a service or repository; repositories accept only the enum type; DB columns are `text` + `check` built from `*_VALUES` (`03` §5).

**Constants.** No magic strings/numbers: messages, user-facing copy, paths/routes, header names, limits, storage keys, query keys, cache tags and numeric thresholds are named exports in `lib/constants/<d>.constants.ts` (copy: `lib/errorCopy.ts`; cache tags: `lib/cache-tags.ts`). Files are dependency-free so schema, Zod and UI import one source. Limits shared by schema and UI (`POST_TITLE_MAX`) are exported once. A literal used once as a React `key`, CSS value or test fixture is fine.

## 4. Symbol naming (file/folder naming: `10`)

| Thing | Convention | Example |
| --- | --- | --- |
| Components, types, enum objects | `PascalCase` | `UserCard`, `JobStatus` |
| Functions, variables | `camelCase` | `getUserById` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_UPLOAD_BYTES` |
| Booleans | `is/has/can/should` | `isLoading` |
| Zod schemas | `camelCase` + `Schema` | `signUpSchema` |
| Schema types | `<Name>Input` / `Data` / `Dto` / `ViewModel` | `SignUpInput` |
| Contracts | verb + noun + `Contract` | `getPostContract` |
| Server Actions | verb-first + `Action` | `createPostAction` |
| Events | dotted `domain.verb`, schema `<name>EventSchema` | `post.created` |
| Hooks | `use` prefix | `useDebouncedValue` |

## 5. Function and module design

- One job per function: ≤ 40 lines, ≤ 3 params (options object beyond), nesting ≤ 3, early returns.
- **Files ≤ 250 lines.** Extract logic into services or pure helpers in `lib/utils`; side effects live in `lib/server` or hooks. DRY: reuse before writing a new helper.
- No circular imports. Server-only modules start with `import "server-only";`.
- Comments explain **why**, not what. Shared utilities get a one-line JSDoc. `TODO(#123)` only with an issue number. No commented-out code.

## 6. Errors and async

- **Fail fast**: validate and throw a typed `AppError` as early as possible; no silent failure. Never throw strings.
- No empty `catch {}`: log with context or rethrow. `catch (e)` → `e` is `unknown`, narrow with `instanceof`. Rethrow Next control flow (`redirect`, `notFound`) with `unstable_rethrow` (`02`).
- Always `await` or `void` a promise. Independent work in `Promise.all`; no sequential awaits over network calls in loops.
- Every third-party `fetch` has `AbortSignal.timeout(...)`.

## 7. Imports and lint

Import order: `node:` → external → `@/` → relative → type-only last per group; CSS last.

oxlint (`--deny-warnings` in CI): `correctness` error, `suspicious`, `typescript`, `react`, `react-hooks`, `nextjs`, `jsx-a11y`, `import`, `promise`, `unicorn` (selective). Keep on: `no-console`, `no-debugger`, `eqeqeq`, `no-explicit-any`, `no-non-null-assertion`, `ban-ts-comment`, `consistent-type-imports`, `no-floating-promises`, `exhaustive-deps`, `rules-of-hooks`, `no-array-index-key`. `no-restricted-imports` per folder: client folders may not import `@/lib/server/*`, `@/lib/env/server`, `@/lib/supabase/{admin,server}`. `check:boundaries` is the backstop.
