import { z } from "zod";
import { PostStatus } from "@/lib/constants/enums/content.enum";
import { AiTopicStatus, AiJobStatus, AiJobStep } from "@/lib/constants/enums/ai.enum";

// Resilient single post in listing
export const SafeAdminPostItemSchema = z
  .object({
    id: z.string().default(() => crypto.randomUUID()),
    siteId: z.string().optional(),
    slug: z.string().nullish().transform((v) => v?.trim() || "article"),
    title: z.string().nullish().transform((v) => v?.trim() || "Untitled Article"),
    excerpt: z.string().nullish().catch(null),
    content: z.string().nullish().transform((v) => v ?? ""),
    categoryId: z.string().nullish().catch(null),
    heroImage: z.string().nullish().catch(null),
    thumbnailMissing: z.boolean().nullish().catch(null),
    thumbnailProvider: z.string().nullish().catch(null),
    thumbnailPrompt: z.string().nullish().catch(null),
    thumbnailAlt: z.string().nullish().catch(null),
    aiGenerated: z.boolean().nullish().catch(false),
    aiJobId: z.string().nullish().catch(null),
    tags: z
      .array(z.string())
      .nullish()
      .transform((t) => t ?? []),
    readTime: z.string().nullish().transform((v) => v || "5 min read"),
    status: z.enum(PostStatus).catch(PostStatus.DRAFT),
    publishedAt: z.string().nullish().catch(null),
    createdAt: z.string().nullish().transform((v) => v || new Date().toISOString()),
    updatedAt: z.string().nullish().transform((v) => v || new Date().toISOString()),
    version: z.coerce.number().int().catch(1),
    category: z
      .object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
      })
      .nullish()
      .catch(null),
  })
  .nullable()
  .catch(null);

export type SafeAdminPostItem = NonNullable<z.infer<typeof SafeAdminPostItemSchema>>;

export const SafeAdminPostsListResponseSchema = z.object({
  posts: z
    .array(SafeAdminPostItemSchema)
    .nullish()
    .transform((items) => (items ?? []).filter((item): item is NonNullable<typeof item> => item !== null)),
  total: z.coerce.number().int().catch(0),
});

export type SafeAdminPostsListResponse = z.infer<typeof SafeAdminPostsListResponseSchema>;

// Resilient AI Topic item
export const SafeAdminAiTopicItemSchema = z
  .object({
    id: z.string().default(() => crypto.randomUUID()),
    title: z.string().nullish().transform((v) => v?.trim() || "Untitled Topic"),
    keywords: z
      .array(z.string())
      .nullish()
      .transform((k) => k ?? []),
    category: z.string().nullish().transform((v) => v || "General"),
    targetAudience: z.string().nullish().transform((v) => v || "General"),
    difficulty: z.string().nullish().transform((v) => v || "Intermediate"),
    status: z.enum(AiTopicStatus).catch(AiTopicStatus.SUGGESTED),
    priority: z.coerce.number().int().catch(0),
    suggestedBy: z.string().nullish().transform((v) => v || "Manual"),
    notes: z.string().nullish().catch(null),
    createdAt: z.string().nullish().transform((v) => v || new Date().toISOString()),
    updatedAt: z.string().nullish().catch(null),
  })
  .nullable()
  .catch(null);

export type SafeAdminAiTopicItem = NonNullable<z.infer<typeof SafeAdminAiTopicItemSchema>>;
export type AdminAiTopicItem = SafeAdminAiTopicItem;

export const SafeAdminAiTopicsListResponseSchema = z.object({
  topics: z
    .array(SafeAdminAiTopicItemSchema)
    .nullish()
    .transform((items) => (items ?? []).filter((item): item is NonNullable<typeof item> => item !== null)),
  total: z.coerce.number().int().catch(0),
});

// Resilient AI Generation Job item
export const SafeAdminAiJobItemSchema = z
  .object({
    id: z.string().default(() => crypto.randomUUID()),
    siteId: z.string().optional(),
    topicText: z.string().nullish().transform((v) => v || "Untitled Generation Job"),
    category: z.string().nullish().catch(null),
    status: z.enum(AiJobStatus).catch(AiJobStatus.QUEUED),
    currentStep: z.enum(AiJobStep).catch(AiJobStep.OUTLINE),
    resultPostId: z.string().nullish().catch(null),
    errorDetails: z.record(z.string(), z.any()).nullish().catch(null),
    attempt: z.coerce.number().int().catch(1),
    maxAttempts: z.coerce.number().int().catch(3),
    version: z.coerce.number().int().catch(1),
    createdAt: z.string().nullish().transform((v) => v || new Date().toISOString()),
    updatedAt: z.string().nullish().transform((v) => v || new Date().toISOString()),
  })
  .nullable()
  .catch(null);

export type SafeAdminAiJobItem = NonNullable<z.infer<typeof SafeAdminAiJobItemSchema>>;

export const SafeAdminAiJobsListResponseSchema = z.object({
  jobs: z
    .array(SafeAdminAiJobItemSchema)
    .nullish()
    .transform((items) => (items ?? []).filter((item): item is NonNullable<typeof item> => item !== null)),
  total: z.coerce.number().int().catch(0),
});
