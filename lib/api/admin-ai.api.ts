import { z } from "zod";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import type { AdminGenerationJob } from "@/lib/types/admin.types";
import type {
  CreateAiTopicInput,
  ListAiTopicsQueryInput,
} from "@/lib/contracts/admin-ai-topics.contract";
import type { AiTopicStatus } from "@/lib/constants/enums/ai.enum";
import type { AiTelemetrySummary } from "@/lib/contracts/admin-ai-usage.contract";
import type {
  PromptTemplateDto,
  UpdateAiPromptBodyInput,
} from "@/lib/contracts/admin-ai-prompts.contract";
import { safeFetch } from "@/lib/http/safeFetch";
import {
  SafeAdminAiTopicsListResponseSchema,
  SafeAdminAiTopicItemSchema,
  SafeAdminAiJobsListResponseSchema,
  SafeAdminAiJobItemSchema,
  type SafeAdminAiTopicItem,
} from "@/lib/validations/admin-blog-boundary.schema";

export type { AdminAiTopicItem } from "@/lib/validations/admin-blog-boundary.schema";

const SingleJobSchema = z
  .object({
    job: z.any(),
  })
  .or(SafeAdminAiJobItemSchema);

const SingleTopicSchema = z
  .object({
    topic: z.any(),
  })
  .or(SafeAdminAiTopicItemSchema);

const TopicSuggestionsSchema = z
  .object({
    count: z.number().catch(0),
    topics: z.array(SafeAdminAiTopicItemSchema).catch([]),
  })
  .catch({ count: 0, topics: [] });

const LaunchJobResponseSchema = z
  .object({
    jobId: z.string().default(""),
    status: z.string().default("PENDING"),
    message: z.string().default("Job launched"),
  })
  .catch({ jobId: "", status: "PENDING", message: "Job launched" });

const PromptTemplatesSchema = z
  .object({
    templates: z.array(z.any()).catch([]),
  })
  .catch({ templates: [] });

const SinglePromptTemplateSchema = z
  .object({
    template: z.any(),
  })
  .catch({ template: null });

/**
 * Lists autonomous AI content generation jobs.
 * Endpoint: GET /api/admin/ai/jobs
 */
export async function listAdminAiJobs(
  limit = 50,
  signal?: AbortSignal,
): Promise<AdminGenerationJob[]> {
  const url = `${API_ENDPOINTS.ADMIN.AI.JOBS}?limit=${limit}`;

  const data = await safeFetch(url, SafeAdminAiJobsListResponseSchema, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    signal,
  });

  return (data.jobs || []) as unknown as AdminGenerationJob[];
}

/**
 * Triggers an autonomous content generation job for a topic.
 * Endpoint: POST /api/admin/ai/jobs
 */
export async function createAdminAiJob(
  payload: {
    topicText: string;
    category?: string;
    siteId?: string;
  },
  signal?: AbortSignal,
): Promise<AdminGenerationJob> {
  const url = API_ENDPOINTS.ADMIN.AI.JOBS;

  const data = await safeFetch(url, SingleJobSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
    signal,
  });

  return (data && "job" in data ? data.job : data) as unknown as AdminGenerationJob;
}

/**
 * Lists editorial topic proposals in the AI backlog.
 * Endpoint: GET /api/admin/ai/topics
 */
export async function listAdminAiTopics(
  query?: ListAiTopicsQueryInput,
  signal?: AbortSignal,
): Promise<{ topics: SafeAdminAiTopicItem[]; total: number }> {
  const params = new URLSearchParams();
  if (query?.status) params.set("status", query.status);
  if (query?.search?.trim()) params.set("search", query.search.trim());
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.offset) params.set("offset", String(query.offset));

  const queryStr = params.toString();
  const url = queryStr
    ? `${API_ENDPOINTS.ADMIN.AI.TOPICS}?${queryStr}`
    : API_ENDPOINTS.ADMIN.AI.TOPICS;

  const data = await safeFetch(url, SafeAdminAiTopicsListResponseSchema, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    signal,
  });

  return {
    topics: data.topics as SafeAdminAiTopicItem[],
    total: data.total,
  };
}

