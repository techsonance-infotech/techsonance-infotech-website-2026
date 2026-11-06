export const BOOKING_TIMEZONE = "Asia/Kolkata" as const;

export const BOOKING_SLOTS_CACHE_CONTROL =
  "public, s-maxage=300, stale-while-revalidate=600" as const;

export const SLOTS_DEFAULT_DAYS_AHEAD = 14 as const;
export const SLOTS_MAX_DAYS_AHEAD = 30 as const;
export const SLOTS_MIN_NOTICE_HOURS = 12 as const;
export const SLOTS_DURATION_MINUTES = 30 as const;

export const SLOTS_RATE_LIMIT = {
  limit: 60,
  windowSec: 60,
} as const;

export const BOOKING_ERRORS = {
  FORBIDDEN_ORIGIN: "Forbidden origin",
  FAILED_TO_FETCH_SLOTS: "Failed to retrieve available slots",
  INVALID_QUERY_PARAMS: "Invalid query parameters for slots",
  SLOT_UNAVAILABLE_OR_INVALID: "Selected time slot is unavailable or invalid.",
  MISSING_REQUIRED_FIELDS: "Please provide your name, email, and select an available time slot.",
} as const;

export { API_ENDPOINTS } from "./endpoints.constants";

export const BOOKING_ENDPOINTS = {
  SLOTS: "/api/slots",
  BOOK: "/api/book",
} as const;
