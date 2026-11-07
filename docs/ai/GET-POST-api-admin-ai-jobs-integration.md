# Integration Guide: `GET & POST /api/admin/ai/jobs`

This document details the architectural design, RBAC security controls, contract definitions, and frontend integration specifications for the Autonomous AI Content Generation Pipeline endpoints (`GET` and `POST /api/admin/ai/jobs`).

---

## 1. Architectural Overview (3-Tier Layering)

The AI generation queue strictly adheres to the project's 3-Tier Layer Architecture:

```
┌────────────────────────────────────────────────────────┐
│  Admin Client (app/admin/blog/ai/page.tsx)             │
└───────────────────────────┬────────────────────────────┘
                            │ GET /api/admin/ai/jobs
                            │ POST /api/admin/ai/jobs
                            ▼
┌────────────────────────────────────────────────────────┐
│  Controller: app/api/admin/ai/jobs/route.ts            │
│  - Origin Verification via isAllowedOrigin (403)       │
│  - Auth Session Check via AdminAuthService (401)       │
│  - RBAC: Viewer+ for GET, Editor+ for POST (403)       │
│  - Strict Zod 4 Inbound Validation                     │
│  - Tracing header: x-request-id                        │
└───────────────────────────┬────────────────────────────┘
                            │ listJobs() / createJob()
                            ▼
┌────────────────────────────────────────────────────────┐
│  Service: lib/services/job-orchestrator.service.ts     │
│  - listJobs(limit): Returns recent generation jobs     │
│  - createJob(): Enqueues job in QUEUED status          │
│  - executeJob(): Kicks off 6-step background pipeline  │
│    (outline -> sections -> meta -> image -> validate)  │
└───────────────────────────┬────────────────────────────┘
                            │ Queries & Mutations
                            ▼
┌────────────────────────────────────────────────────────┐
│  Repository: lib/repositories/generation-jobs.repository.ts │
│  - Needle DI: inject(DRIZZLE_DB_TOKEN)                 │
│  - Table: ts_ai_generation_jobs                        │
│  - Error mapping via mapDbError                        │
└────────────────────────────────────────────────────────┘
```

---

## 2. API Contract Specification

- **Path**: `/api/admin/ai/jobs`
- **Authentication**: `required` (Admin Session)
- **Rate Limit**: Standard internal admin rate protection

### Role Permissions
| HTTP Method | Minimum Required Role | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `viewer` | `viewer`, `author`, `editor`, `admin`, `owner` | Read-only listing of jobs queue |
| `POST` | `editor` | `editor`, `admin`, `owner` | Triggering / enqueuing generation pipeline |

---

### Endpoint A: `GET /api/admin/ai/jobs`

#### Query Parameters (`listAiJobsQuerySchema`)
| Parameter | Type | Default | Bounds | Description |
| :--- | :--- | :--- | :--- | :--- |
| `limit` | integer | `30` | `1 <= limit <= 100` | Maximum recent jobs to retrieve |

#### Response Envelope (`200 OK`)
```json
{
  "ok": true,
  "data": {
    "jobs": [
      {
        "id": "job-uuid-101",
        "siteId": "site-uuid-1111",
        "topicText": "Autonomous Multi-Agent Orchestration Patterns",
        "category": "Engineering",
        "status": "COMPLETED",
        "currentStep": "completed",
        "attempt": 1,
        "createdAt": "2026-11-07T04:50:00.843Z",
        "updatedAt": "2026-11-07T04:50:00.844Z"
      }
    ],
    "count": 1
  },
  "jobs": [...]
}
```

---

### Endpoint B: `POST /api/admin/ai/jobs`

#### Request Payload (`createAiJobSchema`)
```typescript
{
  topicText: string;  // Required: 5 to 300 characters (trimmed)
  category?: string;   // Optional: max 100 characters (default: "Engineering")
  siteId?: string;     // Optional UUID
}
```

#### Response Envelope (`201 Created`)
```json
{
  "ok": true,
  "data": {
    "job": {
      "id": "job-new-uuid-999",
      "siteId": "site-uuid-1111",
      "topicText": "Micro-Frontend Federation Patterns in Next.js 16",
      "category": "Architecture",
      "status": "QUEUED",
      "currentStep": "outline",
      "attempt": 0,
      "createdAt": "2026-11-07T04:50:00.862Z",
      "updatedAt": "2026-11-07T04:50:00.862Z"
    },
    "message": "Job enqueued and generation started in background"
  },
  "job": { ... },
  "message": "Job enqueued and generation started in background"
}
```

---

## 3. Error Codes & Status Matrix

| Scenario | HTTP Status | Code | Message |
| :--- | :--- | :--- | :--- |
| Missing/invalid session | `401 Unauthorized` | `UNAUTHENTICATED` | "You must be signed in to access AI generation jobs" |
| Origin mismatch | `403 Forbidden` | `FORBIDDEN` | "Forbidden origin" |
| Author/Viewer on POST | `403 Forbidden` | `FORBIDDEN` | "Insufficient permissions. Only editors and admins can trigger AI generation jobs." |
| Topic < 5 characters | `422 Unprocessable` | `VALIDATION` | "Topic must be at least 5 characters" |
| Service crash | `500 Internal Error` | `INTERNAL` | "Failed to trigger AI generation job" |

---

## 4. Frontend Integration Guide

The admin AI control panel ([`app/admin/blog/ai/page.tsx`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/app/admin/blog/ai/page.tsx)) integrates seamlessly:

```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

// 1. Fetching recent jobs
async function fetchJobs() {
  const res = await fetch(`${API_ENDPOINTS.ADMIN.AI.JOBS}?limit=30`);
  const result = await res.json();
  if (result.ok) {
    return result.data?.jobs || result.jobs;
  }
}

// 2. Triggering autonomous generation job
async function triggerAiJob(topicText: string, category: string) {
  const res = await fetch(API_ENDPOINTS.ADMIN.AI.JOBS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topicText: topicText.trim(), category }),
  });

  const result = await res.json();
  if (!res.ok) {
    const errorMsg =
      typeof result.error === "object" && result.error?.message
        ? result.error.message
        : result.error || "Failed to trigger generation";
    throw new Error(errorMsg);
  }

  return result.data?.job || result.job;
}
```

---

## 5. Verification & Testing

- **Vitest Suite**: `tests/admin-ai-jobs-blackbox.test.ts` (11 integration tests covering 401, 403 origin, 403 RBAC, 422 validation, 200 list, 201 enqueue & 500 error handling).
- **Standalone Runner**: `blackbox-testing/ai/verify_admin_ai_jobs_blackbox.ts` (30 assertions passed provably).
