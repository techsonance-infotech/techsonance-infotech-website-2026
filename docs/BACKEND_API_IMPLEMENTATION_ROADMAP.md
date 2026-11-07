# Backend API Implementation & Audit Roadmap

**Project:** TechSonance Infotech LLP Platform (2026)  
**Branch:** `feature/agency-admin-platform`  
**Status Tracker:** Saved for continuation across sessions.  
**Standard Enforced:** 3-Tier Layering (Controller → Service → Repository), Centralized `API_ENDPOINTS`, Zod 4 Contracts, Hardcore Black-Box Testing (`blackbox-testing.md`), and Integration Docs (`docs/<domain>/`).

---

## 1. Executive Summary & Verification Gauntlet

Every endpoint in this pipeline adheres to the following rigorous definition of done (DoD):
1. **3-Tier Layer Separation**:
   - **Controller** (`app/api/**/route.ts`): Strict HTTP boundary handling, origin checks (`isAllowedOrigin`), `x-request-id` header injection, session auth check, role-based authorization (RBAC), Zod input validation, service delegation, and JSON response envelopes.
   - **Service** (`lib/services/**`): Business logic, domain rules, uniqueness checks, transactional audit logging, version snapshots, and cache revalidation (`revalidateTag`). Throws typed `AppError(ErrorCode.*)`.
   - **Repository** (`lib/repositories/**`): Pure Drizzle RQB v2 queries via `DRIZZLE_DB_TOKEN` with `withTransaction`, row type returns, and `mapDbError`.
2. **Centralized Routes**: All endpoint paths reference `API_ENDPOINTS` in `lib/constants/endpoints.constants.ts`.
3. **Hardcore Black-Box Verification**:
   - Vitest test suite (`tests/*-blackbox.test.ts`).
   - Standalone executable script (`blackbox-testing/<domain>/verify_*_blackbox.ts`) runnable via direct `npx tsx <path>`.
   - Detailed request logging (Method, Path, Params, Query, Body, Caller Context) and response logging (`JSON.stringify(..., null, 2)`).
4. **Integration Guide**: Dedicated markdown guide in `docs/<domain>/` with schemas, status tables, and TypeScript client examples.
5. **Git Commit**: Clean atomic commit per endpoint with zero working tree pollution.

---

## 2. Completed Endpoints (27/27 Committed & 100% Verified)

