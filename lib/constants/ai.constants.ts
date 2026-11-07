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

export const AI_TOPICS_LIMITS = {
  TITLE_MIN: 5,
  TITLE_MAX: 250,
  KEYWORD_MAX: 60,
  KEYWORDS_MAX_COUNT: 20,
  CATEGORY_MAX: 100,
  TARGET_AUDIENCE_MAX: 150,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
} as const;

export const AI_TOPICS_ERRORS = {
  UNAUTHORIZED: "You must be signed in to access AI topic clusters",
  FORBIDDEN_ORIGIN: "Forbidden origin",
  FORBIDDEN_ROLE: "Insufficient permissions. Only editors and admins can modify AI topic clusters.",
  TITLE_REQUIRED: "Topic title is required and must be between 5 and 250 characters.",
  TOPIC_NOT_FOUND: "AI topic not found",
  CREATE_FAILED: "Failed to create AI topic",
  UPDATE_FAILED: "Failed to update AI topic status",
  DELETE_FAILED: "Failed to delete AI topic",
  LIST_FAILED: "Failed to list AI topics",
  SUGGEST_FAILED: "Failed to generate AI topic suggestions",
  INVALID_STATUS: "Valid status required: SUGGESTED, ACCEPTED, QUEUED, GENERATED, or REJECTED",
} as const;

export const AI_TOPICS_MESSAGES = {
  TOPIC_CREATED: "Topic added to backlog successfully.",
  STATUS_UPDATED: "Topic status updated successfully.",
  TOPIC_DELETED: "Topic removed successfully.",
  TOPICS_SUGGESTED: "AI topic suggestions generated and added to backlog.",
} as const;
