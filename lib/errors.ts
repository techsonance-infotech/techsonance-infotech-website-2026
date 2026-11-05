import type { z } from "zod";

export enum ErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  VALIDATION = "VALIDATION",
  UNAUTHENTICATED = "UNAUTHENTICATED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  PAYLOAD_TOO_LARGE = "PAYLOAD_TOO_LARGE",
  UNSUPPORTED_MEDIA = "UNSUPPORTED_MEDIA",
  RATE_LIMITED = "RATE_LIMITED",
  UNAVAILABLE = "UNAVAILABLE",
  INTERNAL = "INTERNAL",
}

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

export type ErrorCodeType = ErrorCode | `${ErrorCode}`;

export const STATUS_BY_CODE: Record<ErrorCodeType, number> = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.VALIDATION]: 422,
  [ErrorCode.UNAUTHENTICATED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.PAYLOAD_TOO_LARGE]: 413,
  [ErrorCode.UNSUPPORTED_MEDIA]: 415,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.UNAVAILABLE]: 503,
  [ErrorCode.INTERNAL]: 500,
};

export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  readonly code: ErrorCodeType;
  readonly fieldErrors: FieldErrors | undefined;
  readonly retryAfterSec: number | undefined;

  constructor(
    code: ErrorCodeType,
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
