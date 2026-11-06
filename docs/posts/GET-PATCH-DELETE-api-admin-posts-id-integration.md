# Frontend Integration Guide: GET, PATCH, DELETE /api/admin/posts/[id]

## 1. Overview & Business Purpose
The `GET, PATCH, DELETE /api/admin/posts/[id]` endpoints manage individual Blog and CMS post lifecycles. They enable administrators to view complete article details (with relational category metadata and tag taxonomies), update drafts and published content with automatic optimistic versioning snapshots, and delete posts with transactional audit logging.

### Key Architectural Invariants
- **Centralized Endpoint**: Referenced strictly via `API_ENDPOINTS.ADMIN.POST(id)` from `@/lib/constants/endpoints.constants`.
- **Role-Based Access Control (RBAC)**:
  - `GET`: Accessible to authenticated staff (`owner`, `admin`, `editor`, `author`, `viewer`).
  - `PATCH`: Restricted to authoring staff (`owner`, `admin`, `editor`, `author`). Callers with `viewer` role receive `403 FORBIDDEN`.
  - `DELETE`: Restricted to elevated roles (`owner`, `admin`, `editor`). Submissions by `author` or `viewer` receive `403 FORBIDDEN`.
- **Param Validation**: Post ID must be a strictly formatted UUID v4 string. Invalid UUID formats fail fast with `400 VALIDATION`.
- **Slug Conflict Prevention**: When updating the URL `slug`, the service checks for collisions against existing posts within the site. If a conflict is detected, it throws `409 CONFLICT` returning `fieldErrors.slug`.
- **Automatic Content Versioning & Audit**: Every `PATCH` operation increments `versionId` and atomically records the previous state in `ts_content_versions` and `ts_system_audit_logs` (`post.update`).
- **Cache Invalidation**: Automatically calls `revalidateTag("posts")` and `revalidateTag("post:<slug>")` when published posts are updated or deleted.
- **Traceability**: Emits `x-request-id` header in all responses.

---

## 2. Endpoint Specifications

### GET /api/admin/posts/[id]
Fetches a single post by UUID.

- **Method**: `GET`
- **Path**: `/api/admin/posts/[id]`
- **Constant**: `API_ENDPOINTS.ADMIN.POST(id)`
- **Contract**: `getAdminPostContract` in `@/lib/contracts/admin-posts.contract`
- **Authentication**: Required (`AdminSession` cookie)

#### URL Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Yes | Unique identifier of the blog post. |

---

### PATCH /api/admin/posts/[id]
Updates post attributes, content, or metadata with automatic version incrementation.

- **Method**: `PATCH`
- **Path**: `/api/admin/posts/[id]`
- **Constant**: `API_ENDPOINTS.ADMIN.POST(id)`
- **Contract**: `updateAdminPostContract` in `@/lib/contracts/admin-posts.contract`
- **Authentication**: Required (`owner`, `admin`, `editor`, `author`)
- **Content-Type**: `application/json`

#### Request Payload
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | No | Updated title (3 - 200 characters). |
| `slug` | `string` | No | Updated URL slug (`/^[a-z0-9-]+$/`, 2 - 120 characters). |
| `content` | `string` | No | Updated article body (min 10 characters). |
| `excerpt` | `string` | No | Preview summary (max 500 characters). |
| `status` | `PostStatus` | No | Status update: `DRAFT`, `IN_REVIEW`, `PUBLISHED`, `ARCHIVED`. |
| `categoryId` | `UUID \| null` | No | Category foreign key. |
| `heroImage` | `URL \| ""` | No | Hero image URL. |
| `tags` | `string[]` | No | Array of tags (max 20 items, max 50 chars each). |
| `readTime` | `string` | No | Reading time string (e.g. `"7 min read"`). |

---

### DELETE /api/admin/posts/[id]
Deletes a blog post and records a `post.delete` audit record.