| # | Endpoint | Method | Domain | Status | Key Commits |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `/api/slots` | `GET` | Booking | ✅ Done & Tested | `397fe54` |
| 2 | `/api/careers/apply` | `POST` | Careers | ✅ Done & Tested | `397fe54` |
| 3 | `/api/admin/jobs` | `POST`, `GET` | Careers Admin | ✅ Done & Tested | `397fe54` |
| 4 | `/api/admin/careers/applications` | `GET` | Applications Inbox | ✅ Done & Tested | `397fe54` |
| 5 | `/api/admin/careers/applications/[id]` | `GET`, `PATCH` | Applications Inbox | ✅ Done & Tested | `397fe54` |
| 6 | `/api/admin/careers/jobs/[id]/approve` | `POST` | Approval Workflow | ✅ Done & Tested | `0cd5ae5` |
| 7 | `/api/admin/careers/jobs/[id]/return` | `POST` | Approval Workflow | ✅ Done & Tested | `372ca85` |
| 8 | `/api/admin/careers/jobs/[id]/versions` | `GET`, `POST` | Snapshot History | ✅ Done & Tested | `767ab15` |
| 9 | `/api/admin/jobs/[id]/status` | `POST` | 7-State Lifecycle | ✅ Done & Tested | `569877f` |
| 10 | `/api/admin/jobs/[id]` | `GET`, `PATCH`, `DELETE` | Job CRUD by ID | ✅ Done & Tested | `397fe54` |
| 11 | `/api/admin/careers/applications/[id]/resume` | `GET` | Resume Signed URL | ✅ Done & Tested | `6ddd217` |
| 12 | `/api/admin/careers/applications/export` | `GET` | CSV Export & Bucket | ✅ Done & Tested | `6de7c33` |
| 13 | `/api/careers/talent-pool` | `POST` | Public Talent Pool | ✅ Done & Tested | `bbb9fd7` |
| 14 | `/api/admin/blog/posts` | `GET`, `POST` | Blog / Editorial CMS | ✅ Done & Tested | `6b30587` |
| 15 | `/api/admin/blog/posts/[id]` | `GET`, `PATCH`, `DELETE` | Blog / Editorial CMS | ✅ Done & Tested | `8032f1e` |
| 16 | `/api/admin/blog/posts/[id]/publish` | `POST` | Blog / Publishing | ✅ Done & Tested | `cf4bae2` |
| 17 | `/api/admin/blog/posts/[id]/submit` | `POST` | Blog / Review Workflow | ✅ Done & Tested | `e47705d` |
| 18 | `/api/admin/media/upload` | `POST` | Media Management | ✅ Done & Tested | `7a2a48a` |
| 19 | `/api/book` | `POST` | Consultation Booking Engine | ✅ Done & Tested | `4126693` |
| 20 | `/api/admin/ai/jobs` | `GET`, `POST` | Autonomous AI Pipeline | ✅ Done & Tested | `8bd22f2` |
| 21 | `/api/admin/ai/topics`, `[id]` | `GET`, `POST`, `PATCH`, `DELETE` | Topic Backlog & Management | ✅ Done & Tested | `58a442f` |
| 22 | `/api/admin/ai/topics/suggest` | `POST` | AI Topic Ideation Generator | ✅ Done & Tested | `681c515` |
| 23 | `/api/admin/ai/topics/[id]/launch` | `POST` | 1-Click Autonomous Job Trigger | ✅ Done & Tested | `322ea01` |
| 24 | `/api/admin/ai/usage` | `GET` | AI Telemetry & Resource Caps | ✅ Done & Tested | `2e6c999` |
| 25 | `/api/admin/ai/prompts` | `GET`, `PATCH` | AI Prompt Template Management | ✅ Done & Tested | `cffc7b5` |
| 26 | `/api/admin/auth/login` | `POST` | Admin Auth & Security | ✅ Done & Tested | `add805c` |
| 27 | `/api/admin/auth/logout` | `POST` | Admin Auth & Security | ✅ Done & Tested | `be0f62e` |

---

## 3. Remaining Endpoints to Implement (Prioritized Backlog)

### Phase A: Blog / CMS Publishing & Media (Completed)

- [x] **1. `POST /api/admin/blog/posts/[id]/publish`**
  - **Purpose**: Transitions a draft or in-review blog post into `PUBLISHED` state, sets `publishedAt = new Date()`, updates `versionId`, writes audit log (`post.publish`), and triggers on-demand cache revalidation for `posts` and `post:<slug>`.
  - **Controller**: `app/api/admin/blog/posts/[id]/publish/route.ts`
  - **Service**: `AdminPostsService.publishPost(id, actorId, ipAddress)`
  - **Repository**: `AdminPostsRepository.updatePostWithAudit`
  - **Required Tests**: 401 unauthenticated, 403 origin mismatch, 403 author/viewer denied (Editor+ required to publish), 404 not found, 200 published success with envelope.

- [x] **2. `POST /api/admin/blog/posts/[id]/submit`**
  - **Purpose**: Transitions a draft post to `IN_REVIEW` status so editors can review and schedule it for publication.
  - **Controller**: `app/api/admin/blog/posts/[id]/submit/route.ts`
  - **Service**: `AdminPostsService.submitForReview(id, actorId, ipAddress)`
  - **Repository**: `AdminPostsRepository.updatePostWithAudit`
  - **Required Tests**: 401, 403 origin, 404 not found, 200 state transition success.

- [x] **3. `POST /api/admin/media/upload`**
  - **Purpose**: Uploads blog cover images, article infographics, and rich media assets to private Supabase storage.
  - **Controller**: `app/api/admin/media/upload/route.ts`
  - **Service**: Media upload service with MIME type verification, size bounding (max 10MB), Sharp image verification, and CDN URL return.
  - **Required Tests**: 401, 403, 415 unsupported media, 413 payload too large, 201 upload success with URL.

---

### Phase B: Public Consultation & Booking Engine (Completed)

