import type { ErrorCode, FieldErrors } from "@/lib/errors";

export type ErrorPayload = {
  code: ErrorCode;
  message: string;
  fieldErrors?: FieldErrors;
  retryAfterSec?: number;
  requestId?: string;
};

export type Result<T = void> = { ok: true; data: T } | { ok: false; error: ErrorPayload };

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });

export const fail = (error: ErrorPayload): Result<never> => ({ ok: false, error });
