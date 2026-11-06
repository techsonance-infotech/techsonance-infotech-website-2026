# Frontend Integration Guide: `/api/admin/careers/applications` & `/[id]`

This document provides complete end-to-end integration specifications for the **Admin Candidate Applications Inbox & Review Endpoints** (`GET /api/admin/careers/applications`, `GET /api/admin/careers/applications/[id]`, and `PATCH /api/admin/careers/applications/[id]`).

---

## 1. Endpoints Overview & Purpose

| Method | Endpoint Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/careers/applications` | Lists candidate applications with pagination, full-text search, job filtering, status filtering, and knockout-only toggles. |
| `GET` | `/api/admin/careers/applications/[id]` | Fetches full candidate profile, screening question responses, EEOC details, cover letter, and resume metadata. |
| `PATCH` | `/api/admin/careers/applications/[id]` | Updates recruitment pipeline stage (`ApplicationStatus`), records rejection reasons, and saves internal reviewer notes and ratings (1–5). |

### Security & Invariants
- **Authentication**: `required` (Admin / Recruiter session cookie). Unauthenticated requests return `401 UNAUTHENTICATED`.
- **Origin Check**: Enforces domain verification (`403 FORBIDDEN` on unauthorized foreign callers).
- **Request Tracing**: All responses include unique `x-request-id` headers.
- **Cache-Control**: `private, no-store` prevents caching of sensitive candidate PII.

---

## 2. API Contract & Wire Protocol

### 2.1 `GET /api/admin/careers/applications` (Inbox & Filter)

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `jobId` | `string` (UUID) | No | Filter by specific job posting. |
| `status` | `enum` | No | Filter by pipeline stage: `"NEW"`, `"SCREENING"`, `"SHORTLISTED"`, `"INTERVIEW"`, `"OFFER"`, `"HIRED"`, `"REJECTED"`, `"WITHDRAWN"`. |
| `search` | `string` | No | Search query across candidate name, email, or skills. |
| `knockoutTriggered` | `boolean`/`"true"`| No | Toggle to filter candidates who triggered knockout questions. |
| `limit` | `number` | No | Results per page (1–100, default `50`). |
| `offset` | `number` | No | Pagination offset (default `0`). |

#### Success Response (`200 OK`)
```json
{
  "ok": true,
  "data": {
    "applications": [
      {
        "id": "app-uuid-1111",
        "jobId": "job-uuid-2222",
        "candidateName": "Elena Rostova",
        "email": "elena@example.com",
        "phone": "+91 9123456789",
        "status": "NEW",
        "rating": 4,
        "internalNotes": "Strong background in distributed architecture.",
        "knockoutTriggered": false,
        "createdAt": "2026-11-06T10:30:00.000Z",
        "updatedAt": "2026-11-06T10:30:00.000Z"
      }
    ],
    "total": 1
  },
  "applications": [ ... ],
  "total": 1
}
```

---

### 2.2 `GET /api/admin/careers/applications/[id]` (Applicant Detail)

#### Route Parameter
- `id`: Valid UUID of the candidate application.

#### Success Response (`200 OK`)
```json
{
  "ok": true,
  "data": {
    "application": {
      "id": "app-uuid-1111",
      "jobId": "job-uuid-2222",
      "candidateName": "Elena Rostova",
      "email": "elena@example.com",
      "phone": "+91 9123456789",
      "currentLocation": "Bhubaneswar, India",
      "portfolioUrl": "https://elenarostova.dev",
      "githubUrl": "https://github.com/elenarostova",
      "linkedinUrl": "https://linkedin.com/in/elenarostova",
      "coverLetter": "Excited to apply for the Principal Engineer role.",
      "resumeStoragePath": "resumes/2026/11/elena_cv.pdf",
      "screeningAnswers": [
        {
          "questionId": "q_exp",
          "question": "Do you have 5+ years with distributed systems?",
          "answer": true
        }
      ],
      "status": "NEW",
      "rating": 4,
      "internalNotes": "Impressive technical portfolio.",
      "knockoutTriggered": false,
      "createdAt": "2026-11-06T10:30:00.000Z"
    }
  },
  "application": { ... }
}
```

---

### 2.3 `PATCH /api/admin/careers/applications/[id]` (Stage Transition & Rating)

#### Request Body (`application/json`)
| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `status` | `enum` | No | New recruitment stage (`"SCREENING"`, `"SHORTLISTED"`, `"INTERVIEW"`, `"OFFER"`, `"HIRED"`, `"REJECTED"`). |
| `rejectionReason`| `string` | No | Reason recorded when rejecting (max 500 characters). |
| `internalNotes` | `string` | No | Reviewer comments (max 5,000 characters). |
| `rating` | `number` | No | Reviewer score: integer between `1` and `5` (or `null` to reset). |

#### Success Response (`200 OK`)
```json
{
  "ok": true,
  "data": {
    "application": {
      "id": "app-uuid-1111",
      "status": "SHORTLISTED",
      "rating": 5,
      "internalNotes": "Passed initial screening."
    }
  },
  "application": { ... }
}
```

---

## 3. Frontend Integration: React 19 Kanban & Drawer Updates

```tsx
"use client";

import React, { useState, useEffect } from "react";
import { ApplicationStatus } from "@/lib/constants/enums/content.enum";

// Fetch candidate applications for Inbox & Kanban
export async function fetchApplicationsInbox(filters: {
  status?: ApplicationStatus;
  jobId?: string;
  search?: string;
  knockoutTriggered?: boolean;
}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.jobId) params.set("jobId", filters.jobId);
  if (filters.search) params.set("search", filters.search);
  if (filters.knockoutTriggered !== undefined) {
    params.set("knockoutTriggered", String(filters.knockoutTriggered));
  }

  const res = await fetch(`/api/admin/careers/applications?${params.toString()}`);
  const json = await res.json();

  if (!res.ok || !json.ok) {
    throw new Error(json.error?.message || "Failed to load applications");
  }

  return json.data; // { applications: [...], total: number }
}

// Transition candidate pipeline stage (e.g. Kanban Drag & Drop)
export async function transitionApplicationStage(
  applicationId: string,
  newStage: ApplicationStatus,
  rejectionReason?: string,
) {
  const res = await fetch(`/api/admin/careers/applications/${applicationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: newStage,
      rejectionReason,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error?.message || "Failed to update candidate stage");
  }

  return json.data.application;
}

// Update reviewer notes and rating (1–5 Stars)
export async function updateCandidateNotesAndRating(
  applicationId: string,
  internalNotes: string,
  rating: number | null,
) {
  const res = await fetch(`/api/admin/careers/applications/${applicationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      internalNotes,
      rating,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error?.message || "Failed to save reviewer notes");
  }

  return json.data.application;
}
```

---

## 4. Verification Proof

- [x] **Contracts Registered**: Defined in [`lib/contracts/admin-applications.contract.ts`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/lib/contracts/admin-applications.contract.ts).
- [x] **Authentication & Origin Protection**: All 3 handlers verify admin sessions (401) and permitted origins (403).
- [x] **Black Box Tests**: 9 test scenarios in [`tests/admin-applications-blackbox.test.ts`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/tests/admin-applications-blackbox.test.ts) covering authentication rejections, query filters, not-found (404) scenarios, stage transitions, and rating validation (1–5).
- [x] **Regression Suite**: 35 test suites with **338 tests passing** (`npm test`).
- [x] **TypeScript Strict**: Passed with 0 errors (`npm run typecheck`).
