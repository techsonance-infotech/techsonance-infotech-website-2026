/**
 * posts.constants.ts
 * Domain-specific constants for Blog and CMS Post Management.
 * Enforces Rule 01 & Rule 12: Zero magic strings, centralized messages and limits.
 */

export const POST_ERRORS = {
  UNAUTHORIZED: "Unauthorized access. Please log in as an administrator.",
  FORBIDDEN_ORIGIN: "Forbidden origin: request rejected.",
  FORBIDDEN_ROLE: "Forbidden: your account does not have permission to create or edit posts.",
  FORBIDDEN_DELETE: "Forbidden: editor or higher required to delete posts.",
  FORBIDDEN_PUBLISH: "Forbidden: editor or higher required to publish posts.",
  NOT_FOUND: "The requested post could not be found.",
  SLUG_EXISTS: "A post with this slug already exists.",
  VALIDATION_FAILED: "Post validation failed. Please check your inputs.",
  INVALID_ID: "Invalid post ID format. Expected a valid UUID.",
  FAILED_LIST_POSTS: "Failed to list posts due to an internal server error.",
  FAILED_GET_POST: "Failed to fetch post due to an internal server error.",
  FAILED_CREATE_POST: "Failed to create post due to an internal server error.",
  FAILED_UPDATE_POST: "Failed to update post due to an internal server error.",
  FAILED_DELETE_POST: "Failed to delete post due to an internal server error.",
  FAILED_PUBLISH_POST: "Failed to publish post due to an internal server error.",
  FAILED_SUBMIT_POST: "Failed to submit post for review due to an internal server error.",
  SITE_REQUIRED: "Site ID is required to create a post.",
  POST_DELETED_SUCCESS: "Post deleted successfully",
  POST_PUBLISHED_SUCCESS: "Post published successfully",
  POST_SUBMITTED_SUCCESS: "Post submitted for review successfully",
} as const;

export const POST_LIMITS = {
  TITLE_MIN: 3,
  TITLE_MAX: 200,
  SLUG_MIN: 2,
  SLUG_MAX: 120,
  EXCERPT_MAX: 500,
  CONTENT_MIN: 10,
  TAG_MAX: 50,
  TAGS_MAX_COUNT: 20,
  READ_TIME_MAX: 50,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0,
} as const;

export const POST_DEFAULTS = {
  READ_TIME: "5 min read",
} as const;

export const POST_AUTHOR_ROLES = ["owner", "admin", "editor", "author"] as const;
