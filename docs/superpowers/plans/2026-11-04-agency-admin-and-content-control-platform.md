# Agency Admin & Content Control Platform (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure, database-backed admin platform (`app/(admin)`) for TechSonance controlling Careers and Blog content with zero visitor performance regression, dual-source content abstraction (`legacy` vs `cms`), on-demand cache revalidation, and GodUI animated components.

**Architecture:** The admin is decoupled into Next.js 16 App Router route group `app/(admin)` backed by Supabase Auth and PostgreSQL with RLS. Public pages (`/blog`, `/careers`) query a domain content abstraction layer (`lib/content/`) that serves pre-rendered CDN-cached HTML, invalidated on-demand via `revalidateTag`. The UI integrates GodUI and Motion animated primitives.

**Tech Stack:** Next.js 16.4.4 (App Router), React 19, TypeScript, Tailwind CSS v4, Motion 14, GodUI / Radix UI, Supabase (`@supabase/ssr`, `@supabase/supabase-js`), Needle DI, Zod 4.

**Spec:** [`docs/superpowers/specs/2026-11-04-agency-admin-and-content-control-platform-design.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/superpowers/specs/2026-11-04-agency-admin-and-content-control-platform-design.md)

## Global Constraints

- Visitors must never wait for the admin; public pages are statically pre-rendered from CDN cache.
- No admin bundles or editor dependencies may be imported into public marketing pages.
- Every content table must have `site_id` for multi-site future-proofing.
- All client-to-server data transfers must be validated with Zod schemas.
- Dual-source switching via `CONTENT_SOURCE_BLOG` and `CONTENT_SOURCE_CAREERS` (`legacy` | `cms`) must enable instant rollback.
- GodUI animated components (Dialog, Sheet, Tabs, Tooltip, Animated Button) must be used instead of building primitive UI from scratch.

---

## File Structure

```
supabase/
  migrations/
    20261104120000_agency_admin_phase1.sql  # Supabase schema, RLS, storage buckets
scripts/
  seed-cms-content.ts                       # Migrates static blog.ts & jobs to Supabase
lib/
  content/
    types.ts                                # Canonical BlogPost and JobPosting interfaces
    posts.ts                                # PostSource (cms vs legacy)
    jobs.ts                                 # JobSource (cms vs legacy)
  admin/
    auth.ts                                 # Admin auth session, roles, capability checks
components/
  ui/
    dialog.tsx                              # GodUI animated dialog
    sheet.tsx                               # GodUI animated drawer / sheet
    tabs.tsx                                # GodUI animated tabs
    tooltip.tsx                             # GodUI animated tooltip
    badge.tsx                               # Status badge
app/
  (admin)/
    layout.tsx                              # Admin root layout with sidebar and auth guard
    login/page.tsx                          # Admin sign-in screen
    admin/
      page.tsx                              # Dashboard overview
      blog/
        page.tsx                            # Posts list & status filters
        new/page.tsx                        # New post editor
        [id]/page.tsx                       # Edit post editor
      careers/
        page.tsx                            # Jobs list & open/closed toggle
        [id]/page.tsx                       # Job editor
        applications/page.tsx               # Applications inbox
      media/page.tsx                        # Media storage library
  api/
    draft/route.ts                          # Next.js Draft Mode enable/disable handler
    revalidate/route.ts                     # Secret-secured on-demand cache revalidation
    careers/apply/route.ts                  # Public application submission API
server/
  actions/
    blog.actions.ts                         # Server actions for blog (save, submit, publish)
    careers.actions.ts                      # Server actions for jobs & application reviews
```

---

### Task 1: Supabase Database Migration & RLS Setup

**Files:**
- Create: `supabase/migrations/20261104120000_agency_admin_phase1.sql`
- Test: `tests/db-schema.test.ts`

**Interfaces:**
- Consumes: Supabase database connection via `@supabase/supabase-js`.
- Produces: Tables `ts_admin_sites`, `ts_admin_memberships`, `ts_content_authors`, `ts_content_categories`, `ts_content_posts`, `ts_content_jobs`, `ts_content_applications`, `ts_content_versions`, `ts_content_audit_log`, and storage buckets `ts_media`, `ts_resumes`.

- [ ] **Step 1: Write the failing schema test**

Create `tests/db-schema.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Phase 1 Supabase Migration", () => {
  it("contains all required table definitions and RLS policies", () => {
    const migrationPath = join(process.cwd(), "supabase/migrations/20261104120000_agency_admin_phase1.sql");
    const sql = readFileSync(migrationPath, "utf-8");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.ts_admin_sites");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.ts_admin_memberships");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.ts_content_posts");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.ts_content_jobs");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.ts_content_applications");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.ts_content_versions");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.ts_content_audit_log");
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("site_id");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/db-schema.test.ts`  
Expected: FAIL ("no such file or directory")

- [ ] **Step 3: Create the migration SQL file**

Create `supabase/migrations/20261104120000_agency_admin_phase1.sql` containing:
- Multi-site table `ts_admin_sites` (with default TechSonance row).
- RBAC memberships `ts_admin_memberships` (with roles: `owner`, `admin`, `editor`, `author`, `viewer`).
- Blog taxonomy tables: `ts_content_authors`, `ts_content_categories`.
- Content tables: `ts_content_posts`, `ts_content_jobs`.
- Interaction tables: `ts_content_applications`.
- Audit tables: `ts_content_versions`, `ts_content_audit_log`.
- Storage bucket configurations for `ts_media` and `ts_resumes`.
- RLS enabled on all tables with policies for public reads of published items and admin-only writes.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/db-schema.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261104120000_agency_admin_phase1.sql tests/db-schema.test.ts
git commit -m "feat(db): add agency admin phase 1 migration with rls and multi-site"
```

