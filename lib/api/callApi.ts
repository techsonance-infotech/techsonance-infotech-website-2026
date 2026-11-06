import { z } from "zod";
import type { Contract } from "@/lib/contracts/define";
import { errorPayloadSchema } from "@/lib/contracts/define";
import { ErrorCode } from "@/lib/errors";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";

export type CallApiInput<
  P extends z.ZodObject<z.ZodRawShape>,
  Q extends z.ZodObject<z.ZodRawShape>,
  B extends z.ZodType,
> = {
  params?: z.input<P>;
  query?: z.input<Q>;
  body?: z.input<B>;
  headers?: Record<string, string>;
  idempotencyKey?: string;
};

export async function callApi<
  P extends z.ZodObject<z.ZodRawShape>,
  Q extends z.ZodObject<z.ZodRawShape>,
  B extends z.ZodType,
  R extends z.ZodType,
>(contract: Contract<P, Q, B, R>, input?: CallApiInput<P, Q, B>): Promise<Result<z.output<R>>> {
  try {
    let resolvedPath: string = contract.path;

    // 1. Client-side params pre-validation & interpolation
    if (input?.params) {
      const parsedParams = contract.params.safeParse(input.params);
      if (!parsedParams.success) {
        return fail({
          code: ErrorCode.VALIDATION,
          message: "Client pre-validation failed for params",
        });
      }
      for (const [key, value] of Object.entries(parsedParams.data)) {
        resolvedPath = resolvedPath
          .replace(`:${key}`, encodeURIComponent(String(value)))
          .replace(`[${key}]`, encodeURIComponent(String(value)));
      }
    }

    // 2. Client-side query pre-validation & query string construction
    let queryString = "";
    if (input?.query) {
      const parsedQuery = contract.query.safeParse(input.query);
      if (!parsedQuery.success) {
        return fail({
          code: ErrorCode.VALIDATION,
          message: "Client pre-validation failed for query",
        });
      }
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(parsedQuery.data)) {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      }
      const qs = searchParams.toString();
      if (qs) {
        queryString = `?${qs}`;
      }
    }

    const fullUrl = `${resolvedPath}${queryString}`;

    // 3. Client-side body pre-validation
    let requestBody: string | undefined = undefined;
    if (contract.method !== "GET" && contract.method !== "DELETE") {
      if (input?.body !== undefined) {
        const parsedBody = contract.body.safeParse(input.body);
        if (!parsedBody.success) {
          return fail({
            code: ErrorCode.VALIDATION,
            message: "Client pre-validation failed for request body",
          });
        }
        requestBody = JSON.stringify(parsedBody.data);
      }
    }

    // 4. Request headers
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(requestBody ? { "Content-Type": "application/json" } : {}),
      ...(input?.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
      ...input?.headers,
    };

    // 5. Fetch call
    const response = await fetch(fullUrl, {
      method: contract.method,
      headers,
      body: requestBody,
    });

    const json: unknown = await response.json().catch(() => null);

    if (typeof json === "object" && json !== null && "ok" in json) {
      if (json.ok === true && "data" in json) {
        const parsedData = contract.response.safeParse(json.data);
        if (parsedData.success) {
          return ok(parsedData.data);
        }
      } else if (json.ok === false && "error" in json) {
        const parsedError = errorPayloadSchema.safeParse(json.error);
        if (parsedError.success) {
          return fail(parsedError.data);
        }
      }
    }

    return fail({
      code: ErrorCode.INTERNAL,
      message: `Unexpected response format from ${contract.path}`,
    });
  } catch (error) {
    return fail({
      code: ErrorCode.UNAVAILABLE,
      message:
        error instanceof Error ? error.message : "Network error or remote service unavailable",
    });
  }
}