- [x] **4. `POST /api/book`**
  - **Purpose**: Client consultation appointment booking. Validates selected slot from `GET /api/slots`, prevents double-booking race conditions with transactional locking, generates an `.ics` calendar file attachment, sends confirmation emails via Nodemailer, and stores booking in `ts_web_consultation_bookings`.
  - **Controller**: `app/api/book/route.ts`
  - **Service**: `BookingService.createBooking`
  - **Repository**: `BookingRepository.createBookingWithSlotLock`
  - **Required Tests**: 403 origin, 400 validation (name, email, time range), 409 conflict on already-booked slot, 201 booked success with calendar invite.

---

### Phase C: Autonomous AI Content Generation Pipeline

- [x] **5. `GET, POST /api/admin/ai/jobs`**
  - **Purpose**: Content generation pipeline jobs queue, tracking autonomous article generation runs, status transitions, and failures.
  - **Controller**: `app/api/admin/ai/jobs/route.ts`
  - **Service**: `JobOrchestratorService`
  - **Repository**: `GenerationJobsRepository`
  - **Required Tests**: 401 unauthenticated, 403 origin, 403 role permissions (Viewer vs Editor+), 422 validation, 200 get jobs list, 201 job trigger/creation.
- [x] **6. `GET, POST /api/admin/ai/topics` & `GET, PATCH, DELETE /api/admin/ai/topics/[id]`**
  - **Purpose**: AI content ideation topic cluster inbox, keyword density, search intent classification, and lifecycle management.
  - **Controller**: `app/api/admin/ai/topics/route.ts` & `app/api/admin/ai/topics/[id]/route.ts`
  - **Service**: `AdminTopicsService`
  - **Repository**: `TopicsRepository`
  - **Required Tests**: 401 unauthenticated, 403 origin, 403 role permissions (Viewer vs Editor+), 422 validation, 404 not found, 200 get list, 201 create topic, 200 update status, 200 delete topic.
- [x] **7. `POST /api/admin/ai/topics/suggest`**
  - **Purpose**: Autonomous topic ideation generator powered by LLM / search intent cues, persisting proposals into `ts_ai_topics`.
  - **Controller**: `app/api/admin/ai/topics/suggest/route.ts`
  - **Service**: `AdminTopicsService.suggestTopicsWithAI(category)`
  - **Contract**: `lib/contracts/admin-ai-topics.contract.ts` (`suggestAiTopicsContract`)
  - **Required Tests**: 401 unauthenticated, 403 foreign origin, 403 viewer/author denied, 400 bad JSON, 422 validation, 200 suggest with custom category, 200 default category, 500 error mapping.
- [x] **8. `POST /api/admin/ai/topics/[id]/launch`**
  - **Purpose**: Triggers end-to-end autonomous content generation for a specific queued topic and transitions status to QUEUED.
  - **Controller**: `app/api/admin/ai/topics/[id]/launch/route.ts`
  - **Service**: `AdminTopicsService.launchTopicGeneration(id)` & `JobOrchestratorService`
  - **Contract**: `lib/contracts/admin-ai-topics.contract.ts` (`launchAiTopicContract`)
  - **Required Tests**: 401 unauthenticated, 403 origin, 403 viewer/author denied, 400 invalid UUID, 404 not found, 200 launch success returning jobId, 500 error mapping.
- [x] **9. `GET /api/admin/ai/usage`**
  - **Purpose**: Tracks AI provider API quotas, token usage, latency metrics, and Cloudflare/Gemini costs.
  - **Controller**: `app/api/admin/ai/usage/route.ts`
  - **Service**: `AdminTelemetryService.getTelemetrySummary()`
  - **Repository**: `AdminTelemetryRepository.getTelemetryAggregates`
  - **Contract**: `lib/contracts/admin-ai-usage.contract.ts` (`getAiUsageTelemetryContract`)
  - **Required Tests**: 401 unauthenticated, 403 foreign origin, 200 get telemetry for viewer role, 200 get telemetry for editor role, 500 error mapping.
