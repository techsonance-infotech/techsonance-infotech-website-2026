import { z } from "zod";
import { defineContract, noParams, noQuery, noBody } from "@/lib/contracts/define";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { AI_JOBS_LIMITS } from "@/lib/constants/ai.constants";

export const listAiJobsQuerySchema = z.strictObject({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(AI_JOBS_LIMITS.MAX_LIMIT)
    .default(AI_JOBS_LIMITS.DEFAULT_LIMIT)
    .optional(),
});

export type ListAiJobsQueryInput = z.input<typeof listAiJobsQuerySchema>;
export type ListAiJobsQueryOutput = z.output<typeof listAiJobsQuerySchema>;

export const createAiJobSchema = z.strictObject({
  topicText: z
    .string()
    .trim()
    .min(AI_JOBS_LIMITS.TOPIC_MIN, {
      error: `Topic must be at least ${AI_JOBS_LIMITS.TOPIC_MIN} characters`,
    })
    .max(AI_JOBS_LIMITS.TOPIC_MAX, {
      error: `Topic cannot exceed ${AI_JOBS_LIMITS.TOPIC_MAX} characters`,
    }),
  category: z
    .string()
    .trim()
    .max(AI_JOBS_LIMITS.CATEGORY_MAX)
    .optional()
    .default("Engineering"),
  siteId: z.string().uuid().optional(),
});

export type CreateAiJobInput = z.input<typeof createAiJobSchema>;
export type CreateAiJobOutput = z.output<typeof createAiJobSchema>;

export const listAiJobsResponseSchema = z.object({
  jobs: z.array(z.any()),
  count: z.number().int().min(0),
});

export type ListAiJobsResponseDto = z.infer<typeof listAiJobsResponseSchema>;

export const createAiJobResponseSchema = z.object({
  job: z.any(),
  message: z.string(),
});

export type CreateAiJobResponseDto = z.infer<typeof createAiJobResponseSchema>;

export const listAiJobsContract = defineContract({
  method: "GET",
  path: API_ENDPOINTS.ADMIN.AI.JOBS,
  auth: "required",
  params: noParams,
  query: listAiJobsQuerySchema,
  body: noBody,
  response: listAiJobsResponseSchema,
  status: 200,
});

export const createAiJobContract = defineContract({
  method: "POST",
  path: API_ENDPOINTS.ADMIN.AI.JOBS,
  auth: "required",
  params: noParams,
  query: noQuery,
  body: createAiJobSchema,
  response: createAiJobResponseSchema,
  status: 201,
});
