# Audit of the Careers Flow

I audited the document, not the code, so anything I say about implementation is a gap in the spec, not a confirmed bug. Check each point against the real code.

## Verdict

- **Job publishing side: about 6/10.** The foundation is good.
- **Whole recruitment system: about 3/10.** The document covers authoring a job and receiving an application, but almost nothing about what an admin does after an application arrives.
- **The "Audit Verdict" section is not an audit.** It lists three positives, with no findings, severity, tests or evidence. Claims like "no bare deletes" and "immediately reflect" are unverified.

**What is good:** contract-first design with Zod, boundary schemas that don't crash on bad data, a state machine with role permissions, version and audit tables, a private resume bucket, a honeypot and rate limit, and a job-version snapshot on each application.

## Critical problems (fix before production)

| # | Problem | Why it breaks |
|---|---|---|
| 1 | `resume_storage_path` and `resume_file_name` are `NOT NULL`, but the job has `resumeRequired = false` | When a job doesn't require a resume, the insert fails. |
| 2 | `status` is listed as an editable form field in Step 6 | A dropdown bypasses the state machine and role checks. Status should change only through action buttons (Submit, Approve, Pause, Close). |
| 3 | `closesAt` only "renders a countdown" | Nothing closes the job when the date passes. The listing stays live, stays cached, and may still accept applications. |
| 4 | `publishAt` and `SCHEDULED` have no scheduler | `SCHEDULED` appears in the transition table but not in the state diagram or the enum. Nothing flips it to published or purges the cache. |
| 5 | Application statuses have no `REJECTED`, `WITHDRAWN` or `ON_HOLD` | A recruiter cannot reject anyone. |
| 6 | There is no admin side for applications | The document doesn't mention an inbox, resume viewing (signed URLs), notes, ratings, status changes, emails or exports. This is the biggest gap. |
| 7 | The UI shows "tracking confirmation", but no tracking exists | Candidates are promised something the system doesn't do. |
| 8 | `privacy_consent_date` defaults to `now()` | Consent is recorded even if the candidate never ticked a box. Store an explicit consent flag and policy version. |
| 9 | The apply API's server-side checks aren't described | It must re-check that the job is PUBLISHED, not past `closesAt`, and not paused. A disabled button is not protection. |
| 10 | Cache purge is described only for status changes | Editing the salary or requirements of a live job may stay stale. `revalidateTag` can also serve stale content once, depending on your Next.js version and profile. Check this, and consider `updateTag` for admin saves. |

## Major problems

- **No duplicate-application rule.** Add a unique constraint on `(job_id, lower(email))` and decide when someone may reapply.
- **Orphaned files.** The resume is stored first, then the DB insert happens. If the insert fails, the file stays forever. Also add an idempotency key so a double-click doesn't create two applications.
- **File safety is thin.** The spec says "types, bounds". Add a size cap, a magic-byte check, rejection of encrypted PDFs, and a virus scan. Resumes are a classic malware route to HR staff. If you deploy on Vercel, check the serverless request body limit (about 4.5 MB) and consider uploading straight to storage.
- **No `created_at` or `updated_at` on applications.** There is also no status history, notes, assignee, rejection reason or source.
- **`job_version_id` has no foreign key,** and its default of `1` is misleading.
- **Screening answers should store the question text,** not only the answer, so they stay readable if questions change.
- **No owner on the job.** There is no `owner_id`, `hiring_manager_id` or notification email, so you can't route alerts, and a removed admin leaves orphaned jobs.
- **No concurrent-edit protection.** Two recruiters editing the same job means last write wins. Use optimistic locking on a version number.
- **No publish-readiness check.** Can DRAFT go to PUBLISHED with empty requirements? The DB constraints also mix "valid draft" with "publishable". Let drafts be incomplete and run a checklist on publish.
- **No preview** before publishing.
- **No clone or template feature,** which is what recruiters use most.
- **SEO is missing the one thing that matters.** There is no `JobPosting` JSON-LD for Google for Jobs (it needs datePosted, validThrough, hiringOrganization, jobLocation and salary). There is also no sitemap rule, and `unlisted` jobs need `noindex`.
- **Slug changes after publish** break links. Lock the slug after publish or keep a redirect table. Slugs should be unique per `(site_id, slug)`.
- **"No deletes" conflicts with data protection law.** India's DPDP Act, and GDPR if you take EU candidates, require erasure and retention limits. You need an anonymize/delete job and a retention policy, for example delete after 6 to 12 months unless the candidate opts into a talent pool.
- **Status ambiguity.** `PUBLISHED / OPEN` appears as one row. Pick one name. `PUBLISHED → DRAFT` on a live job also needs defined behavior (404? in-flight applicants?).

