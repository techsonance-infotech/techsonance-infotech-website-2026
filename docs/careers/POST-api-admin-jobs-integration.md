# Frontend Integration Guide: `POST /api/admin/jobs`

This document details the complete end-to-end integration specifications for the **Admin Career Job Creation Endpoint** (`POST /api/admin/jobs`) in the Techsonance Infotech web application.

---

## 1. Endpoint Overview & Purpose

| Property | Value |
| :--- | :--- |
| **Route** | `POST /api/admin/jobs` |
| **Handler** | [`app/api/admin/jobs/route.ts`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/app/api/admin/jobs/route.ts) |
| **Contract** | [`lib/contracts/admin-jobs.contract.ts`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/lib/contracts/admin-jobs.contract.ts) |
| **Service** | [`lib/services/admin-jobs.service.ts`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/lib/services/admin-jobs.service.ts) |
| **Validation Schema** | [`createJobSchema`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/lib/validations/careers.ts) |
| **Authentication** | `required` (Admin session cookie required) |
| **Encoding** | `application/json` |
| **Origin Check** | Validated against permitted company & local host domains |

### Core Business Purpose
- Allows authorized HR and admin users to create new job opportunities (e.g. Full-time, Contract, Internship, Hybrid, Remote).
- Auto-generates initial content version snapshots in `ts_web_content_versions` for change tracking and audit rollback.
- Logs an immutable security audit entry in `ts_web_content_audit_log` with actor ID, IP address, and timestamp.
- Validates job compensation parameters (enforcing `salaryMin <= salaryMax`).
- Enforces strict location formatting (preventing ambiguous "multiple locations" strings; multi-location openings must be posted as separate roles).

---

## 2. Request Body Specification (`application/json`)

| Field Name | Type | Required | Description & Validation Rules |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **Yes** | Job title (min 3 characters). |
| `slug` | `string` | **Yes** | Lowercase alphanumeric hyphenated slug (e.g. `staff-software-engineer`). Regex: `^[a-z0-9-]+$`. |
| `department` | `string` | **Yes** | Department (e.g. `Engineering`, `Product`, `Design`). |
| `location` | `string` | **Yes** | Exact city/region (e.g. `Bhubaneswar`, `Remote`, `Surat`). Must not be "multiple locations". |
| `workMode` | `enum` | No | `"onsite"`, `"hybrid"`, or `"remote"`. Default: `"hybrid"`. |
| `type` | `enum` | No | `"full_time"`, `"part_time"`, `"contract"`, `"internship"`. Default: `"full_time"`. |
| `experienceLevel` | `enum` | No | `"entry"`, `"junior"`, `"mid"`, `"senior"`, `"lead"`, `"principal"`, `"executive"`. Default: `"mid"`. |
| `openingsCount` | `number` | No | Positive integer of open headcount (min 1). Default: `1`. |
| `salaryMin` | `number` | No | Minimum compensation minor unit or annual integer. |
| `salaryMax` | `number` | No | Maximum compensation. Must be `>= salaryMin`. |
| `salaryCurrency` | `string` | No | Currency ISO code (e.g. `"INR"`, `"USD"`). Default: `"INR"`. |
| `salaryPeriod` | `enum` | No | `"hour"`, `"month"`, or `"year"`. Default: `"year"`. |
| `showSalaryPublicly`| `boolean`| No | Whether compensation details render publicly on the career page. Default: `false`. |
| `summary` | `string` | No | High-level role summary (supports Markdown/plain text). |
| `description` | `string` | No | Full role overview, requirements, and responsibilities. |
| `screeningQuestions`| `array` | No | Array of screening question objects: `[{ id, question, type, options, required, knockoutAnswer }]`. |
| `status` | `enum` | No | `"DRAFT"`, `"PUBLISHED"`, `"ARCHIVED"`, `"INTERNAL_ONLY"`. Default: `"DRAFT"`. |
| `visibility` | `enum` | No | `"PUBLIC"`, `"PRIVATE"`, `"UNLISTED"`. Default: `"PUBLIC"`. |
| `featured` | `boolean`| No | Pins the job to the top of public career listings. Default: `false`. |

---

## 3. Wire Response Envelope Protocol

### 3.1 Success Response (`201 Created`)

