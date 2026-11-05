# 10 — Directory Architecture, Layers & Naming

Owns: folder layout, file naming, feature slices, route-group files, DI wiring. Layer direction and the import matrix are in `AGENTS.md` §3 and enforced by `scripts/check-boundaries.mjs`.

## 1. Layout

```
app/
  (auth)/ (marketing)/ (dashboard)/     each: layout.tsx loading.tsx error.tsx not-found.tsx
  api/                                  route.ts files only (handleRoute/handleWebhook)
    health/route.ts                     liveness: no DB, no auth
    ready/route.ts                      readiness: DB ping via health service
  layout.tsx  global-error.tsx  not-found.tsx  globals.css  sitemap.ts  robots.ts  manifest.ts
components/
  ui/            primitives (third-party/vendored: do not edit)
  forms/         FormField, FormError
  layouts/       Navbar, SiteFooter, LenisProvider
  feedback/      WidgetBoundary, ErrorState, EmptyState, Skeletons
features/<domain>/            auth chat booking contact careers admin-* ...
  components/  hooks/
  actions.ts     "use server": thin wrappers over runAction
  queries.ts     server-only reads: wrap services in React.cache
lib/
  env/ config/ constants/ utils/ types/ validations/ contracts/ http/ api/ hooks/ client-storage/
  errors.ts dbErrors.ts result.ts logger.ts cache-tags.ts errorCopy.ts motion.ts
  supabase/      client.ts (browser) server.ts admin.ts
  database/      index.ts transaction.ts relation.ts schema/
  repositories/  <aggregate>.repository.ts
  services/      <domain>.service.ts  <domain>.mapper.ts
  di/            container.ts tokens.ts
  server/        action.ts route.ts auth.ts rateLimit.ts requestContext.ts
drizzle/         generated SQL + meta; rollback/ holds hand-written rollback plans
supabase/tests/  pgTAP
scripts/         check-boundaries.mjs db-check.mjs
proxy.ts  instrumentation.ts  drizzle.config.ts
```

Every file under `lib/` must live in one of the folders above; an unclassified folder fails `check:boundaries`.

## 2. Rules

1. **Route groups** organise by access: `(marketing)` public, `(auth)` login/registration, `(dashboard)` authenticated and admin.
2. **Boundary files**: each route group and each dynamic data segment has `loading.tsx` and `error.tsx`; the root has `global-error.tsx` and `not-found.tsx` (`11b` §4).
3. **Co-location**: code used by one feature stays in `features/<domain>`. Promote to `components/` or `lib/` only when a second feature needs it.
4. **Imports**: `@/` alias only; `../../` is banned (exception: `lib/database/schema/**`, which imports sibling files and `lib/constants` relatively so `drizzle-kit` can load them ⚠ drop the exception if the installed drizzle-kit resolves `@/`).
5. **Depth**: at most 4 folders below `components/`, `features/`, `lib/`.
6. **One component per file.** Named exports; default exports only where Next requires them. No barrel files (exception: `lib/database/schema/index.schema.ts`, required by drizzle-kit).
7. **Third-party UI** (`components/ui`, Radix, Lucide, GSAP/Lenis internals) is consumed, never edited.
8. **Constants shared by schema, Zod and UI** (enum arrays, limits) live in dependency-free `lib/constants/<d>.constants.ts` so the Drizzle schema, Zod schemas and forms import one source.

## 3. File and symbol naming

| Entity | Convention | Example |
|---|---|---|
| React components | `PascalCase.tsx` | `ChatWidget.tsx` |
| Hooks | `useCamelCase.ts(x)` | `useBooking.ts` |
| Utilities | `camelCase.ts` | `formatDate.ts`, `formData.ts` |
| Services / mappers | `kebab-case.service.ts` / `.mapper.ts` | `booking.service.ts` |
| Repositories | `kebab-case.repository.ts` | `booking.repository.ts` |
| Zod schemas | `kebab-case.schema.ts` | `booking.schema.ts`, `primitives.schema.ts` |
| Contracts | `kebab-case.contract.ts` | `chat.contract.ts` |
| Constants files | `kebab-case.constants.ts` | `booking.constants.ts` |
| Config objects | `camelCaseConfig.ts` | `seoConfig.ts` |
| Drizzle schema files | `kebab-case.schema.ts` | `booking.schema.ts` |
| Constants | `UPPER_SNAKE_CASE` | `RATE_LIMIT_WINDOW_MS` |
| Zod schema symbols | `camelCase` + `Schema` | `bookingInputSchema` |
| Contracts, actions | `getXContract`, `createXAction` | `createBookingAction` |
| Postgres objects | `ts_web_` + `snake_case`, tables plural | `ts_web_consultation_bookings` |
| Indexes / constraints | `ts_web_<table>_<cols>_idx|_uq|_chk|_fk` | `ts_web_consultation_bookings_slot_uq` |

> **Shared database rule**: every table, index, enum type, constraint, trigger, function and policy for this site carries `ts_web_`. Nothing else may be created, altered or dropped.

## 4. Needle DI workflow

1. Define `lib/repositories/<a>.repository.ts` (pure functions or a class taking an executor) and `lib/services/<d>.service.ts`:
   ```ts
   import "server-only";
   import { inject } from "@needle-di/core";
   import { BookingRepository } from "@/lib/repositories/booking.repository";
   import { ENV_CONFIG_TOKEN } from "@/lib/di/tokens";

   export class BookingService {
     constructor(
       private readonly bookings = inject(BookingRepository),
       private readonly env = inject(ENV_CONFIG_TOKEN),
     ) {}
   }
   ```
2. Bind in `lib/di/container.ts` (`configureContainer()`); bind the database to a token (`DATABASE_TOKEN` → `getDrizzleDb()`), never import the `db` proxy inside services.
3. Resolve in actions/routes/queries: `getContainer().get(BookingService)`. Never `new BookingService()` outside tests.
4. Services are singletons: no per-request fields. Pass `userId`, `requestId`, `tx` as arguments.
5. Tests: `createTestContainer([...overrides])`; repositories are mocked by token, not by module patching.

## 5. New feature checklist

1. `lib/constants/<d>.constants.ts` (enums/limits) → `lib/validations/<d>.schema.ts` (+ tests).
2. `lib/database/schema/<d>.schema.ts` → export from `index.schema.ts` → `npm run db:generate` → review SQL, add grants/RLS block (`03c` §9).
3. `lib/repositories/<d>.repository.ts`, `lib/services/<d>.service.ts` (+ mapper), bind in container.
4. `features/<d>/actions.ts` (`runAction`) and/or `app/api/.../route.ts` + `lib/contracts/<d>.contract.ts`.
5. UI with the four states and a `WidgetBoundary` where the feature is optional (`11b` §4).
6. Tests for success, `VALIDATION`, `UNAUTHENTICATED`, `FORBIDDEN`, `CONFLICT`, `UNAVAILABLE` (`11b` §6).
7. `npm run check`, then the report in `09` §5.
