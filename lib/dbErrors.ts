import { AppError, ErrorCode } from "@/lib/errors";

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

export type DbErrorContext = Record<string, unknown>;

export function mapDbError(error: unknown, _context?: DbErrorContext): AppError {
  if (error instanceof AppError) return error;
  const code = dbErrorInfo(error)?.code;
  if (code === undefined)
    return new AppError(ErrorCode.INTERNAL, "Something went wrong", { cause: error });
  if (code === "23505")
    return new AppError(ErrorCode.CONFLICT, "That record already exists", { cause: error });
  if (code === "23503") {
    const constraint = dbErrorInfo(error)?.constraint || "";
    let message = "A related record is missing or still in use";
    if (constraint.includes("owner_id")) {
      message = "The assigned recruiter account was not found in the administrator directory.";
    } else if (constraint.includes("hiring_manager_id")) {
      message = "The assigned hiring manager was not found in the administrator directory.";
    } else if (constraint.includes("site_id")) {
      message = "The workspace site configuration could not be verified in the database.";
    } else if (constraint.includes("job_id") || constraint.includes("application")) {
      message = "Cannot delete or alter this role because candidate applications are currently attached.";
    }
    return new AppError(ErrorCode.CONFLICT, message, {
      cause: error,
    });
  }
  if (code === "42501")
    return new AppError(ErrorCode.FORBIDDEN, "Not allowed", { cause: error });
  if (code === "23514" || code.startsWith("22"))
    return new AppError(ErrorCode.VALIDATION, "Invalid value", { cause: error });
  if (UNAVAILABLE.has(code) || code.startsWith("08") || code.startsWith("53")) {
    return new AppError(
      ErrorCode.UNAVAILABLE,
      "Service temporarily unavailable. Please retry.",
      {
        retryAfterSec: 2,
        cause: error,
      },
    );
  }
  return new AppError(ErrorCode.INTERNAL, "Something went wrong", { cause: error });
}
