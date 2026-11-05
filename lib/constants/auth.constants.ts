export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: "Invalid email or password",
  ACCOUNT_DISABLED: "User account is disabled",
  USER_NOT_FOUND: "User not found",
  UNAUTHORIZED: "Unauthorized access",
  EMAIL_REQUIRED: "Valid email address is required",
  PASSWORD_REQUIRED: "Password must be at least 6 characters",
  VALIDATION_FAILED: "Validation failed",
} as const;

export const AUTH_DEFAULT_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  EDITOR: "editor",
  AUTHOR: "author",
  VIEWER: "viewer",
} as const;
