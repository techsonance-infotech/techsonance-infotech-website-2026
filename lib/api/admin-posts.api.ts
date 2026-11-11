import { z } from "zod";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import type { AdminPost } from "@/lib/types/admin.types";
import { safeFetch } from "@/lib/http/safeFetch";
import {
  SafeAdminPostsListResponseSchema,
  SafeAdminPostItemSchema,
} from "@/lib/validations/admin-blog-boundary.schema";

export interface SubmitPostForReviewResponse {
  ok: boolean;
  data: {
    post: AdminPost;
  };
  post: AdminPost;
  message?: string;
  error?: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId?: string;
  };
}

export interface PublishPostResponse {
  ok: boolean;
  data: {
    post: AdminPost;
  };
  post: AdminPost;
  message?: string;
  error?: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId?: string;
  };
}

export interface DeletePostResponse {
  ok: boolean;
  data: {
    success: boolean;
    message: string;
  };
  message?: string;
  error?: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId?: string;
  };
}

export interface SinglePostResponse {
  ok: boolean;
  data: {
    post: AdminPost;
  };
  post: AdminPost;
  error?: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId?: string;
  };
}

export interface ListPostsResponse {
  ok: boolean;
  data: {
    posts: AdminPost[];
    total: number;
  };
  posts: AdminPost[];
  total: number;
  error?: {
    code: string;
    message: string;
    requestId?: string;
  };
}

export interface CreatePostPayload {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status?: string;
  categoryId?: string | null;
  heroImage?: string;
  tags?: string[];
  readTime?: string;
  siteId?: string;
}

export type UpdatePostPayload = Partial<CreatePostPayload>;

const SinglePostResponseSchema = z
  .object({
    post: z.any(),
  })
  .or(SafeAdminPostItemSchema)
  .or(z.object({ id: z.string(), title: z.string() }));

/**
 * Creates a new blog post.
 * Endpoint: POST /api/admin/blog/posts
 */
export async function createPost(
  payload: CreatePostPayload,
  signal?: AbortSignal,
): Promise<AdminPost> {
  const url = API_ENDPOINTS.ADMIN.BLOG.POSTS;

  const data = await safeFetch(url, SinglePostResponseSchema, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
    signal,
  });

  return (data && "post" in data ? data.post : data) as unknown as AdminPost;
}

/**
 * Updates an existing blog post by ID.
 * Endpoint: PATCH /api/admin/blog/posts/[id]
 */
export async function updatePost(
  postId: string,
  payload: UpdatePostPayload,
  signal?: AbortSignal,
): Promise<AdminPost> {
  const url = API_ENDPOINTS.ADMIN.BLOG.POST(postId);

  const data = await safeFetch(url, SinglePostResponseSchema, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
    signal,
  });

  return (data && "post" in data ? data.post : data) as unknown as AdminPost;
}

/**
 * Submits a draft blog post for editorial review.
 * Endpoint: POST /api/admin/blog/posts/[id]/submit
 */
export async function submitPostForReview(
  postId: string,
  signal?: AbortSignal,
): Promise<SubmitPostForReviewResponse> {
  const url = API_ENDPOINTS.ADMIN.BLOG.POST_SUBMIT(postId);

  const data = await safeFetch(url, z.any(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    signal,
  });

  const post = (data && "post" in data ? data.post : data?.data?.post || data) as AdminPost;
  const message = data?.message || "Post submitted for editorial review successfully";

  return {
    ok: true,
    data: { post },
    post,
    message,
  };
}

/**
 * Publishes a draft or in-review blog post to live status and triggers ISR cache revalidation.
 * Endpoint: POST /api/admin/blog/posts/[id]/publish
 */
export async function publishPost(
  postId: string,
  signal?: AbortSignal,
): Promise<PublishPostResponse> {
  const url = API_ENDPOINTS.ADMIN.BLOG.POST_PUBLISH(postId);

  const data = await safeFetch(url, z.any(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    signal,
  });

  const post = (data && "post" in data ? data.post : data?.data?.post || data) as AdminPost;
  const message = data?.message || "Post published successfully";

  return {
    ok: true,
    data: { post },
    post,
    message,
  };
}

