import { z } from "zod";
import { defineContract, noParams, noQuery, noBody } from "@/lib/contracts/define";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { AI_PROMPTS_LIMITS, AI_PROMPTS_ERRORS } from "@/lib/constants/ai.constants";

// ─── Shared prompt template response schema ───────────────────────────────────

export const promptTemplateSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  stepName: z.string(),
  version: z.number().int().min(1),
  systemPrompt: z.string(),
  userPromptTemplate: z.string(),
  modelPreference: z.string().nullable(),
  temperature: z.number().int().nullable(),
  isActive: z.boolean(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export type PromptTemplateDto = z.infer<typeof promptTemplateSchema>;

// ─── List Prompt Templates ─────────────────────────────────────────────────

export const listAiPromptsResponseSchema = z.object({
  templates: z.array(promptTemplateSchema),
  total: z.number().int().min(0),
});

export const listAiPromptsContract = defineContract({
  method: "GET",
  path: API_ENDPOINTS.ADMIN.AI.PROMPTS,
  auth: "required",
  params: noParams,
  query: noQuery,
  body: noBody,
  response: listAiPromptsResponseSchema,
  status: 200,
});

// ─── Update Prompt Template (PATCH by ID) ─────────────────────────────────

export const updateAiPromptParamsSchema = z.strictObject({
  id: z.string().uuid(AI_PROMPTS_ERRORS.INVALID_ID),
});

export type UpdateAiPromptParams = z.input<typeof updateAiPromptParamsSchema>;

export const updateAiPromptBodySchema = z.strictObject({
  systemPrompt: z
    .string()
    .trim()
    .min(AI_PROMPTS_LIMITS.SYSTEM_PROMPT_MIN)
    .max(AI_PROMPTS_LIMITS.SYSTEM_PROMPT_MAX)
    .optional(),
  userPromptTemplate: z
    .string()
    .trim()
    .min(AI_PROMPTS_LIMITS.USER_PROMPT_TEMPLATE_MIN)
    .max(AI_PROMPTS_LIMITS.USER_PROMPT_TEMPLATE_MAX)
    .optional(),
  modelPreference: z
    .string()
    .trim()
    .min(1)
    .max(AI_PROMPTS_LIMITS.MODEL_PREFERENCE_MAX)
    .optional(),
  temperature: z
    .number()
    .int()
    .min(AI_PROMPTS_LIMITS.TEMPERATURE_MIN)
    .max(AI_PROMPTS_LIMITS.TEMPERATURE_MAX)
    .optional(),
});

export type UpdateAiPromptBodyInput = z.input<typeof updateAiPromptBodySchema>;
export type UpdateAiPromptBodyOutput = z.output<typeof updateAiPromptBodySchema>;

export const singleAiPromptResponseSchema = z.object({
  template: promptTemplateSchema,
});

export const updateAiPromptContract = defineContract({
  method: "PATCH",
  path: API_ENDPOINTS.ADMIN.AI.PROMPTS as `/api/${string}`,
  auth: "required",
  params: updateAiPromptParamsSchema,
  query: noQuery,
  body: updateAiPromptBodySchema,
  response: singleAiPromptResponseSchema,
  status: 200,
});
