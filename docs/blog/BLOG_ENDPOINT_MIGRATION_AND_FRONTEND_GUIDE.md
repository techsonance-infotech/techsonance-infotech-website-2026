# Blog & CMS Endpoint Migration & Frontend Integration Guide

**Domain:** Agency Admin Control Plane — Blog & Content Management  
**Section Scope:** `/api/admin/blog/posts`  
**Target Audience:** Frontend Engineers, Full-Stack Developers, QA Engineers  
**Date of Refactor:** November 2026  

---

## 1. Executive Summary & Historical Context

Initially, blog post management endpoints were placed directly at `/api/admin/posts`. This introduced two significant architectural and communication issues:
1. **HTTP Method Collision / Grammatical Ambiguity**: Requests such as `POST /api/admin/posts` conflated the HTTP method verb (`POST`) with the entity noun (`posts`), creating confusion in logging, routing documentation, and client integrations.
2. **Missing Section Context**: The agency admin platform is partitioned into discrete domain modules (e.g. `/api/admin/careers/jobs`, `/api/admin/careers/applications`, `/api/admin/ai/...`). Leaving blog articles at `/api/admin/posts` obscured their belonging to the **Blog / Editorial CMS** section.

**Resolution:**  
All endpoints have been formally migrated and consolidated under the canonical, domain-scoped namespace **`/api/admin/blog/posts`**. The obsolete `/api/admin/posts` route handlers have been excised, and client calls across [`app/admin/blog/page.tsx`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/app/admin/blog/page.tsx) and [`components/admin/PostEditor.tsx`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/components/admin/PostEditor.tsx) have been re-targeted to use the centralized [`API_ENDPOINTS.ADMIN.BLOG`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/lib/constants/endpoints.constants.ts) registry.

---

## 2. Endpoint History & Mapping Matrix

| Historical Legacy Path (Removed) | New Canonical Endpoint | Method | Required RBAC Role | Purpose & Business Lifecycle Phase |
| :--- | :--- | :--- | :--- | :--- |
| `/api/admin/posts` | `/api/admin/blog/posts` | `GET` | Authenticated Staff (`viewer`+) | Lists, searches, and filters articles by status (`DRAFT`, `IN_REVIEW`, `PUBLISHED`, `ARCHIVED`). |
| `/api/admin/posts` | `/api/admin/blog/posts` | `POST` | Authoring Staff (`author`, `editor`, `admin`, `owner`) | Creates a new article draft with slug conflict detection and initial version snapshot. |
| `/api/admin/posts/[id]` | `/api/admin/blog/posts/[id]` | `GET` | Authenticated Staff (`viewer`+) | Retrieves a single post's full content and relational metadata by UUID. |
| `/api/admin/posts/[id]` | `/api/admin/blog/posts/[id]` | `PATCH` | Authoring Staff (`author`, `editor`, `admin`, `owner`) | Updates article content, tags, or metadata; increments `versionId`; archives previous state. |
| `/api/admin/posts/[id]` | `/api/admin/blog/posts/[id]` | `DELETE` | Editorial Staff (`editor`, `admin`, `owner`) | Deletes an article permanently with audit log (`post.delete`) and clears ISR caches. |
| `/api/admin/posts/[id]/publish` | `/api/admin/blog/posts/[id]/publish` | `POST` | Editorial Staff (`editor`, `admin`, `owner`) | Transitions post to `PUBLISHED`, sets `publishedAt = new Date()`, bumps version, and flushes ISR caches (`posts`, `post:<slug>`). |
| `/api/admin/posts/[id]/submit` | `/api/admin/blog/posts/[id]/submit` | `POST` | Authoring Staff (`author`, `editor`, `admin`, `owner`) | Transitions a draft post to `IN_REVIEW` status for editorial review and scheduling. |

---

## 3. Changed Behaviors & Security Invariants

When migrating frontend code to the new canonical routes, be aware of the following enforced behavioral contracts:

### A. Centralized Route Registry (`API_ENDPOINTS`)
Hardcoded route strings are strictly banned (Rules 01 & 12). All frontend requests must reference:
```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

// Available constants:
API_ENDPOINTS.ADMIN.BLOG.POSTS               // "/api/admin/blog/posts"
API_ENDPOINTS.ADMIN.BLOG.POST(id)            // "/api/admin/blog/posts/:id"
API_ENDPOINTS.ADMIN.BLOG.POST_PUBLISH(id)    // "/api/admin/blog/posts/:id/publish"
API_ENDPOINTS.ADMIN.BLOG.POST_SUBMIT(id)     // "/api/admin/blog/posts/:id/submit"
```

