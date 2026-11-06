# Frontend Integration Guide: GET /api/admin/careers/applications/[id]/resume

## 1. Overview & Business Purpose
The `GET /api/admin/careers/applications/[id]/resume` endpoint generates a secure, time-limited signed URL for authorized HR staff, hiring managers, and administrators to preview or download a job candidate's uploaded resume from protected cloud storage (`resumes` bucket).

### Key Architectural Invariants
- **Centralized Endpoint**: Referenced strictly via `API_ENDPOINTS.ADMIN.APPLICATION_RESUME(id)` from `@/lib/constants/endpoints.constants`.
- **Role-Based Access Control (RBAC)**: Restricted to authenticated users with roles `recruiter`, `hiring_manager`, `admin`, `owner`, or `superadmin`.
- **Origin & CORS Verification**: Foreign or untrusted origins receive `403 FORBIDDEN`.
- **Parameter Validation**: Requires a valid RFC 4122 UUID for `:id`; invalid formats receive `400 VALIDATION`.
- **Strict Discriminated Union Envelope**: Always returns `{ ok: true, data: { signedUrl } }` or `{ ok: false, error: ErrorPayload }`. Top-level `signedUrl` is preserved for backward compatibility with existing drawer components.
- **Cache-Control**: Emits `Cache-Control: no-store, private` so short-lived signed URLs are never stored in intermediate proxies or shared browser caches.
- **Request Tracing**: Echoes or mints an `x-request-id` header in every response.

---

## 2. Endpoint Specification

- **Method**: `GET`
- **Path**: `/api/admin/careers/applications/:id/resume`
- **Constant**: `API_ENDPOINTS.ADMIN.APPLICATION_RESUME(id)`
- **Contract**: `getApplicationResumeContract` in `@/lib/contracts/admin-applications.contract`
- **Authentication**: Required (`session` cookie or admin bearer token)

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` (UUID v4) | Yes | Unique ID of the candidate application. |

---

## 3. Response Contracts & Envelopes

### Success Response (HTTP 200 OK)
```json
{
  "ok": true,
  "data": {
    "signedUrl": "https://supabase.co/storage/v1/object/sign/resumes/candidate.pdf?token=abc123xyz"
  },
  "signedUrl": "https://supabase.co/storage/v1/object/sign/resumes/candidate.pdf?token=abc123xyz"
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Unauthorized",
    "requestId": "b135356d-04db-4585-86e6-d7bbe10d18f8"
  },
  "code": "UNAUTHENTICATED",
  "message": "Unauthorized"
}
```

#### 403 Forbidden (Origin Mismatch or Insufficient Role)
```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Forbidden: insufficient permissions to access candidate resumes",
    "requestId": "b8d2fe26-7fc7-4e61-b869-2ef93fd4d108"
  },
  "code": "FORBIDDEN",
  "message": "Forbidden: insufficient permissions to access candidate resumes"
}
```

#### 400 Validation Error (Invalid UUID)
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION",
    "message": "Invalid application ID parameter",
    "fieldErrors": {
      "id": ["Invalid application ID format"]
    },
    "requestId": "82f40f22-e872-42e8-a768-cf97323d2755"
  },
  "code": "VALIDATION",
  "message": "Invalid application ID parameter"
}
```

#### 404 Not Found (Application Missing or Resume Not Attached)
```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "No resume document attached to this application.",
    "requestId": "9a0ab72f-1189-4887-ba44-8a0389ecc3e9"
  },
  "code": "NOT_FOUND",
  "message": "No resume document attached to this application."
}
```

#### 500 Internal Server Error (Storage Provider Down)
```json
{
  "ok": false,
  "error": {
    "code": "INTERNAL",
    "message": "Failed to generate resume download link",
    "requestId": "d6fc9a06-fd40-450c-b108-1159e240173d"
  },
  "code": "INTERNAL",
  "message": "Failed to generate resume download link"
}
```

---

## 4. Frontend Integration Examples

### A. TypeScript API Client Helper
```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import type { Result } from "@/lib/result";
import { ErrorCode } from "@/lib/errors";

export interface ResumeUrlData {
  signedUrl: string;
}

export async function fetchCandidateResumeUrl(
  applicationId: string,
): Promise<Result<ResumeUrlData>> {
  try {
    const res = await fetch(API_ENDPOINTS.ADMIN.APPLICATION_RESUME(applicationId), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      return {
        ok: false,
        error: {
          code: json.error?.code || ErrorCode.INTERNAL,
          message: json.error?.message || "Failed to retrieve candidate resume",
          requestId: json.error?.requestId,
        },
      };
    }

    return {
      ok: true,
      data: {
        signedUrl: json.data?.signedUrl || json.signedUrl,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: {
        code: ErrorCode.UNAVAILABLE,
        message: err instanceof Error ? err.message : "Network error retrieving resume",
      },
    };
  }
}
```

### B. React Component Usage (e.g. in CandidateDrawer)
```tsx
import React, { useState } from "react";
import { fetchCandidateResumeUrl } from "@/lib/api/candidate-resume";

interface ResumeDownloadButtonProps {
  applicationId: string;
  candidateName: string;
}

export const ResumeDownloadButton: React.FC<ResumeDownloadButtonProps> = ({
  applicationId,
  candidateName,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenResume = async () => {
    setLoading(true);
    setErrorMessage(null);

    const result = await fetchCandidateResumeUrl(applicationId);

    setLoading(false);

    if (result.ok) {
      // Open signed URL in a secure new tab
      window.open(result.data.signedUrl, "_blank", "noopener,noreferrer");
    } else {
      setErrorMessage(result.error.message);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleOpenResume}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Generating link..." : `Download ${candidateName}'s Resume`}
      </button>

      {errorMessage && (
        <span role="alert" className="text-xs text-red-500 font-medium">
          {errorMessage}
        </span>
      )}
    </div>
  );
};
```

---

## 5. Security & Verification Checklist
- [x] Endpoint path centralized in `API_ENDPOINTS.ADMIN.APPLICATION_RESUME(id)`
- [x] Input parameters validated via strict Zod schema (`applicationResumeParamsSchema`)
- [x] Role-Based Access Control verified for Recruiter, Hiring Manager, Admin, Owner
- [x] Non-privileged roles (`viewer`, unauthorized callers) rejected with 403
- [x] Unauthenticated requests rejected with 401
- [x] Storage failures captured and returned as sanitized 500 `INTERNAL`
- [x] 100% automated test coverage in Vitest (`tests/admin-application-resume-blackbox.test.ts`)
- [x] Standalone black-box verification script executed and verified (`blackbox-testing/careers/verify_admin_application_resume_blackbox.ts`)
