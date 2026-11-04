# Agency Admin & Content Control Platform – Phase 1 Design Spec

**Date:** 2026-11-04  
**Author:** Manish / Antigravity AI  
**Scope:** Phase 1 – Careers & Blog Control, Supabase Schema, Content Abstraction Layer, Next.js 16 App Router Admin UI (`app/(admin)`), GodUI Animated Component System.

---

## 1. Executive Summary & Goals

The TechSonance Agency Admin & Content Control Platform transitions the current static, in-code content management (careers and blog articles) into a secure, database-backed admin platform with zero visitor-facing performance degradation.

### Key Objectives
1. **Performance as a Release Gate**: Visitors continue to receive statically pre-rendered pages served directly from the CDN with on-demand cache revalidation (`revalidateTag`). The admin is never queried at public request time.
2. **Zero-Downtime Safe Migration**: A dual-source Content Abstraction Layer switched via environment feature flags (`CONTENT_SOURCE_BLOG` and `CONTENT_SOURCE_CAREERS`) enables instantaneous fallback to existing code-based data (`data/blog.ts` and legacy career configs).
3. **Phase 1 Focus**: Full end-to-end management of **Blog** (posts, categories, tags, authors, SEO fields, draft/review/publish workflow, draft preview) and **Careers** (job positions, open/closed toggle, application form submission, application inbox with status & review notes).
4. **Modern Animated UI (GodUI + Motion + Tailwind v4)**: The admin interface and interactive forms utilize GodUI and Radix/Motion animated primitives rather than custom bare-bones components from scratch.
5. **Future-Proof Multi-Site Foundation**: Every database table incorporates `site_id` from day one, allowing subsequent agency sites to be added without schema migrations.

---

## 2. System Architecture

```
                                  +------------------------------------+
                                  |         Supabase Database          |
                                  |  - ts_admin_memberships / roles    |
                                  |  - ts_content_posts / authors      |
                                  |  - ts_content_jobs / applications  |
                                  |  - ts_content_versions / audit_log |
                                  +-----------------+------------------+
                                                    |
                         Direct Service Role / RLS  |  Server Action Writes &
                                (Admin queries)     |  On-demand revalidation
                                                    |
                       +----------------------------v-----------------------------+
                       |                 Next.js 16 App Router                    |
                       |                                                          |
  [Admins & Editors] --+--> app/(admin)                                           |
                       |    - /admin/login (Supabase Auth)                        |
                       |    - /admin (Dashboard)                                  |
                       |    - /admin/blog (GodUI Editor, Draft/Publish, SEO)      |
                       |    - /admin/careers (Job Editor, Applications Inbox)     |
                       |    - /admin/media (Supabase Storage + WebP conversion)   |
                       |                                                          |
                       |    Content Abstraction Layer (lib/content/)              |
                       |    - postSource.get(slug) / list()                       |
                       |    - jobSource.get(slug) / list()                        |
                       |    - Dynamic switch: "cms" (Supabase) vs "legacy" (file) |
                       |                                                          |
  [Public Visitors] ---+--> app/(marketing) or public routes                      |
                       |    - /blog, /blog/[slug] (Statically pre-rendered)       |
                       |    - /careers (Static jobs + interactive apply modal)    |
                       +----------------------------------------------------------+
```

---

## 3. Database Schema (Supabase Migration with RLS)

### 3.1 Tenancy & RBAC
- **`ts_admin_sites`**:
  - `id` (uuid, PK)
  - `name` (text, default 'TechSonance Infotech')
  - `slug` (text, unique)
  - `domain` (text)
  - `created_at`, `updated_at` (timestamptz)
- **`ts_admin_memberships`**:
  - `id` (uuid, PK)
  - `user_id` (uuid, references `auth.users`)
  - `site_id` (uuid, references `ts_admin_sites`)
  - `role` (enum: `owner`, `admin`, `editor`, `author`, `viewer`)
  - Capabilities array / lookup for granular permissions (`post.publish`, `job.edit`, `application.view`).

### 3.2 Content Tables
- **`ts_content_authors`**:
  - `id` (uuid, PK), `site_id` (uuid), `name` (text), `role` (text), `avatar` (text), `bio` (text)
