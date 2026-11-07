# Frontend Integration Guide: POST /api/admin/blog/posts/[id]/submit

## 1. Overview & Business Purpose
The `POST /api/admin/blog/posts/[id]/submit` (legacy alias: `/api/admin/posts/[id]/submit`) endpoint transitions a draft blog post into the `IN_REVIEW` status. This notifies editorial staff that an article is complete and ready for editorial assessment, proofreading, and publishing scheduling.

### Key Architectural Invariants
- **Centralized Endpoint**: Referenced via `API_ENDPOINTS.ADMIN.BLOG.POST_SUBMIT(id)` (or `API_ENDPOINTS.ADMIN.POST_SUBMIT(id)`) from `@/lib/constants/endpoints.constants`.
- **Role-Based Access Control (RBAC)**: Permitted for authoring staff (`author`, `editor`, `admin`, `owner`). Read-only `viewer` accounts receive `403 FORBIDDEN`.
- **Param Validation**: Post ID must be a strictly formatted UUID v4 string. Invalid UUID formats fail fast with `400 VALIDATION`.
- **State Transition Guard**: Only articles currently in `DRAFT` status can be transitioned into `IN_REVIEW`.
- **Traceability**: Injects unique `x-request-id` header in all responses.

---

## 2. Endpoint Specification

### POST /api/admin/blog/posts/[id]/submit
Submits a draft blog post for editorial review.

- **Method**: `POST`
- **Path**: `/api/admin/blog/posts/[id]/submit`
- **Constant**: `API_ENDPOINTS.ADMIN.BLOG.POST_SUBMIT(id)`
- **Contract**: `submitAdminPostContract` in `@/lib/contracts/admin-posts.contract`
- **Authentication**: Required (`author`, `editor`, `admin`, `owner`)
- **Headers**:
  - `Content-Type: application/json`
  - `Origin`: Must match allowed application origin

#### URL Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Yes | Unique identifier of the blog post to submit for review. |

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
      "slug": "agentic-ai-orchestration-2026",
      "title": "Agentic AI Orchestration in 2026",
      "excerpt": "A deep dive into multi-agent systems and deterministic validation.",
      "content": "Full article markdown content...",
      "status": "IN_REVIEW",
      "tags": ["ai", "agents", "architecture"],
      "readTime": "6 min read",
      "versionId": 1,
      "publishedAt": null,
      "createdBy": "author-uuid-1111",
      "createdAt": "2026-11-07T03:00:00.000Z",
      "updatedAt": "2026-11-07T03:30:00.000Z"
    }
  },
  "post": { ... },
  "message": "Post submitted for editorial review successfully"
}
```

---

## 4. HTTP Status Code & Error Matrix

| Status | Code Enum           | Message / Trigger                                                 |
| ------ | ------------------- | ----------------------------------------------------------------- |
| `200`  | —                   | Post successfully transitioned to `IN_REVIEW` status              |
| `400`  | `VALIDATION`        | Post ID is not a valid UUID format                                |
| `401`  | `UNAUTHENTICATED`   | Missing or expired session authentication                         |
| `403`  | `FORBIDDEN`         | Foreign origin or user role lacks author permissions (`viewer`)   |
| `404`  | `NOT_FOUND`         | Post ID does not exist                                            |
| `500`  | `INTERNAL`          | Unexpected database or server error                               |

---

## 5. TypeScript Client Example

```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

export async function submitPostForReview(postId: string) {
  const url = API_ENDPOINTS.ADMIN.BLOG.POST_SUBMIT(postId);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const payload = await response.json();

  if (!response.ok) {
    const errorMsg = payload.error?.message || "Failed to submit post for review";
    throw new Error(errorMsg);
  }

  return payload.data.post;
}
```

---

## 6. Verification & Black-Box Execution

### Run Vitest Integration Suite
```bash
npx vitest run tests/admin-posts-submit-blackbox.test.ts
```
