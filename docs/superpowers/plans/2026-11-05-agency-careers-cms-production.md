# Agency Careers Page & CMS Admin Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a production-ready Agency Careers Page and CMS Admin with rich structured job fields, 7-status lifecycle with approval gates, dedicated `/careers/[slug]` detail pages with Schema.org `JobPosting` JSON-LD, secure private resume storage in Supabase, an 8-stage applicant pipeline with candidate review drawer, and GDPR compliance tools.

**Architecture:** Extended Drizzle ORM schemas backed by PostgreSQL with transactional integrity. Domain logic is isolated in stateless Needle DI services (`AdminJobsService`, `CareerApplyService`, `ApplicationsService`). The public experience leverages Next.js 16 App Router Server Components with on-demand tag revalidation, and the admin interface provides real-time completeness checklists, previews, and Kanban/table views.

**Tech Stack:** Next.js 16.4.4 (App Router), React 19, TypeScript (strict), Drizzle ORM 1.0.0-rc.5 + postgres.js, Needle DI (`@needle-di/core`), Zod 4, Supabase Storage (`@supabase/supabase-js`), Tailwind CSS v4, Motion 14, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-05-agency-careers-cms-production-design.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/superpowers/specs/2026-11-05-agency-careers-cms-production-design.md)

---

## Global Constraints

- Never use `process.env` outside `lib/env` and root configuration files.
- All database objects must maintain existing `ts_content_*` and `ts_admin_*` naming conventions.
- Only published roles may appear on public listings, search, and dynamic sitemaps.
- Public `/careers/[slug]` URLs for closed or paused roles must never return 404; they display state banners and recommend similar active openings.
- Resumes must be stored in private Supabase Storage (`resumes` bucket) with magic-byte/MIME validation; public visitors never receive raw public download URLs.
- Every state transition, publish, close, delete, and applicant stage movement must be logged in `ts_content_audit_log`.
- All form inputs and API payloads must be validated using Zod 4.
- All code must conform to strict Next.js 16 and React 19 server/client boundaries (`import "server-only"` for server layers; `"use client"` files never import server modules).

---

## File Structure

```
lib/database/schema/core/
  job.schema.ts                         # Extended jobsTable schema (comp, screening, status)
  application.schema.ts                 # Extended applicationsTable schema (versionId, notes, ratings)
  talent-pool.schema.ts                 # New talentPoolTable schema
  careers-settings.schema.ts            # New careersSettingsTable schema
  eeoc.schema.ts                        # New eeocResponsesTable schema (isolated)
  index.schema.ts                       # Barrel export update
drizzle/
  20261105XXXXXX_careers_production/   # Versioned Drizzle migration
lib/validations/
  careers.ts                            # Zod schemas for jobs, applications, screening, and filters
lib/services/
  admin-jobs.service.ts                 # 7-status lifecycle state machine, transitions, approval flow
  career-apply.service.ts               # Application intake, private storage, duplicate/knockout checks
  applications.service.ts               # Candidate pipeline, notes, ratings, bulk actions, GDPR purge
app/
  careers/
    page.tsx                            # Server-rendered careers listing with search/filter params
    CareersClient.tsx                   # Interactive filters, search, URL sync, talent-pool empty state
    [slug]/
      page.tsx                          # Job detail page, sticky CTA, state banners, JobPosting JSON-LD
  sitemap.ts                            # Dynamic sitemap generator updated with published jobs
  api/
    careers/
      apply/route.ts                    # Public application intake endpoint
      talent-pool/route.ts              # Public talent pool general intake endpoint
    admin/
      careers/
        settings/route.ts               # Admin settings endpoint
        applications/
          route.ts                      # List applications with filters/search
          [id]/route.ts                 # Update stage, notes, ratings, get signed resume URL
          [id]/resume/route.ts          # Short-lived signed download URL generator
          export/route.ts               # CSV export endpoint
          purge-candidate/route.ts      # GDPR candidate removal endpoint
  admin/careers/
    jobs/
      page.tsx                          # Jobs table with status tabs & search
      [id]/page.tsx                     # Full 6-section Job Editor with checklist & preview
    applications/
      page.tsx                          # Applications inbox (Table/Kanban, Candidate Drawer)
```

