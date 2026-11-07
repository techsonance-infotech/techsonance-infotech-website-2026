import { z } from "zod";
import { defineContract, noParams, noQuery, noBody } from "@/lib/contracts/define";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

export const providerStatsSchema = z.object({
  provider: z.string(),
  totalCalls: z.number().int().min(0),
  successCalls: z.number().int().min(0),
  avgDurationMs: z.number().int().min(0),
});

export const aiTelemetrySummarySchema = z.object({
  tokensToday: z.number().int().min(0),
  tokensThisWeek: z.number().int().min(0),
  dailyPostsUsed: z.number().int().min(0),
  dailyPostCap: z.number().int().min(0),
  weeklyPostsUsed: z.number().int().min(0),
  weeklyPostCap: z.number().int().min(0),
  totalJobs: z.number().int().min(0),
  activeJobs: z.number().int().min(0),
  providerStats: z.array(providerStatsSchema),
  recentEvents: z.array(z.any()),
});

export type AiTelemetrySummary = z.infer<typeof aiTelemetrySummarySchema>;

export const getAiUsageTelemetryContract = defineContract({
  method: "GET",
  path: API_ENDPOINTS.ADMIN.AI.USAGE,
  auth: "required",
  params: noParams,
  query: noQuery,
  body: noBody,
  response: aiTelemetrySummarySchema,
  status: 200,
});
