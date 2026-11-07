/**
 * media.constants.ts
 * Domain-specific constants, error messages, and limits for Admin Media Management.
 * Enforces Rule 01 & Rule 12: Zero magic strings, centralized configuration.
 */

export const MEDIA_ERRORS = {
  UNAUTHORIZED: "Unauthorized access. Please log in as an administrator.",
  FORBIDDEN_ORIGIN: "Forbidden origin: request rejected.",
  FORBIDDEN_ROLE: "Forbidden: your account does not have permission to upload media assets.",
  NO_FILE_PROVIDED: "No file was provided in the upload request.",
  FILE_TOO_LARGE: "File size exceeds the maximum allowed limit of 10MB.",
  UNSUPPORTED_MEDIA_TYPE:
    "Unsupported file type. Only JPEG, PNG, WebP, GIF, AVIF, and SVG images are accepted.",
  MAGIC_BYTE_MISMATCH:
    "File content does not match its declared image format. Magic byte inspection failed.",
  FAILED_UPLOAD_MEDIA: "Failed to upload media asset due to an internal server error.",
  UPLOAD_SUCCESS: "Media asset uploaded successfully",
} as const;

export const MEDIA_LIMITS = {
  MAX_FILE_BYTES: 10 * 1024 * 1024, // 10MB
  FOLDER_MAX_LENGTH: 100,
  DEFAULT_FOLDER: "blog/media",
} as const;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export const ALLOWED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
  ".svg",
] as const;

export const MEDIA_AUTHOR_ROLES = ["owner", "admin", "editor", "author"] as const;
