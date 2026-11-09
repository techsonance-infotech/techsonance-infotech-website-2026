import { z } from "zod";
import { defineContract, noParams, noQuery } from "@/lib/contracts/define";
import { PostStatus } from "@/lib/constants/enums/content.enum";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { POST_LIMITS, POST_DEFAULTS } from "@/lib/constants/posts.constants";

export const listAdminPostsQuerySchema = z.strictObject({
  status: z.enum(PostStatus).optional(),
  search: z.string().trim().max(POST_LIMITS.TITLE_MAX).optional(),
  siteId: z.string().uuid().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(POST_LIMITS.MAX_LIMIT)
    .default(POST_LIMITS.DEFAULT_LIMIT),
  offset: z.coerce.number().int().min(0).default(POST_LIMITS.DEFAULT_OFFSET),
});

export type ListAdminPostsQueryInput = z.input<typeof listAdminPostsQuerySchema>;

export const createAdminPostSchema = z.strictObject({
  siteId: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(POST_LIMITS.SLUG_MIN, `Slug must be at least ${POST_LIMITS.SLUG_MIN} characters`)
    .max(POST_LIMITS.SLUG_MAX, `Slug cannot exceed ${POST_LIMITS.SLUG_MAX} characters`)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  title: z
    .string()
    .trim()
    .min(POST_LIMITS.TITLE_MIN, `Title must be at least ${POST_LIMITS.TITLE_MIN} characters`)
    .max(POST_LIMITS.TITLE_MAX, `Title cannot exceed ${POST_LIMITS.TITLE_MAX} characters`),
  excerpt: z.string().trim().max(POST_LIMITS.EXCERPT_MAX).optional(),
  content: z
    .string()
    .min(POST_LIMITS.CONTENT_MIN, `Content must be at least ${POST_LIMITS.CONTENT_MIN} characters`),
  categoryId: z.string().uuid().optional(),
  heroImage: z.string().url().optional().or(z.literal("")),
  tags: z
    .array(z.string().trim().max(POST_LIMITS.TAG_MAX))
    .max(POST_LIMITS.TAGS_MAX_COUNT)
    .default([]),
  readTime: z.string().trim().max(POST_LIMITS.READ_TIME_MAX).default(POST_DEFAULTS.READ_TIME),
  status: z.enum(PostStatus).default(PostStatus.DRAFT),
});

export type CreateAdminPostInput = z.input<typeof createAdminPostSchema>;

export const listAdminPostsResponseSchema = z.object({
  posts: z.array(z.any()),
  total: z.number().int().min(0),
});

export const singleAdminPostResponseSchema = z.object({
  post: z.any(),
});

export const adminPostParamsSchema = z.strictObject({
  id: z.string().uuid("Invalid post ID format. Expected a valid UUID."),
});

export type AdminPostParams = z.input<typeof adminPostParamsSchema>;

export const updateAdminPostSchema = z.strictObject({
  slug: z
    .string()
    .trim()
    .min(POST_LIMITS.SLUG_MIN, `Slug must be at least ${POST_LIMITS.SLUG_MIN} characters`)
    .max(POST_LIMITS.SLUG_MAX, `Slug cannot exceed ${POST_LIMITS.SLUG_MAX} characters`)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  title: z
    .string()
    .trim()
    .min(POST_LIMITS.TITLE_MIN, `Title must be at least ${POST_LIMITS.TITLE_MIN} characters`)
    .max(POST_LIMITS.TITLE_MAX, `Title cannot exceed ${POST_LIMITS.TITLE_MAX} characters`)
    .optional(),
  excerpt: z.string().trim().max(POST_LIMITS.EXCERPT_MAX).optional(),
  content: z
    .string()
    .min(POST_LIMITS.CONTENT_MIN, `Content must be at least ${POST_LIMITS.CONTENT_MIN} characters`)
    .optional(),
  categoryId: z.string().uuid().optional().nullable(),
  heroImage: z.string().url().optional().or(z.literal("")),
  tags: z
    .array(z.string().trim().max(POST_LIMITS.TAG_MAX))
    .max(POST_LIMITS.TAGS_MAX_COUNT)
    .optional(),
  readTime: z.string().trim().max(POST_LIMITS.READ_TIME_MAX).optional(),
  status: z.enum(PostStatus).optional(),
});

export type UpdateAdminPostInput = z.input<typeof updateAdminPostSchema>;

export const deleteAdminPostResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const listAdminPostsContract = defineContract({
  method: "GET",
  path: API_ENDPOINTS.ADMIN.POSTS,
  auth: "required",
  params: noParams,
  query: listAdminPostsQuerySchema,
  body: z.undefined(),
  response: listAdminPostsResponseSchema,
  status: 200,
});

export const createAdminPostContract = defineContract({
  method: "POST",
  path: API_ENDPOINTS.ADMIN.POSTS,
  auth: "required",
  params: noParams,
  query: noQuery,
  body: createAdminPostSchema,
  response: singleAdminPostResponseSchema,
  status: 201,
});

export const getAdminPostContract = defineContract({
  method: "GET",
  path: API_ENDPOINTS.ADMIN.POST(":id"),
  auth: "required",
  params: adminPostParamsSchema,
  query: noQuery,
  body: z.undefined(),
  response: singleAdminPostResponseSchema,
  status: 200,
});

export const updateAdminPostContract = defineContract({
  method: "PATCH",
  path: API_ENDPOINTS.ADMIN.POST(":id"),
  auth: "required",
  params: adminPostParamsSchema,
  query: noQuery,
  body: updateAdminPostSchema,
  response: singleAdminPostResponseSchema,
  status: 200,
});

export const deleteAdminPostContract = defineContract({
  method: "DELETE",
  path: API_ENDPOINTS.ADMIN.POST(":id"),
  auth: "required",
  params: adminPostParamsSchema,
  query: noQuery,
  body: z.undefined(),
  response: deleteAdminPostResponseSchema,
  status: 200,
});

export const publishAdminPostContract = defineContract({
  method: "POST",
  path: API_ENDPOINTS.ADMIN.POST_PUBLISH(":id"),
  auth: "required",
  params: adminPostParamsSchema,
  query: noQuery,
  body: z.undefined(),
  response: singleAdminPostResponseSchema,
  status: 200,
});

export const submitAdminPostContract = defineContract({
  method: "POST",
  path: API_ENDPOINTS.ADMIN.POST_SUBMIT(":id"),
  auth: "required",
  params: adminPostParamsSchema,
  query: noQuery,
  body: z.undefined(),
  response: singleAdminPostResponseSchema,
  status: 200,
});

export const generateThumbnailInputSchema = z.strictObject({
  postId: z.uuid().optional(),
  title: z.string().trim().min(3).max(300),
  prompt: z.string().trim().max(1000).optional(),
});
export type GenerateThumbnailInput = z.infer<typeof generateThumbnailInputSchema>;

export const generateThumbnailResponseSchema = z.strictObject({
  url: z.string(),
  provider: z.string(),
  prompt: z.string(),
  alt: z.string(),
  thumbnailMissing: z.boolean(),
});
export type GenerateThumbnailResponse = z.infer<typeof generateThumbnailResponseSchema>;

export const generateThumbnailContract = defineContract({
  method: "POST",
  path: API_ENDPOINTS.ADMIN.POST_THUMBNAIL_GENERATE,
  auth: "required",
  params: noParams,
  query: noQuery,
  body: generateThumbnailInputSchema,
  response: generateThumbnailResponseSchema,
  status: 200,
});
