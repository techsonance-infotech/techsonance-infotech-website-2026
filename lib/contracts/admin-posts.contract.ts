import { z } from "zod";
import { defineContract, noParams, noQuery } from "@/lib/contracts/define";
import { PostStatus } from "@/lib/constants/enums/content.enum";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { POST_LIMITS, POST_DEFAULTS } from "@/lib/constants/posts.constants";

export const listAdminPostsQuerySchema = z.strictObject({
  status: z.nativeEnum(PostStatus).optional(),
  search: z.string().trim().max(POST_LIMITS.TITLE_MAX).optional(),
  siteId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(POST_LIMITS.MAX_LIMIT).default(POST_LIMITS.DEFAULT_LIMIT),
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
  content: z.string().min(POST_LIMITS.CONTENT_MIN, `Content must be at least ${POST_LIMITS.CONTENT_MIN} characters`),
  categoryId: z.string().uuid().optional(),
  heroImage: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string().trim().max(POST_LIMITS.TAG_MAX)).max(POST_LIMITS.TAGS_MAX_COUNT).default([]),
  readTime: z.string().trim().max(POST_LIMITS.READ_TIME_MAX).default(POST_DEFAULTS.READ_TIME),
  status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
});

export type CreateAdminPostInput = z.input<typeof createAdminPostSchema>;

export const listAdminPostsResponseSchema = z.object({
  posts: z.array(z.any()),
  total: z.number().int().min(0),
});

export const singleAdminPostResponseSchema = z.object({
  post: z.any(),
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
