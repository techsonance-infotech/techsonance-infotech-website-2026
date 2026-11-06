# Frontend Integration Guide: GET & POST /api/admin/posts

## 1. Overview & Business Purpose
The `GET, POST /api/admin/posts` endpoints power TechSonance's administrative Blog & Content Management System (CMS). They provide high-performance listing, filtering, search, pagination, and atomic post creation for marketing articles, engineering deep-dives, case studies, and corporate news.

### Key Architectural Invariants
- **Centralized Endpoint**: Referenced strictly via `API_ENDPOINTS.ADMIN.POSTS` from `@/lib/constants/endpoints.constants`.
- **Role-Based Access Control (RBAC)**:
  - `GET`: Accessible to authenticated staff (`owner`, `admin`, `editor`, `author`, `viewer`).
  - `POST`: Restricted to authoring roles (`owner`, `admin`, `editor`, `author`). Submissions by `viewer` role are rejected with `403 FORBIDDEN`.
- **Origin & CORS Verification**: Foreign or untrusted cross-origin requests are rejected with `403 FORBIDDEN`.
- **Slug Uniqueness & Conflict Detection**: The service layer ensures the URL slug is unique within the site; duplicates return `409 CONFLICT` with targeted `fieldErrors.slug`.
- **Automatic Fallback Provisioning**: If `siteId` is not explicitly provided, it resolves seamlessly to the primary site tenant via `getDefaultSiteId()`.
- **Audit Logging & Content Versioning**: Every post creation atomically creates an entry in `ts_system_audit_logs` (`post.create`) and records initial content snapshot in `ts_content_versions` via database transactions.
- **Cache Invalidation**: Automatically calls `revalidateTag("posts")` upon post mutations.
- **Discriminated Union Envelopes**:
  - `GET`: Returns `{ ok: true, data: { posts: Post[], total: number }, posts, total }`.
  - `POST`: Returns `{ ok: true, data: { post: Post }, post }` with status `201 Created`.
  - Errors: Returns `{ ok: false, error: ErrorPayload, code: ErrorCode }`.
- **Traceability**: Emits `x-request-id` header in all responses.

---

## 2. Endpoint Specifications

### GET /api/admin/posts
Lists, filters, searches, and paginates CMS blog posts.

- **Method**: `GET`
- **Path**: `/api/admin/posts`
- **Constant**: `API_ENDPOINTS.ADMIN.POSTS`
- **Contract**: `listAdminPostsContract` in `@/lib/contracts/admin-posts.contract`
- **Authentication**: Required (`AdminSession` cookie)

#### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `PostStatus` | No | - | Filter by status: `DRAFT`, `IN_REVIEW`, `PUBLISHED`, `ARCHIVED`. |
| `search` | `string` | No | - | Case-insensitive title search query (max 200 chars). |
| `siteId` | `UUID` | No | Current Site | Filter by site tenant ID. |
| `limit` | `number` | No | `20` | Number of posts to return (1 - 100). |
| `offset` | `number` | No | `0` | Pagination offset index (>= 0). |

---

### POST /api/admin/posts
Creates a new blog post record in draft state with audit and version snapshot.

- **Method**: `POST`
- **Path**: `/api/admin/posts`
- **Constant**: `API_ENDPOINTS.ADMIN.POSTS`
- **Contract**: `createAdminPostContract` in `@/lib/contracts/admin-posts.contract`
- **Authentication**: Required (`owner`, `admin`, `editor`, `author`)
- **Content-Type**: `application/json`

#### Request Payload
| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `title` | `string` | Yes | - | Article title (3 - 200 characters). |
| `slug` | `string` | Yes | - | Unique URL slug (`/^[a-z0-9-]+$/`, 2 - 120 characters). |
| `content` | `string` | Yes | - | Article body markdown or HTML (min 10 characters). |
| `excerpt` | `string` | No | - | Short preview summary (max 500 characters). |
| `status` | `PostStatus` | No | `DRAFT` | Initial status: `DRAFT`, `IN_REVIEW`, `PUBLISHED`, `ARCHIVED`. |
| `categoryId` | `UUID` | No | - | Foreign key to category table. |
| `heroImage` | `URL` | No | - | Cover image URL. |
| `tags` | `string[]` | No | `[]` | Array of topic tags (max 20 items, max 50 chars each). |
| `readTime` | `string` | No | `"5 min read"` | Estimated reading time display string. |
| `siteId` | `UUID` | No | Auto-resolved | Target site tenant ID. |

