import { z } from "zod";
import { defineContract, noParams, noQuery } from "@/lib/contracts/define";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { REVALIDATE_LIMITS } from "@/lib/constants/revalidate.constants";

export const adminRevalidateBodySchema = z.strictObject({
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, { error: "Tag cannot be empty" })
        .max(REVALIDATE_LIMITS.TAG_MAX_LENGTH),
    )
    .max(REVALIDATE_LIMITS.MAX_TAGS)
    .optional(),
  paths: z
    .array(
      z
        .string()
        .trim()
        .min(1, { error: "Path cannot be empty" })
        .max(REVALIDATE_LIMITS.PATH_MAX_LENGTH),
    )
    .max(REVALIDATE_LIMITS.MAX_PATHS)
    .optional(),
});

export type AdminRevalidateBodyInput = z.input<typeof adminRevalidateBodySchema>;
export type AdminRevalidateBodyOutput = z.output<typeof adminRevalidateBodySchema>;

export const adminRevalidateResponseSchema = z.object({
  revalidatedTags: z.array(z.string()),
  revalidatedPaths: z.array(z.string()),
  timestamp: z.string(),
  message: z.string().optional(),
});

export type AdminRevalidateResponse = z.infer<typeof adminRevalidateResponseSchema>;

export const adminRevalidateContract = defineContract({
  method: "POST",
  path: API_ENDPOINTS.ADMIN.REVALIDATE,
  auth: "required",
  params: noParams,
  query: noQuery,
  body: adminRevalidateBodySchema,
  response: adminRevalidateResponseSchema,
  status: 200,
});
