# 10 — Directory Architecture, Naming & DI

Owns: folder layout, file naming, feature slices, DI wiring. Layer direction and the import matrix are in `AGENTS.md` §4. Symbol naming: `01` §4. New-feature steps: `08` §8.

## 1. Layout

```
app/
  (auth)/ (marketing)/ (dashboard)/     each: layout.tsx loading.tsx error.tsx not-found.tsx
  api/                                  route.ts files only (handleRoute/handleWebhook)
    health/route.ts                     liveness: no DB, no auth
    ready/route.ts                      readiness: DB ping via health service
  layout.tsx global-error.tsx not-found.tsx globals.css sitemap.ts robots.ts manifest.ts
components/
  ui/ (vendored, do not edit)  forms/  layouts/  feedback/ (WidgetBoundary, ErrorState, EmptyState, Skeletons)
features/<domain>/
  components/ hooks/
  actions.ts        "use server": thin wrappers over runAction
  queries.ts        server-only reads: services wrapped in React.cache
  view-models.ts    ResponseDto → ViewModel mappers
lib/
  env/ config/ constants/ (enums/) utils/ types/ validations/ contracts/ http/ api/ hooks/ client-storage/
  errors.ts dbErrors.ts result.ts logger.ts cache-tags.ts errorCopy.ts motion.ts
  supabase/      client.ts server.ts admin.ts
  database/      index.ts transaction.ts relation.ts schema/
  repositories/  <aggregate>.repository.ts
  services/      <domain>.service.ts  <domain>.mapper.ts
  di/            container.ts tokens.ts
  server/        action.ts route.ts auth.ts rateLimit.ts requestContext.ts
drizzle/         generated SQL + meta; rollback/ = hand-written rollback plans
supabase/tests/  pgTAP
scripts/         check-boundaries.mjs db-check.mjs
proxy.ts  instrumentation.ts  drizzle.config.ts
```

Every folder under `lib/` must be listed above; an unclassified folder fails `check:boundaries`.

## 2. Rules

1. **Route groups** by access: `(marketing)` public, `(auth)` login/registration, `(dashboard)` authenticated + admin.
2. **Boundary files**: each route group and dynamic data segment has `loading.tsx` + `error.tsx`; root has `global-error.tsx` + `not-found.tsx` (`05` §4).
3. **Co-location**: code used by one feature stays in `features/<d>`; promote to `components/` or `lib/` only when a second feature needs it.
4. **Imports**: `@/` alias only; `../../` banned (exception: `lib/database/schema/**` imports siblings and `lib/constants` relatively so `drizzle-kit` can load them; ⚠ drop it if the installed drizzle-kit resolves `@/`).
5. **Depth** ≤ 4 folders below `components/`, `features/`, `lib/`. File size ≤ 250 lines (`01` §5).
6. **One component per file**, named exports; default exports only where Next requires them (`page`, `layout`, `loading`, `error`, `global-error`, `not-found`); `route.ts` exports named HTTP methods. No barrel files (exception: `lib/database/schema/index.schema.ts`).
7. **Third-party UI** (`components/ui`, Radix, Lucide, GSAP/Lenis internals) is consumed, never edited.
8. **Shared constants/enums** (enum values, limits) live in dependency-free `lib/constants/**` so Drizzle schema, Zod and UI import one source (`01` §3).

## 3. File naming (this file owns it)

| Entity                            | Convention                                                | Example                                |
| --------------------------------- | --------------------------------------------------------- | -------------------------------------- |
| React components                  | `PascalCase.tsx`                                          | `ChatWidget.tsx`                       |
| Hooks                             | `useCamelCase.ts(x)`                                      | `useBooking.ts`                        |
| Utilities, API helpers            | `camelCase.ts`                                            | `formatDate.ts`, `callApi.ts`          |
| Services / mappers / repositories | `kebab-case.service.ts` / `.mapper.ts` / `.repository.ts` | `booking.service.ts`                   |
| Zod schemas                       | `kebab-case.schema.ts`                                    | `booking.schema.ts`                    |
| Contracts                         | `kebab-case.contract.ts`                                  | `chat.contract.ts`                     |
| Constants                         | `kebab-case.constants.ts`                                 | `booking.constants.ts`                 |
| Enums (one per file)              | `kebab-case.enum.ts`                                      | `job-status.enum.ts`                   |
| Config objects                    | `camelCaseConfig.ts`                                      | `seoConfig.ts`                         |
| Drizzle schema files              | `kebab-case.schema.ts`                                    | `booking.schema.ts`                    |
| Postgres objects                  | `ts_web_` + `snake_case`, tables plural                   | `ts_web_consultation_bookings`         |
| Indexes / constraints             | `ts_web_<table>_<cols>_idx\|_uq\|_chk\|_fk`               | `ts_web_consultation_bookings_slot_uq` |

> **Shared database rule**: every table, index, enum type, constraint, trigger, function and policy for this site carries `ts_web_`. Nothing else may be created, altered or dropped.

## 4. Needle DI workflow

1. Write `lib/repositories/<a>.repository.ts` and `lib/services/<d>.service.ts`:
   ```ts
   import "server-only";
   //imports
   export class BookingService {
     constructor(
       private readonly bookings = inject(BookingRepository),
       private readonly env = inject(ENV_CONFIG_TOKEN),
     ) {}
   }
   ```
2. Bind in `lib/di/container.ts` (`configureContainer()`); bind the database to `DATABASE_TOKEN` → `getDrizzleDb()`; never import the `db` proxy in services.
3. Resolve in actions/routes/queries with `getContainer().get(BookingService)`. Never `new BookingService()` outside tests.
4. Services are singletons: no per-request fields; pass `userId`, `requestId`, `tx` as arguments.
5. Tests: `createTestContainer([...overrides])`; mock repositories by token, not module patching.