/**
 * Creates a new editorial topic proposal.
 * Endpoint: POST /api/admin/ai/topics
 */
export async function createAdminAiTopic(
  payload: CreateAiTopicInput,
  signal?: AbortSignal,
): Promise<SafeAdminAiTopicItem> {
  const url = API_ENDPOINTS.ADMIN.AI.TOPICS;

  const data = await safeFetch(url, SingleTopicSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
    signal,
  });

  return (data && "topic" in data ? data.topic : data) as unknown as SafeAdminAiTopicItem;
}

/**
 * Updates status of an AI topic (APPROVED, REJECTED, ARCHIVED, etc.)
 * Endpoint: PATCH /api/admin/ai/topics/[id]
 */
export async function updateAdminAiTopicStatus(
  id: string,
  status: AiTopicStatus,
  signal?: AbortSignal,
): Promise<SafeAdminAiTopicItem> {
  const url = API_ENDPOINTS.ADMIN.AI.TOPIC(id);

  const data = await safeFetch(url, SingleTopicSchema, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
    signal,
  });

  return (data && "topic" in data ? data.topic : data) as unknown as SafeAdminAiTopicItem;
}

/**
 * Deletes an AI topic from backlog.
 * Endpoint: DELETE /api/admin/ai/topics/[id]
 */
export async function deleteAdminAiTopic(id: string, signal?: AbortSignal): Promise<boolean> {
  const url = API_ENDPOINTS.ADMIN.AI.TOPIC(id);

  await safeFetch(url, z.any(), {
    method: "DELETE",
    credentials: "include",
    signal,
  });

  return true;
}

/**
 * Suggests new AI blog topic ideas using LLM brainstorming.
 * Endpoint: POST /api/admin/ai/topics/suggest
 */
export async function suggestAdminAiTopics(
  category = "Agentic AI & Next.js 16",
  signal?: AbortSignal,
): Promise<{ count: number; topics: SafeAdminAiTopicItem[] }> {
  const url = API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST;

  const data = await safeFetch(url, TopicSuggestionsSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ category }),
    signal,
  });

  return {
    count: data.count,
    topics: (data.topics || []) as SafeAdminAiTopicItem[],
  };
}

/**
 * Launches an autonomous content generation job from a backlog topic.
 * Endpoint: POST /api/admin/ai/topics/[id]/launch
 */
export async function launchAdminAiTopic(
  id: string,
  signal?: AbortSignal,
): Promise<{ jobId: string; status: string; message: string }> {
  const url = API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH(id);

  const data = await safeFetch(url, LaunchJobResponseSchema, {
    method: "POST",
    credentials: "include",
    signal,
  });

  return data;
}

/**
 * Retrieves AI token usage, quota limits, and telemetry.
 * Endpoint: GET /api/admin/ai/usage
 */
export async function getAdminAiUsage(signal?: AbortSignal): Promise<AiTelemetrySummary> {
  const url = API_ENDPOINTS.ADMIN.AI.USAGE;

  const data = await safeFetch(url, z.any(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    signal,
  });

  return data as AiTelemetrySummary;
}

/**
 * Lists all customizable prompt engineering templates.
 * Endpoint: GET /api/admin/ai/prompts
 */
export async function listAdminAiPrompts(signal?: AbortSignal): Promise<PromptTemplateDto[]> {
  const url = API_ENDPOINTS.ADMIN.AI.PROMPTS;

  const data = await safeFetch(url, PromptTemplatesSchema, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    signal,
  });

  return (data.templates || []) as PromptTemplateDto[];
}

/**
 * Updates a specific prompt template configuration by UUID.
 * Endpoint: PATCH /api/admin/ai/prompts?id=<uuid>
 */
export async function updateAdminAiPrompt(
  id: string,
  payload: UpdateAiPromptBodyInput,
  signal?: AbortSignal,
): Promise<PromptTemplateDto> {
  const url = `${API_ENDPOINTS.ADMIN.AI.PROMPTS}?id=${encodeURIComponent(id)}`;

  const data = await safeFetch(url, SinglePromptTemplateSchema, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
    signal,
  });

  return (data && "template" in data ? data.template : data) as PromptTemplateDto;
}
