# Integration Guide: `POST /api/admin/careers/jobs/[id]/approve`

## Overview
The `POST /api/admin/careers/jobs/[id]/approve` endpoint allows an authenticated administrator or company owner to approve a job requisition for publication. 

Depending on the job's scheduling configuration:
1. **Immediate Publication**: If `publishAt` is not specified or in the past, the job transitions immediately to `PUBLISHED` (`approvalStatus: APPROVED`), populates `publishedAt` with the current timestamp, and goes live on the public `/careers` portal.
2. **Scheduled Publication**: If `publishAt` is set to a future datetime, the job transitions to `SCHEDULED` (`approvalStatus: APPROVED`), holding publication until the scheduled date arrives.

Additionally, every approval action:
- Increments the job's immutable `versionId`.
- Creates a point-in-time snapshot in `ts_web_content_versions`.
- Records an audit log entry in `ts_web_audit_logs` (`action: "job.approve"`) tracking the acting admin's user ID and IP address.
- Flushes the Next.js on-demand cache tag for the job's public slug (`job-${slug}`).

---

## Endpoint Details

| Property | Value |
| --- | --- |
| **HTTP Method** | `POST` |
| **Path** | `/api/admin/careers/jobs/[id]/approve` |
| **Authentication** | Required (Admin session cookie via Supabase Auth) |
| **Role Authorization** | `owner` or `admin` only (`recruiter` / `editor` receive 403) |
| **Request ID** | Injected via `x-request-id` response header for distributed tracing |
| **Cache Control** | `private, no-store` |

---

## Request Specification

### Route Parameters
| Parameter | Type | Validation | Description |
| --- | --- | --- | --- |
| `id` | `string` | UUID (`z.string().uuid()`) | The unique identifier of the job to approve. |

### Headers
```http
POST /api/admin/careers/jobs/550e8400-e29b-41d4-a716-446655440000/approve HTTP/1.1
Host: techsonance.co.in
Content-Type: application/json
Origin: https://techsonance.co.in
```

### Request Body (Optional)
The endpoint accepts an optional JSON body to attach reviewer feedback or approval notes:

```json
{
  "comment": "Approved by Head of Talent. Ready to publish for Q1 hiring sprint."
}
```

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `comment` | `string` | No | Max 1,000 chars, trimmed | Optional approval notes saved to `approvalComment`. |

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
      "status": "published",
      "approvalStatus": "approved",
      "approvalComment": "Approved by Head of Talent. Ready to publish for Q1 hiring sprint.",
      "publishedAt": "2026-11-06T10:40:00.000Z",
      "publishAt": null,
      "versionId": 3,
      "updatedAt": "2026-11-06T10:40:00.000Z"
    }
  },
  "job": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "slug": "senior-cloud-architect",
    "title": "Senior Cloud Architect",
    "status": "published",
    "approvalStatus": "approved"
  }
}
```

### Error Responses

#### 400 Bad Request / Validation Failure (`ErrorCode.VALIDATION` / `ErrorCode.BAD_REQUEST`)
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION",
    "message": "Invalid job ID parameter",
    "fieldErrors": {
      "id": ["Invalid job ID format"]
    },
    "requestId": "4f9e007a-4b19-4477-a0f5-5e8d3e269749"
  },
  "code": "VALIDATION",
  "message": "Invalid job ID parameter"
}
```

#### 401 Unauthorized (`ErrorCode.UNAUTHENTICATED`)
```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "requestId": "10e9d94b-95c5-458a-b4b2-14328d602651"
  },
  "code": "UNAUTHENTICATED",
  "message": "Authentication required"
}
```

#### 403 Forbidden (`ErrorCode.FORBIDDEN`)
Returned if the session is not an owner/admin (e.g., recruiter, editor) or if the origin header is untrusted:
```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Only admins and owners can perform this action",
    "requestId": "83400ad1-7d73-407e-804c-ddc5954e3e12"
  },
  "code": "FORBIDDEN",
  "message": "Only admins and owners can perform this action"
}
```

#### 404 Not Found (`ErrorCode.NOT_FOUND`)
```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Job posting not found",
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  },
  "code": "NOT_FOUND",
  "message": "Job posting not found"
}
```

---

## Frontend Integration Guide

### 1. Client Helper Function
```typescript
import { ErrorCode } from "@/lib/errors";

export interface ApproveJobPayload {
  comment?: string;
}

export interface ApproveJobResult {
  ok: boolean;
  job?: any;
  error?: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

export async function approveJob(
  jobId: string,
  payload: ApproveJobPayload = {}
): Promise<ApproveJobResult> {
  try {
    const res = await fetch(`/api/admin/careers/jobs/${jobId}/approve`, {
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
        "Failed to approve job";

      return {
        ok: false,
        error: {
          code: json.error?.code || json.code || ErrorCode.INTERNAL,
          message: errorMessage,
          fieldErrors: json.error?.fieldErrors,
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
        message: err instanceof Error ? err.message : "Network error occurred",
      },
    };
  }
}
```

### 2. Component Integration (e.g. `ApprovalActionDialog.tsx`)
```tsx
import React, { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ApproveJobButton({
  jobId,
  jobTitle,
  publishAt,
  onApproved,
}: {
  jobId: string;
  jobTitle: string;
  publishAt?: string | null;
  onApproved: (updatedJob: any) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isScheduled = publishAt && new Date(publishAt).getTime() > Date.now();

  const handleApprove = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await approveJob(jobId);

    if (result.ok && result.job) {
      onApproved(result.job);
    } else {
      setErrorMessage(result.error?.message || "Approval failed");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleApprove}
        disabled={isSubmitting}
        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Approving...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {isScheduled ? "Approve & Schedule" : "Approve & Publish"}
          </span>
        )}
      </Button>

      {errorMessage && (
        <p className="text-xs text-rose-600 font-medium">{errorMessage}</p>
      )}
    </div>
  );
}
```

---

## Quality Checklist
- [x] Standard envelope: `{ ok: true, data: { job } }` + backwards compatible top-level `job`.
- [x] Contract defined in `lib/contracts/admin-jobs.contract.ts`.
- [x] Origin verification enforced against DNS rebinding & CSRF.
- [x] Role validation restricted to `owner` and `admin`.
- [x] Request ID header `x-request-id` returned on both 2xx and 4xx/5xx responses.
- [x] End-to-end black box test coverage in `tests/admin-job-approve-blackbox.test.ts`.
- [x] Turbopack production build verified without regressions.
