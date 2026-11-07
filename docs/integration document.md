The master reference matrix mapping each endpoint to its exact integration document:

---

### 1. Booking & Consultation Engine

| # | Endpoint | Method | Integration Guide |
|---|---|---|---|
| 1 | `/api/slots` | `GET` | [`docs/booking/GET-api-slots-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/booking/GET-api-slots-integration.md) |
| 2 | `/api/book` | `POST` | [`docs/booking/POST-api-book-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/booking/POST-api-book-integration.md) |

---

### 2. Public Careers & Candidate Talent Pool

| # | Endpoint | Method | Integration Guide |
|---|---|---|---|
| 3 | `/api/careers/apply` | `POST` | [`docs/careers/POST-api-careers-apply-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/careers/POST-api-careers-apply-integration.md) |
| 4 | `/api/careers/talent-pool` | `POST` | [`docs/careers/POST-api-careers-talent-pool-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/careers/POST-api-careers-talent-pool-integration.md) |

---

### 3. Careers Admin, Job Postings & Hiring Inbox

| # | Endpoint | Method | Integration Guide |
|---|---|---|---|
| 5 | `/api/admin/jobs` | `POST`, `GET` | [`docs/careers/POST-api-admin-jobs-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/careers/POST-api-admin-jobs-integration.md) |
| 6 | `/api/admin/jobs/[id]` | `GET`, `PATCH`, `DELETE` | [`docs/careers/GET-PATCH-DELETE-api-admin-jobs-id-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/careers/GET-PATCH-DELETE-api-admin-jobs-id-integration.md) |
| 7 | `/api/admin/jobs/[id]/status` | `POST` | [`docs/careers/POST-api-admin-jobs-id-status-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/careers/POST-api-admin-jobs-id-status-integration.md) |
| 8 | `/api/admin/careers/jobs/[id]/approve` | `POST` | [`docs/careers/POST-api-admin-careers-jobs-id-approve-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/careers/POST-api-admin-careers-jobs-id-approve-integration.md) |
| 9 | `/api/admin/careers/jobs/[id]/return` | `POST` | [`docs/careers/POST-api-admin-careers-jobs-id-return-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/careers/POST-api-admin-careers-jobs-id-return-integration.md) |
| 10 | `/api/admin/careers/jobs/[id]/versions` | `GET`, `POST` | [`docs/careers/GET-POST-api-admin-careers-jobs-id-versions-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/careers/GET-POST-api-admin-careers-jobs-id-versions-integration.md) |
| 11 | `/api/admin/careers/applications` | `GET` | [`docs/careers/GET-PATCH-api-admin-careers-applications-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/careers/GET-PATCH-api-admin-careers-applications-integration.md) |
| 12 | `/api/admin/careers/applications/[id]` | `GET`, `PATCH` | [`docs/careers/GET-PATCH-api-admin-careers-applications-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/careers/GET-PATCH-api-admin-careers-applications-integration.md) |
| 13 | `/api/admin/careers/applications/[id]/resume` | `GET` | [`docs/careers/GET-api-admin-careers-applications-id-resume-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/careers/GET-api-admin-careers-applications-id-resume-integration.md) |
| 14 | `/api/admin/careers/applications/export` | `GET` | [`docs/careers/GET-api-admin-careers-applications-export-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/careers/GET-api-admin-careers-applications-export-integration.md) |
| 15 | `/api/admin/careers/compliance` | `GET`, `POST` | [`docs/careers/GET-POST-api-admin-careers-compliance-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/careers/GET-POST-api-admin-careers-compliance-integration.md) |

---

### 4. Blog & Editorial CMS Publishing

| # | Endpoint | Method | Integration Guide |
|---|---|---|---|
| 16 | `/api/admin/blog/posts` | `GET`, `POST` | [`docs/posts/GET-POST-api-admin-posts-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/posts/GET-POST-api-admin-posts-integration.md) |
| 17 | `/api/admin/blog/posts/[id]` | `GET`, `PATCH`, `DELETE` | [`docs/posts/GET-PATCH-DELETE-api-admin-posts-id-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/posts/GET-PATCH-DELETE-api-admin-posts-id-integration.md) |
| 18 | `/api/admin/blog/posts/[id]/publish` | `POST` | [`docs/posts/POST-api-admin-posts-id-publish-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/posts/POST-api-admin-posts-id-publish-integration.md) |
| 19 | `/api/admin/blog/posts/[id]/submit` | `POST` | [`docs/posts/POST-api-admin-posts-id-submit-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/posts/POST-api-admin-posts-id-submit-integration.md) |
| 20 | `/api/admin/media/upload` | `POST` | [`docs/media/POST-api-admin-media-upload-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/media/POST-api-admin-media-upload-integration.md) |
| * | *Full Blog Migration & Namespace Guide* | — | [`docs/blog/BLOG_ENDPOINT_MIGRATION_AND_FRONTEND_GUIDE.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/blog/BLOG_ENDPOINT_MIGRATION_AND_FRONTEND_GUIDE.md) |

---

### 5. Autonomous AI Content Pipeline

| # | Endpoint | Method | Integration Guide |
|---|---|---|---|
| 21 | `/api/admin/ai/jobs` | `GET`, `POST` | [`docs/ai/GET-POST-api-admin-ai-jobs-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/ai/GET-POST-api-admin-ai-jobs-integration.md) |
| 22 | `/api/admin/ai/topics`, `[id]` | `GET`, `POST`, `PATCH`, `DELETE` | [`docs/ai/GET-POST-api-admin-ai-topics-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/ai/GET-POST-api-admin-ai-topics-integration.md) |
| 23 | `/api/admin/ai/topics/suggest` | `POST` | [`docs/ai/POST-api-admin-ai-topics-suggest-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/ai/POST-api-admin-ai-topics-suggest-integration.md) |
| 24 | `/api/admin/ai/topics/[id]/launch` | `POST` | [`docs/ai/POST-api-admin-ai-topics-id-launch-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/ai/POST-api-admin-ai-topics-id-launch-integration.md) |
| 25 | `/api/admin/ai/usage` | `GET` | [`docs/ai/GET-api-admin-ai-usage-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/ai/GET-api-admin-ai-usage-integration.md) |
| 26 | `/api/admin/ai/prompts` | `GET`, `PATCH` | [`docs/ai/GET-PATCH-api-admin-ai-prompts-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/ai/GET-PATCH-api-admin-ai-prompts-integration.md) |

---

### 6. Admin Governance, Auth & System Maintenance

| # | Endpoint | Method | Integration Guide |
|---|---|---|---|
| 27 | `/api/admin/auth/login` | `POST` | [`docs/auth/POST-api-admin-auth-login-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/auth/POST-api-admin-auth-login-integration.md) |
| 28 | `/api/admin/auth/logout` | `POST` | [`docs/auth/POST-api-admin-auth-logout-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/auth/POST-api-admin-auth-logout-integration.md) |
| 29 | `/api/admin/revalidate` | `POST` | [`docs/admin/POST-api-admin-revalidate-integration.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/docs/admin/POST-api-admin-revalidate-integration.md) |

---

### What Every Integration Guide Includes
Each markdown document provides:
1. **Overview & Business Purpose**: Clear description of the endpoint's purpose, database tables, and lifecycle roles.
2. **Endpoint Specification**: Path, HTTP method, centralized `API_ENDPOINTS` constant, and Zod 4 contract link.
3. **Security Invariants**: Origin enforcement (`isAllowedOrigin`), session requirement, and exact RBAC role permissions (`Viewer`, `Author`, `Editor`, `Admin`, `Owner`).
4. **Request & Response Envelopes**: Strict JSON schemas with field-level bounds and realistic copy/examples.
5. **HTTP Status Code & Error Matrix**: Complete mapping of `200`, `201`, `400`, `401`, `403`, `404`, `422`, `429`, and `500` status codes to `ErrorCode` enum members.
6. **TypeScript Client Examples**: Ready-to-copy frontend fetch calls using typed contracts.
7. **Verification Commands**: Exact commands to run the Vitest suite and the standalone hardcore black-box script.