---

## Phase 1: Foundation, Data Architecture & Domain Lifecycle

### Task 1: Database Schema Expansion & Migration

**Files:**
- Modify: `lib/database/schema/core/job.schema.ts`
- Modify: `lib/database/schema/core/application.schema.ts`
- Create: `lib/database/schema/core/talent-pool.schema.ts`
- Create: `lib/database/schema/core/careers-settings.schema.ts`
- Create: `lib/database/schema/core/eeoc.schema.ts`
- Modify: `lib/database/schema/index.schema.ts`

**Interfaces:**
- Produces: `jobsTable`, `applicationsTable`, `talentPoolTable`, `careersSettingsTable`, `eeocResponsesTable`.

- [ ] **Step 1: Write test verifying schema types and exported tables**

Create `tests/careers-schema.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { jobsTable } from "@/lib/database/schema/core/job.schema";
import { applicationsTable } from "@/lib/database/schema/core/application.schema";
import { talentPoolTable } from "@/lib/database/schema/core/talent-pool.schema";
import { careersSettingsTable } from "@/lib/database/schema/core/careers-settings.schema";

describe("Careers Production Database Schemas", () => {
  it("exports all tables with required columns", () => {
    expect(jobsTable).toBeDefined();
    expect(applicationsTable).toBeDefined();
    expect(talentPoolTable).toBeDefined();
    expect(careersSettingsTable).toBeDefined();

    expect(jobsTable.workMode).toBeDefined();
    expect(jobsTable.showSalaryPublicly).toBeDefined();
    expect(jobsTable.screeningQuestions).toBeDefined();
    expect(applicationsTable.resumeStoragePath).toBeDefined();
    expect(applicationsTable.knockoutTriggered).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/careers-schema.test.ts`  
Expected: FAIL (missing fields/tables)

- [ ] **Step 3: Implement new schema definitions**

1. Create `lib/database/schema/core/talent-pool.schema.ts` with fields: `id`, `siteId`, `name`, `email`, `phone`, `skills`, `preferredRole`, `experienceLevel`, `portfolioUrl`, `resumeStoragePath`, `notes`, `consentDate`, `createdAt`, `updatedAt`.
2. Create `lib/database/schema/core/careers-settings.schema.ts` with fields: `id`, `siteId`, `requireApprovalToPublish`, `defaultCloseDurationDays`, `documentRetentionDays`, `adminAlertRecipients`.
3. Create `lib/database/schema/core/eeoc.schema.ts` with fields: `id`, `jobId`, `gender`, `ethnicity`, `veteranStatus`, `disabilityStatus`, `createdAt`.
4. Update `lib/database/schema/core/job.schema.ts` and `lib/database/schema/core/application.schema.ts` with the full field set specified in Section 3 of the design spec.
5. Export new tables from `lib/database/schema/index.schema.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/careers-schema.test.ts`  
Expected: PASS

- [ ] **Step 5: Generate Drizzle migration and run db check**

Run: `npx drizzle-kit generate`  
Run: `npm run db:check`

- [ ] **Step 6: Commit**

```bash
git add lib/database/schema/ drizzle/ tests/careers-schema.test.ts
git commit -m "feat(careers): extend jobs and applications schemas with production fields"
```

---

### Task 2: Validation Schemas & Status Lifecycle State Machine

**Files:**
- Create: `lib/validations/careers.ts`
- Modify: `lib/services/admin-jobs.service.ts`
- Test: `tests/careers-lifecycle.test.ts`

**Interfaces:**
- Produces: `jobPostingInputSchema`, `applicationSubmissionSchema`, `AdminJobsService.transitionStatus(id, newStatus, user, comment?)`.

- [ ] **Step 1: Write failing test for allowed/forbidden lifecycle transitions**