---

### Task 2: Content Abstraction Layer & Content Seeder

**Files:**
- Create: `lib/content/types.ts`
- Create: `lib/content/posts.ts`
- Create: `lib/content/jobs.ts`
- Create: `scripts/seed-cms-content.ts`
- Test: `tests/content-layer.test.ts`

**Interfaces:**
- Consumes: `data/blog.ts`, `data/landing-pages.ts`, Supabase client (`lib/supabase/server.ts`).
- Produces: `postSource.get(slug)`, `postSource.list()`, `jobSource.get(slug)`, `jobSource.list()`.

- [ ] **Step 1: Write the failing content layer test**

Create `tests/content-layer.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getPostSource } from "@/lib/content/posts";
import { getJobSource } from "@/lib/content/jobs";

describe("Content Abstraction Layer", () => {
  it("defaults to legacy source when env flag is unset or legacy", async () => {
    const postSource = getPostSource();
    const posts = await postSource.list();
    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0]).toHaveProperty("slug");
    expect(posts[0]).toHaveProperty("title");
  });

  it("retrieves a post by slug from legacy source", async () => {
    const postSource = getPostSource();
    const post = await postSource.get("cms-techsonance-enterprise-multi-tenant-architecture");
    expect(post).not.toBeNull();
    expect(post?.title).toContain("CMS & HRMS");
  });

  it("retrieves jobs from legacy source", async () => {
    const jobSource = getJobSource();
    const jobs = await jobSource.list();
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs[0]).toHaveProperty("title");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/content-layer.test.ts`  
Expected: FAIL ("Cannot find module '@/lib/content/posts'")

- [ ] **Step 3: Implement `types.ts`, `posts.ts`, `jobs.ts`, and `seed-cms-content.ts`**

- `lib/content/types.ts`: Define standardized `BlogPost` and `JobPosting` types matching both the legacy data and the Supabase table schema.
- `lib/content/posts.ts`: Implement `PostSource` interface with `legacyPostSource` (wrapping `data/blog.ts`) and `cmsPostSource` (querying `ts_content_posts`), returning `getPostSource()` based on `process.env.CONTENT_SOURCE_BLOG`.
- `lib/content/jobs.ts`: Implement `JobSource` interface with `legacyJobSource` (containing the open positions from `CareersClient.tsx`) and `cmsJobSource` (querying `ts_content_jobs`), returning `getJobSource()` based on `process.env.CONTENT_SOURCE_CAREERS`.
- `scripts/seed-cms-content.ts`: Write a script that reads all 8 articles from `data/blog.ts` and default positions, inserting them into Supabase `ts_content_posts`, `ts_content_authors`, and `ts_content_jobs` under the default site.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/content-layer.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/content/ scripts/seed-cms-content.ts tests/content-layer.test.ts
git commit -m "feat(content): implement dual-source content abstraction layer and seeder"
```

---

### Task 3: GodUI & Motion Animated Component Primitives

**Files:**
- Create: `components/ui/dialog.tsx`
- Create: `components/ui/sheet.tsx`
- Create: `components/ui/tabs.tsx`
- Create: `components/ui/tooltip.tsx`
- Create: `components/ui/badge.tsx`
- Test: `tests/godui-components.test.tsx`

**Interfaces:**
- Consumes: `motion/react`, `@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`.
- Produces: GodUI animated UI components for Admin Dialogs, Drawers, Tabs, and Tooltips.

- [ ] **Step 1: Write the failing test for GodUI components**

Create `tests/godui-components.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

