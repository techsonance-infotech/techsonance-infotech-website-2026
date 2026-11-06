# Frontend Integration Guide: POST /api/careers/talent-pool

## 1. Overview & Business Purpose
The `POST /api/careers/talent-pool` endpoint enables prospective job candidates to register into TechSonance's general talent pool when there is no specific active vacancy matching their immediate profile. It supports both structured JSON submissions (e.g. from the quick talent capture modal) and multipart FormData submissions with optional PDF/DOCX resume file attachments.

### Key Architectural Invariants
- **Centralized Endpoint**: Referenced strictly via `API_ENDPOINTS.CAREERS.TALENT_POOL` from `@/lib/constants/endpoints.constants`.
- **Bot Defense (Honeypot)**: Protects against automated web scrapers and form spammers via invisible honeypot fields (`website_url`, `_hp`); bot submissions are silently defeated with a simulated `200 OK`.
- **Rate Limiting**: Enforced at 10 requests per minute per IP via `@/lib/server/rateLimit`; exceeding clients receive `429 RATE_LIMITED`.
- **Origin & CORS Verification**: Foreign or untrusted origins receive `403 FORBIDDEN`.
- **Dual Content-Type Support**: Seamlessly processes both `application/json` and `multipart/form-data`.
- **Resume Magic Bytes Verification**: When a resume is attached, verifies file magic bytes (`%PDF` or DOCX zip signature) and enforces a 10MB size limit.
- **Private Cloud Storage Upload**: Automatically uploads validated candidate resumes to the secure Supabase Storage bucket (`resumes/siteId/talent-pool/...`).
- **Discriminated Union Envelope**: Always returns `{ ok: true, data: { id, name, email }, id }` or `{ ok: false, error: ErrorPayload }`. Top-level `id` is retained for legacy UI modal compatibility.
- **Traceability**: Emits `x-request-id` header in all responses.

---

## 2. Endpoint Specification

- **Method**: `POST`
- **Path**: `/api/careers/talent-pool`
- **Constant**: `API_ENDPOINTS.CAREERS.TALENT_POOL`
- **Contract**: `talentPoolContract` in `@/lib/contracts/careers.contract`
- **Authentication**: None (Public visitor endpoint)
- **Supported Content Types**: `application/json` or `multipart/form-data`

### Request Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | Yes | Candidate full name (min 2 characters). |
| `email` | `string` | Yes | Valid email address. |
| `phone` | `string` | No | Phone number with country code. |
| `preferredRole` | `string` | No | Target role title or domain of interest. |
| `experienceLevel` | `string` | No | `entry`, `mid`, `senior`, `lead`, `executive` (default: `mid`). |
| `skills` | `string[]` or comma-separated string | No | Candidate skill tags (e.g. `["React", "Node.js"]`). |
| `portfolioUrl` | `string` | No | Portfolio, GitHub, or LinkedIn URL. |
| `notes` | `string` | No | Cover letter or additional notes. |
| `resumeFile` | `File` (Binary) | No | Optional candidate resume (`.pdf` or `.docx`, max 10MB). |
| `privacyConsent` | `boolean` | Yes | Confirmation of privacy policy acceptance. |
| `website_url` | `string` | No | **Honeypot field** (must be left empty by human users). |

---

## 3. Response Contracts & Envelopes

### Success Response (HTTP 200 OK)
```json
{
  "ok": true,
  "data": {
    "id": "t1111111-2222-4333-8444-555555555555",
    "name": "Aarav Sharma",
    "email": "aarav.sharma@example.com"
  },
  "id": "t1111111-2222-4333-8444-555555555555"
}
```

### Error Responses

#### 400 Validation Error (Missing Fields)
```json
{
  "ok": false,
  "error": "Full name is required.",
  "errorPayload": {
    "code": "VALIDATION",
    "message": "Full name is required.",
    "fieldErrors": {
      "name": ["Full name is required.", "Full name must be at least 2 characters"],
      "email": ["Invalid email address"]
    },
    "requestId": "7904ce91-6af5-481d-a2e2-03311947ecb5"
  },
  "code": "VALIDATION",
  "message": "Full name is required."
}
```

#### 403 Forbidden (Origin Mismatch)
```json
{
  "ok": false,
  "error": "Forbidden origin",
  "errorPayload": {
    "code": "FORBIDDEN",
    "message": "Forbidden origin",
    "requestId": "b36d01e5-f10c-4d4d-b8b3-77d466dd05e4"
  },
  "code": "FORBIDDEN",
  "message": "Forbidden origin"
}
```

