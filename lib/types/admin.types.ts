import type { AiJobStatus, AiJobStep, AiTopicStatus } from "@/lib/constants/enums/ai.enum";

export interface AdminPost {
  id: string;
  siteId: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  content: string;
  categoryId?: string | null;
  heroImage?: string | null;
  thumbnailMissing?: boolean | null;
  thumbnailProvider?: string | null;
  thumbnailPrompt?: string | null;
  thumbnailAlt?: string | null;
  aiGenerated?: boolean | null;
  aiJobId?: string | null;
  tags?: string[] | null;
  readTime?: string | null;
  status: string;
  publishedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface AdminGenerationJob {
  id: string;
  siteId: string;
  topicText: string;
  category?: string | null;
  status: AiJobStatus | string;
  currentStep: AiJobStep | string;
  resultPostId?: string | null;
  errorDetails?: { error?: string } | null;
  attempt?: number | null;
  maxAttempts?: number | null;
  version: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TelemetrySummary {
  tokensToday: number;
  tokensThisWeek: number;
  dailyPostsUsed: number;
  dailyPostCap: number;
  weeklyPostsUsed: number;
  weeklyPostCap: number;
  totalJobs: number;
  activeJobs: number;
  providerStats: Array<{
    provider: string;
    totalCalls: number;
    successCalls: number;
    avgDurationMs: number;
  }>;
  recentEvents: Array<{
    id: string;
    jobId?: string | null;
    stepName?: string | null;
    provider: string;
    model: string;
    promptTokens?: number | null;
    completionTokens?: number | null;
    totalTokens?: number | null;
    durationMs?: number | null;
    status: string;
    errorMessage?: string | null;
    timestamp?: Date | string | null;
    createdAt?: Date | string | null;
  }>;
}

export interface AdminTopic {
  id: string;
  siteId: string;
  title: string;
  keywords?: string[] | null;
  category: string;
  targetAudience: string;
  difficulty: string;
  status: AiTopicStatus | string;
  priority: number;
  notes?: string | null;
  suggestedBy: string;
  generationJobId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}
