# POST `/api/admin/revalidate` — Integration Guide

**Domain:** Admin Governance & Next.js ISR Cache Revalidation  
**Route file:** `app/api/admin/revalidate/route.ts`  
**Contract:** `lib/contracts/admin-revalidate.contract.ts` (`adminRevalidateContract`)  
**Cache Mechanism:** Next.js `revalidateTag` & `revalidatePath` (`next/cache`)

---

## Overview

The `/api/admin/revalidate` endpoint allows authorized editors and administrators (`Editor+`) to trigger on-demand cache revalidation for Next.js ISR (Incremental Static Regeneration) cache tags and route paths across the agency platform.

---

## Endpoint Details

### `POST /api/admin/revalidate`

| Attribute       | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| **Auth**        | Required (`AdminSession` via HTTP-only cookie)                     |
| **RBAC**        | `Editor+` (`editor`, `admin`, `owner`). Viewers & Authors rejected |
| **Origin**      | Enforced — foreign cross-site origins → `403 Forbidden`            |
| **Cache**       | `private, no-store`                                                |
| **Default Tags**| `["posts", "jobs", "categories"]` if no tags/paths provided        |
| **Response**    | `200 OK` with `{ ok: true, data: { revalidatedTags, revalidatedPaths, timestamp, message } }` |

---

## Request & Response Schemas

### Request Headers

```http
POST /api/admin/revalidate HTTP/1.1
Host: techsonance.co.in
Content-Type: application/json
Origin: https://techsonance.co.in
```

### Request Body Schema (Optional)

Strict JSON object adhering to `adminRevalidateBodySchema`:

| Field   | Type            | Required | Constraints                     | Description                                   |
| ------- | --------------- | -------- | ------------------------------- | --------------------------------------------- |
| `tags`  | `Array<string>` | No       | Max 20 tags, 1-100 chars each   | ISR cache tags to invalidate (e.g. `posts`)  |
| `paths` | `Array<string>` | No       | Max 20 paths, 1-200 chars each  | Route paths to invalidate (e.g. `/blog`)      |

#### Empty Body (Revalidates Default Site Tags):
```json
{}
```

#### Custom Tags & Paths Payload:
```json
{
  "tags": ["posts", "post:ai-agentic-architecture-2026", "jobs"],
  "paths": ["/blog", "/careers"]
}
```

### Response Schema (`200 OK`)

```json
{
  "ok": true,
  "data": {
    "revalidatedTags": [
      "posts",
      "post:ai-agentic-architecture-2026",
      "jobs"
    ],
    "revalidatedPaths": [
      "/blog",
      "/careers"
    ],
    "timestamp": "2026-11-07T06:05:00.000Z",
    "message": "Cache revalidated successfully."
  },
  "revalidated": [
    "posts",
    "post:ai-agentic-architecture-2026",
    "jobs"
  ],
  "timestamp": "2026-11-07T06:05:00.000Z",
  "success": true
}
```

---

## HTTP Status Code & Error Matrix

| Status | Code Enum           | Message / Trigger                                                 |
| ------ | ------------------- | ----------------------------------------------------------------- |
| `200`  | —                   | Cache successfully purged and revalidated                         |
| `400`  | `BAD_REQUEST`       | Invalid JSON body syntax                                          |
| `401`  | `UNAUTHENTICATED`   | Missing or invalid admin session                                  |
| `403`  | `FORBIDDEN`         | Foreign origin header or insufficient role permissions (`Viewer`) |
| `422`  | `VALIDATION`        | Schema validation violation (non-array tags or invalid types)     |
| `500`  | `INTERNAL`          | Unexpected runtime or cache engine failure                        |

---

## TypeScript Client Example

```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

interface RevalidateOptions {
  tags?: string[];
  paths?: string[];
}

export async function revalidateSiteCache(options: RevalidateOptions = {}) {
  const response = await fetch(API_ENDPOINTS.ADMIN.REVALIDATE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(options),
  });

  const payload = await response.json();

  if (!response.ok) {
    const errorMsg = payload.error?.message || "Cache revalidation failed";
    throw new Error(errorMsg);
  }

  return payload.data;
}
```

---

## Verification & Black-Box Execution

### Run Standalone Black-Box Script
```bash
npx tsx blackbox-testing/admin/verify_admin_revalidate_blackbox.ts
```

### Run Vitest Integration Suite
```bash
npx vitest run tests/admin-revalidate-blackbox.test.ts
```
