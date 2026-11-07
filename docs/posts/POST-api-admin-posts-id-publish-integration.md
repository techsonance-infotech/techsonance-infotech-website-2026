# Frontend Integration Guide: POST /api/admin/posts/[id]/publish

## 1. Overview & Business Purpose
The `POST /api/admin/posts/[id]/publish` endpoint transitions a blog or CMS post into the `PUBLISHED` state. It timestamps the article with `publishedAt = new Date()`, increments the content `versionId`, writes an immutable audit record (`post.publish`), and triggers on-demand cache revalidation for Next.js ISR tags (`posts` and `post:<slug>`).

### Key Architectural Invariants
- **Centralized Endpoint**: Referenced strictly via `API_ENDPOINTS.ADMIN.POST_PUBLISH(id)` from `@/lib/constants/endpoints.constants`.
- **Role-Based Access Control (RBAC)**: Restricted to editorial management (`owner`, `admin`, `editor`). Submissions by `author` or `viewer` accounts receive `403 FORBIDDEN`.
- **Param Validation**: Post ID must be a strictly formatted UUID v4 string. Invalid UUID formats fail fast with `400 VALIDATION`.
- **Cache Invalidation**: Triggers instant on-demand cache revalidation for `posts` and `post:<slug>` tags.
- **Traceability**: Injects unique `x-request-id` header in all responses.

---

## 2. Endpoint Specification

### POST /api/admin/posts/[id]/publish
Publishes a draft or in-review blog post.

- **Method**: `POST`
- **Path**: `/api/admin/posts/[id]/publish`
- **Constant**: `API_ENDPOINTS.ADMIN.POST_PUBLISH(id)`
- **Contract**: `publishAdminPostContract` in `@/lib/contracts/admin-posts.contract`
- **Authentication**: Required (`owner`, `admin`, `editor`)
- **Headers**:
  - `Content-Type: application/json`
  - `Origin`: Must match allowed application origin

#### URL Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Yes | Unique identifier of the blog post to publish. |

#### Request Body
No request body is required (`z.undefined()`).

---

## 3. Response Envelopes & Status Codes

### Success Response (HTTP 200 OK)
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
      "status": "PUBLISHED",
      "tags": ["nextjs", "react", "architecture"],
      "readTime": "5 min read",
      "versionId": 2,
      "publishedAt": "2026-11-07T03:48:42.239Z",
      "createdBy": "admin-uuid-1111",
      "createdAt": "2026-11-07T03:48:42.220Z",
      "updatedAt": "2026-11-07T03:48:42.221Z",
      "updatedBy": "admin-uuid-1111"
    }
  },
  "post": {
    "id": "b1111111-2222-4333-8444-555555555555",
    "siteId": "site-uuid-1111",
    "slug": "nextjs-16-deep-dive",
    "title": "Next.js 16 Deep Dive: Architecture and Performance",
    "excerpt": "Exploring Next.js 16 innovations and App Router patterns.",
    "content": "Comprehensive overview of server actions, streaming, and caching.",
    "status": "PUBLISHED",
    "tags": ["nextjs", "react", "architecture"],
    "readTime": "5 min read",
    "versionId": 2,
    "publishedAt": "2026-11-07T03:48:42.239Z",
    "createdBy": "admin-uuid-1111",
    "createdAt": "2026-11-07T03:48:42.220Z",
    "updatedAt": "2026-11-07T03:48:42.221Z",
    "updatedBy": "admin-uuid-1111"
  },
  "message": "Post published successfully"
}
```

### Error Responses

#### 401 Unauthorized (No Session)
```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Unauthorized access. Please log in as an administrator.",
    "requestId": "11d5add7-655b-4685-a175-57c8e8e0b9c8"
  },
  "code": "UNAUTHENTICATED"
}
```

#### 403 Forbidden (Insufficient Role or Origin Mismatch)
```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Forbidden: editor or higher required to publish posts.",
    "requestId": "ae21df1d-a722-4e8d-b4ec-25e2104768ca"
  },
  "code": "FORBIDDEN"
}
```

#### 400 Validation Error (Invalid UUID)
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION",
    "message": "Invalid post ID format. Expected a valid UUID.",
    "fieldErrors": {
      "id": ["Invalid post ID format. Expected a valid UUID."]
    },
    "requestId": "8a04e729-c835-441c-b561-55a662106c3c"
  },
  "code": "VALIDATION"
}
```

#### 404 Not Found
```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested post could not be found.",
    "requestId": "c4bb150d-dfbe-46e3-ae33-b9187e1f4405"
  },
  "code": "NOT_FOUND"
}
```

---

## 4. TypeScript Client Implementation

```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

export interface PublishPostResponse {
  ok: boolean;
  data: {
    post: {
      id: string;
      slug: string;
      title: string;
      status: "PUBLISHED";
      publishedAt: string;
      versionId: number;
    };
  };
  message?: string;
  error?: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId?: string;
  };
}

export async function publishPost(postId: string): Promise<PublishPostResponse> {
  const endpoint = API_ENDPOINTS.ADMIN.POST_PUBLISH(postId);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const json: PublishPostResponse = await response.json();
  if (!response.ok || !json.ok) {
    throw new Error(json.error?.message || "Failed to publish post");
  }

  return json;
}
```
