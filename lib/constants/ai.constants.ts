export const AI_JOBS_LIMITS = {
  TOPIC_MIN: 5,
  TOPIC_MAX: 300,
  CATEGORY_MAX: 100,
  DEFAULT_LIMIT: 30,
  MAX_LIMIT: 100,
} as const;

export const AI_JOBS_ERRORS = {
  UNAUTHORIZED: "You must be signed in to access AI generation jobs",
  FORBIDDEN_ORIGIN: "Forbidden origin",
  FORBIDDEN_ROLE: "Insufficient permissions. Only editors and admins can trigger AI generation jobs.",
  TOPIC_REQUIRED: "Topic text is required and must be between 5 and 300 characters.",
  JOB_NOT_FOUND: "AI generation job not found",
  TRIGGER_FAILED: "Failed to trigger AI generation job",
  LIST_FAILED: "Failed to list AI generation jobs",
} as const;

export const AI_JOBS_MESSAGES = {
  JOB_ENQUEUED: "Job enqueued and generation started in background",
} as const;
