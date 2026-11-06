# Integration Guide: `GET, PATCH, DELETE /api/admin/jobs/[id]`

## Overview
The `/api/admin/jobs/[id]` endpoint provides administrative CRUD operations for individual job requisitions:
- **`GET`**: Fetches the complete requisition profile (title, department, location, compensation range, qualifications, screening questions, workflow status).
- **`PATCH`**: Performs partial updates to job fields with strict Zod validation, bumps the job's `versionId`, and invalidates Next.js tag caches.
- **`DELETE`**: Permanently deletes the requisition and records a structured audit log entry in `ts_web_audit_logs`. Restricted strictly to administrators and company owners.

---

## Endpoint Details

| Property | Value |
| --- | --- |
| **HTTP Methods** | `GET`, `PATCH`, `DELETE` |
| **Path** | `/api/admin/jobs/[id]` (Centralized in `API_ENDPOINTS.ADMIN.JOB(id)`) |
| **Authentication** | Required (Admin session cookie via Supabase Auth) |
| **Role Authorization** | **GET & PATCH**: `owner`, `admin`, `recruiter`, `editor`<br/>**DELETE**: `owner`, `admin` only |
| **Request ID** | Injected via `x-request-id` response header for distributed tracing |
| **Cache Control** | `private, no-store` |

---

## Route Parameters

| Parameter | Type | Validation | Description |
| --- | --- | --- | --- |
| `id` | `string` | UUID (`z.string().uuid()`) | Unique identifier of the job requisition. |

---

## 1. `GET /api/admin/jobs/[id]` (Read Job)

### Headers
```http
GET /api/admin/jobs/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: techsonance.co.in
Origin: https://techsonance.co.in
```

### Success Response (`200 OK`)
```json
{
  "ok": true,
  "data": {
    "job": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "slug": "senior-cloud-architect",
      "title": "Senior Cloud Architect",
      "department": "Cloud & DevOps",
      "location": "Bhubaneswar",
      "workMode": "hybrid",
      "type": "full_time",
      "status": "DRAFT",
      "approvalStatus": "pending",
      "openingsCount": 2,
      "salaryMin": 1800000,
      "salaryMax": 2600000,
      "salaryPeriod": "annual",
      "currency": "INR",
      "responsibilities": ["Lead AWS infrastructure modernization"],
      "requirements": ["8+ years cloud engineering experience"],
      "versionId": 1,
      "createdAt": "2026-11-06T10:00:00.000Z",
      "updatedAt": "2026-11-06T10:00:00.000Z"
    }
  },
  "job": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Senior Cloud Architect",
    "status": "DRAFT"
  }
}
```

---

## 2. `PATCH /api/admin/jobs/[id]` (Update Job)

### Request Body
Supports partial updates adhering to `updateJobSchema`:

```json
{
  "title": "Staff Cloud Architect",
  "openingsCount": 3,
  "salaryMin": 2200000,
  "salaryMax": 3000000
}
```

### Success Response (`200 OK`)
```json
{
  "ok": true,
  "data": {
    "job": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Staff Cloud Architect",
      "openingsCount": 3,
      "salaryMin": 2200000,
      "salaryMax": 3000000,
      "versionId": 2,
      "updatedAt": "2026-11-06T12:00:00.000Z"
    }
  },
  "job": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Staff Cloud Architect",
    "versionId": 2
  }
}
```

---

## 3. `DELETE /api/admin/jobs/[id]` (Delete Job)

### Headers
```http
DELETE /api/admin/jobs/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: techsonance.co.in
Origin: https://techsonance.co.in
```

### Success Response (`200 OK`)
```json
{
  "ok": true,
  "data": {
    "success": true
  },
  "success": true
}
```

---

## Error Responses

#### 400 Bad Request / Validation Failure (`ErrorCode.VALIDATION` / `ErrorCode.BAD_REQUEST`)
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION",
    "message": "Job update validation failed",
    "fieldErrors": {
      "salaryMax": ["Maximum salary must be greater than or equal to minimum salary"]
    },
    "requestId": "4f9e007a-4b19-4477-a0f5-5e8d3e269749"
  },
  "code": "VALIDATION",
  "message": "Job update validation failed"
}
```

#### 401 Unauthorized (`ErrorCode.UNAUTHENTICATED`)
```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Unauthorized",
    "requestId": "10e9d94b-95c5-458a-b4b2-14328d602651"
  },
  "code": "UNAUTHENTICATED",
  "message": "Unauthorized"
}
```

#### 403 Forbidden (`ErrorCode.FORBIDDEN`)
Returned if session lacks required role (e.g. recruiter trying to delete a requisition):
```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Forbidden: Admin or Owner role required",
    "requestId": "83400ad1-7d73-407e-804c-ddc5954e3e12"
  },
  "code": "FORBIDDEN",
  "message": "Forbidden: Admin or Owner role required"
}
```

#### 404 Not Found (`ErrorCode.NOT_FOUND`)
```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "The specified job opening does not exist.",
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  },
  "code": "NOT_FOUND",
  "message": "The specified job opening does not exist."
}
```

---

## Frontend Integration Guide

### 1. Client Helper Functions
```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { ErrorCode } from "@/lib/errors";

export async function getAdminJob(jobId: string): Promise<{ ok: boolean; job?: any; error?: string }> {
  try {
    const res = await fetch(API_ENDPOINTS.ADMIN.JOB(jobId));
    const json = await res.json();
    if (!res.ok || !json.ok) {
      return { ok: false, error: json.error?.message || json.message || "Failed to load job" };
    }
    return { ok: true, job: json.data?.job || json.job };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function updateAdminJob(
  jobId: string,
  updates: Record<string, any>
): Promise<{ ok: boolean; job?: any; error?: string }> {
  try {
    const res = await fetch(API_ENDPOINTS.ADMIN.JOB(jobId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      return { ok: false, error: json.error?.message || json.message || "Failed to update job" };
    }
    return { ok: true, job: json.data?.job || json.job };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function deleteAdminJob(jobId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(API_ENDPOINTS.ADMIN.JOB(jobId), { method: "DELETE" });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      return { ok: false, error: json.error?.message || json.message || "Failed to delete job" };
    }
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}
```

---

## Quality Checklist
- [x] Standard envelope: `{ ok: true, data: { job } }` + backwards compatible top-level fields.
- [x] Contracts defined in `lib/contracts/admin-jobs.contract.ts` (`getJobByIdContract`, `updateJobContract`, `deleteJobContract`).
- [x] All routes reference centralized `API_ENDPOINTS.ADMIN.JOB(id)`.
- [x] Destructive deletion restricted to `owner` and `admin` roles.
- [x] Request ID header `x-request-id` returned on all 2xx, 4xx, and 5xx responses.
- [x] End-to-end black box test coverage in `tests/admin-jobs-id-blackbox.test.ts`.
- [x] Turbopack production build verified without regressions.
