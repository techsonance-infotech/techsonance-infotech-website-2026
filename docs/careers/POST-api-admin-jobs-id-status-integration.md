# Integration Guide: `POST /api/admin/jobs/[id]/status`

## Overview
The `POST /api/admin/jobs/[id]/status` endpoint executes validated transitions across the hiring requisition lifecycle. It enforces a formal 7-state status machine with strict role-based permission gates.

When a status change is executed:
- The system validates that the transition is legal from the current status.
- Role-specific constraints are enforced (e.g., recruiters cannot jump directly from `DRAFT` to `PUBLISHED` without administrator approval).
- Relevant timestamps (`publishedAt`, `closedAt`) and approval statuses (`approvalStatus`, `approvalComment`) are set automatically.
- Requisition `versionId` is incremented and an immutable audit log entry is recorded in `ts_web_audit_logs`.
- Next.js on-demand cache tag (`job-${slug}`) is invalidated if the transition impacts public job visibility.

---

## State Machine Matrix

| Current Status | Allowed Target Status | Permitted Roles | Notes / Requirements |
| --- | --- | --- | --- |
| `DRAFT` | `IN_REVIEW` | `owner`, `admin`, `recruiter`, `editor` | Submits draft for executive review. |
| `DRAFT` | `PUBLISHED` / `OPEN` | `owner`, `admin` only | Direct publish bypasses review (Admins only). |
| `IN_REVIEW` | `PUBLISHED` / `OPEN` | `owner`, `admin` only | Approves requisition and makes it live. |
| `IN_REVIEW` | `SCHEDULED` | `owner`, `admin` only | Requires future `publishAt` date on job. |
| `IN_REVIEW` | `DRAFT` | `owner`, `admin` only | Returns requisition for revisions. |
| `SCHEDULED` | `PUBLISHED` / `OPEN` | `owner`, `admin`, `recruiter` | Manual early activation. |
| `SCHEDULED` | `DRAFT` | `owner`, `admin` only | Cancels scheduled publication. |
| `PUBLISHED` / `OPEN` | `PAUSED` | `owner`, `admin`, `recruiter` | Temporarily suspends incoming applications. |
| `PUBLISHED` / `OPEN` | `CLOSED` | `owner`, `admin`, `recruiter` | Closes position, sets `closedAt`. |
| `PAUSED` | `PUBLISHED` / `OPEN` | `owner`, `admin`, `recruiter` | Resumes active candidate sourcing. |
| `PAUSED` | `CLOSED` | `owner`, `admin`, `recruiter` | Closes paused requisition. |
| `CLOSED` | `ARCHIVED` | `owner`, `admin` only | Long-term archival. |
| `CLOSED` | `DRAFT` / `PUBLISHED` | `owner`, `admin` only | Re-opens closed position. |
| `ARCHIVED` | None (Terminal) | — | Archived positions are read-only. |

---

## Endpoint Details

| Property | Value |
| --- | --- |
| **HTTP Method** | `POST` |
| **Path** | `/api/admin/jobs/[id]/status` |
| **Authentication** | Required (Admin session cookie via Supabase Auth) |
| **Role Authorization** | `owner`, `admin`, `recruiter`, `editor` |
| **Request ID** | Injected via `x-request-id` response header for distributed tracing |
| **Cache Control** | `private, no-store` |

---

## Request Specification

### Route Parameters
| Parameter | Type | Validation | Description |
| --- | --- | --- | --- |
| `id` | `string` | UUID (`z.string().uuid()`) | The unique identifier of the job opening. |

### Headers
```http
POST /api/admin/jobs/550e8400-e29b-41d4-a716-446655440000/status HTTP/1.1
Host: techsonance.co.in
Content-Type: application/json
Origin: https://techsonance.co.in
```

### Request Body
The endpoint accepts either `targetStatus` or legacy `status`. Values are case-insensitive (`IN_REVIEW`, `in_review`):

```json
{
  "targetStatus": "IN_REVIEW",
  "comment": "Submitted by recruiter for executive approval."
}
```

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `targetStatus` | `string` | **Yes*** | Valid `JobStatus` enum member | Target state (`DRAFT`, `IN_REVIEW`, `SCHEDULED`, `PUBLISHED`, `OPEN`, `PAUSED`, `CLOSED`, `ARCHIVED`). |
| `status` | `string` | Optional | Valid `JobStatus` enum member | Alternative key for `targetStatus` for backward compatibility. |
| `comment` | `string` | Optional | Max 1,000 chars, trimmed | Context or audit note explaining the status change. |