---

## 3. Response Contracts & Envelopes

### GET 200 OK Response
```json
{
  "ok": true,
  "data": {
    "posts": [
      {
        "id": "post-uuid-2222",
        "siteId": "site-uuid-1111",
        "slug": "nextjs-16-deep-dive",
        "title": "Next.js 16 Deep Dive: Architecture and Performance",
        "excerpt": "Exploring Next.js 16 innovations and App Router patterns.",
        "content": "Comprehensive overview of server actions, streaming, and caching.",
        "status": "DRAFT",
        "tags": ["nextjs", "react", "architecture"],
        "readTime": "5 min read",
        "createdBy": "admin-uuid-1111",
        "createdAt": "2026-11-06T17:00:15.654Z",
        "updatedAt": "2026-11-06T17:00:15.654Z"
      }
    ],
    "total": 1
  },
  "posts": [ ... ],
  "total": 1
}
```

### POST 201 Created Response
```json
{
  "ok": true,
  "data": {
    "post": {
      "id": "post-uuid-new-9999",
      "siteId": "site-uuid-1111",
      "slug": "nextjs-16-deep-dive",
      "title": "Next.js 16 Deep Dive: Architecture and Performance",
      "excerpt": "Exploring Next.js 16 innovations and App Router patterns.",
      "content": "Comprehensive overview of server actions, streaming, and caching.",
      "status": "DRAFT",
      "tags": ["nextjs", "react", "architecture"],
      "readTime": "5 min read",
      "createdBy": "admin-uuid-1111",
      "createdAt": "2026-11-06T17:00:15.654Z",
      "updatedAt": "2026-11-06T17:00:15.654Z"
    }
  },
  "post": { ... }
}
```

---

## 4. Error Status Codes & Response Envelopes

| Status | Code | Trigger |
| :--- | :--- | :--- |
| `400` | `VALIDATION` / `BAD_REQUEST` | Validation error (e.g. title < 3 chars, invalid slug format, limit > 100). |
| `401` | `UNAUTHENTICATED` | Missing, expired, or invalid admin session cookie. |
| `403` | `FORBIDDEN` | Caller has `viewer` role attempting `POST`, or cross-origin check failed. |
| `409` | `CONFLICT` | Attempting to create a post with a slug that is already taken. |
| `500` | `INTERNAL` | Unexpected server, database, or network failure. |

### Error Envelope Example (409 Conflict)
```json
{
  "ok": false,
  "error": {
    "code": "CONFLICT",
    "message": "A post with slug \"existing-post\" already exists",
    "fieldErrors": {
      "slug": [
        "Slug is already taken"
      ]
    },
    "requestId": "fe1c2b77-1e49-4eb0-ab66-2ca6531405af"
  },
  "code": "CONFLICT"
}
```

---

## 5. TypeScript Frontend Client Example

```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { PostStatus } from "@/lib/constants/enums/content.enum";
import type { Result } from "@/lib/result";

export interface CreatePostPayload {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  categoryId?: string;
  heroImage?: string;
  tags?: string[];
  readTime?: string;
  status?: PostStatus;
}

export async function fetchAdminPosts(params: {
  status?: PostStatus;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Result<{ posts: any[]; total: number }>> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));

  const url = `${API_ENDPOINTS.ADMIN.POSTS}?${query.toString()}`;
  const res = await fetch(url, {
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
        message: body.error?.message || "Failed to list posts",
        fieldErrors: body.error?.fieldErrors,
      },
    };
  }

  return { ok: true, data: body.data };
}

export async function createAdminPost(
  payload: CreatePostPayload
): Promise<Result<{ post: any }>> {
  const res = await fetch(API_ENDPOINTS.ADMIN.POSTS, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await res.json();
  if (!res.ok || !body.ok) {
    return {
      ok: false,
      error: {
        code: body.error?.code || "INTERNAL",
        message: body.error?.message || "Failed to create post",
        fieldErrors: body.error?.fieldErrors,
      },
    };
  }

  return { ok: true, data: body.data };
}
```