### B. Standardized Response Envelopes
All responses conform strictly to the project discriminated union envelope:
* **Success Envelope (200 / 201)**:
  ```json
  {
    "ok": true,
    "data": {
      "post": { /* post fields */ }
    },
    "post": { /* direct access compatibility */ },
    "message": "Action completed successfully"
  }
  ```
* **Failure Envelope (4xx / 5xx)**:
  ```json
  {
    "ok": false,
    "error": {
      "code": "VALIDATION | UNAUTHENTICATED | FORBIDDEN | NOT_FOUND | CONFLICT | INTERNAL",
      "message": "Human-readable safe explanation",
      "fieldErrors": { "slug": ["Slug is already taken"] },
      "requestId": "uuid-v4-string"
    },
    "code": "..."
  }
  ```

### C. Enhanced Role-Based Authorization
* **Viewers (`viewer`)**: Can only read via `GET`. Calling `POST`, `PATCH`, or `DELETE` returns `403 FORBIDDEN` (`POST_ERRORS.FORBIDDEN_ROLE`).
* **Authors (`author`)**: Can create drafts (`POST`), update content (`PATCH`), and submit for review (`POST .../submit`). Attempting to publish or delete returns `403 FORBIDDEN` (`POST_ERRORS.FORBIDDEN_PUBLISH` / `FORBIDDEN_DELETE`).
* **Editors & Admins (`editor`, `admin`, `owner`)**: Hold full lifecycle control including publishing and deletion.

### D. Origin Checking (CSRF Defense)
Any request carrying a foreign or untrusted `Origin` header is rejected immediately with `403 FORBIDDEN` (`POST_ERRORS.FORBIDDEN_ORIGIN`).

### E. Automatic Optimistic Versioning & Content Recovery
Every update (`PATCH`), submission (`submit`), or publication (`publish`) automatically increments `post.versionId` and stores the previous snapshot in `ts_content_versions`.

---

## 4. Frontend Integration Examples (Next.js & React)

### 1. Fetching & Filtering Blog Posts
```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import type { AdminPost } from "@/lib/types/admin.types";

export async function fetchBlogPosts(status?: string, search?: string): Promise<AdminPost[]> {
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.set("status", status);
  if (search?.trim()) params.set("search", search.trim());

  const url = `${API_ENDPOINTS.ADMIN.BLOG.POSTS}?${params.toString()}`;
  const res = await fetch(url, { credentials: "include" });
  const json = await res.json();

  if (!res.ok || !json.ok) {
    throw new Error(json.error?.message || "Failed to load blog posts");
  }

  return json.data?.posts || json.posts || [];
}
```

### 2. Creating a New Blog Post Draft
```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

export interface CreatePostPayload {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  heroImage?: string;
  tags?: string[];
  readTime?: string;
}

export async function createBlogPost(payload: CreatePostPayload) {
  const res = await fetch(API_ENDPOINTS.ADMIN.BLOG.POSTS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    // Check for field-specific errors (e.g. duplicate slug)
    if (json.error?.fieldErrors) {
      throw { message: json.error.message, fieldErrors: json.error.fieldErrors };
    }
    throw new Error(json.error?.message || "Failed to create post");
  }

  return json.data.post;
}
```

### 3. Submitting a Post for Editorial Review
```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

export async function submitPostForReview(postId: string) {
  const endpoint = API_ENDPOINTS.ADMIN.BLOG.POST_SUBMIT(postId);
  const res = await fetch(endpoint, {
    method: "POST",
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error?.message || "Failed to submit post for review");
  }

  return json.data.post;
}
```

### 4. Publishing an Article (Editor / Admin Only)
```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

export async function publishBlogPost(postId: string) {
  const endpoint = API_ENDPOINTS.ADMIN.BLOG.POST_PUBLISH(postId);
  const res = await fetch(endpoint, {
    method: "POST",
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error?.message || "Failed to publish post");
  }

  return json.data.post;
}
```

### 5. Deleting an Article
```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

export async function deleteBlogPost(postId: string): Promise<boolean> {
  const endpoint = API_ENDPOINTS.ADMIN.BLOG.POST(postId);
  const res = await fetch(endpoint, {
    method: "DELETE",
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error?.message || "Failed to delete post");
  }

  return true;
}
```

---

## 5. Verification Checklist for Frontend PRs

When updating or reviewing client components touching the Blog section:
- [x] All requests target `API_ENDPOINTS.ADMIN.BLOG.*` (no `/api/admin/posts` hardcoded strings).
- [x] Responses check `json.ok === true` before accessing `json.data.post`.
- [x] Form validation checks `json.error.fieldErrors` to display inline errors on the `slug` and `title` fields.
- [x] Role restrictions on "Publish" and "Delete" buttons check the current user's session role before displaying action triggers.
- [x] Zero references remain to deleted `/api/admin/posts/` routes.