*\*At least one of `targetStatus` or `status` is required.*

---

## Response Specification

The endpoint returns the standard architectural envelope conforming to Rule 08, with backward-compatible top-level keys for existing UI components:

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
      "status": "IN_REVIEW",
      "approvalStatus": "pending",
      "approvalComment": "Submitted by recruiter for executive approval.",
      "publishedAt": null,
      "closedAt": null,
      "versionId": 2,
      "updatedAt": "2026-11-06T11:15:00.000Z"
    }
  },
  "job": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "IN_REVIEW",
    "title": "Senior Cloud Architect"
  }
}
```

### Error Responses

#### 400 Bad Request / Validation Failure (`ErrorCode.VALIDATION` / `ErrorCode.BAD_REQUEST`)
Occurs when target status is invalid or an illegal state transition is attempted:
```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Approval required: Recruiters must submit role to IN_REVIEW for approval before publishing",
    "requestId": "4f9e007a-4b19-4477-a0f5-5e8d3e269749"
  },
  "code": "BAD_REQUEST",
  "message": "Approval required: Recruiters must submit role to IN_REVIEW for approval before publishing"
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
Returned if session role lacks permission to perform the transition:
```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Forbidden: You do not have permission to transition job status",
    "requestId": "83400ad1-7d73-407e-804c-ddc5954e3e12"
  },
  "code": "FORBIDDEN",
  "message": "Forbidden: You do not have permission to transition job status"
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

### 1. Client Helper Function
```typescript
import { ErrorCode } from "@/lib/errors";

export interface TransitionStatusPayload {
  targetStatus: "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED" | "OPEN" | "PAUSED" | "CLOSED" | "ARCHIVED";
  comment?: string;
}

export interface TransitionStatusResult {
  ok: boolean;
  job?: any;
  error?: {
    code: string;
    message: string;
  };
}

export async function transitionJobStatus(
  jobId: string,
  payload: TransitionStatusPayload
): Promise<TransitionStatusResult> {
  try {
    const res = await fetch(`/api/admin/jobs/${jobId}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      const errorMessage =
        (typeof json.error === "object" ? json.error?.message : json.error) ||
        json.message ||
        "Failed to transition status";

      return {
        ok: false,
        error: {
          code: json.error?.code || json.code || ErrorCode.BAD_REQUEST,
          message: errorMessage,
        },
      };
    }

    return {
      ok: true,
      job: json.data?.job || json.job,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: {
        code: ErrorCode.UNAVAILABLE,
        message: err instanceof Error ? err.message : "Network communication error",
      },
    };
  }
}
```

### 2. Usage in Job Editor (`app/admin/careers/jobs/[id]/page.tsx`)
```tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { transitionJobStatus } from "@/lib/api/jobs";

export function SubmitForReviewButton({
  jobId,
  onStatusChanged,
}: {
  jobId: string;
  onStatusChanged: (job: any) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    const result = await transitionJobStatus(jobId, {
      targetStatus: "IN_REVIEW",
      comment: "Submitted by recruiter for executive approval.",
    });

    if (result.ok && result.job) {
      onStatusChanged(result.job);
    } else {
      setError(result.error?.message || "Transition failed");
    }
    setSubmitting(false);
  };

  return (
    <div>
      <Button onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Role for Review"}
      </Button>
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}
```

---

## Quality Checklist
- [x] Standard envelope: `{ ok: true, data: { job } }` + backwards compatible top-level `job`.
- [x] Contract defined in `lib/contracts/admin-jobs.contract.ts` (`transitionJobStatusContract`).
- [x] Origin verification enforced against DNS rebinding & CSRF.
- [x] Case-insensitive status input normalization (`IN_REVIEW`, `in_review`).
- [x] Role validation restricted to `owner`, `admin`, `recruiter`, `editor`.
- [x] Full state machine transition logic enforced by `AdminJobsService`.
- [x] Request ID header `x-request-id` returned on all 2xx, 4xx, and 5xx responses.
- [x] End-to-end black box test coverage in `tests/admin-job-status-blackbox.test.ts`.
- [x] Turbopack production build verified without regressions.
