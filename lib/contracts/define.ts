import { z } from "zod";
import { ERROR_CODES } from "@/lib/errors";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type Contract<
  P extends z.ZodObject<z.ZodRawShape>,
  Q extends z.ZodObject<z.ZodRawShape>,
  B extends z.ZodType,
  R extends z.ZodType,
> = {
  readonly method: HttpMethod;
  readonly path: `/api/${string}`;
  readonly auth: "required" | "optional" | "none";
  readonly params: P;
  readonly query: Q;
  readonly body: B;
  readonly response: R;
  readonly status?: 200 | 201;
  readonly idempotent?: boolean;
};

export const defineContract = <
  P extends z.ZodObject<z.ZodRawShape>,
  Q extends z.ZodObject<z.ZodRawShape>,
  B extends z.ZodType,
  R extends z.ZodType,
>(
  c: Contract<P, Q, B, R>,
): Contract<P, Q, B, R> => c;

export const noParams = z.strictObject({});
export const noQuery = z.strictObject({});
export const noBody = z.undefined();

export const errorPayloadSchema = z.object({
  code: z.enum(ERROR_CODES),
  message: z.string().max(500),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  requestId: z.string().max(64).optional(),
});

export const envelopeSchema = <R extends z.ZodType>(data: R) =>
  z.discriminatedUnion("ok", [
    z.object({ ok: z.literal(true), data }),
    z.object({ ok: z.literal(false), error: errorPayloadSchema }),
  ]);
