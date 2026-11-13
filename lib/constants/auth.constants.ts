import { AdminRole } from "@/lib/constants/enums/content.enum";

export const AUTH_LIMITS = {
  EMAIL_MAX: 254,
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 128,
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW_SECONDS: 60,
} as const;

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: "Invalid email or password",
  ACCOUNT_DISABLED: "User account is disabled",
  USER_NOT_FOUND: "User not found",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN_ORIGIN: "Forbidden origin",
  EMAIL_REQUIRED: "Valid email address is required",
  PASSWORD_REQUIRED: "Password must be at least 6 characters",
  VALIDATION_FAILED: "Validation failed",
  RATE_LIMITED: "Too many login attempts. Please try again later.",
  LOGIN_FAILED: "An unexpected error occurred during login",
  LOGOUT_FAILED: "Failed to sign out. Please try again.",
} as const;

export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: "Signed in successfully",
  LOGOUT_SUCCESS: "Signed out successfully",
} as const;

export const AUTH_DEFAULT_ROLES = {
  OWNER: AdminRole.OWNER,
  ADMIN: AdminRole.ADMIN,
  EDITOR: AdminRole.EDITOR,
  AUTHOR: AdminRole.AUTHOR,
  VIEWER: AdminRole.VIEWER,
} as const;
