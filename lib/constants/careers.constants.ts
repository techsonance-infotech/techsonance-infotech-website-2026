/**
 * careers.constants.ts
 * Domain-scoped constants for the careers / applications feature.
 * Rule 12 §1: all meaningful strings live here, never inline in services or repositories.
 */

// ─── Database / repository sentinels ─────────────────────────────────────────

/** Nil UUID returned when no site row exists in the DB (e.g. dev/test environments). */
export const NIL_SITE_ID = "00000000-0000-0000-0000-000000000000" as const;

// ─── Resume upload limits ─────────────────────────────────────────────────────

/** Maximum resume file size (5 MB). */
export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

/** Human-readable label shown in validation error messages. */
export const MAX_RESUME_SIZE_LABEL = "5MB" as const;

/** Allowed resume MIME types. */
export const ALLOWED_RESUME_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

/** Allowed resume extensions (lowercase). */
export const ALLOWED_RESUME_EXTENSIONS = [".pdf", ".docx", ".doc"] as const;

// ─── Magic bytes for resume file validation ───────────────────────────────────

/** PDF binary signature: `%PDF-` */
export const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d] as const;

/** DOCX / ZIP binary signature: `PK\x03\x04` */
export const DOCX_MAGIC_BYTES = [0x50, 0x4b, 0x03, 0x04] as const;

// ─── Error messages ───────────────────────────────────────────────────────────

export const CAREER_ERRORS = {
  RESUME_REQUIRED: "A resume file is required to submit an application.",
  RESUME_TOO_LARGE: `Resume file size exceeds the maximum limit of ${MAX_RESUME_SIZE_LABEL}.`,
  RESUME_BAD_FORMAT:
    "Unsupported resume format. Please upload a PDF or Word document (.pdf, .docx, .doc).",
  RESUME_PDF_MAGIC:
    "File content does not match allowed format. PDF magic bytes verification failed.",
  RESUME_DOCX_MAGIC:
    "File content does not match allowed format. DOCX magic bytes verification failed.",

  PRIVACY_CONSENT_REQUIRED: "You must accept the privacy policy to submit an application.",
  JOB_NOT_FOUND: "The specified job opening does not exist.",
  JOB_NOT_ACCEPTING: "This opening is currently closed and no longer accepting applications.",
  JOB_DEADLINE_PASSED: "The application deadline for this opening has passed.",
  DUPLICATE_APPLICATION:
    "Already applied: You have already submitted an application for this role with this email address.",

  TALENT_NAME_TOO_SHORT: "Full name must be at least 2 characters.",
  TALENT_EMAIL_INVALID: "Please provide a valid email address.",
  TALENT_INSERT_FAILED: "Failed to save talent pool candidate profile.",

  RATING_OUT_OF_RANGE: "Rating must be between 1 and 5",
  CANDIDATE_EMAIL_REQUIRED: "A valid candidate email is required for data export.",
  CANDIDATE_EMAIL_REQUIRED_GDPR: "A valid candidate email is required for GDPR deletion.",
  RESUME_NOT_ATTACHED: "No resume document attached to this application.",
  APPLICATION_NOT_FOUND: "Application record could not be found.",
  SIGNED_URL_FAILED: "Failed to generate signed resume URL",

  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN_ADMIN_OR_OWNER: "Forbidden: Admin or Owner role required",
  FORBIDDEN_COMPLIANCE_EXPORT: "Forbidden: Admin or Owner role required for compliance data export",
  FORBIDDEN_COMPLIANCE_PURGE: "Forbidden: Admin or Owner role required for candidate data purge",
  FORBIDDEN_ORIGIN: "Forbidden origin",
  FORBIDDEN_ROLE_TRANSITION: "Forbidden: You do not have permission to transition job status",
  FORBIDDEN_ROLE_APPROVE: "Forbidden: Only Admins can approve or return roles under review",
  FORBIDDEN_ROLE_REOPEN: "Forbidden: Only Admins can re-open or archive closed roles",

  FAILED_LIST_APPLICATIONS: "Failed to list applications",
  FAILED_GET_APPLICATION: "Failed to retrieve application",
  FAILED_UPDATE_APPLICATION: "Failed to update application",
  FAILED_EXPORT_APPLICATIONS: "Failed to export applications",
  FAILED_GENERATE_RESUME_LINK: "Failed to generate resume download link",
  FAILED_EXPORT_COMPLIANCE: "Failed to export candidate compliance data",
  FAILED_PURGE_CANDIDATE: "Failed to purge candidate records",

  FAILED_LIST_JOBS: "Failed to list jobs",
  FAILED_GET_JOB: "Failed to fetch job",
  FAILED_CREATE_JOB: "Failed to create job",
  FAILED_UPDATE_JOB: "Failed to update job",
  FAILED_DELETE_JOB: "Failed to delete job",
  FAILED_UPDATE_JOB_STATUS: "Failed to update job status",
  FAILED_APPROVE_JOB: "Failed to approve job",
  FAILED_RETURN_JOB: "Failed to return job",
  FAILED_LIST_VERSIONS: "Failed to list versions",
  FAILED_RESTORE_VERSION: "Failed to restore version",

  JOB_ID_REQUIRED: "Job ID is required",
  CANDIDATE_NAME_REQUIRED: "Candidate name is required",
  EMAIL_REQUIRED: "Email address is required",
  RESUME_DOCUMENT_REQUIRED: "Resume document is required",
  FULL_NAME_REQUIRED: "Full name is required.",
  ROLE_REQUIRED: "Role applied for is required.",
  MESSAGE_REQUIRED: "Message or cover letter must be at least 5 characters.",
  INQUIRY_RECEIVED_SUCCESS: "Career inquiry submitted successfully.",
  CAREER_INQUIRY_EMAIL_FAIL: "Failed to send career inquiry notification email.",
  UNEXPECTED_APPLICATION_ERROR: "An unexpected error occurred while processing your application.",
  UNEXPECTED_TALENT_POOL_ERROR: "An unexpected error occurred while processing your submission.",

  VALIDATION_FAILED: "Validation failed",
  VERSION_ID_REQUIRED: "Valid versionId is required",
  RETURN_FEEDBACK_REQUIRED: "Feedback comment is required when returning a role to draft",
  JOB_TITLE_AND_SLUG_REQUIRED: "Job title and slug are required",
  CANNOT_SCHEDULE_WITHOUT_DATE: "Cannot schedule job without a publishAt date",
  RECRUITER_APPROVAL_REQUIRED:
    "Approval required: Recruiters must submit role to IN_REVIEW for approval before publishing",
} as const;