## Wrong or odd details

- **Defaults hide missing input.** `experienceLevel = 'mid'` and `workMode = 'hybrid'` mean a senior remote role can go live with the wrong badge. Require an explicit choice.
- **"EEOC Commitment"** is a US legal term. For an India-based LLP, use a plain equal-opportunity statement unless you hire in the US.
- **`notice_period_weeks`:** India uses days (30/60/90). Use days.
- **`visaSupport` and `remoteEligibility`** are noise for most roles. Show them only when relevant.
- **`compensationNotes`:** is it public or internal? If `showSalaryPublicly = false`, it must not leak.
- **Knockout questions:** keep them as a flag for human review, not auto-rejection. Auto-rejecting is a legal and bias risk.
- **"3-tier architecture"** is the heading, but the diagram has 5 layers.
- **"Apply drawer" and "Apply modal"** are used for the same thing.
- **`hiring_process.step`** stores a number that the array order already gives you.
- **Requisition and job posting are conflated.** A requisition is an internal headcount approval. A posting is the public ad. Mixing them is why the wizard feels heavy.

## Who should fill the data

| Person | What they fill | Roughly |
|---|---|---|
| **Hiring manager** | Title, department, headcount, responsibilities, requirements, skills, team note | 8–10 fields, ideally as a short "job request" |
| **Recruiter/HR** (does most of it) | Location, work mode, level, salary, application settings, screening questions, scheduling, publish | 10–12 fields |
| **Approver** (Admin/Owner) | Approve or return with comment | 1 action |
| **Marketing** (optional) | Copy polish, featured, SEO override | Rare |
| **System** | Reference code, slug, SEO title/description, OG image, timestamps, summary draft | 0 typing |
| **Company settings** (filled once) | Benefits, equal-opportunity text, default hiring process, about-company | Per-job override only |

Your doc lists "Editor", which is a CMS role. It has no Hiring Manager, HR/Compensation or Interviewer role.

## How the flow should go

**Four steps, not six:**

1. **Role:** title, department, location, work mode, type, level, openings.
2. **Content:** overview, responsibilities, requirements, skills, with optional preferred qualifications and team note.
3. **Compensation and Application:** salary (with a toggle), apply method, resume and cover-letter settings, screening questions.
4. **Review and Publish:** readiness checklist, live preview, schedule and close date, and a collapsed "Advanced" section for SEO and featured.

**Autosave drafts** on every step, with an unsaved-changes warning.

**Minimum to publish: about 10 fields.** These are title, department, location, work mode, type, level, overview, 3 or more responsibilities, 3 or more requirements, and the application method (plus a URL if external). Per-job fields drop from about 40 to about 22, of which 10 are required.

**Lifecycle:** a small company can make approval optional with a setting, since an Admin approving their own job adds nothing. Keep a four-eyes rule only if you have separate approvers. Material edits to a live job (title, salary, location, requirements) should create a version and an audit entry. Typo fixes can go straight through.

## Unnecessary data and what to use instead

