import type { ErrorCode } from "@/lib/errors";

export const ERROR_COPY = {
  BAD_REQUEST: "The request could not be processed. Please check your inputs.",
  VALIDATION: "Some fields need your attention before proceeding.",
  UNAUTHENTICATED: "Please sign in to access this feature.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "The requested item was not found.",
  CONFLICT: "A conflicting resource already exists.",
  PAYLOAD_TOO_LARGE: "The submitted content is too large. Please reduce the size.",
  UNSUPPORTED_MEDIA: "The file format or media type is not supported.",
  RATE_LIMITED: "Too many requests. Please wait a moment before trying again.",
  UNAVAILABLE: "This service is temporarily unavailable. Please retry in a few moments.",
  INTERNAL: "Something unexpected happened. Our engineering team has been notified.",
} as const satisfies Record<ErrorCode, string>;