// ─── Audit / action event names ───────────────────────────────────────────────

export const CAREER_AUDIT_ACTIONS = {
  APPLICATION_STAGE_UPDATED: "APPLICATION_STAGE_UPDATED",
  APPLICATION_REVIEW_UPDATED: "APPLICATION_REVIEW_UPDATED",
  CANDIDATE_PURGED: "compliance.candidate_purged",
  JOB_CREATE: "job.create",
  JOB_UPDATE: "job.update",
  JOB_DELETE: "job.delete",
  JOB_APPROVE: "job.approve",
  JOB_RETURN: "job.return",
  JOB_RESTORE_VERSION: "job.restore_version",
} as const;

export const CAREER_COMPLIANCE_MESSAGES = {
  EXPORT_SUCCESS: "Candidate compliance data exported successfully.",
  PURGE_SUCCESS: "Candidate records and files purged successfully.",
} as const;

// ─── Storage ──────────────────────────────────────────────────────────────────

/** Supabase Storage bucket for resumes. */
export const RESUME_BUCKET = "resumes" as const;

/** Privacy notice version string stored alongside consent. */
export const PRIVACY_NOTICE_VERSION = "2026-v1" as const;

/** Default application source when none is specified. */
export const DEFAULT_APPLICATION_SOURCE = "direct" as const;

/** Fallback recruiter email when env var is not set. */
export const DEFAULT_RECRUITER_EMAIL = "careers@techsonance.co.in" as const;

/** Signed URL expiry for resume downloads (seconds). */
export const RESUME_SIGNED_URL_TTL_SEC = 300 as const;

/** Signed URL expiry generated at application creation time (seconds). */
export const RESUME_CREATION_SIGNED_URL_TTL_SEC = 60 * 60 * 24 * 7;

// ─── Pagination defaults ──────────────────────────────────────────────────────

export const DEFAULT_APPLICATIONS_PAGE_SIZE = 50 as const;

// ─── API Endpoints (Centralized in endpoints.constants.ts) ────────────────────

export { API_ENDPOINTS } from "./endpoints.constants";

export const CAREER_ENDPOINTS = {
  APPLY: "/api/careers/apply",
  TALENT_POOL: "/api/careers/talent-pool",
  INQUIRY: "/api/careers",
  ADMIN_JOBS: "/api/admin/jobs",
  ADMIN_JOB: (id: string) => `/api/admin/jobs/${id}` as const,
  ADMIN_JOB_STATUS: (id: string) => `/api/admin/jobs/${id}/status` as const,
  ADMIN_JOB_APPROVE: (id: string) => `/api/admin/careers/jobs/${id}/approve` as const,
  ADMIN_JOB_RETURN: (id: string) => `/api/admin/careers/jobs/${id}/return` as const,
  ADMIN_JOB_VERSIONS: (id: string) => `/api/admin/careers/jobs/${id}/versions` as const,
  ADMIN_APPLICATIONS: "/api/admin/careers/applications",
  ADMIN_APPLICATION: (id: string) => `/api/admin/careers/applications/${id}` as const,
  ADMIN_APPLICATION_RESUME: (id: string) => `/api/admin/careers/applications/${id}/resume` as const,
  ADMIN_APPLICATIONS_EXPORT: "/api/admin/careers/applications/export",
  ADMIN_COMPLIANCE: "/api/admin/careers/compliance",
} as const;
