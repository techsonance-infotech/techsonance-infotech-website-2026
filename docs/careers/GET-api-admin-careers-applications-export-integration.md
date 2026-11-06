# Frontend Integration Guide: GET /api/admin/careers/applications/export

## 1. Overview & Business Purpose
The `GET /api/admin/careers/applications/export` endpoint allows authorized administrators and owners to generate and export a real CSV report of job applications. It supports filtering by specific job requisitions, adheres to RFC 4180 CSV formatting standards, automatically archives generated CSV reports to the secure storage bucket (`resumes/exports/`), and streams the file directly to the client as an attachment.

### Key Architectural Invariants
- **Centralized Endpoint**: Referenced strictly via `API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT` from `@/lib/constants/endpoints.constants`.
- **Role-Based Access Control (RBAC)**: Restricted strictly to `admin` and `owner` roles to safeguard candidate Personally Identifiable Information (PII) under GDPR.
- **Origin & CORS Verification**: Foreign or untrusted origins receive `403 FORBIDDEN`.
- **Query Validation**: Strict Zod validation of `jobId` (`z.string().uuid()`); malformed IDs receive `400 VALIDATION`.
- **Dual Response Delivery**:
  - **Direct Download (Default)**: Streams `text/csv; charset=utf-8` with `Content-Disposition: attachment; filename="applications-...csv"`.
  - **Programmatic JSON**: If `Accept: application/json` is supplied, returns a discriminated union envelope `{ ok: true, data: { filename, csvData, rowCount, storagePath } }`.
- **Storage Archival**: Generated CSV files are archived in Supabase Storage (`exports/applications-${jobId|all}-${date}.csv`), and the path is returned via `x-export-storage-path` response header.
- **Cache-Control**: Emits `Cache-Control: no-store, private` to prevent caching of candidate export files.
- **Traceability**: Emits `x-request-id` and `x-export-row-count` response headers.

---

## 2. Endpoint Specification

- **Method**: `GET`
- **Path**: `/api/admin/careers/applications/export`
- **Constant**: `API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT`
- **Contract**: `exportApplicationsContract` in `@/lib/contracts/admin-applications.contract`
- **Authentication**: Required (`session` cookie or admin bearer token)

### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `jobId` | `string` (UUID v4) | No | Optional job ID filter. If omitted, exports all applications across all jobs. |

---

## 3. CSV File Structure (RFC 4180)

The generated CSV contains the following standard columns:
1. `ID`: Unique application UUID.
2. `Candidate Name`: Full candidate name.
3. `Email`: Contact email address.
4. `Phone`: Contact phone number.
5. `Status`: Application stage (`new`, `reviewing`, `shortlisted`, `interview`, `offered`, `hired`, `rejected`).
6. `Job Title`: Title of the applied job opening.
7. `Knockout Triggered`: `Yes` or `No`.
8. `Rating`: Candidate rating (1–5) or empty string.
9. `Created At`: ISO-8601 application timestamp.

---

## 4. Response Specifications

### A. Direct File Download (Default)
- **Status**: `200 OK`
- **Headers**:
  ```http
  Content-Type: text/csv; charset=utf-8
  Content-Disposition: attachment; filename="applications-all-2026-11-06.csv"
  x-request-id: af04d6e2-a158-42fc-8ea9-cf7c3cb2d96a
  x-export-row-count: 24
  x-export-storage-path: exports/applications-all-2026-11-06.csv
  Cache-Control: no-store, private
  ```
- **Body**: Raw UTF-8 encoded CSV string.

### B. Programmatic JSON Envelope (Accept: application/json)
```json
{
  "ok": true,
  "data": {
    "filename": "applications-all-2026-11-06.csv",
    "csvData": "ID,Candidate Name,Email,Phone,Status,Job Title,Knockout Triggered,Rating,Created At\n\"app-1\",\"Sarah Connor\"...",
    "rowCount": 24,
    "storagePath": "exports/applications-all-2026-11-06.csv"
  },
  "filename": "applications-all-2026-11-06.csv",
  "rowCount": 24,
  "storagePath": "exports/applications-all-2026-11-06.csv"
}
```

### C. Error Envelopes

#### 401 Unauthorized
```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Unauthorized",
    "requestId": "0166778c-2be1-484f-a8d2-af2733f6abed"
  },
  "code": "UNAUTHENTICATED",
  "message": "Unauthorized"
}
```

#### 403 Forbidden (Non-Admin / Non-Owner Role)
```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Forbidden: Admin or Owner role required",
    "requestId": "94ad2536-74a1-4495-8650-ee71d4304437"
  },
  "code": "FORBIDDEN",
  "message": "Forbidden: Admin or Owner role required"
}
```

#### 400 Validation Error (Malformed jobId)
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION",
    "message": "Invalid export query parameters",
    "fieldErrors": {
      "jobId": ["Invalid job ID format"]
    },
    "requestId": "ced18623-dbb4-456a-9e50-1bd10315c9d8"
  },
  "code": "VALIDATION",
  "message": "Invalid export query parameters"
}
```

---

## 5. Frontend Integration Examples

### A. Simple Browser Download Trigger
Used directly in the Admin Applications Inbox ([`app/admin/careers/applications/page.tsx`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/app/admin/careers/applications/page.tsx)):
```tsx
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

export function handleExportCsv(selectedJobId?: string) {
  const params = new URLSearchParams();
  if (selectedJobId) {
    params.set("jobId", selectedJobId);
  }

  const exportUrl = `${API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT}${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  // Opens browser native download prompt
  window.open(exportUrl, "_blank");
}
```

### B. Programmatic Client Fetch with Blob Download & Error Handling
```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import type { Result } from "@/lib/result";
import { ErrorCode } from "@/lib/errors";

export async function downloadApplicationsCsv(jobId?: string): Promise<Result<{ filename: string }>> {
  try {
    const params = new URLSearchParams();
    if (jobId) params.set("jobId", jobId);

    const url = `${API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT}${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "text/csv, application/json",
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: {
          code: errJson.error?.code || ErrorCode.INTERNAL,
          message: errJson.error?.message || "Failed to export applications",
          requestId: errJson.error?.requestId,
        },
      };
    }

    // Extract filename from Content-Disposition header
    const disposition = res.headers.get("content-disposition");
    let filename = "applications-export.csv";
    if (disposition && disposition.includes("filename=")) {
      const matches = disposition.match(/filename="?([^"]+)"?/);
      if (matches && matches[1]) {
        filename = matches[1];
      }
    }

    // Create client-side download link
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    return {
      ok: true,
      data: { filename },
    };
  } catch (err) {
    return {
      ok: false,
      error: {
        code: ErrorCode.UNAVAILABLE,
        message: err instanceof Error ? err.message : "Network error downloading CSV",
      },
    };
  }
}
```

---

## 6. Verification Checklist
- [x] Endpoint centralized in `API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT`
- [x] Query validation with `exportApplicationsQuerySchema` (`jobId: UUID`)
- [x] RBAC restricted strictly to `admin` and `owner`
- [x] Recruiter and unauthorized roles rejected with 403
- [x] Automatic archival to storage bucket (`resumes/exports/`)
- [x] Real RFC 4180 CSV file attachment stream verified
- [x] JSON envelope mode supported via `Accept: application/json`
- [x] 100% test coverage in Vitest (`tests/admin-applications-export-blackbox.test.ts`)
- [x] Standalone black-box verification script executed and verified (`blackbox-testing/careers/verify_admin_applications_export_blackbox.ts`)