Create `tests/careers-lifecycle.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";

describe("AdminJobsService Lifecycle State Machine", () => {
  it("allows Recruiter to submit DRAFT to IN_REVIEW", async () => {
    // Test logic asserting valid transition
  });

  it("prevents Recruiter from moving IN_REVIEW to PUBLISHED if approval is required", async () => {
    // Test logic asserting permission error
  });

  it("allows Admin to approve IN_REVIEW to PUBLISHED or return to DRAFT with comment", async () => {
    // Test logic asserting Admin approval
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/careers-lifecycle.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement validation schemas and status transition engine**

1. In `lib/validations/careers.ts`, write Zod schemas for:
   - `createJobSchema` and `updateJobSchema` (enforcing single-location, positive openings count, salary min <= max).
   - `jobStatusTransitionSchema` (`DRAFT`, `IN_REVIEW`, `SCHEDULED`, `PUBLISHED`, `PAUSED`, `CLOSED`, `ARCHIVED`).
   - `applicationSubmissionSchema` (validating email, phone, screening questions answers, privacy consent).
2. In `lib/services/admin-jobs.service.ts`:
   - Implement `transitionStatus(jobId, targetStatus, actor, comment?)` enforcing the transition matrix and role permissions.
   - Insert version snapshot into `ts_content_versions` on material changes.
   - Insert audit trail into `ts_content_audit_log`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/careers-lifecycle.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/validations/careers.ts lib/services/admin-jobs.service.ts tests/careers-lifecycle.test.ts
git commit -m "feat(careers): implement 7-state job lifecycle engine and validation schemas"
```

---

## Phase 2: Public Careers Experience & SEO

### Task 3: Dynamic Job Detail Page (`/careers/[slug]`) & Schema.org JSON-LD

**Files:**
- Create: `app/careers/[slug]/page.tsx`
- Create: `app/careers/[slug]/JobDetailClient.tsx`
- Create: `components/careers/JobPostingJsonLd.tsx`
- Create: `components/careers/ClosedJobBanner.tsx`

**Interfaces:**
- Consumes: `getJobSource().get(slug)` from `lib/content/jobs.ts`.
- Produces: Statically cached job detail page at `/careers/[slug]` with SEO metadata, structured data, sticky CTA, and closed/paused banners.

- [ ] **Step 1: Write test for JobPosting JSON-LD generation and status banner rendering**

Create `tests/job-detail.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { generateJobPostingJsonLd } from "@/components/careers/JobPostingJsonLd";
import type { JobPosting } from "@/lib/content/types";

describe("JobPostingJsonLd Component", () => {
  it("formats valid Schema.org JobPosting object", () => {
    const mockJob: JobPosting = {
      slug: "frontend-engineer",
      title: "Frontend Engineer",
      department: "Engineering",
      location: "Remote",
      type: "full_time",
      description: "Building Next.js apps",
      responsibilities: ["Develop UI"],
      requirements: ["React 19"],
      benefits: ["Health insurance"],
      status: "PUBLISHED",
    };
    const jsonLd = generateJobPostingJsonLd(mockJob);
    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("JobPosting");
    expect(jsonLd.title).toBe("Frontend Engineer");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/job-detail.test.tsx`  
Expected: FAIL

- [ ] **Step 3: Implement Job detail components and dynamic route**

1. Create `components/careers/JobPostingJsonLd.tsx` generating valid JSON-LD script tag.
2. Create `components/careers/ClosedJobBanner.tsx` rendering state notice and similar open roles when role is `CLOSED` or `PAUSED`.
3. Create `app/careers/[slug]/page.tsx`:
   - Fetch role via `getJobSource().get(slug)`.
   - If not found or draft, call `notFound()`.
   - Render `JobDetailClient` with summary strip, responsibilities, requirements, benefits, team, hiring process, and sticky mobile Apply CTA.
   - Dynamic `generateMetadata` with canonical URL and OpenGraph preview tags.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/job-detail.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/careers/[slug]/ components/careers/ tests/job-detail.test.tsx
