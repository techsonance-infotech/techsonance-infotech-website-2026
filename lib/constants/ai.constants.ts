export const AI_ADMIN_ROUTES = {
  CREDENTIALS: "/admin/ai/credentials",
  PIPELINE: "/admin/blog/ai",
  USAGE: "/admin/blog/ai/usage",
} as const;

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
  FORBIDDEN_ROLE:
    "Insufficient permissions. Only editors and admins can trigger AI generation jobs.",
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
  LAUNCH_FAILED: "Failed to launch autonomous generation for topic",
  INVALID_STATUS: "Valid status required: SUGGESTED, ACCEPTED, QUEUED, GENERATED, or REJECTED",
} as const;

export const AI_TOPICS_MESSAGES = {
  TOPIC_CREATED: "Topic added to backlog successfully.",
  STATUS_UPDATED: "Topic status updated successfully.",
  TOPIC_DELETED: "Topic removed successfully.",
  TOPICS_SUGGESTED: "AI topic suggestions generated and added to backlog.",
  TOPIC_LAUNCHED: "Autonomous generation job triggered successfully.",
} as const;

export const AI_USAGE_ERRORS = {
  UNAUTHORIZED: "You must be signed in to access AI telemetry and usage metrics",
  FORBIDDEN_ORIGIN: "Forbidden origin",
  LOAD_FAILED: "Failed to load AI telemetry usage metrics",
} as const;

export const AI_PROMPTS_LIMITS = {
  STEP_NAME_MIN: 1,
  STEP_NAME_MAX: 64,
  SYSTEM_PROMPT_MIN: 10,
  SYSTEM_PROMPT_MAX: 8000,
  USER_PROMPT_TEMPLATE_MIN: 5,
  USER_PROMPT_TEMPLATE_MAX: 4000,
  MODEL_PREFERENCE_MAX: 100,
  TEMPERATURE_MIN: 0,
  TEMPERATURE_MAX: 100,
} as const;

export const AI_PROMPTS_ERRORS = {
  UNAUTHORIZED: "You must be signed in to manage AI prompt templates",
  FORBIDDEN_ORIGIN: "Forbidden origin",
  FORBIDDEN_ROLE:
    "Insufficient permissions. Only editors and admins can modify AI prompt templates.",
  TEMPLATE_NOT_FOUND: "AI prompt template not found",
  LIST_FAILED: "Failed to list AI prompt templates",
  UPDATE_FAILED: "Failed to update AI prompt template",
  INVALID_ID: "Invalid template ID format. Expected a valid UUID.",
  VALIDATION_FAILED: "Prompt template validation failed",
} as const;

export const AI_PROMPTS_MESSAGES = {
  TEMPLATE_UPDATED: "Prompt template updated successfully.",
} as const;