#### 429 Rate Limited
```json
{
  "ok": false,
  "error": "Too many requests. Please try again later.",
  "errorPayload": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "requestId": "9c123456-7890-4abc-def1-234567890abc"
  },
  "code": "RATE_LIMITED",
  "message": "Too many requests. Please try again later."
}
```

#### 500 Internal Server Error
```json
{
  "ok": false,
  "error": "An unexpected error occurred while processing your submission.",
  "errorPayload": {
    "code": "INTERNAL",
    "message": "An unexpected error occurred while processing your submission.",
    "requestId": "8004bfb3-1181-43ca-ab92-7f74cd6dcc65"
  },
  "code": "INTERNAL",
  "message": "An unexpected error occurred while processing your submission."
}
```

---

## 4. Frontend Integration Examples

### A. React Component Submission (Modal Hook)
Integrated directly in [`components/careers/TalentPoolCaptureModal.tsx`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/components/careers/TalentPoolCaptureModal.tsx):
```tsx
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

export async function submitTalentPoolModal(data: {
  name: string;
  email: string;
  phone?: string;
  preferredRole?: string;
  experienceLevel: string;
  skills: string[];
  portfolioUrl?: string;
  notes?: string;
  privacyConsent: boolean;
}) {
  const res = await fetch(API_ENDPOINTS.CAREERS.TALENT_POOL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error || json.message || "Failed to join talent pool.");
  }

  return json.data;
}
```

### B. Submitting with Optional Resume File (FormData)
```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import type { Result } from "@/lib/result";
import { ErrorCode } from "@/lib/errors";

export interface TalentPoolInput {
  name: string;
  email: string;
  phone?: string;
  skills?: string[];
  preferredRole?: string;
  experienceLevel?: string;
  portfolioUrl?: string;
  notes?: string;
  resumeFile?: File;
  privacyConsent: boolean;
}

export async function submitCandidateWithResume(
  input: TalentPoolInput,
): Promise<Result<{ id: string; name: string; email: string }>> {
  try {
    const formData = new FormData();
    formData.append("name", input.name);
    formData.append("email", input.email);
    if (input.phone) formData.append("phone", input.phone);
    if (input.preferredRole) formData.append("preferredRole", input.preferredRole);
    if (input.experienceLevel) formData.append("experienceLevel", input.experienceLevel);
    if (input.skills && input.skills.length > 0) {
      formData.append("skills", input.skills.join(","));
    }
    if (input.portfolioUrl) formData.append("portfolioUrl", input.portfolioUrl);
    if (input.notes) formData.append("notes", input.notes);
    formData.append("privacyConsent", String(input.privacyConsent));

    if (input.resumeFile) {
      formData.append("resumeFile", input.resumeFile);
    }

    const res = await fetch(API_ENDPOINTS.CAREERS.TALENT_POOL, {
      method: "POST",
      body: formData,
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      return {
        ok: false,
        error: {
          code: json.code || json.errorPayload?.code || ErrorCode.BAD_REQUEST,
          message: json.error || json.message || "Talent pool registration failed",
          fieldErrors: json.errorPayload?.fieldErrors,
          requestId: json.errorPayload?.requestId,
        },
      };
    }

    return {
      ok: true,
      data: json.data,
    };
  } catch (err) {
    return {
      ok: false,
      error: {
        code: ErrorCode.UNAVAILABLE,
        message: err instanceof Error ? err.message : "Network failure submitting profile",
      },
    };
  }
}
```

---

## 5. Security & Verification Checklist
- [x] Endpoint centralized in `API_ENDPOINTS.CAREERS.TALENT_POOL`
- [x] Honeypot anti-spam protection enabled
- [x] Rate limiting enforced (10 reqs / min / IP)
- [x] Strict Zod input validation (`talentPoolSubmissionSchema`)
- [x] Magic bytes verification on uploaded resume files
- [x] Private cloud storage upload to `resumes` bucket
- [x] Dual support for JSON and Multipart FormData
- [x] 100% test coverage in Vitest (`tests/careers-talent-pool-blackbox.test.ts`)
- [x] Standalone black-box verification script executed and verified (`blackbox-testing/careers/verify_careers_talent_pool_blackbox.ts`)