/**
 * Deletes a blog post and records an audit log.
 * Endpoint: DELETE /api/admin/blog/posts/[id]
 */
export async function deletePost(
  postId: string,
  signal?: AbortSignal,
): Promise<DeletePostResponse> {
  const url = API_ENDPOINTS.ADMIN.BLOG.POST(postId);

  const data = await safeFetch(url, z.any(), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    signal,
  });

  const message = data?.message || data?.data?.message || "Post deleted successfully";

  return {
    ok: true,
    data: { success: true, message },
    message,
  };
}

/**
 * Retrieves a single post by ID with relations.
 * Endpoint: GET /api/admin/blog/posts/[id]
 */
export async function getPostById(postId: string, signal?: AbortSignal): Promise<AdminPost> {
  const url = API_ENDPOINTS.ADMIN.BLOG.POST(postId);

  const data = await safeFetch(url, SinglePostResponseSchema, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    signal,
  });

  return (data && "post" in data ? data.post : data) as unknown as AdminPost;
}

/**
 * Lists posts with search, status filtering, and pagination.
 * Endpoint: GET /api/admin/blog/posts
 */
export async function listPosts(
  query?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  },
  signal?: AbortSignal,
): Promise<ListPostsResponse> {
  const params = new URLSearchParams();
  if (query?.status && query.status !== "ALL") {
    params.set("status", query.status);
  }
  if (query?.search && query.search.trim()) {
    params.set("search", query.search.trim());
  }
  if (query?.limit) {
    params.set("limit", String(query.limit));
  }
  if (query?.offset) {
    params.set("offset", String(query.offset));
  }

  const qs = params.toString();
  const url = `${API_ENDPOINTS.ADMIN.BLOG.POSTS}${qs ? `?${qs}` : ""}`;

  const data = await safeFetch(url, SafeAdminPostsListResponseSchema, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    signal,
  });

  const posts = (data.posts || []) as unknown as AdminPost[];
  const total = data.total ?? posts.length;

  return {
    ok: true,
    data: { posts, total },
    posts,
    total,
  };
}

export interface GeneratePostThumbnailResponse {
  ok: boolean;
  data: {
    url: string;
    provider: string;
    prompt: string;
    alt: string;
    thumbnailMissing: boolean;
  };
}

export interface GeneratePostThumbnailInput {
  postId?: string;
  title: string;
  prompt?: string;
  summary?: string;
  contentExcerpt?: string;
  category?: string;
  keywords?: string[];
}

export async function generatePostThumbnail(
  input: GeneratePostThumbnailInput,
  signal?: AbortSignal,
): Promise<GeneratePostThumbnailResponse> {
  const schema = z.strictObject({
    url: z.string(),
    provider: z.string(),
    prompt: z.string(),
    alt: z.string(),
    thumbnailMissing: z.boolean(),
  });

  const data = await safeFetch(API_ENDPOINTS.ADMIN.BLOG.POST_THUMBNAIL_GENERATE, schema, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
    signal,
    timeoutMs: 180_000, // 3 minutes timeout to allow full 3-attempt AI image generation and verification loop
  });

  return {
    ok: true,
    data,
  };
}

export interface AiRevisePostInput {
  instruction: string;
  targetSectionHeading?: string;
  autoPublish?: boolean;
}

export interface AiRevisePostResponse {
  ok: boolean;
  data: {
    success: boolean;
    postId: string;
    status: string;
    summary: string;
    validationErrors?: string[];
  };
  message?: string;
}

export async function aiRevisePost(
  postId: string,
  input: AiRevisePostInput,
  signal?: AbortSignal,
): Promise<AiRevisePostResponse> {
  const schema = z.strictObject({
    success: z.boolean(),
    postId: z.string(),
    status: z.string(),
    summary: z.string(),
    validationErrors: z.array(z.string()).optional(),
  });

  const endpoint = API_ENDPOINTS.ADMIN.BLOG.POST_AI_REVISE(postId);
  const data = await safeFetch(endpoint, schema, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
    signal,
    timeoutMs: 180_000,
  });

  return {
    ok: true,
    data,
  };
}
