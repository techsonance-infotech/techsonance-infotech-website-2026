# 03b — Query Rules, Transactions & SQLSTATE Mapping

Continues `03` (§6–8). Owns: Drizzle query rules and footguns, `withTransaction`, `mapDbError`.

## 6. Query rules and Drizzle footguns

1. **`update`/`delete` always have a non-optional `where`.** `.where(undefined)` (from a conditional builder) matches every row. Repository functions take the identifying value as a required parameter and build the predicate unconditionally.
2. **Empty arrays**: guard `inArray(col, ids)` (`if (ids.length === 0) return []`).
3. **Select needed columns** (`db.select({ id: t.id, … })`); relational `with` queries specify `columns`. No unbounded `select()` on user-facing paths.
4. **Paginate** every list: keyset on `(created_at, id)` with a tie-breaker, `limit ≤ 100` (`+1` row to compute `nextCursor`). Avoid exact `count(*)` on large tables.
5. **Bulk inserts** chunk to `floor(60000 / columnCount)` rows (postgres.js `MAX_PARAMETERS_EXCEEDED` at 65 534 parameters).
6. **Search**: escape `%`, `_`, `\` in `ilike` input; index with trigram only when needed.
7. **Absence**: `.limit(1)` and check `rows[0]`; throw `AppError("NOT_FOUND")` in the service. Validate ids with `idSchema` first so a malformed uuid never reaches Postgres (`22P02`).
8. **Idempotent creates**: rely on a unique constraint (`on conflict do nothing` + `returning`, or catch `23505`) instead of check-then-insert.
9. **Lost updates**: guard admin edits with `version` and return `CONFLICT` when 0 rows update.
10. **Numerics**: `numeric`/`bigint` arrive as strings; convert in the mapper. No floating point money.
11. **No raw SQL with interpolated user input**; `sql` template parameters only.
12. **No network calls, email or `redirect()` inside a transaction** (long locks, and retries would repeat them).

## 7. Transactions (`lib/database/transaction.ts`)

```ts
import "server-only";
import { AppError } from "@/lib/errors";
import { dbErrorInfo, mapDbError } from "@/lib/dbErrors";
import { getDrizzleDb, type Database, type DbTransaction } from "./index";

export type { Database, DbTransaction };

const RETRYABLE = new Set(["40001", "40P01"]); // serialization failure, deadlock
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Runs `fn` atomically; retries serialization failures and deadlocks with jitter. `fn` must be safe to re-run. */
export async function withTransaction<T>(
  fn: (tx: DbTransaction) => Promise<T>,
  opts: { retries?: number; database?: Database } = {},
): Promise<T> {
  const retries = opts.retries ?? 2;
  const database = opts.database ?? getDrizzleDb();
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await database.transaction(fn);
    } catch (e) {
      const info = dbErrorInfo(e);
      const retryable = info !== undefined && RETRYABLE.has(info.code);
      if (!retryable || attempt >= retries) throw e instanceof AppError ? e : mapDbError(e);
      await sleep(25 * 2 ** attempt + Math.random() * 25);
    }
  }
}
```

Use a transaction when two or more writes must succeed together, or a read-then-write must not race. A single statement needs none. Business `AppError`s thrown inside roll the transaction back and pass through unchanged. ⚠ type-check against the installed drizzle version (`09`).

## 8. SQLSTATE mapping (`lib/dbErrors.ts`)

```ts
import { AppError } from "@/lib/errors";

export type DbErrorInfo = { code: string; constraint?: string };
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/** Walks the `cause` chain (Drizzle wraps driver errors) for a SQLSTATE or postgres.js code. */
export function dbErrorInfo(error: unknown): DbErrorInfo | undefined {
  let cur: unknown = error;
  for (let depth = 0; depth < 5 && isRecord(cur); depth += 1) {
    const code = cur["code"];
    if (typeof code === "string") {
      const constraint = cur["constraint_name"];
      return typeof constraint === "string" ? { code, constraint } : { code };
    }
    cur = cur["cause"];
  }
  return undefined;
}

const UNAVAILABLE = new Set([
  "CONNECT_TIMEOUT", "CONNECTION_CLOSED", "CONNECTION_ENDED", "CONNECTION_DESTROYED",
  "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN",
  "40001", "40P01", "55P03", "57014", "57P01", "57P02", "57P03", "53300",
]);

export function mapDbError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const code = dbErrorInfo(error)?.code;
  if (code === undefined) return new AppError("INTERNAL", "Something went wrong", { cause: error });
  if (code === "23505") return new AppError("CONFLICT", "That record already exists", { cause: error });
  if (code === "23503") return new AppError("CONFLICT", "A related record is missing or still in use", { cause: error });
  if (code === "42501") return new AppError("FORBIDDEN", "Not allowed", { cause: error });
  if (code === "23514" || code.startsWith("22")) return new AppError("VALIDATION", "Invalid value", { cause: error });
  if (UNAVAILABLE.has(code) || code.startsWith("08") || code.startsWith("53")) {
    return new AppError("UNAVAILABLE", "Service temporarily unavailable. Please retry.", { retryAfterSec: 2, cause: error });
  }
  return new AppError("INTERNAL", "Something went wrong", { cause: error }); // 23502 etc.: our bug, logged
}
```

Services translate expected conflicts into domain messages before the generic mapping: `if (dbErrorInfo(e)?.constraint === "ts_web_consultation_bookings_slot_uq") throw new AppError("CONFLICT", "That slot was just taken")`. Class 22 / check violations reaching the database mean validation missed something: log as `warn` and fix the schema.
