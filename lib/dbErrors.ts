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
  "CONNECT_TIMEOUT",
  "CONNECTION_CLOSED",
  "CONNECTION_ENDED",
  "CONNECTION_DESTROYED",
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "40001",
  "40P01",
  "55P03",
  "57014",
  "57P01",
  "57P02",
  "57P03",
  "53300",
]);

export function mapDbError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const code = dbErrorInfo(error)?.code;
  if (code === undefined) return new AppError("INTERNAL", "Something went wrong", { cause: error });
  if (code === "23505") return new AppError("CONFLICT", "That record already exists", { cause: error });
  if (code === "23503")
    return new AppError("CONFLICT", "A related record is missing or still in use", { cause: error });
  if (code === "42501") return new AppError("FORBIDDEN", "Not allowed", { cause: error });
  if (code === "23514" || code.startsWith("22"))
    return new AppError("VALIDATION", "Invalid value", { cause: error });
  if (UNAVAILABLE.has(code) || code.startsWith("08") || code.startsWith("53")) {
    return new AppError("UNAVAILABLE", "Service temporarily unavailable. Please retry.", {
      retryAfterSec: 2,
      cause: error,
    });
  }
  return new AppError("INTERNAL", "Something went wrong", { cause: error });
}
