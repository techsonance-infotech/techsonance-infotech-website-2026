import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import type { AdminPost } from "@/lib/types/admin.types";

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

/**
 * Creates a new blog post.
 * Endpoint: POST /api/admin/blog/posts
 */
export async function createPost(payload: CreatePostPayload): Promise<AdminPost> {
  const url = API_ENDPOINTS.ADMIN.BLOG.POSTS;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg = resJson.error?.message || resJson.message || "Failed to create post";
    throw new Error(errorMsg);
  }

  return resJson.data?.post || resJson.post;
}

/**
 * Updates an existing blog post by ID.
 * Endpoint: PATCH /api/admin/blog/posts/[id]
 */
export async function updatePost(postId: string, payload: UpdatePostPayload): Promise<AdminPost> {
  const url = API_ENDPOINTS.ADMIN.BLOG.POST(postId);

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg = resJson.error?.message || resJson.message || "Failed to update post";
    throw new Error(errorMsg);
  }

  return resJson.data?.post || resJson.post;
}

/**
 * Submits a draft blog post for editorial review.
 * Endpoint: POST /api/admin/blog/posts/[id]/submit
 */
export async function submitPostForReview(postId: string): Promise<SubmitPostForReviewResponse> {
  const url = API_ENDPOINTS.ADMIN.BLOG.POST_SUBMIT(postId);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const payload: SubmitPostForReviewResponse = await response.json();

  if (!response.ok || !payload.ok) {
    const errorMsg =
      payload.error?.message || payload.message || "Failed to submit post for review";
    throw new Error(errorMsg);
  }

  return payload;
}

/**
 * Publishes a draft or in-review blog post to live status and triggers ISR cache revalidation.
 * Endpoint: POST /api/admin/blog/posts/[id]/publish
 */
export async function publishPost(postId: string): Promise<PublishPostResponse> {
  const url = API_ENDPOINTS.ADMIN.BLOG.POST_PUBLISH(postId);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const payload: PublishPostResponse = await response.json();

  if (!response.ok || !payload.ok) {
    const errorMsg = payload.error?.message || payload.message || "Failed to publish post";
    throw new Error(errorMsg);
  }

  return payload;
}

/**
 * Deletes a blog post and records an audit log.
 * Endpoint: DELETE /api/admin/blog/posts/[id]
 */
export async function deletePost(postId: string): Promise<DeletePostResponse> {
  const url = API_ENDPOINTS.ADMIN.BLOG.POST(postId);

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const payload: DeletePostResponse = await response.json();

  if (!response.ok || !payload.ok) {
    const errorMsg = payload.error?.message || payload.message || "Failed to delete post";
    throw new Error(errorMsg);
  }

  return payload;
}

/**
 * Retrieves a single post by ID with relations.
 * Endpoint: GET /api/admin/blog/posts/[id]
 */
export async function getPostById(postId: string): Promise<AdminPost> {
  const url = API_ENDPOINTS.ADMIN.BLOG.POST(postId);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const payload: SinglePostResponse = await response.json();

  if (!response.ok || !payload.ok) {
    const errorMsg = payload.error?.message || "Failed to retrieve post";
    throw new Error(errorMsg);
  }

  return payload.data?.post || payload.post;
}

/**
 * Lists posts with search, status filtering, and pagination.
 * Endpoint: GET /api/admin/blog/posts
 */
export async function listPosts(query?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ListPostsResponse> {
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

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const payload: ListPostsResponse = await response.json();

  if (!response.ok || !payload.ok) {
    const errorMsg = payload.error?.message || "Failed to list posts";
    throw new Error(errorMsg);
  }

  return payload;
}
