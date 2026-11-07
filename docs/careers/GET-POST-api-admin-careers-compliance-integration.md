# GET & POST `/api/admin/careers/compliance` — Integration Guide

**Domain:** Careers Governance & GDPR Compliance  
**Route file:** `app/api/admin/careers/compliance/route.ts`  
**Contract:** `lib/contracts/admin-careers-compliance.contract.ts`  
**Service:** `lib/services/applications.service.ts`  
**Repository:** `lib/repositories/admin-applications.repository.ts`  
**DB tables:** `ts_core_applications`, `ts_core_talent_pool`, `ts_content_audit_log`  
**Storage bucket:** `resumes`

---

## Overview

The `/api/admin/careers/compliance` endpoint provides GDPR Articles 15 & 17 regulatory compliance capabilities for candidate hiring records:
1. **GET**: GDPR Article 15 (Right of Access) — Exports all data associated with a candidate's email address (job applications, screening answers, talent pool profiles).
2. **POST**: GDPR Article 17 (Right to be Forgotten) — Permanently purges all applications, talent pool submissions, and uploaded resume files from storage for a candidate, recording an immutable audit event.

---

## Endpoint Details

### 1. `GET /api/admin/careers/compliance?email=<email>`

Exports candidate data in machine-readable JSON format.

| Attribute       | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| **Auth**        | Required (`AdminSession` via HTTP-only cookie)                     |
| **RBAC**        | `Admin+` (`admin`, `owner` only). Viewers, authors, editors denied |
| **Origin**      | Enforced — foreign cross-site origins → `403 Forbidden`            |
| **Cache**       | `private, no-store`                                                |
| **Response**    | `200 OK` with `{ ok: true, data: candidateData }`                  |

#### Query Parameters
- `email` (string, required): RFC 5322 valid email address to export.

#### Response Example (`200 OK`)
```json
{
  "ok": true,
  "data": {
    "email": "candidate@example.com",
    "exportedAt": "2026-11-07T06:10:00.000Z",
    "applications": [
      {
        "id": "app-uuid-1",
        "jobId": "job-uuid-1",
        "candidateName": "Jane Doe",
        "email": "candidate@example.com",
        "resumeStoragePath": "resumes/candidate-resume.pdf",
        "createdAt": "2026-03-01T12:00:00.000Z"
      }
    ],
    "talentPoolSubmissions": []
  },
  "candidateData": { ... },
  "success": true,
  "message": "Candidate compliance data exported successfully."
}
```

---

### 2. `POST /api/admin/careers/compliance`

Permanently purges candidate records and deletes uploaded resume assets from Supabase Storage.

| Attribute       | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| **Auth**        | Required (`AdminSession` via HTTP-only cookie)                     |
| **RBAC**        | `Admin+` (`admin`, `owner` only). Viewers, authors, editors denied |
| **Origin**      | Enforced — foreign cross-site origins → `403 Forbidden`            |
| **Cache**       | `private, no-store`                                                |
| **Response**    | `200 OK` with deletion counters and audit confirmation             |

#### Request Body Schema
```json
{
  "email": "candidate@example.com"
}
```

#### Response Example (`200 OK`)
```json
{
  "ok": true,
  "data": {
    "success": true,
    "email": "candidate@example.com",
    "deletedApplicationsCount": 1,
    "deletedTalentPoolCount": 0,
    "deletedFilesCount": 1,
    "message": "Candidate records and files purged successfully."
  },
  "result": { ... },
  "success": true,
  "message": "Candidate records and files purged successfully."
}
```

---

## HTTP Status Code & Error Matrix

| Status | Code Enum           | Message / Trigger                                                 |
| ------ | ------------------- | ----------------------------------------------------------------- |
| `200`  | —                   | Export or purge completed successfully                            |
| `401`  | `UNAUTHENTICATED`   | Missing or expired admin session                                  |
| `403`  | `FORBIDDEN`         | Foreign origin header or insufficient role (`Editor` / `Viewer`)  |
| `422`  | `VALIDATION`        | Malformed or missing candidate email                              |
| `500`  | `INTERNAL`          | Unexpected database or storage failure                            |

---

## TypeScript Client Example

```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

// 1. Export candidate data
export async function exportCandidateComplianceData(email: string) {
  const url = `${API_ENDPOINTS.ADMIN.COMPLIANCE}?email=${encodeURIComponent(email)}`;
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || "Failed to export candidate data");
  }

  return payload.data;
}

// 2. Permanently purge candidate data (GDPR Right to be Forgotten)
export async function purgeCandidateData(email: string) {
  const response = await fetch(API_ENDPOINTS.ADMIN.COMPLIANCE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || "Failed to purge candidate data");
  }

  return payload.data;
}
```

---

## Verification & Black-Box Execution

### Run Standalone Black-Box Script
```bash
npx tsx blackbox-testing/careers/verify_admin_careers_compliance_blackbox.ts
```

### Run Vitest Integration Suite
```bash
npx vitest run tests/admin-careers-compliance-blackbox.test.ts
```