- [x] **10. `GET, PATCH /api/admin/ai/prompts`**
  - **Purpose**: Configures dynamic prompt templates for autonomous article generation and image synthesis.
  - **Controller**: `app/api/admin/ai/prompts/route.ts` (fully rewritten — DoD-compliant with origin check, RBAC, Zod validation, `{ok, data}` envelope, `x-request-id`, `Cache-Control: private, no-store`)
  - **Contract**: `lib/contracts/admin-ai-prompts.contract.ts` (`listAiPromptsContract`, `updateAiPromptContract`)
  - **Service**: `AdminPromptsService.listTemplates()` / `.updateTemplate(id, patch)` — existing, unchanged
  - **Repository**: `AdminPromptsRepository` — existing, unchanged
  - **Constants**: `AI_PROMPTS_LIMITS`, `AI_PROMPTS_ERRORS`, `AI_PROMPTS_MESSAGES` added to `lib/constants/ai.constants.ts`
  - **Vitest Suite**: `tests/admin-ai-prompts-blackbox.test.ts` (13 test cases)
  - **Standalone Script**: `blackbox-testing/ai/verify_admin_ai_prompts_blackbox.ts` ✅ **57/57 assertions passed**
  - **Integration Guide**: `docs/ai/GET-PATCH-api-admin-ai-prompts-integration.md`
  - **Git Commit**: `cffc7b5`

---

### Phase D: Admin Governance & System Maintenance

- [x] **11. `POST /api/admin/auth/login`**
  - **Purpose**: Admin credential verification, password hashing check, rate-limited login attempts, session cookie issuance, and audit record.
  - **Controller**: `app/api/admin/auth/login/route.ts` (3-tier HTTP boundary, origin check, `RateLimiterService` brute-force guard, Zod 4 contract validation, session cookie issuance, structured audit logging)
  - **Contract**: `lib/contracts/admin-auth.contract.ts` (`adminLoginContract`, `adminLoginBodySchema`, `adminLoginResponseSchema`)
  - **Service**: `AdminAuthService.authenticate(email, password)`
  - **Repository**: `AdminUsersRepository`
  - **Constants**: `AUTH_LIMITS`, `AUTH_ERRORS`, `AUTH_MESSAGES` in `lib/constants/auth.constants.ts`
  - **Vitest Suite**: `tests/admin-auth-login-blackbox.test.ts` (8 test cases)
  - **Standalone Script**: `blackbox-testing/auth/verify_admin_auth_login_blackbox.ts` ✅ **40/40 assertions passed**
  - **Integration Guide**: `docs/auth/POST-api-admin-auth-login-integration.md`
  - **Git Commit**: `add805c`
- [x] **12. `POST /api/admin/auth/logout`**
  - **Purpose**: Revokes current session token and clears HTTP-only authentication cookies.
  - **Controller**: `app/api/admin/auth/logout/route.ts` (3-tier HTTP boundary, origin check, explicit cookie deletion via `clearSessionCookie` and `response.cookies.delete`, structured audit logging)
  - **Contract**: `lib/contracts/admin-auth.contract.ts` (`adminLogoutContract`, `adminLogoutResponseSchema`)
  - **Constants**: `AUTH_MESSAGES.LOGOUT_SUCCESS`, `AUTH_ERRORS.LOGOUT_FAILED`
  - **Vitest Suite**: `tests/admin-auth-logout-blackbox.test.ts` (2 test cases)
  - **Standalone Script**: `blackbox-testing/auth/verify_admin_auth_logout_blackbox.ts` ✅ **11/11 assertions passed**
  - **Integration Guide**: `docs/auth/POST-api-admin-auth-logout-integration.md`
  - **Git Commit**: `be0f62e`
- [ ] **13. `POST /api/admin/revalidate`**
  - **Purpose**: On-demand Next.js ISR tag and path cache revalidation endpoint for editors.
- [ ] **14. `GET, POST /api/admin/careers/compliance`** *(Low Priority / Deferred)*
  - **Purpose**: Candidate GDPR data access export and permanent PII deletion/purging.

---

## 4. How to Resume the Next Endpoint

When starting the next turn:
1. State: *"Proceed with `POST /api/admin/revalidate` (Phase D: Admin Governance & System Maintenance)"*.
2. Follow the 5-step DoD pipeline:
   - Contract definition in `lib/contracts/`
   - Repository & Service enhancements in `lib/repositories/` & `lib/services/`
   - Controller implementation in `app/api/`
   - Vitest suite in `tests/` + Standalone script in `blackbox-testing/`
   - Frontend integration guide in `docs/`
   - Boundary checks, typecheck, full test run, and git commit.
