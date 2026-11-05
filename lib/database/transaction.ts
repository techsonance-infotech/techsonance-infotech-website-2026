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
