# Integration Guide: `GET & POST /api/admin/careers/jobs/[id]/versions`

## Overview
The `/api/admin/careers/jobs/[id]/versions` endpoint provides point-in-time snapshot history and version rollback capabilities for career job requisitions.

- **`GET`**: Lists all recorded version snapshots for a specified job opening from `ts_content_versions`, in reverse chronological order. Each entry includes full job field snapshots, modification timestamps, and the identity of the user who made the change.
- **`POST`**: Rolls back the job to an earlier snapshot selected by `versionId`. Restoring a version:
  - Updates the job record with the fields captured in the historical snapshot.
  - Increments the job's immutable `versionId` (preserving linear audit continuity without rewriting history).
  - Creates a new snapshot in `ts_content_versions` reflecting the restoration.
  - Records an audit log entry in `ts_web_audit_logs` (`action: "job.restore_version"`).
  - Purges the Next.js on-demand cache tag (`job-${slug}`) to synchronize the public careers page.

---

## Endpoint Details

| Property | Value |
| --- | --- |
| **HTTP Methods** | `GET`, `POST` |
| **Path** | `/api/admin/careers/jobs/[id]/versions` |
| **Authentication** | Required (Admin session cookie via Supabase Auth) |
| **Role Authorization** | `owner`, `admin`, `recruiter`, `editor` |
| **Request ID** | Injected via `x-request-id` response header for distributed tracing |
| **Cache Control** | `private, no-store` |

---

## Route Parameters

| Parameter | Type | Validation | Description |
| --- | --- | --- | --- |
| `id` | `string` | UUID (`z.string().uuid()`) | Unique identifier of the job opening. |

---

## 1. `GET /api/admin/careers/jobs/[id]/versions` (List Versions)

### Headers
```http
GET /api/admin/careers/jobs/550e8400-e29b-41d4-a716-446655440000/versions HTTP/1.1
Host: techsonance.co.in
Origin: https://techsonance.co.in
```

### Success Response (`200 OK`)
```json
{
  "ok": true,
  "data": {
    "versions": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "entityType": "job",
        "entityId": "550e8400-e29b-41d4-a716-446655440000",
        "snapshot": {
          "versionId": 2,
          "title": "Senior Cloud Architect",
          "department": "Cloud & DevOps",
          "status": "published",
          "approvalStatus": "approved",
          "location": "Bhubaneswar",
          "workMode": "hybrid",
          "responsibilities": ["Design AWS infrastructure", "Lead IaC migration"]
        },
        "changedBy": "admin-uuid-1111",
        "createdAt": "2026-11-06T10:30:00.000Z"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "entityType": "job",
        "entityId": "550e8400-e29b-41d4-a716-446655440000",
        "snapshot": {
          "versionId": 1,
          "title": "Cloud Architect",
          "department": "Cloud & DevOps",
          "status": "draft",
          "approvalStatus": "pending"
        },
        "changedBy": "recruiter-uuid-2222",
        "createdAt": "2026-11-05T14:15:00.000Z"
      }
    ]
  },
  "versions": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "snapshot": { "versionId": 2, "title": "Senior Cloud Architect" }
    }
  ]
}
```

---

## 2. `POST /api/admin/careers/jobs/[id]/versions` (Restore Version)

### Request Body
```json
{
  "versionId": "770e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `versionId` | `string` | **Yes** | Min 1, max 100 chars, trimmed | Unique identifier of the version snapshot in `ts_content_versions`. |

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
      "versionId": 3,
      "updatedAt": "2026-11-06T11:00:00.000Z"
    }
  },
  "job": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "versionId": 3,
    "title": "Senior Cloud Architect"
  }
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
    "message": "Unauthorized",
    "requestId": "10e9d94b-95c5-458a-b4b2-14328d602651"
  },
  "code": "UNAUTHENTICATED",
  "message": "Unauthorized"
}
```

#### 403 Forbidden (`ErrorCode.FORBIDDEN`)
Returned if origin is foreign or session role lacks access:
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
Returned when job or requested version snapshot does not exist:
```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Version \"770e8400-e29b-41d4-a716-446655440000\" not found for job \"550e8400-e29b-41d4-a716-446655440000\"",
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  },
  "code": "NOT_FOUND",
  "message": "Version \"770e8400-e29b-41d4-a716-446655440000\" not found for job \"550e8400-e29b-41d4-a716-446655440000\""
}
```

---

## Frontend Integration Guide

### 1. Client Helper Functions
```typescript
import { ErrorCode } from "@/lib/errors";

export interface VersionItem {
  id: string;
  entityType: string;
  entityId: string;
  snapshot: Record<string, any>;
  changedBy?: string | null;
  createdAt: string;
}

export async function fetchJobVersions(jobId: string): Promise<{
  ok: boolean;
  versions?: VersionItem[];
  error?: string;
}> {
  try {
    const res = await fetch(`/api/admin/careers/jobs/${jobId}/versions`);
    const json = await res.json();

    if (!res.ok || !json.ok) {
      const msg =
        (typeof json.error === "object" ? json.error?.message : json.error) ||
        json.message ||
        "Failed to load versions";
      return { ok: false, error: msg };
    }

    return {
      ok: true,
      versions: json.data?.versions || json.versions || [],
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function restoreJobVersion(
  jobId: string,
  versionId: string
): Promise<{
  ok: boolean;
  job?: any;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/admin/careers/jobs/${jobId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      const msg =
        (typeof json.error === "object" ? json.error?.message : json.error) ||
        json.message ||
        "Failed to restore version";
      return { ok: false, error: msg };
    }

    return {
      ok: true,
      job: json.data?.job || json.job,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
```

### 2. Dialog Component Integration (`VersionHistoryDialog.tsx`)
```tsx
import React, { useState, useEffect } from "react";
import { History, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchJobVersions, restoreJobVersion, VersionItem } from "@/lib/api/jobVersions";

export function VersionHistoryModal({
  jobId,
  currentVersionId,
  onRestored,
}: {
  jobId: string;
  currentVersionId?: number;
  onRestored: (job: any) => void;
}) {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    fetchJobVersions(jobId).then((res) => {
      if (res.ok && res.versions) setVersions(res.versions);
      setLoading(false);
    });
  }, [jobId]);

  const handleRestore = async (version: VersionItem) => {
    setRestoringId(version.id);
    const res = await restoreJobVersion(jobId, version.id);
    if (res.ok && res.job) {
      onRestored(res.job);
    }
    setRestoringId(null);
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
      ) : (
        versions.map((ver) => (
          <div key={ver.id} className="p-3 border rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">
                Version #{ver.snapshot?.versionId} - {ver.snapshot?.title}
              </p>
              <p className="text-xs text-slate-400">
                {new Date(ver.createdAt).toLocaleString()}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRestore(ver)}
              disabled={restoringId === ver.id || ver.snapshot?.versionId === currentVersionId}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Restore
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
```

---

## Quality Checklist
- [x] Standard envelope: `{ ok: true, data: { ... } }` + backwards compatible top-level fields.
- [x] Contracts defined in `lib/contracts/admin-jobs.contract.ts` (`listJobVersionsContract`, `restoreJobVersionContract`).
- [x] Origin verification enforced on both GET and POST against CSRF.
- [x] Role validation restricted to `owner`, `admin`, `recruiter`, `editor`.
- [x] Request ID header `x-request-id` returned on all 2xx, 4xx, and 5xx responses.
- [x] End-to-end black box test coverage in `tests/admin-job-versions-blackbox.test.ts`.
- [x] Turbopack production build verified without regressions.