- **`ts_content_categories`**:
  - `id` (uuid, PK), `site_id` (uuid), `name` (text), `slug` (text), `description` (text)
- **`ts_content_posts`**:
  - `id` (uuid, PK)
  - `site_id` (uuid)
  - `slug` (text, unique per site)
  - `title` (text)
  - `excerpt` (text)
  - `content` (text)
  - `category_id` (uuid, references `ts_content_categories`)
  - `hero_image` (text)
  - `tags` (text[])
  - `author_ids` (uuid[])
  - `read_time` (text)
  - `faqs` (jsonb)
  - `seo` (jsonb: `{ metaTitle, metaDescription, canonical, ogImage, noindex }`)
  - `status` (enum: `DRAFT`, `IN_REVIEW`, `PUBLISHED`, `ARCHIVED`)
  - `version_id` (int, for optimistic locking)
  - `published_at` (timestamptz)
  - `created_by`, `updated_by` (uuid)
  - `created_at`, `updated_at` (timestamptz)
- **`ts_content_jobs`**:
  - `id` (uuid, PK)
  - `site_id` (uuid)
  - `slug` (text, unique per site)
  - `title` (text)
  - `department` (text)
  - `location` (text)
  - `type` (text: 'Full Time', 'Internship', 'Contract', 'Partner')
  - `experience_level` (text)
  - `description` (text)
  - `responsibilities` (text[])
  - `requirements` (text[])
  - `benefits` (text[])
  - `closes_at` (timestamptz)
  - `status` (enum: `DRAFT`, `OPEN`, `CLOSED`, `ARCHIVED`)
  - `version_id` (int)
  - `created_at`, `updated_at` (timestamptz)
- **`ts_content_applications`**:
  - `id` (uuid, PK)
  - `site_id` (uuid)
  - `job_id` (uuid, references `ts_content_jobs`)
  - `candidate_name` (text)
  - `email` (text)
  - `phone` (text)
  - `portfolio_url` (text)
  - `github_url` (text)
  - `resume_url` (text)
  - `cover_letter` (text)
  - `status` (enum: `NEW`, `REVIEWING`, `SHORTLISTED`, `INTERVIEW`, `OFFERED`, `REJECTED`)
  - `internal_notes` (text)
  - `created_at`, `updated_at` (timestamptz)
- **`ts_content_versions`**:
  - `id` (uuid, PK)
  - `entity_type` (text: 'post', 'job')
  - `entity_id` (uuid)
  - `snapshot` (jsonb)
  - `changed_by` (uuid)
  - `created_at` (timestamptz)
- **`ts_content_audit_log`**:
  - `id` (uuid, PK)
  - `actor_id` (uuid)
  - `action` (text)
  - `entity_type` (text)
  - `entity_id` (uuid)
  - `before_state` (jsonb)
  - `after_state` (jsonb)
  - `ip_address` (text)
  - `created_at` (timestamptz)

---

## 4. Content Abstraction Layer & Hybrid Cut-Over

Public pages interact solely via domain contracts in `lib/content/`:
- `lib/content/posts.ts`: defines `PostSource` with `cmsPostSource` (Supabase queries cached via `unstable_cache` / tagged fetch) and `legacyPostSource` (`data/blog.ts`).
- `lib/content/jobs.ts`: defines `JobSource` with `cmsJobSource` (Supabase queries for `status = 'OPEN'`) and `legacyJobSource` (in-memory job definitions extracted from `CareersClient.tsx`).
- Controlled via runtime env vars:
  - `CONTENT_SOURCE_BLOG`: `legacy` | `cms`
  - `CONTENT_SOURCE_CAREERS`: `legacy` | `cms`

### On-Demand Invalidation & Draft Preview
- **Tag Invalidation**:
  - `revalidateTag('posts')`
  - `revalidateTag('post:${slug}')`
  - `revalidateTag('jobs')`
  - `revalidateTag('job:${slug}')`
- **Draft Mode**:
  - Route `/api/draft/enable?secret=...&slug=...&type=post` sets cookie `draftMode().enable()`.
  - Preview page shows real production page styling with an interactive floating banner: *"Viewing Unpublished Draft – [Exit Preview]"*.