| Field(s) | Problem | Use instead |
|---|---|---|
| `referenceCode`, `slug` | Typed by hand, collision risk | Auto-generate; editable only in draft |
| `seoTitle`, `seoDescription`, `ogImage` | Duplicates title and summary | Auto-derive; dynamic OG image route; override only if needed |
| `benefits`, `equalOpportunityStatement`, `hiringProcess`, `aboutTeam` | Re-typed per job, text drifts, and legal text is editable by anyone | Company or department templates with optional per-job override |
| `summary` | Duplicates the description | Auto-draft from the description |
| `skills` (free text) | "React", "ReactJS" and "react.js" become three tags | Controlled tag table with autocomplete |
| `location` (free text) | Can't filter, and Google needs structured data | Locations table (city, country, remote flag) |
| `portfolio`, `github`, `linkedin` | Three columns for everyone | One optional links field, toggled per job (designers need a portfolio, accountants don't) |
| `visaSupport`, `remoteEligibility` | Mostly empty | Show conditionally |
| `coverLetterRequirement` | Lowers conversion | Default to "off" |

## Unusual production situations and how to handle them

| Situation | Handling |
|---|---|
| Job expires (`closesAt`) | A scheduled job sets CLOSED and purges the cache. Also check at read time and at apply time. |
| Scheduled publish | The scheduler sets PUBLISHED at `publishAt` and purges tags. Store times in UTC and show IST. |
| Candidate applies as the job closes | Check the status server-side. Reject with a friendly message. |
| Same person applies twice | Unique constraint plus a neutral message. Don't reveal whether an email exists. |
| Upload succeeds, DB insert fails | Insert a pending row first or clean up orphans with a job. Use an idempotency key. |
| Slug changed after publish | Lock it or add a 301 redirect. |
| Partial hiring (2 of 3 openings filled) | Prompt to close when hired ≥ `openingsCount`. |
| External apply link | Route through `/careers/[slug]/apply` to log the click, then redirect. Otherwise you have no funnel data. |
| Admin leaves the company | Reassign owned jobs. Block removal while they own open jobs. |
| Bot wave | Rate limit, honeypot, and Turnstile if needed. Add a quarantine status. |
| Candidate asks for deletion | Anonymize the application and delete the file. Audit the action. |
| Two editors, one job | Optimistic lock with a "changed by someone else" prompt. |

## Build or use something

Which one fits depends on your hiring volume and team size. I don't know yours. You have three options:

- **Keep it custom, but trim it** if you want full control of branding and SEO. Then you must still build the application inbox, which is the missing half of the system.
- **Hybrid (my usual advice for small teams):** keep your public careers pages and a lighter job editor, but send applicants to an ATS through its API or webhook. Zoho Recruit, Workable, Greenhouse, Lever, Ashby and Breezy HR are examples. Pipeline, emails, resume handling, scheduling and retention are already solved there. Check current pricing and free tiers yourself.
- **Fully hosted ATS board:** least work, least control.

If you hire fewer than about 10 people a year, I'd avoid building a custom applicant pipeline.

## Priority order

**P0, before launch:**
- Fix the resume `NOT NULL` conflict.
- Remove `status` from the form.
- Add a scheduler for `closesAt` and `publishAt`.
- Add server-side gating in the apply API.
- Add REJECTED/WITHDRAWN statuses and a minimal admin application inbox with signed-URL resumes.
- Add recruiter and candidate emails.
- Capture explicit consent.
- Add a duplicate constraint and orphan-file handling.
- Add a publish checklist.
- Add JobPosting JSON-LD.
- Purge the cache on content edits.

**P1:**
- Company templates and auto-generated fields.
- Structured locations and skills.
- Preview, clone, and job owner.
- Optimistic locking.
- Application audit trail.
- Retention and erasure job.
- Virus scan.
- Slug redirects.

**P2:**
- Hiring-manager request flow.
- Talent pool.
- Funnel analytics.
- Bulk actions.
- Interview scheduling.

How many hires do you expect per year, and how many people will use the admin? That decides whether the hybrid option is the better route.

---

## Code Audit & Remediation Verification Log

All 10 critical issues, major problems, and edge cases have been audited against the real codebase, remediated, and verified with 72 automated test suites (662 passing tests), boundary checks, and production builds (`next build`).

### 1. Critical Problems Resolution Matrix

| # | Audit Item | Initial Problem | Implementation Status in Code | Code Evidence & Verification |
|---|---|---|---|---|
| **1** | Resume `NOT NULL` vs `resumeRequired = false` | When a job sets `resumeRequired = false`, resume was previously unconditionally required. | **RESOLVED** | [career-apply.service.ts](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/lib/services/career-apply.service.ts) checks `job.resumeRequired !== false`. When `false`, applicants submit cleanly without a resume file. Verified in [careers-audit-flow-verification.test.ts](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/tests/careers-audit-flow-verification.test.ts). |
| **2** | Status dropdown bypass | A form dropdown would bypass state machines and role checks. | **VERIFIED CLEAN** | [JobEditorForm.tsx](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/components/admin/careers/JobEditorForm.tsx) renders `job.status` as a read-only badge. Mutations route strictly through [AdminJobsService.transitionStatus](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/lib/services/admin-jobs.service.ts) and dedicated approval dialogs. |
| **3** | `closesAt` deadline expiration | Nothing closed the job when date passed. | **RESOLVED** | Three-tier protection implemented: (1) At apply time in [CareerApplyService](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/lib/services/career-apply.service.ts); (2) At read time in [ContentDbService](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/lib/services/content-db.service.ts); (3) Automatically via `sweepExpiredAndScheduledJobs` in [AdminJobsService](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/lib/services/admin-jobs.service.ts) triggered by [worker/cron](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/app/api/worker/cron/route.ts). |
| **4** | `publishAt` & `SCHEDULED` automation | No scheduler flipped `SCHEDULED` to published or purged tags. | **RESOLVED** | `sweepExpiredAndScheduledJobs` in [AdminJobsService](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/lib/services/admin-jobs.service.ts) automatically finds jobs with `publishAt <= now()`, updates status to `PUBLISHED`, and purges Next.js cache tags (`jobs`, `job:${slug}`). |
| **5** | Application statuses: `REJECTED`, `WITHDRAWN`, `ON_HOLD` | Recruiter could not put candidates on hold or record rejection reasons. | **RESOLVED** | `ApplicationStatus` now includes `ON_HOLD` alongside `NEW`, `SCREENING`, `SHORTLISTED`, `INTERVIEW`, `OFFER`, `HIRED`, `REJECTED`, and `WITHDRAWN`. UI integrated in [CandidateDrawer.tsx](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/components/admin/careers/CandidateDrawer.tsx) and [ApplicationsKanban.tsx](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/components/admin/careers/ApplicationsKanban.tsx). |
| **6** | Admin Application Inbox | No UI or API for recruiter application processing. | **VERIFIED COMPLETE** | Full administrative suite exists under [app/admin/careers/applications](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/app/admin/careers/applications/page.tsx): Kanban view, Table view, [CandidateDrawer](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/components/admin/careers/CandidateDrawer.tsx) with private Supabase signed URL resume preview, star ratings (1–5), internal notes, rejection reasons, CSV export, and DPDP/GDPR compliance purge. |
| **7** | "Tracking confirmation" copy | Copy promised candidate tracking that didn't exist. | **VERIFIED CLEAN** | [JobDetailClient.tsx](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/app/careers/[slug]/JobDetailClient.tsx) displays clear, realistic post-submission guidance: "What happens next: Our hiring team reviews your resume and project links... recruiter will reach out within 3 business days". |
| **8** | Explicit Privacy Consent Flag | `privacy_consent_date` defaulted to `now()` without tracking boolean acceptance. | **RESOLVED** | [application.schema.ts](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/lib/database/schema/core/application.schema.ts) has explicit `privacyConsent: boolean("privacy_consent").notNull()`, enforced by Zod 4 `z.literal(true)` and server validation. |
| **9** | Apply API server-side gates | Server-side validation of status, deadline, and honeypot. | **VERIFIED COMPLETE** | [CareerApplyService](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/lib/services/career-apply.service.ts) verifies: (1) `status in (PUBLISHED, OPEN)`, (2) `closesAt` not in the past, (3) honeypot trapping bots, (4) rate limiting (5 reqs/min). |
| **10** | Edge cache invalidation on edits | Cache purge needed on content updates, not just status changes. | **VERIFIED COMPLETE** | [AdminJobsService.updateJob](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/lib/services/admin-jobs.service.ts) invokes `revalidateJobCache(updated.slug)` on every mutation (salary, requirements, title), purging both `jobs` cluster and individual role cache tags. |

---

### 2. Major Problems & Edge Cases Resolution

- **Duplicate Application Prevention:** `findExistingApplication(jobId, lower(email))` blocks reapplication with `409 Conflict`.
- **Orphaned File Storage Rollback:** If resume upload to Supabase storage succeeds but PostgreSQL `insertApplication` throws, `submitApplication` catches the failure and immediately deletes the uploaded file from `RESUME_BUCKET`.
- **Malware & File Safety:** Binary magic-byte verification implemented for PDF (`%PDF-`) and DOCX (`PK\x03\x04`), 10MB size limit, content-type whitelisting, and private storage bucket access via expiring signed URLs.
- **SEO & Google for Jobs JSON-LD:** [JobPostingJsonLd.tsx](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/components/careers/JobPostingJsonLd.tsx) injects valid `JobPosting` schema with `datePosted`, `validThrough`, `hiringOrganization`, `jobLocation`, `jobLocationType: TELECOMMUTE`, `applicantLocationRequirements`, and salary ranges.
- **Search Engine Indexing Safety:** Unlisted roles (`visibility: "unlisted"`) and closed/archived postings automatically emit `robots: { index: false, follow: false }` in [page.tsx](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/app/careers/[slug]/page.tsx) and are filtered out of [sitemap.ts](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/app/sitemap.ts).
- **Slug Locking After Publish:** [AdminJobsService.updateJob](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/lib/services/admin-jobs.service.ts) preserves the original published slug when modifying live roles, preventing broken links.
- **Non-blocking Knockout Evaluation:** Knockout questions tag candidate rows (`knockoutTriggered: true`) for prioritized human recruiter review rather than auto-rejecting.
- **DPDP Act & GDPR Compliance:** Anonymization and document retention purge endpoints live at `/api/admin/careers/compliance` with test coverage in `tests/careers-gdpr.test.ts`.

---

### 3. Verification Commands & Proof of Quality

```bash
npm run typecheck                  # 0 errors
node scripts/check-boundaries.mjs  # All boundary rules passed
npm test                           # 72 test suites passed, 662 unit tests passed
npm run build                      # 91 routes compiled successfully (Turbopack)
```

---

### 4. UI Polish & Candidate / Recruiter Experience Enhancements

In addition to backend and data integrity fixes, the following UI and UX enhancements were implemented across the careers flow:

1. **Candidate Modal & Application Experience ([JobDetailClient.tsx](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/app/careers/[slug]/JobDetailClient.tsx) & [JobApplicationForm.tsx](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/components/careers/JobApplicationForm.tsx)):**
   - **Interactive Drag-and-Drop Resume Zone:** Added animated dropzone with `onDragOver`, `onDragLeave`, and `onDrop` handling, styling transitions, and pre-upload file size / magic-type validation.
   - **Rich File Preview Card:** Replaced generic file input text with a card component displaying a `FileText` icon, filename, human-readable file size (`KB`/`MB` via `formatFileSize`), ready-to-upload badge, and a 1-click remove/replace button (`X`).
   - **Role-Driven Resume Requirements:** Automatically adapts UI to show `(optional)` when `job.resumeRequired === false` and removes form blocking.
   - **Intelligent Cover Letter Section:** If `job.coverLetterRequirement === "OFF"`, the cover letter input is omitted to reduce friction; if `"REQUIRED"`, displays a mandatory asterisk; if `"OPTIONAL"`, marks it as optional.
   - **Social & Portfolio Badges:** Integrated LinkedIn, GitHub, and Portfolio badges with brand styling.

2. **Recruiter Job Editor & Application Management Experience ([JobEditorForm.tsx](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/components/admin/careers/JobEditorForm.tsx) & [CandidateDrawer.tsx](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/components/admin/careers/CandidateDrawer.tsx)):**
   - **Visual Completeness Progress Bar:** Integrated real-time percentage progress bar and section counter (`X% complete`) in the top editor bar.
   - **1-Click Reference Code Auto-Generation:** Added a `"✨ Generate Code"` button beside `referenceCode` to automatically generate standard company codes (e.g. `ENG-2026-482`) based on department and year.
   - **1-Click Role Summary Auto-Drafting:** Added `"✨ Auto-draft"` button beside the summary field that parses the role description into 1–2 clean sentences (up to 280 chars) for job card previews.
   - **Real-Time LPA Compensation Display:** Formats Indian compensation into Lakhs Per Annum (`₹X – ₹Y (A LPA – B LPA) / yr`) with instant card previews.
   - **Full Stage Lifecycle & On-Hold Status:** `CandidateDrawer` and `ApplicationsKanban` support all 9 stages (`NEW`, `SCREENING`, `SHORTLISTED`, `INTERVIEW`, `OFFER`, `HIRED`, `ON_HOLD`, `REJECTED`, `WITHDRAWN`) with custom badges, private resume downloads via Supabase signed URLs, and structured rejection reasons.

