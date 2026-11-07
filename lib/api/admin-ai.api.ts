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

export interface AdminAiTopicItem {
  id: string;
  title: string;
  keywords: string[];
  category: string;
  targetAudience: string;
  difficulty: string;
  status: AiTopicStatus;
  priority: number;
  suggestedBy: string;
  notes: string | null;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Lists autonomous AI content generation jobs.
 * Endpoint: GET /api/admin/ai/jobs
 * Contract: listAiJobsContract
 */
export async function listAdminAiJobs(limit = 50): Promise<AdminGenerationJob[]> {
  const url = `${API_ENDPOINTS.ADMIN.AI.JOBS}?limit=${limit}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to load AI generation jobs.";
    throw new Error(errorMsg);
  }

  return resJson.data?.jobs || resJson.jobs || [];
}

/**
 * Triggers an autonomous content generation job for a topic.
 * Endpoint: POST /api/admin/ai/jobs
 * Contract: createAiJobContract
 */
export async function createAdminAiJob(payload: {
  topicText: string;
  category?: string;
  siteId?: string;
}): Promise<AdminGenerationJob> {
  const url = API_ENDPOINTS.ADMIN.AI.JOBS;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to create generation job.";
    throw new Error(errorMsg);
  }

  return resJson.data?.job || resJson.job;
}

/**
 * Lists editorial topic proposals in the AI backlog.
 * Endpoint: GET /api/admin/ai/topics
 * Contract: listAiTopicsContract
 */
export async function listAdminAiTopics(
  query?: ListAiTopicsQueryInput,
): Promise<{ topics: AdminAiTopicItem[]; total: number }> {
  const params = new URLSearchParams();
  if (query?.status) params.set("status", query.status);
  if (query?.search?.trim()) params.set("search", query.search.trim());
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.offset) params.set("offset", String(query.offset));

  const queryStr = params.toString();
  const url = queryStr
    ? `${API_ENDPOINTS.ADMIN.AI.TOPICS}?${queryStr}`
    : API_ENDPOINTS.ADMIN.AI.TOPICS;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to load topic backlog.";
    throw new Error(errorMsg);
  }

  const topics = resJson.data?.topics || resJson.topics || [];
  const total = resJson.data?.total ?? resJson.total ?? topics.length;

  return { topics, total };
}

/**
 * Creates a new editorial topic proposal.
 * Endpoint: POST /api/admin/ai/topics
 * Contract: createAiTopicContract
 */
export async function createAdminAiTopic(payload: CreateAiTopicInput): Promise<AdminAiTopicItem> {
  const url = API_ENDPOINTS.ADMIN.AI.TOPICS;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to create topic.";
    throw new Error(errorMsg);
  }

  return resJson.data?.topic || resJson.topic;
}

/**
 * Updates status of an AI topic (APPROVED, REJECTED, ARCHIVED, etc.)
 * Endpoint: PATCH /api/admin/ai/topics/[id]
 * Contract: updateAiTopicStatusContract
 */
export async function updateAdminAiTopicStatus(
  id: string,
  status: AiTopicStatus,
): Promise<AdminAiTopicItem> {
  const url = API_ENDPOINTS.ADMIN.AI.TOPIC(id);

  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to update topic status.";
    throw new Error(errorMsg);
  }

  return resJson.data?.topic || resJson.topic;
}

/**
 * Deletes an AI topic from backlog.
 * Endpoint: DELETE /api/admin/ai/topics/[id]
 * Contract: deleteAiTopicContract
 */
export async function deleteAdminAiTopic(id: string): Promise<boolean> {
  const url = API_ENDPOINTS.ADMIN.AI.TOPIC(id);

  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
  });

  const resJson = await response.json().catch(() => ({ ok: response.ok }));

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to delete topic.";
    throw new Error(errorMsg);
  }

  return true;
}

/**
 * Suggests new AI blog topic ideas using LLM brainstorming.
 * Endpoint: POST /api/admin/ai/topics/suggest
 * Contract: suggestAiTopicsContract
 */
export async function suggestAdminAiTopics(
  category = "Agentic AI & Next.js 16",
): Promise<{ count: number; topics: AdminAiTopicItem[] }> {
  const url = API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ category }),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to generate topic ideas.";
    throw new Error(errorMsg);
  }

  return {
    count: resJson.data?.count ?? resJson.count ?? 0,
    topics: resJson.data?.topics || resJson.topics || [],
  };
}

/**
 * Launches an autonomous content generation job from a backlog topic.
 * Endpoint: POST /api/admin/ai/topics/[id]/launch
 * Contract: launchAiTopicJobContract
 */
export async function launchAdminAiTopic(
  id: string,
): Promise<{ jobId: string; status: string; message: string }> {
  const url = API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH(id);

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to launch autonomous generation.";
    throw new Error(errorMsg);
  }

  return {
    jobId: resJson.data?.jobId || resJson.jobId,
    status: resJson.data?.status || resJson.status,
    message: resJson.data?.message || resJson.message,
  };
}

/**
 * Retrieves AI token usage, quota limits, and telemetry.
 * Endpoint: GET /api/admin/ai/usage
 * Contract: getAiUsageTelemetryContract
 */
export async function getAdminAiUsage(): Promise<AiTelemetrySummary> {
  const url = API_ENDPOINTS.ADMIN.AI.USAGE;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to load AI telemetry.";
    throw new Error(errorMsg);
  }

  return resJson.data || resJson;
}

/**
 * Lists all customizable prompt engineering templates.
 * Endpoint: GET /api/admin/ai/prompts
 * Contract: listAiPromptsContract
 */
export async function listAdminAiPrompts(): Promise<PromptTemplateDto[]> {
  const url = API_ENDPOINTS.ADMIN.AI.PROMPTS;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to load prompt templates.";
    throw new Error(errorMsg);
  }

  return resJson.data?.templates || resJson.templates || [];
}

/**
 * Updates a specific prompt template configuration by UUID.
 * Endpoint: PATCH /api/admin/ai/prompts?id=<uuid>
 * Contract: updateAiPromptContract
 */
export async function updateAdminAiPrompt(
  id: string,
  payload: UpdateAiPromptBodyInput,
): Promise<PromptTemplateDto> {
  const url = `${API_ENDPOINTS.ADMIN.AI.PROMPTS}?id=${encodeURIComponent(id)}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to update prompt template.";
    throw new Error(errorMsg);
  }

  return resJson.data?.template || resJson.template;
}