---

## 5. UI System: GodUI & Opensource UI Integration

The user interface leverages **GodUI** and **Opensource UI** (MIT licensed, React/Next.js/Tailwind CSS v4 & Motion components) to provide production-ready animated components and rich widgets without building from scratch:

1. **GodUI Animated Motion Primitives**:
   - **GodUI Animated Dialog / Modal**: For candidate application review, delete confirmations, and version history diff comparisons.
   - **GodUI Animated Sheet / Drawer**: Slide-over panel for quick editing, SEO settings inspector, and filter drawers.
   - **GodUI Tooltip & Popovers**: Contextual help for SEO limits, author badges, and status pills.
   - **GodUI Animated Button & Micro-Interactions**: Smooth state transitions on "Save Draft", "Publishing...", and copy-link triggers.
   - **GodUI Tabs & Segmented Controls**: Smooth sliding layoutId spring tab indicator for filtering by status (`All`, `Drafts`, `In Review`, `Published`).

2. **Opensource UI Widgets & Mockups (`opensourceui`)**:
   - **Phone & Device Mockup Frames**: Interactive responsive device simulator in the admin preview mode (desktop, tablet, and mobile frame toggles) showing the real Next.js draft page inside realistic hardware frames.
   - **Form Fields & Specialized Input Controls**: Polished tag inputs, character-limit counter inputs, clean file dropzone widgets with progress animations.
   - **Dashboard Stat Cards & Metrics**: Clean KPI cards with trends, applicant pipeline counters, and activity feed widgets.

3. **Careers Public Application Flow**:
   - Enhanced modal application form built with GodUI Dialog and spring animations for file upload feedback, validation error shaking, and confirmation celebratory feedback.

---

## 6. Admin Portal Layout & Navigation (`app/(admin)`)

- `/admin/login`: Branded login with session validation and rate-limiting.
- `/admin`: Dashboard metrics (Pending reviews, Active jobs, Recent applicants).
- `/admin/blog`:
  - Search, category filter, status tabs, post listing table.
  - Floating action bar for batch operations.
- `/admin/blog/new` & `/admin/blog/[id]`:
  - Split view / focus mode Markdown & Rich editor with autosave (30s interval).
  - Sidebar for categories, tags, authors, publishing status, and SEO preview (Google SERP simulator).
- `/admin/careers`:
  - Job management grid with instant open/close toggle switches.
  - Job editor (department, location, compensation/stipend, markdown requirements).
- `/admin/careers/applications`:
  - Candidate table with status tags, resume viewer, rating/status select, and notes drawer.
- `/admin/media`:
  - Drag-and-drop file uploader to Supabase storage with thumbnail grid, aspect ratio badges, and copy-CDN-URL.

---

## 7. Verification & Release Gates (P2 Compliance)

1. **Type & Lint Check**: `npm run typecheck` and `oxlint` must pass without warnings.
2. **Core Web Vitals Integrity**:
   - Lighthouse score on `/blog` and `/careers` must match or exceed the baseline static score.
   - Zero admin bundles shipped to public routes.
3. **Database Integrity**:
   - Migrations apply cleanly via Supabase CLI.
   - RLS strictly disallows unauthenticated reads of drafts, internal notes, or candidate applications.
4. **Shadow Run & Replay**:
   - Seed script imports all 8 existing blog articles from `data/blog.ts` into Supabase.
   - Output comparison ensures slugs, titles, meta tags, and rendered text are identical.

---

## 8. Rollout Plan

- **Step 1**: Baseline measurement & DB migration (tables, indexes, RLS, storage buckets).
- **Step 2**: Content layer interface & seeding script (`data/blog.ts` -> Supabase).
- **Step 3**: GodUI components configuration & Admin Layout (`app/(admin)`).
- **Step 4**: Blog admin module (list, editor, review, publish, revalidate).
- **Step 5**: Careers admin module (jobs, application form API, applications inbox).
- **Step 6**: Public wiring & shadow testing with `CONTENT_SOURCE_*` flags.
- **Step 7**: Cut-over: Blog first (`CONTENT_SOURCE_BLOG=cms`), then Careers.