```json
{
  "ok": true,
  "data": {
    "job": {
      "id": "7f8a9b0c-1d2e-3f4a-5b6c-7d8e9f0a1b2c",
      "slug": "staff-fullstack-engineer",
      "title": "Staff Fullstack Engineer",
      "department": "Engineering",
      "location": "Bhubaneswar",
      "workMode": "hybrid",
      "status": "DRAFT",
      "visibility": "PUBLIC",
      "openingsCount": 2,
      "createdAt": "2026-11-06T10:20:00.000Z",
      "updatedAt": "2026-11-06T10:20:00.000Z"
    }
  },
  "job": {
    "id": "7f8a9b0c-1d2e-3f4a-5b6c-7d8e9f0a1b2c",
    "slug": "staff-fullstack-engineer",
    "title": "Staff Fullstack Engineer"
  }
}
```

### 3.2 Error Response Envelope (`4xx` / `5xx`)

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION",
    "message": "Validation failed",
    "fieldErrors": {
      "salaryMax": ["Maximum salary must be greater than or equal to minimum salary"]
    },
    "requestId": "req_01j9b4c5d6e7f8"
  },
  "code": "VALIDATION"
}
```

---

## 4. Frontend Integration: React 19 Component Example

```tsx
"use client";

import React, { useState } from "react";
import { Briefcase, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface CreateJobFormProps {
  onSuccess?: (jobId: string, slug: string) => void;
}

export function CreateJobForm({ onSuccess }: CreateJobFormProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [location, setLocation] = useState("Bhubaneswar");
  const [workMode, setWorkMode] = useState<"hybrid" | "onsite" | "remote">("hybrid");
  const [salaryMin, setSalaryMin] = useState<string>("");
  const [salaryMax, setSalaryMax] = useState<string>("");
  const [openingsCount, setOpeningsCount] = useState("1");
  const [summary, setSummary] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        department: department.trim(),
        location: location.trim(),
        workMode,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        openingsCount: Number(openingsCount) || 1,
        summary: summary.trim(),
        status: "DRAFT",
      };

      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        if (res.status === 401) {
          throw new Error("Your admin session has expired. Please log in again.");
        }
        if (json.error?.fieldErrors) {
          setFieldErrors(json.error.fieldErrors);
        }
        throw new Error(json.error?.message || "Failed to create job posting.");
      }

      const newJob = json.data?.job || json.job;
      setCreatedJobId(newJob.id);
      if (onSuccess) onSuccess(newJob.id, newJob.slug);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to create job.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdJobId) {
    return (
      <div className="p-6 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Job Draft Created</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Opening <strong>{title}</strong> has been saved with ID <code>{createdJobId}</code>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div role="alert" className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm flex gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold mb-1">Job Title *</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-zinc-900"
        />
        {fieldErrors.title && <p className="text-xs text-red-600 mt-1">{fieldErrors.title[0]}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1">URL Slug *</label>
        <input
          type="text"
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-lg font-mono dark:bg-zinc-900"
        />
        {fieldErrors.slug && <p className="text-xs text-red-600 mt-1">{fieldErrors.slug[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1">Department *</label>
          <input
            type="text"
            required
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Location *</label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-zinc-900"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 bg-brand-600 text-white font-semibold text-sm rounded-lg hover:bg-brand-700 disabled:opacity-50"
      >
        {isSubmitting ? "Creating Draft..." : "Create Job Opening"}
      </button>
    </form>
  );
}
```

---

## 5. Verification Checklist

- [x] **Contracts Registered**: Defined in [`lib/contracts/admin-jobs.contract.ts`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/lib/contracts/admin-jobs.contract.ts).
- [x] **Security Invariants**: Enforces origin validation, admin authentication (401), and request ID tracing.
- [x] **Zod 4 Strict Validation**: Validates `salaryMin <= salaryMax`, unambiguous locations, and lowercase alphanumeric slugs.
- [x] **Black Box Tests**: 8 tests in [`tests/admin-jobs-blackbox.test.ts`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/tests/admin-jobs-blackbox.test.ts) covering authentication rejection, origin validation, salary constraint verification, and successful job creation.
- [x] **Automated Suite**: 34 test suites with **329 tests passing** (`npm test`).
