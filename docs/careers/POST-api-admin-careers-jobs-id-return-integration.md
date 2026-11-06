# Integration Guide: `POST /api/admin/careers/jobs/[id]/return`

## Overview
The `POST /api/admin/careers/jobs/[id]/return` endpoint allows an authenticated administrator or company owner to send a job opening back to `DRAFT` status with actionable reviewer feedback.

This endpoint is part of the hiring governance workflow:
- When a recruiter submits a job requisition for review, an administrator reviews the compensation, job description, and hiring requirements.
- If revisions or corrections are required, the administrator calls this endpoint with mandatory feedback notes.
- The job transitions to `DRAFT` (`approvalStatus: RETURNED`), allowing the recruiter to make changes and resubmit for approval.

Additionally, every return action:
- Increments the job's immutable `versionId`.
- Stores the reviewer's feedback in `approvalComment`.
- Creates a point-in-time snapshot in `ts_web_content_versions`.
- Records an audit log entry in `ts_web_audit_logs` (`action: "job.return"`) capturing the acting admin's user ID and IP address.
- Flushes the Next.js on-demand cache tag for the job's public slug (`job-${slug}`).

---

## Endpoint Details

| Property | Value |
| --- | --- |
| **HTTP Method** | `POST` |
| **Path** | `/api/admin/careers/jobs/[id]/return` |
| **Authentication** | Required (Admin session cookie via Supabase Auth) |
| **Role Authorization** | `owner` or `admin` only (`recruiter` / `editor` receive 403) |
| **Request ID** | Injected via `x-request-id` response header for distributed tracing |
| **Cache Control** | `private, no-store` |

---

## Request Specification

### Route Parameters
| Parameter | Type | Validation | Description |
| --- | --- | --- | --- |
| `id` | `string` | UUID (`z.string().uuid()`) | The unique identifier of the job opening to return to draft. |

### Headers
```http
POST /api/admin/careers/jobs/550e8400-e29b-41d4-a716-446655440000/return HTTP/1.1
Host: techsonance.co.in
Content-Type: application/json
Origin: https://techsonance.co.in
```

### Request Body (Mandatory)
The endpoint requires a JSON body containing the reviewer's revision instructions:

```json
{
  "comment": "Please specify the exact salary band and clarify remote eligibility before publishing."
}
```

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `comment` | `string` | **Yes** | 1–2,000 chars, trimmed | Reviewer feedback explaining what needs revision. |

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
      "status": "draft",
      "approvalStatus": "returned",
      "approvalComment": "Please specify the exact salary band and clarify remote eligibility before publishing.",
      "publishedAt": null,
      "versionId": 4,
      "updatedAt": "2026-11-06T10:48:00.000Z"
    }
  },
  "job": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "slug": "senior-cloud-architect",
    "title": "Senior Cloud Architect",
    "status": "draft",
    "approvalStatus": "returned"
  }
}
```

### Error Responses

#### 400 Bad Request / Validation Failure (`ErrorCode.VALIDATION` / `ErrorCode.BAD_REQUEST`)
Occurs when the job ID is invalid, payload is malformed JSON, or feedback comment is missing/empty:
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION",
    "message": "Feedback comment is required when returning a role to draft",
    "fieldErrors": {
      "comment": ["Feedback comment is required when returning a role to draft"]
    },
    "requestId": "4f9e007a-4b19-4477-a0f5-5e8d3e269749"
  },
  "code": "VALIDATION",
  "message": "Feedback comment is required when returning a role to draft"
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
Returned if the session is not an owner/admin (e.g., recruiter, editor) or if the origin header is untrusted:
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

### 1. Client Helper Function
```typescript
import { ErrorCode } from "@/lib/errors";

export interface ReturnJobPayload {
  comment: string;
}

export interface ReturnJobResult {
  ok: boolean;
  job?: any;
  error?: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

export async function returnJob(
  jobId: string,
  payload: ReturnJobPayload
): Promise<ReturnJobResult> {
  try {
    const trimmedComment = payload.comment.trim();
    if (!trimmedComment) {
      return {
        ok: false,
        error: {
          code: ErrorCode.VALIDATION,
          message: "Please enter reviewer feedback to explain what needs revision.",
        },
      };
    }

    const res = await fetch(`/api/admin/careers/jobs/${jobId}/return`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment: trimmedComment }),
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      const errorMessage =
        (typeof json.error === "object" ? json.error?.message : json.error) ||
        json.message ||
        "Failed to return job";

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

### 2. Dialog Component Example (`ApprovalActionDialog.tsx`)
```tsx
import React, { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReturnJobDialog({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  onReturned,
}: {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  onReturned: (updatedJob: any) => void;
}) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReturn = async () => {
    if (!comment.trim()) {
      setErrorMessage("Please enter reviewer feedback to explain what needs revision.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await returnJob(jobId, { comment });

    if (result.ok && result.job) {
      onReturned(result.job);
      onClose();
    } else {
      setErrorMessage(result.error?.message || "Failed to return job");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Return Role to Draft
            </h3>
            <p className="text-xs text-slate-500 line-clamp-1">{jobTitle}</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Reviewer Feedback <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Explain what revisions or additional details are needed before this position can be approved..."
            rows={4}
            className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleReturn}
            disabled={isSubmitting || !comment.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Returning...
              </span>
            ) : (
              "Return to Draft"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## Quality Checklist
- [x] Standard envelope: `{ ok: true, data: { job } }` + backwards compatible top-level `job`.
- [x] Contract defined in `lib/contracts/admin-jobs.contract.ts` (`returnJobContract`).
- [x] Origin verification enforced against DNS rebinding & CSRF.
- [x] Role validation restricted to `owner` and `admin`.
- [x] Mandatory non-empty comment enforced by Zod 4 schema.
- [x] Request ID header `x-request-id` returned on all 2xx, 4xx, and 5xx responses.
- [x] End-to-end black box test coverage in `tests/admin-job-return-blackbox.test.ts`.
- [x] Turbopack production build verified without regressions.
