import { z } from "zod";
import { defineContract, noParams, noQuery, noBody } from "@/lib/contracts/define";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { AI_TOPICS_LIMITS, AI_TOPICS_ERRORS } from "@/lib/constants/ai.constants";
import { AiTopicStatus } from "@/lib/constants/enums/ai.enum";

export const listAiTopicsQuerySchema = z.strictObject({
  status: z.nativeEnum(AiTopicStatus).optional(),
  search: z.string().trim().max(AI_TOPICS_LIMITS.TITLE_MAX).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(AI_TOPICS_LIMITS.MAX_LIMIT)
    .default(AI_TOPICS_LIMITS.DEFAULT_LIMIT)
    .optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

export type ListAiTopicsQueryInput = z.input<typeof listAiTopicsQuerySchema>;
export type ListAiTopicsQueryOutput = z.output<typeof listAiTopicsQuerySchema>;

export const createAiTopicSchema = z.strictObject({
  title: z
    .string()
    .trim()
    .min(AI_TOPICS_LIMITS.TITLE_MIN, { error: AI_TOPICS_ERRORS.TITLE_REQUIRED })
    .max(AI_TOPICS_LIMITS.TITLE_MAX),
  keywords: z
    .array(z.string().trim().max(AI_TOPICS_LIMITS.KEYWORD_MAX))
    .max(AI_TOPICS_LIMITS.KEYWORDS_MAX_COUNT)
    .default([]),
  category: z
    .string()
    .trim()
    .max(AI_TOPICS_LIMITS.CATEGORY_MAX)
    .optional()
    .default("Engineering"),
  targetAudience: z
    .string()
    .trim()
    .max(AI_TOPICS_LIMITS.TARGET_AUDIENCE_MAX)
    .optional()
    .default("Tech Leads & Engineers"),
  difficulty: z.string().trim().max(50).optional().default("intermediate"),
  priority: z.coerce.number().int().min(-100).max(100).default(0),
  notes: z.string().trim().max(1000).optional(),
  suggestedBy: z.enum(["ai", "admin"]).optional().default("admin"),
});

export type CreateAiTopicInput = z.input<typeof createAiTopicSchema>;
export type CreateAiTopicOutput = z.output<typeof createAiTopicSchema>;

export const aiTopicParamsSchema = z.strictObject({
  id: z.string().uuid("Invalid topic ID format. Expected a valid UUID."),
});

export type AiTopicParams = z.input<typeof aiTopicParamsSchema>;

export const updateAiTopicStatusSchema = z.strictObject({
  status: z.nativeEnum(AiTopicStatus, {
    error: AI_TOPICS_ERRORS.INVALID_STATUS,
  }),
});

export type UpdateAiTopicStatusInput = z.input<typeof updateAiTopicStatusSchema>;

export const listAiTopicsResponseSchema = z.object({
  topics: z.array(z.any()),
  total: z.number().int().min(0),
});

export const singleAiTopicResponseSchema = z.object({
  topic: z.any(),
});

export const listAiTopicsContract = defineContract({
  method: "GET",
  path: API_ENDPOINTS.ADMIN.AI.TOPICS,
  auth: "required",
  params: noParams,
  query: listAiTopicsQuerySchema,
  body: noBody,
  response: listAiTopicsResponseSchema,
  status: 200,
});

export const createAiTopicContract = defineContract({
  method: "POST",
  path: API_ENDPOINTS.ADMIN.AI.TOPICS,
  auth: "required",
  params: noParams,
  query: noQuery,
  body: createAiTopicSchema,
  response: singleAiTopicResponseSchema,
  status: 201,
});

export const getAiTopicByIdContract = defineContract({
  method: "GET",
  path: API_ENDPOINTS.ADMIN.AI.TOPIC(":id") as `/api/${string}`,
  auth: "required",
  params: aiTopicParamsSchema,
  query: noQuery,
  body: noBody,
  response: singleAiTopicResponseSchema,
  status: 200,
});

export const updateAiTopicStatusContract = defineContract({
  method: "PATCH",
  path: API_ENDPOINTS.ADMIN.AI.TOPIC(":id") as `/api/${string}`,
  auth: "required",
  params: aiTopicParamsSchema,
  query: noQuery,
  body: updateAiTopicStatusSchema,
  response: singleAiTopicResponseSchema,
  status: 200,
});

export const deleteAiTopicContract = defineContract({
  method: "DELETE",
  path: API_ENDPOINTS.ADMIN.AI.TOPIC(":id") as `/api/${string}`,
  auth: "required",
  params: aiTopicParamsSchema,
  query: noQuery,
  body: noBody,
  response: z.object({ success: z.boolean() }),
  status: 200,
});

export const suggestAiTopicsSchema = z.strictObject({
  category: z
    .string()
    .trim()
    .max(AI_TOPICS_LIMITS.CATEGORY_MAX)
    .optional()
    .default("Full-Stack & Agentic AI"),
});

export type SuggestAiTopicsInput = z.input<typeof suggestAiTopicsSchema>;
export type SuggestAiTopicsOutput = z.output<typeof suggestAiTopicsSchema>;

export const suggestAiTopicsResponseSchema = z.object({
  success: z.boolean(),
  count: z.number().int().min(0),
  topics: z.array(z.any()),
});

export const suggestAiTopicsContract = defineContract({
  method: "POST",
  path: API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST,
  auth: "required",
  params: noParams,
  query: noQuery,
  body: suggestAiTopicsSchema,
  response: suggestAiTopicsResponseSchema,
  status: 200,
});

export const launchAiTopicResponseSchema = z.object({
  success: z.boolean(),
  jobId: z.string().uuid(),
  message: z.string(),
});

export const launchAiTopicContract = defineContract({
  method: "POST",
  path: API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH(":id") as `/api/${string}`,
  auth: "required",
  params: aiTopicParamsSchema,
  query: noQuery,
  body: noBody,
  response: launchAiTopicResponseSchema,
  status: 200,
});
