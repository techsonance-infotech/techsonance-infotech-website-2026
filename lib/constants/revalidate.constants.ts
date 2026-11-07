export const REVALIDATE_LIMITS = {
  MAX_TAGS: 20,
  MAX_PATHS: 20,
  TAG_MAX_LENGTH: 100,
  PATH_MAX_LENGTH: 200,
} as const;

export const DEFAULT_REVALIDATE_TAGS = ["posts", "jobs", "categories"] as const;

export const REVALIDATE_ERRORS = {
  UNAUTHORIZED: "You must be signed in to trigger cache revalidation",
  FORBIDDEN_ROLE:
    "Insufficient permissions. Only editors and admins can trigger cache revalidation.",
  FORBIDDEN_ORIGIN: "Forbidden origin",
  VALIDATION_FAILED: "Invalid revalidation payload. Provide valid tags or paths.",
  REVALIDATE_FAILED: "Failed to revalidate cache",
} as const;

export const REVALIDATE_MESSAGES = {
  REVALIDATE_SUCCESS: "Cache revalidated successfully.",
} as const;