- **Method**: `DELETE`
- **Path**: `/api/admin/posts/[id]`
- **Constant**: `API_ENDPOINTS.ADMIN.POST(id)`
- **Contract**: `deleteAdminPostContract` in `@/lib/contracts/admin-posts.contract`
- **Authentication**: Required (`owner`, `admin`, `editor`)

---

## 3. Response Contracts & Envelopes

### GET 200 OK Response
```json
{
  "ok": true,
  "data": {
    "post": {
      "id": "b1111111-2222-4333-8444-555555555555",
      "siteId": "site-uuid-1111",
      "slug": "nextjs-16-deep-dive",
      "title": "Next.js 16 Deep Dive: Architecture and Performance",
      "excerpt": "Exploring Next.js 16 innovations and App Router patterns.",
      "content": "Comprehensive overview of server actions, streaming, and caching.",
      "status": "DRAFT",
      "tags": ["nextjs", "react", "architecture"],
      "readTime": "5 min read",
      "versionId": 1,
      "createdBy": "admin-uuid-1111",
      "createdAt": "2026-11-06T17:19:32.972Z",
      "updatedAt": "2026-11-06T17:19:32.973Z"
    }
  },
  "post": { ... }
}
```

### PATCH 200 OK Response
```json
{
  "ok": true,
  "data": {
    "post": {
      "id": "b1111111-2222-4333-8444-555555555555",
      "title": "Next.js 16 Architecture & Performance Guide (Updated)",
      "readTime": "7 min read",
      "versionId": 2,
      "updatedAt": "2026-11-06T17:20:15.000Z"
    }
  },
  "post": { ... }
}
```

### DELETE 200 OK Response
```json
{
  "ok": true,
  "data": {
    "success": true,
    "message": "Post deleted successfully"
  },
  "message": "Post deleted successfully"
}
```

---

## 4. Error Status Codes & Response Envelopes

| Status | Code | Trigger |
| :--- | :--- | :--- |
| `400` | `VALIDATION` / `BAD_REQUEST` | Invalid UUID format in URL path, or body validation failure. |
| `401` | `UNAUTHENTICATED` | Missing or invalid admin session cookie. |
| `403` | `FORBIDDEN` | Caller has `viewer` on PATCH or `author` on DELETE; or untrusted origin. |
| `404` | `NOT_FOUND` | Post with the specified UUID does not exist. |
| `409` | `CONFLICT` | Updating `slug` to one that is already taken by another post. |
| `500` | `INTERNAL` | Unexpected database or internal runtime failure. |

---

## 5. TypeScript Frontend Client Example

```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import type { Result } from "@/lib/result";
import type { UpdateAdminPostInput } from "@/lib/contracts/admin-posts.contract";

export async function getAdminPostById(id: string): Promise<Result<{ post: any }>> {
  const res = await fetch(API_ENDPOINTS.ADMIN.POST(id), {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  const body = await res.json();
  if (!res.ok || !body.ok) {
    return {
      ok: false,
      error: {
        code: body.error?.code || "INTERNAL",
        message: body.error?.message || "Failed to fetch post",
      },
    };
  }

  return { ok: true, data: body.data };
}

export async function updateAdminPost(
  id: string,
  updates: UpdateAdminPostInput
): Promise<Result<{ post: any }>> {
  const res = await fetch(API_ENDPOINTS.ADMIN.POST(id), {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  const body = await res.json();
  if (!res.ok || !body.ok) {
    return {
      ok: false,
      error: {
        code: body.error?.code || "INTERNAL",
        message: body.error?.message || "Failed to update post",
        fieldErrors: body.error?.fieldErrors,
      },
    };
  }

  return { ok: true, data: body.data };
}

export async function deleteAdminPost(id: string): Promise<Result<{ success: boolean; message: string }>> {
  const res = await fetch(API_ENDPOINTS.ADMIN.POST(id), {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  const body = await res.json();
  if (!res.ok || !body.ok) {
    return {
      ok: false,
      error: {
        code: body.error?.code || "INTERNAL",
        message: body.error?.message || "Failed to delete post",
      },
    };
  }

  return { ok: true, data: body.data };
}
```
