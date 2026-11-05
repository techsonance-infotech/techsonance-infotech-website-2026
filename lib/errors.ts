import type { z } from "zod";

export const ERROR_CODES = [
  "BAD_REQUEST",
  "VALIDATION",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "PAYLOAD_TOO_LARGE",
  "UNSUPPORTED_MEDIA",
  "RATE_LIMITED",
  "UNAVAILABLE",
  "INTERNAL",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export const STATUS_BY_CODE = {
  BAD_REQUEST: 400,
  VALIDATION: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA: 415,
  RATE_LIMITED: 429,
  UNAVAILABLE: 503,
  INTERNAL: 500,
} as const satisfies Record<ErrorCode, number>;

export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fieldErrors: FieldErrors | undefined;
  readonly retryAfterSec: number | undefined;

  constructor(
    code: ErrorCode,
    message: string,
    opts: { fieldErrors?: FieldErrors; retryAfterSec?: number; cause?: unknown } = {},
  ) {
    super(message, { cause: opts.cause });
    this.name = "AppError";
    this.code = code;
    this.fieldErrors = opts.fieldErrors;
    this.retryAfterSec = opts.retryAfterSec;
  }
}

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
