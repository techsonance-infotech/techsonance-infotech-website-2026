/**
 * endpoints.constants.ts
 * Centralized registry of all API endpoint routes across the application.
 * Rules 01 & 12: No hardcoded route string literals anywhere in components, services, or contracts.
 */

export const API_ENDPOINTS = {
  // ─── Booking & Consultation ─────────────────────────────────────────────────
  BOOKING: {
    SLOTS: "/api/slots",
    BOOK: "/api/book",
  },

  // ─── Public Careers & Talent ────────────────────────────────────────────────
  CAREERS: {
    APPLY: "/api/careers/apply",
    TALENT_POOL: "/api/careers/talent-pool",
    INQUIRY: "/api/careers",
  },

  // ─── Admin Careers, Jobs & Governance ───────────────────────────────────────
  ADMIN: {
    // Job Postings Lifecycle
    JOBS: "/api/admin/jobs",
    JOB: (id: string) => `/api/admin/jobs/${id}` as const,
    JOB_STATUS: (id: string) => `/api/admin/jobs/${id}/status` as const,

    // Approval Workflow & Version History
    CAREER_JOB_APPROVE: (id: string) => `/api/admin/careers/jobs/${id}/approve` as const,
    CAREER_JOB_RETURN: (id: string) => `/api/admin/careers/jobs/${id}/return` as const,
    CAREER_JOB_VERSIONS: (id: string) => `/api/admin/careers/jobs/${id}/versions` as const,

    // Candidate Applications & Hiring Inbox
    APPLICATIONS: "/api/admin/careers/applications",
    APPLICATION: (id: string) => `/api/admin/careers/applications/${id}` as const,
    APPLICATION_RESUME: (id: string) => `/api/admin/careers/applications/${id}/resume` as const,
    APPLICATIONS_EXPORT: "/api/admin/careers/applications/export",
    COMPLIANCE: "/api/admin/careers/compliance",

    // Authentication
    AUTH: {
      LOGIN: "/api/admin/auth/login",
      LOGOUT: "/api/admin/auth/logout",
    },

    // Blog & CMS Content Management (Section: blog)
    BLOG: {
      POSTS: "/api/admin/blog/posts",
      POST: (id: string) => `/api/admin/blog/posts/${id}` as const,
      POST_PUBLISH: (id: string) => `/api/admin/blog/posts/${id}/publish` as const,
      POST_SUBMIT: (id: string) => `/api/admin/blog/posts/${id}/submit` as const,
    },

    // Legacy Blog / CMS Posts aliases (for seamless backward compatibility)
    POSTS: "/api/admin/blog/posts",
    POST: (id: string) => `/api/admin/blog/posts/${id}` as const,
    POST_PUBLISH: (id: string) => `/api/admin/blog/posts/${id}/publish` as const,
    POST_SUBMIT: (id: string) => `/api/admin/blog/posts/${id}/submit` as const,

    // Media Upload
    MEDIA_UPLOAD: "/api/admin/media/upload",

    // Autonomous AI Pipeline
    AI: {
      JOBS: "/api/admin/ai/jobs",
      PROMPTS: "/api/admin/ai/prompts",
      TOPICS: "/api/admin/ai/topics",
      TOPIC: (id: string) => `/api/admin/ai/topics/${id}` as const,
      TOPIC_LAUNCH: (id: string) => `/api/admin/ai/topics/${id}/launch` as const,
      TOPIC_SUGGEST: "/api/admin/ai/topics/suggest",
      USAGE: "/api/admin/ai/usage",
      CREDENTIALS: "/api/admin/ai/credentials",
      CREDENTIALS_REPLACE: "/api/admin/ai/credentials/replace",
      CREDENTIALS_KILL: "/api/admin/ai/credentials/kill",
      ACCOUNTS: "/api/admin/ai/accounts",
    },

    // Cache Revalidation
    REVALIDATE: "/api/admin/revalidate",
  },

  // ─── Public Chat, Contact, Health & System ──────────────────────────────────
  CHAT: "/api/chat",
  CONTACT: "/api/contact",
  HEALTH: "/api/health",
  REVALIDATE: "/api/revalidate",

  // ─── Background Workers ─────────────────────────────────────────────────────
  WORKER: {
    CRON: "/api/worker/cron",
    STEP: "/api/worker/step",
    TRIGGER: "/api/worker/trigger",
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