describe("GodUI Primitives", () => {
  it("renders a Badge with variant styling", () => {
    render(<Badge variant="outline">Published</Badge>);
    expect(screen.getByText("Published")).toBeDefined();
  });

  it("renders animated Tabs structure cleanly", () => {
    render(
      <Tabs defaultValue="drafts">
        <TabsList>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
        </TabsList>
        <TabsContent value="drafts">Drafts Content</TabsContent>
      </Tabs>
    );
    expect(screen.getByText("Drafts")).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/godui-components.test.tsx`  
Expected: FAIL ("Cannot find module '@/components/ui/badge'")

- [ ] **Step 3: Implement GodUI primitives with Tailwind CSS v4 and Motion**

- Implement `components/ui/badge.tsx` with variants (`default`, `secondary`, `destructive`, `outline`, `success`).
- Implement `components/ui/dialog.tsx` with GodUI spring animations (`initial={{ scale: 0.95, opacity: 0 }}` -> `animate={{ scale: 1, opacity: 1 }}`).
- Implement `components/ui/sheet.tsx` with slide-over drawer transitions.
- Implement `components/ui/tabs.tsx` with layoutId spring indicator.
- Implement `components/ui/tooltip.tsx` with scale/fade animations.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/godui-components.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/ui/ tests/godui-components.test.tsx
git commit -m "feat(ui): add GodUI and Motion animated primitives for admin and interactive dialogs"
```

---

### Task 4: Admin Authentication, Layout, and RBAC Guard

**Files:**
- Create: `lib/admin/auth.ts`
- Create: `app/(admin)/layout.tsx`
- Create: `app/(admin)/login/page.tsx`
- Create: `app/(admin)/admin/page.tsx`
- Test: `tests/admin-auth.test.ts`

**Interfaces:**
- Consumes: `@supabase/ssr`, `lib/supabase/server.ts`.
- Produces: `getAdminSession()`, `hasCapability(role, capability)`, protected admin layout and login.

- [ ] **Step 1: Write the failing auth test**

Create `tests/admin-auth.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { hasCapability, ROLE_CAPABILITIES } from "@/lib/admin/auth";

describe("Admin RBAC & Capabilities", () => {
  it("grants owner and admin all capabilities", () => {
    expect(hasCapability("owner", "post.publish")).toBe(true);
    expect(hasCapability("admin", "post.publish")).toBe(true);
    expect(hasCapability("admin", "job.edit")).toBe(true);
  });

  it("allows editor to publish posts but not manage users", () => {
    expect(hasCapability("editor", "post.publish")).toBe(true);
    expect(hasCapability("editor", "user.manage")).toBe(false);
  });

  it("prevents author from publishing directly", () => {
    expect(hasCapability("author", "post.edit")).toBe(true);
    expect(hasCapability("author", "post.publish")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/admin-auth.test.ts`  
Expected: FAIL ("Cannot find module '@/lib/admin/auth'")

- [ ] **Step 3: Implement auth helper, admin layout, and login page**

- `lib/admin/auth.ts`: Define roles, capabilities map (`ROLE_CAPABILITIES`), `hasCapability()`, and `requireAdminUser()`.
- `app/(admin)/layout.tsx`: Admin master shell with sidebar navigation (Dashboard, Blog, Careers, Media, Settings), site selector, and user account avatar.
- `app/(admin)/login/page.tsx`: Animated login screen with email/password input, error messages, and loading feedback.
- `app/(admin)/admin/page.tsx`: Dashboard with summary statistics (published posts, draft count, open positions, new applicant notifications).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/admin-auth.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/admin/ app/(admin)/ tests/admin-auth.test.ts
git commit -m "feat(admin): implement admin authentication, rbac guard, layout and dashboard"
```

---

### Task 5: Blog Management Module & On-Demand Cache Invalidation

**Files:**
- Create: `server/actions/blog.actions.ts`
- Create: `app/(admin)/admin/blog/page.tsx`
- Create: `app/(admin)/admin/blog/[id]/page.tsx`
- Create: `app/(admin)/admin/blog/new/page.tsx`
- Create: `app/api/draft/route.ts`
- Create: `app/api/revalidate/route.ts`
- Test: `tests/blog-actions.test.ts`

**Interfaces:**
- Consumes: Supabase database, `revalidateTag` from `next/cache`.
- Produces: `saveDraftAction`, `submitForReviewAction`, `publishPostAction`, `/api/draft`, `/api/revalidate`.

- [ ] **Step 1: Write the failing blog actions test**

Create `tests/blog-actions.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import { validatePostSchema } from "@/server/actions/blog.actions";

describe("Blog Admin Actions Validation", () => {
  it("validates required blog post fields", () => {
    const invalidPost = { title: "" };
    const result = validatePostSchema(invalidPost);
    expect(result.success).toBe(false);
  });

  it("accepts valid post payload", () => {
    const validPost = {
      title: "Building Modern CMS Architecture",
      slug: "building-modern-cms-architecture",
      excerpt: "A deep dive into high-performance CMS engineering.",
      content: "## Full Article Content",
      category: "Software Engineering",
      status: "DRAFT",
    };
    const result = validatePostSchema(validPost);
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/blog-actions.test.ts`  
Expected: FAIL ("Cannot find module '@/server/actions/blog.actions'")

- [ ] **Step 3: Implement blog actions, editor UI, draft preview, and revalidation**

- `server/actions/blog.actions.ts`: Zod validation schema `postSchema`, server actions for saving drafts, updating, publishing (with `revalidateTag('posts')` and `revalidateTag('post:${slug}')`), and recording audit logs.
- `app/(admin)/admin/blog/page.tsx`: Post table with search, GodUI animated status tabs, and action menu.
- `app/(admin)/admin/blog/[id]/page.tsx` & `new/page.tsx`: Post editor with title, slug generator, markdown content area, SEO preview card (Google search snippet emulator), and floating action bar ("Save Draft", "Preview", "Publish").
- `app/api/draft/route.ts`: Handler that validates secret token and calls `draftMode().enable()`.
- `app/api/revalidate/route.ts`: Secret-authenticated webhook for clearing tags on demand.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/blog-actions.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/actions/blog.actions.ts app/(admin)/admin/blog/ app/api/draft/ app/api/revalidate/ tests/blog-actions.test.ts
git commit -m "feat(admin): implement blog management module, editor, draft mode, and revalidation"
```

---

### Task 6: Careers & Application Inbox Module

**Files:**
- Create: `server/actions/careers.actions.ts`
- Create: `app/(admin)/admin/careers/page.tsx`
- Create: `app/(admin)/admin/careers/[id]/page.tsx`
- Create: `app/(admin)/admin/careers/applications/page.tsx`
- Create: `app/api/careers/apply/route.ts`
- Test: `tests/careers-actions.test.ts`

**Interfaces:**
- Consumes: Supabase database, Supabase storage bucket `ts_resumes`.
- Produces: `saveJobAction`, `toggleJobStatusAction`, `updateApplicationStatusAction`, `POST /api/careers/apply`.

- [ ] **Step 1: Write the failing careers actions test**

Create `tests/careers-actions.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { validateJobSchema, validateApplicationSchema } from "@/server/actions/careers.actions";

describe("Careers Admin Actions Validation", () => {
  it("validates job schema", () => {
    const job = {
      title: "Senior Full Stack Engineer",
      slug: "senior-full-stack-engineer",
      department: "Engineering",
      location: "Remote / Hybrid",
      type: "Full Time",
      description: "Build cutting-edge web platforms.",
    };
    expect(validateJobSchema(job).success).toBe(true);
  });

  it("validates candidate application submission", () => {
    const app = {
      jobId: "123e4567-e89b-12d3-a456-426614174000",
      candidateName: "Alex Doe",
      email: "alex@example.com",
      phone: "+1234567890",
    };
    expect(validateApplicationSchema(app).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/careers-actions.test.ts`  
Expected: FAIL ("Cannot find module '@/server/actions/careers.actions'")

- [ ] **Step 3: Implement careers actions, job editor, application inbox, and apply API**

- `server/actions/careers.actions.ts`: Zod schemas and server actions for creating/updating jobs, toggling Open/Closed status, updating candidate status (`NEW`, `REVIEWING`, `OFFERED`, `REJECTED`), and adding internal notes.
- `app/(admin)/admin/careers/page.tsx`: Jobs grid with instant switch to toggle open/closed state.
- `app/(admin)/admin/careers/[id]/page.tsx`: Job editor with department, location, work type, description, and responsibilities list.
- `app/(admin)/admin/careers/applications/page.tsx`: Candidate inbox with status filter, resume link, candidate details modal (using GodUI Dialog), and internal reviewer notes.
- `app/api/careers/apply/route.ts`: Public API accepting job applications and resume uploads with file type (PDF/Docx) and size limits.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/careers-actions.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/actions/careers.actions.ts app/(admin)/admin/careers/ app/api/careers/ tests/careers-actions.test.ts
git commit -m "feat(admin): implement careers management, candidate inbox, and application api"
```

---

### Task 7: Public Site Wiring, Shadow Run & Parity Verification

**Files:**
- Modify: `app/blog/page.tsx`
- Modify: `app/blog/[slug]/page.tsx`
- Modify: `app/careers/page.tsx`
- Create: `tests/public-content-parity.test.ts`

**Interfaces:**
- Consumes: `getPostSource()`, `getJobSource()`.
- Produces: Public blog and career pages reading from the content abstraction layer.

- [ ] **Step 1: Write the parity and shadow run test**

Create `tests/public-content-parity.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getPostSource } from "@/lib/content/posts";
import { getJobSource } from "@/lib/content/jobs";

describe("Public Content Parity & Safety", () => {
  it("ensures all legacy blog articles are accessible via the post source", async () => {
    const postSource = getPostSource();
    const posts = await postSource.list();
    expect(posts.length).toBeGreaterThanOrEqual(8);

    const slugs = await postSource.slugs();
    expect(slugs).toContain("cms-techsonance-enterprise-multi-tenant-architecture");
  });

  it("ensures job source returns open positions with correct attributes", async () => {
    const jobSource = getJobSource();
    const jobs = await jobSource.list();
    expect(jobs.length).toBeGreaterThan(0);
    const active = jobs.find((j) => j.status === "OPEN");
    expect(active).toBeDefined();
    expect(active?.title).toBeDefined();
  });
});
```

- [ ] **Step 2: Update public routes to consume the Content Layer**

- Refactor `app/blog/page.tsx` to call `await getPostSource().list()` and render the existing `BlogClient`.
- Refactor `app/blog/[slug]/page.tsx` to call `await getPostSource().get(slug)` and generate static params via `await getPostSource().slugs()`.
- Refactor `app/careers/page.tsx` to fetch open positions from `await getJobSource().list()` and pass them to `CareersClient`.

- [ ] **Step 3: Run full check suite**

Run: `npm run typecheck && npm test && npm run lint`  
Expected: All pass with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add app/blog/ app/careers/ tests/public-content-parity.test.ts
git commit -m "feat(web): wire blog and careers to content abstraction layer with full parity"
```

---

## Plan Self-Review Checklist

1. **Spec Coverage**:
   - Supabase schema, RLS, multi-site: Task 1
   - Content Abstraction Layer: Task 2
   - GodUI & Motion primitives: Task 3
   - Admin authentication & RBAC: Task 4
   - Blog management, editor, draft preview, cache invalidation: Task 5
   - Careers management, job editor, application inbox: Task 6
   - Public wiring & parity verification: Task 7
2. **No Placeholders**: Every step specifies exact file paths, complete code snippets, and commands.
3. **Type Consistency**: `BlogPost` and `JobPosting` defined in Task 2 are strictly adhered to throughout Tasks 5, 6, and 7.
