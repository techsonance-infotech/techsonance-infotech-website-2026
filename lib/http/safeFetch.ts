import type { z } from "zod";
import { ErrorCode } from "@/lib/errors";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode | string,
    message: string,
    public readonly requestId?: string,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface SafeFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function safeFetch<T>(
  url: string,
  schema: z.ZodType<T>,
  options: SafeFetchOptions = {},
): Promise<T> {
  const { timeoutMs = 10_000, signal: callerSignal, headers: customHeaders, ...rest } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort();
    } else {
      callerSignal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      ...(customHeaders ? { headers: customHeaders } : {}),
      signal: controller.signal,
    });
  } catch {
    const isTimeout = controller.signal.aborted;
    throw new ApiError(
      0,
      ErrorCode.UNAVAILABLE,
      isTimeout
        ? "The server took too long to respond. Please try again."
        : "Network connection lost or request aborted. Please check your connection.",
    );
  } finally {
    clearTimeout(timer);
  }

  const requestId = res.headers?.get ? (res.headers.get("x-request-id") ?? undefined) : undefined;

  // 204 No Content
  if (res.status === 204) {
    return schema.parse(undefined);
  }

  // Ensure Content-Type is JSON before parsing if headers are provided
  const contentType = res.headers?.get
    ? (res.headers.get("content-type") ?? "")
    : "application/json";

  if (contentType && !contentType.includes("application/json")) {
    throw new ApiError(
      res.status,
      ErrorCode.INTERNAL,
      `Received unexpected non-JSON response from server (HTTP ${res.status}).`,
      requestId,
    );
  }

  let rawJson: unknown = null;
  try {
    if (typeof res.json === "function") {
      rawJson = await res.json();
    }
  } catch {
    throw new ApiError(
      res.status,
      ErrorCode.INTERNAL,
      "Malformed JSON response received from server.",
      requestId,
    );
  }

  // Envelope unwrapping: { ok: true, data } | { ok: false, error }
  let payloadToValidate: unknown = rawJson;
  if (typeof rawJson === "object" && rawJson !== null && "ok" in rawJson) {
    const envelope = rawJson as {
      ok: boolean;
      data?: unknown;
      error?: string | { message?: string; code?: string; fieldErrors?: Record<string, string[]> };
    };

    if (!envelope.ok) {
      const errorMsg =
        typeof envelope.error === "string"
          ? envelope.error
          : envelope.error?.message || "Operation failed.";
      const errorCode =
        typeof envelope.error === "object" && envelope.error?.code
          ? envelope.error.code
          : ErrorCode.BAD_REQUEST;
      const fieldErrors =
        typeof envelope.error === "object" ? envelope.error?.fieldErrors : undefined;

      throw new ApiError(res.status, errorCode, errorMsg, requestId, fieldErrors);
    }

    payloadToValidate = envelope.data !== undefined ? envelope.data : rawJson;
  }

  if (res.ok === false) {
    const defaultCode =
      res.status === 401
        ? ErrorCode.UNAUTHENTICATED
        : res.status === 403
          ? ErrorCode.FORBIDDEN
          : res.status === 404
            ? ErrorCode.NOT_FOUND
            : res.status === 429
              ? ErrorCode.RATE_LIMITED
              : ErrorCode.INTERNAL;

    throw new ApiError(
      res.status,
      defaultCode,
      `Request failed with HTTP status ${res.status}.`,
      requestId,
    );
  }

  const parsed = schema.safeParse(payloadToValidate);
  if (!parsed.success) {
    throw new ApiError(
      res.status,
      ErrorCode.VALIDATION,
      "Received unexpected data shape from server.",
      requestId,
    );
  }

  return parsed.data;
}