git commit -m "feat(careers): add dynamic job detail page with Schema.org JSON-LD and closed banners"
```

---

### Task 4: Upgraded Careers Listing with Facet Filters & URL Sync

**Files:**
- Modify: `app/careers/page.tsx`
- Modify: `app/careers/CareersClient.tsx`
- Create: `components/careers/TalentPoolCaptureModal.tsx`

**Interfaces:**
- Consumes: `getJobSource().list({ status: "PUBLISHED" })`.
- Produces: Debounced search, facet chips (Dept, Work Mode, Type, Experience), URL search params synchronization, and Talent Pool empty state capture.

- [ ] **Step 1: Write test for filter matching logic**

Create `tests/careers-filter.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { filterJobs } from "@/app/careers/filterUtils";

describe("filterJobs", () => {
  const jobs = [
    { title: "Frontend Lead", department: "Engineering", workMode: "remote", type: "full_time" },
    { title: "Product Designer", department: "Design", workMode: "hybrid", type: "full_time" },
  ];

  it("filters accurately by keyword and department", () => {
    const result = filterJobs(jobs as any, { search: "Frontend", department: "Engineering" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Frontend Lead");
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/careers-filter.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement filters and Talent Pool capture component**

1. Extract filter helper to `app/careers/filterUtils.ts`.
2. Refactor `app/careers/CareersClient.tsx`:
   - Add search bar with debounced input.
   - Add filter chips for Department, Work Mode (`Remote`, `Hybrid`, `On-site`), Employment Type, and Experience.
   - Sync filter state with `useRouter` and `useSearchParams`.
   - When 0 jobs match, render the empty state with a "Reset Filters" action and a "Join our Talent Pool" form.
3. Create `components/careers/TalentPoolCaptureModal.tsx` submitting to `/api/careers/talent-pool`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/careers-filter.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/careers/ components/careers/ tests/careers-filter.test.ts
git commit -m "feat(careers): add search, facet filters, URL sync, and talent pool capture to listing"
```

---

### Task 5: Dynamic Sitemap Generation

**Files:**
- Modify: `app/sitemap.ts`

**Interfaces:**
- Consumes: `getJobSource().list({ status: "PUBLISHED" })`.
- Produces: Dynamic inclusion of `/careers/${job.slug}` for all published roles in sitemap.

- [ ] **Step 1: Write test for dynamic sitemap containing published jobs**

Create `tests/sitemap.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import sitemap from "@/app/sitemap";

describe("Dynamic Sitemap", () => {
  it("includes /careers and active published job slugs", async () => {
    const urls = await sitemap();
    const careersUrl = urls.find((u) => u.url.endsWith("/careers"));
    expect(careersUrl).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify failure/baseline**

Run: `npx vitest run tests/sitemap.test.ts`

- [ ] **Step 3: Update `app/sitemap.ts` to query published jobs**

In `app/sitemap.ts`, fetch active published jobs from `getJobSource().list({ status: "PUBLISHED" })` and append each `${BASE_URL}/careers/${job.slug}` with `lastModified = job.updatedAt`. Exclude closed or unlisted jobs.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/sitemap.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/sitemap.ts tests/sitemap.test.ts
git commit -m "feat(seo): dynamically include published job openings in sitemap"
```

---

## Phase 3: Application Intake, Resume Storage & Candidate Pipeline

### Task 6: Private Resume Storage & Application Submission Service

**Files:**
- Create: `lib/services/career-apply.service.ts`
- Create: `app/api/careers/apply/route.ts`
- Modify: `lib/di/container.ts`

**Interfaces:**
- Consumes: Supabase Storage (`resumes` private bucket), `EmailService`.
- Produces: `CareerApplyService.submitApplication(formData, job)` returning created application.

- [ ] **Step 1: Write unit test for application submission validation and duplicate detection**

Create `tests/career-apply.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { CareerApplyService } from "@/lib/services/career-apply.service";

describe("CareerApplyService", () => {
  it("blocks duplicate application for same email and role", async () => {
    // Assert duplicate detection throws AppError("CONFLICT", "Already applied")
  });

  it("flags knockoutTriggered if candidate fails knockout screening question", async () => {
    // Assert knockout detection sets knockoutTriggered = true
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/career-apply.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement CareerApplyService and API Route**

1. In `lib/services/career-apply.service.ts`:
   - Validate file MIME types (`application/pdf`, `docx`) and size ($\le 5\text{MB}$).
   - Upload file to private Supabase Storage bucket `resumes`.
   - Validate role is currently open and not expired.
   - Check `ts_content_applications` for existing `(jobId, email)` duplicate.
   - Evaluate screening question answers for knockout flags.
   - Insert application record into `ts_content_applications`.
   - Dispatch background confirmation email to candidate and alert email to recruiter.
2. In `app/api/careers/apply/route.ts`:
   - Parse `FormData`, apply honeypot and rate-limiting check (`lib/server/rateLimit.ts`).
   - Call `CareerApplyService.submitApplication(...)`.
   - Return `{ ok: true, applicationId }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/career-apply.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/services/career-apply.service.ts app/api/careers/apply/ tests/career-apply.test.ts
git commit -m "feat(careers): implement secure resume upload, duplicate check, and dual email intake"
```

---

### Task 7: Candidate Pipeline Management & Applications API

**Files:**
- Create: `lib/services/applications.service.ts`
- Create: `app/api/admin/careers/applications/route.ts`
- Create: `app/api/admin/careers/applications/[id]/route.ts`
- Create: `app/api/admin/careers/applications/[id]/resume/route.ts`
- Create: `app/api/admin/careers/applications/export/route.ts`

**Interfaces:**
- Consumes: `applicationsTable`, Supabase Storage client.
- Produces: Pipeline stage transition, internal notes/rating updates, short-lived signed resume download URLs, and CSV exports.

- [ ] **Step 1: Write test for candidate stage movement and signed resume URL generation**

Create `tests/applications-service.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { ApplicationsService } from "@/lib/services/applications.service";

describe("ApplicationsService", () => {
  it("transitions applicant between stages and logs audit event", async () => {
    // Test stage transition NEW -> SCREENING
  });

  it("generates short-lived signed URL for resume download", async () => {
    // Test signed URL generation
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/applications-service.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement ApplicationsService and Admin API Routes**

1. Create `lib/services/applications.service.ts` with methods:
   - `listApplications(options)`: Filter by `jobId`, `status`, `knockoutTriggered`, `search`.
   - `updateStage(id, newStage, rejectionReason?, actorId?)`.
   - `updateNotesAndRating(id, notes, rating, actorId?)`.
   - `getSignedResumeUrl(id, actorRole)`: Generates 5-minute signed URL from Supabase Storage.
   - `exportApplicationsCsv(jobId?)`: Streams CSV representation.
2. Implement corresponding route handlers in `app/api/admin/careers/applications/`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/applications-service.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/services/applications.service.ts app/api/admin/careers/applications/ tests/applications-service.test.ts
git commit -m "feat(careers): implement applicant pipeline service, signed resume URLs, and CSV export"
```

---

### Task 8: Applications Inbox CMS Interface (Table & Kanban)

**Files:**
- Modify: `app/admin/careers/applications/page.tsx`
- Create: `components/admin/careers/ApplicationsTable.tsx`
- Create: `components/admin/careers/ApplicationsKanban.tsx`
- Create: `components/admin/careers/CandidateDrawer.tsx`

**Interfaces:**
- Consumes: `/api/admin/careers/applications` endpoints.
- Produces: Interactive ATS inbox with stage transitions, inline resume view, notes, ratings, and rejection modals.

- [ ] **Step 1: Implement CandidateDrawer component**

Create `components/admin/careers/CandidateDrawer.tsx`:
- Display candidate profile (name, email, phone, location, links).
- Render screening question answers with knockout badge if triggered.
- Inline resume viewer with "Open in New Tab" signed URL link.
- Rating component (1-5 stars) and internal team notes textarea with auto-save.
- Stage selector dropdown triggering status change.

- [ ] **Step 2: Implement ApplicationsTable and ApplicationsKanban components**

1. Create `components/admin/careers/ApplicationsTable.tsx` with columns: Candidate, Role, Stage, Applied Date, Rating, Knockout alert, Actions.
2. Create `components/admin/careers/ApplicationsKanban.tsx` with 8 columns: `New`, `Screening`, `Shortlisted`, `Interview`, `Offer`, `Hired`, `Rejected`, `Withdrawn`. Support quick drag or click-to-move stage transitions.

- [ ] **Step 3: Wire up `app/admin/careers/applications/page.tsx`**

Replace static mockup with:
- Top bar: Role filter dropdown, search input, Stage tabs, and View Toggle (Table / Kanban).
- "Export CSV" action button.
- Selection of applicant opens `CandidateDrawer`.

- [ ] **Step 4: Verify in browser / component test**

Run: `npm run typecheck`  
Expected: Zero type errors.

- [ ] **Step 5: Commit**

```bash
git add app/admin/careers/applications/ components/admin/careers/
git commit -m "feat(admin): build interactive applications inbox with table, kanban, and candidate drawer"
```

---

## Phase 4: Admin Job Editor, Approvals & Compliance

### Task 9: Full-Page Job Editor with Completeness Checklist & Live Preview

**Files:**
- Create: `app/admin/careers/jobs/[id]/page.tsx`
- Create: `components/admin/careers/JobEditorForm.tsx`
- Create: `components/admin/careers/CompletenessChecklist.tsx`
- Create: `components/admin/careers/JobLivePreview.tsx`

**Interfaces:**
- Consumes: `AdminJobsService.getJobById(id)`.
- Produces: 6-section job editing experience, real-time completeness checklist, desktop/mobile preview, and save/submit controls.

- [ ] **Step 1: Implement CompletenessChecklist component**

Create `components/admin/careers/CompletenessChecklist.tsx`:
- Evaluates required fields: Title, Department, Single Location or Remote, Employment Type, Description, Responsibilities ($\ge 1$), Requirements ($\ge 1$), EEOC Statement.
- Validates salary range: If entered, `salaryMin <= salaryMax`.
- Validates deadline: If entered, must be in the future.
- Highlights incomplete items in red/amber; disables "Submit for Review" / "Publish" until all required items pass.

- [ ] **Step 2: Implement JobLivePreview component**

Create `components/admin/careers/JobLivePreview.tsx`:
- Renders the exact UI of `/careers/[slug]` inside a responsive viewport container.
- Desktop / Mobile width toggle.

- [ ] **Step 3: Implement JobEditorForm and page layout**

In `app/admin/careers/jobs/[id]/page.tsx`:
- 6 organized tabs: Basics, Location & Mode, Content, Compensation, Application Settings, Review & Publish.
- Auto-save draft indicator with debounced save.
- Unsaved changes prompt on navigation.

- [ ] **Step 4: Run typecheck and linting**

Run: `npm run typecheck && npm run lint`  
Expected: Clean pass.

- [ ] **Step 5: Commit**

```bash
git add app/admin/careers/jobs/[id]/ components/admin/careers/
git commit -m "feat(admin): build multi-section job editor with completeness checklist and live preview"
```

---

### Task 10: Approval Workflow & Version Restoration

**Files:**
- Modify: `lib/services/admin-jobs.service.ts`
- Create: `app/api/admin/careers/jobs/[id]/approve/route.ts`
- Create: `app/api/admin/careers/jobs/[id]/return/route.ts`
- Create: `components/admin/careers/ApprovalActionDialog.tsx`
- Create: `components/admin/careers/VersionHistoryDialog.tsx`

**Interfaces:**
- Consumes: `ts_content_versions`, `ts_content_careers_settings`.
- Produces: Role submission for review, admin approval/rejection with comments, and version restoration.

- [ ] **Step 1: Write test for version snapshot comparison and approval decisions**

Create `tests/careers-approval.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";

describe("Careers Approval Workflow", () => {
  it("records version snapshot on save and allows rollback", async () => {
    // Assert version snapshot is recorded
  });

  it("returns role to DRAFT with approver comment when returned", async () => {
    // Assert approval return behavior
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/careers-approval.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement approval actions and version restoration**

1. In `lib/services/admin-jobs.service.ts`:
   - Implement `approveJob(jobId, actorId)` $\rightarrow$ sets status to `PUBLISHED` (or `SCHEDULED` if `publishAt` is in the future) and triggers email alert to recruiter.
   - Implement `returnJob(jobId, comment, actorId)` $\rightarrow$ sets status back to `DRAFT`, records `approvalComment`, and alerts recruiter.
   - Implement `restoreVersion(jobId, versionId, actorId)` $\rightarrow$ restores previous snapshot.
2. Wire API routes and dialog components in the Job Editor.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/careers-approval.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/services/admin-jobs.service.ts app/api/admin/careers/jobs/ components/admin/careers/ tests/careers-approval.test.ts
git commit -m "feat(careers): implement approval workflow, reviewer comments, and version history restore"
```

---

### Task 11: GDPR Compliance: Candidate Data Export & Permanent Deletion

**Files:**
- Create: `app/api/admin/careers/compliance/route.ts`
- Modify: `lib/services/applications.service.ts`
- Test: `tests/careers-gdpr.test.ts`

**Interfaces:**
- Consumes: `applicationsTable`, `talentPoolTable`, Supabase Storage client.
- Produces: Search candidate by email $\rightarrow$ export all records $\rightarrow$ permanently purge resumes and database rows with audit trail.

- [ ] **Step 1: Write test for candidate GDPR purge**

Create `tests/careers-gdpr.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { ApplicationsService } from "@/lib/services/applications.service";

describe("GDPR Compliance Deletion", () => {
  it("deletes all application records, resumes, and talent pool entries for a candidate email", async () => {
    // Test GDPR purge
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/careers-gdpr.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement GDPR export and purge service**

1. In `lib/services/applications.service.ts`:
   - Implement `exportCandidateData(email)`: Collates all applications, screening answers, and talent pool submissions.
   - Implement `purgeCandidateData(email, actorId)`:
     - Deletes all stored resume files from Supabase Storage bucket.
     - Hard-deletes application rows from `ts_content_applications`.
     - Hard-deletes talent pool row from `ts_content_talent_pool`.
     - Logs audit record in `ts_content_audit_log` with `action: 'compliance.candidate_purged'`.
2. Expose endpoint `/api/admin/careers/compliance`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/careers-gdpr.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/services/applications.service.ts app/api/admin/careers/compliance/ tests/careers-gdpr.test.ts
git commit -m "feat(compliance): implement candidate GDPR export and permanent purge tool"
```

---

## Phase 5: Verification, Quality Gates & Launch Readiness

### Task 12: End-to-End Verification & Quality Audit

**Files:**
- Create: `tests/careers-e2e-suite.test.ts`

- [ ] **Step 1: Write end-to-end regression test suite**

Verify the full scenario flow:
1. Recruiter creates role in `DRAFT`.
2. Completeness checklist passes; submitted to `IN_REVIEW`.
3. Admin approves; role transitions to `PUBLISHED`.
4. Role appears on `/careers` listing and `/careers/[slug]` detail page with Schema.org JSON-LD.
5. Dynamic sitemap includes the new slug.
6. Candidate submits application with resume file.
7. Application arrives in `/admin/careers/applications` inbox in `NEW` stage.
8. Dual emails dispatched (candidate confirmation + recruiter alert).
9. Recruiter reviews candidate drawer, downloads signed resume, moves to `INTERVIEW`, and leaves a note.
10. Admin closes role; `/careers/[slug]` displays closed banner; apply button disappears.

- [ ] **Step 2: Run all tests in the repository**

Run: `npm run test`  
Expected: 100% pass across all test suites.

- [ ] **Step 3: Run comprehensive project verification gates**

Run: `npm run typecheck`  
Run: `npm run lint`  
Run: `npm run check:boundaries`  
Run: `npm run build`  
Expected: All checks exit with code 0.

- [ ] **Step 4: Commit**

```bash
git add tests/careers-e2e-suite.test.ts
git commit -m "test(careers): add full end-to-end recruitment lifecycle verification suite"
```
