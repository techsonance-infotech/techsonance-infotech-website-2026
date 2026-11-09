import { z } from "zod";
import { defineContract, noParams, noQuery } from "@/lib/contracts/define";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import {
  addCredentialSchema,
  replaceCredentialSchema,
  killSwitchSchema,
} from "@/lib/validations/ai-credential.schema";

export const credentialViewDto = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid().nullable().optional(),
  provider: z.string(),
  model: z.string().nullable().optional(),
  label: z.string(),
  last4: z.string(),
  keyVersion: z.number().int(),
  status: z.string(),
  priority: z.number().int(),
  dailyBudgetUsd: z.string().nullable().optional(),
  spentTodayUsd: z.string(),
  cooldownUntil: z.string().nullable().optional(),
  lastErrorKind: z.string().nullable().optional(),
  lastUsedAt: z.string().nullable().optional(),
  isCanary: z.boolean(),
  createdAt: z.string(),
});

export type CredentialViewDto = z.infer<typeof credentialViewDto>;

export const listCredentialsResponseSchema = z.object({
  credentials: z.array(credentialViewDto),
  count: z.number().int().min(0),
});

export type ListCredentialsResponseDto = z.infer<typeof listCredentialsResponseSchema>;

export const addCredentialResponseSchema = z.object({
  success: z.boolean(),
  credential: credentialViewDto,
  message: z.string(),
});

export type AddCredentialResponseDto = z.infer<typeof addCredentialResponseSchema>;

export const listCredentialsContract = defineContract({
  method: "GET",
  path: API_ENDPOINTS.ADMIN.AI.CREDENTIALS,
  auth: "required",
  params: noParams,
  query: z.strictObject({
    provider: z.string().trim().optional(),
  }),
  body: z.undefined(),
  response: listCredentialsResponseSchema,
  status: 200,
});

export const addCredentialContract = defineContract({
  method: "POST",
  path: API_ENDPOINTS.ADMIN.AI.CREDENTIALS,
  auth: "required",
  params: noParams,
  query: noQuery,
  body: addCredentialSchema,
  response: addCredentialResponseSchema,
  status: 201,
});
