# 03 — Database Access, Isolation & Schema (Drizzle on Supabase)

Owns: access model, shared-DB isolation, pooler constraints, client, schema conventions (§1–5). Query rules, transactions and SQLSTATE mapping are in `03b` (§6–8); migrations, RLS, auth, env and web security in `03c` (§9–13). Section numbers are kept across the three files. Failure policy: `11`.

## 1. Access model

| Concern | Tool | Location |
|---|---|---|
| Login, session, JWT | Supabase Auth via `@supabase/ssr` | `lib/supabase/*`, `lib/server/auth.ts` |
| Table reads/writes | Drizzle + postgres.js | `lib/database`, called only from `lib/repositories` |
| Storage, Realtime | supabase-js | `lib/supabase/*` |

## 2. Shared-database isolation (CRITICAL)

The project is shared with HRMS, ERP and CMS.

- Everything this site creates is named `ts_web_*`: tables, indexes, constraints, enum types, triggers, functions, policies.
- `drizzle.config.ts` sets `tablesFilter: ["ts_web_*"]` and its own migrations journal `ts_web_drizzle_migrations`, so drizzle-kit never diffs or drops foreign tables and never collides with another app's journal. ⚠ confirm both keys against the installed `drizzle-kit` types.
- Allowed commands: `drizzle-kit generate`, `migrate`, `check`. **Forbidden on this database: `push`, `pull`, `drop`.**
- **Dedicated runtime role (recommended hardening).** Runtime connects as `ts_web_app`, not `postgres`:
  ```sql
  create user ts_web_app with password '<strong>' bypassrls;
  grant usage on schema public to ts_web_app;
  alter role ts_web_app set statement_timeout = '10s';
  alter role ts_web_app set lock_timeout = '5s';
  alter role ts_web_app set idle_in_transaction_session_timeout = '15s';
  ```
  Grant per table inside each migration (`grant select, insert, update, delete on ts_web_x to ts_web_app;`). Never use `alter default privileges`: it would also grant other apps' future tables. Result: even a coding mistake cannot read an HRMS table. Verify timeouts through the pooler with `show statement_timeout`. Until the role exists, every statement still must touch only `ts_web_*`.

| Var | Role | Endpoint | Used by |
|---|---|---|---|
| `DATABASE_URL` | `ts_web_app` (`postgres` until created) | transaction pooler `:6543` | runtime |
| `DIRECT_URL` | migration owner (`postgres`) | session pooler `:5432` (IPv4) or `db.<ref>.supabase.co:5432` | drizzle-kit only |

Username through Supavisor is `<role>.<project-ref>`. URL-encode special characters in passwords.

## 3. Transaction-pooler constraints

`prepare: false` is mandatory. In transaction mode never rely on session state: no `SET` (use `SET LOCAL` inside a transaction), no `LISTEN/NOTIFY`, no session advisory locks (use `pg_advisory_xact_lock`), no temp tables, no cursors across statements. Pool size is per instance: default 10, 3 on serverless (`lib/database/index.ts`).

## 4. Client rules (`lib/database/index.ts`)

- Lazy singleton on `globalThis` (HMR-safe); nothing connects at import time, including during `next build`.
- `ssl: "require"` for every non-local host; `connect_timeout`, `idle_timeout`, `max_lifetime` set.
- Production without `DATABASE_URL` throws at first use; it never falls back to localhost.
- `getDrizzleDb(url)` with a custom URL returns an independent client; the caller closes it with `db.$client.end()`.
- Services never import the `db` proxy; they receive an executor from DI or `withTransaction`.
- Liveness (`/api/health`) never touches the DB; readiness (`/api/ready`) calls `checkDatabaseConnection()` through a health service.

## 5. Schema conventions

```ts
// lib/database/schema/columns.ts  (imports only drizzle-orm)
import { pgTableCreator, timestamp, uuid } from "drizzle-orm/pg-core";
export const tsWebTable = pgTableCreator((name) => `ts_web_${name}`);
export const idColumn = () => uuid("id").primaryKey().defaultRandom();
export const createdAtColumn = () =>
  timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow();
export const updatedAtColumn = () =>
  timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date());
```

```ts
// lib/database/schema/booking.schema.ts
import { sql } from "drizzle-orm";
import { check, index, integer, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { BOOKING_STATUSES } from "../../constants/booking.constants";
import { createdAtColumn, idColumn, tsWebTable, updatedAtColumn } from "./columns";

export const bookings = tsWebTable(
  "consultation_bookings",
  {
    id: idColumn(),
    email: text("email").notNull(),
    slotStart: timestamp("slot_start", { withTimezone: true, mode: "date" }).notNull(),
    status: text("status").notNull().default("pending"),
    version: integer("version").notNull().default(1), // optimistic concurrency
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (t) => [
    uniqueIndex("ts_web_consultation_bookings_slot_uq").on(t.slotStart).where(sql`${t.status} <> 'cancelled'`),
    index("ts_web_consultation_bookings_email_idx").on(t.email),
    check("ts_web_consultation_bookings_status_chk", sql.raw(`status in (${BOOKING_STATUSES.map((s) => `'${s}'`).join(",")})`)),
  ],
);
export type BookingRow = typeof bookings.$inferSelect;
export type NewBookingRow = typeof bookings.$inferInsert;
```

- Every table: `id uuid`, `created_at`/`updated_at timestamptz`, `not null` by default, FKs with explicit `onDelete`, check constraints mirroring Zod bounds (`text` length checks = schema `.max`), indexes on FKs and every filter/sort column.
- Money = integer minor units + currency; time = `timestamptz` (UTC); enums = `text` + check constraint built from the shared `as const` array (cheaper to evolve than `pgEnum`).
- Mutable admin-edited rows carry `version`; updates use `where id = $1 and version = $2` and bump it (`03b` §6).
- Soft delete (`deleted_at`) only where recovery is required; every read filters it in the repository, never in callers.
- Table types are exported from the schema file (`BookingRow`, `NewBookingRow`). Never hand-write a duplicate row type.
- Do not auto-derive API schemas from tables; hand-write Zod and map with `toXDto(row)`.
