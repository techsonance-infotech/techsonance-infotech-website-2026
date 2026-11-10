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

export const BOOKING_RATE_LIMIT = {
  limit: 5,
  windowSec: 3600,
} as const;

export const BOOKING_ERRORS = {
  FORBIDDEN_ORIGIN: "Forbidden origin",
  FAILED_TO_FETCH_SLOTS: "Failed to retrieve available slots",
  INVALID_QUERY_PARAMS: "Invalid query parameters for slots",
  SLOT_UNAVAILABLE_OR_INVALID:
    "Selected time slot is unavailable or invalid. Please select another slot.",
  SLOT_ALREADY_BOOKED:
    "This consultation slot has already been booked. Please select another available time slot.",
  MISSING_REQUIRED_FIELDS: "Please provide your name, email, and select an available time slot.",
  RATE_LIMITED:
    "Too many booking attempts. Please try again later or reach out via WhatsApp at +91 9173101711.",
  EMAIL_SEND_FAILED:
    "We could not send your confirmation email. Please contact us directly at info@techsonance.co.in or WhatsApp +91 9173101711.",
  CAPTCHA_FAILED: "Captcha verification failed. Please refresh and try again.",
} as const;

export const BOOKING_MESSAGES = {
  BOOKING_CONFIRMED: "Consultation booked successfully.",
} as const;

export { BookingStatus, BOOKING_STATUS_VALUES } from "./enums/booking.enum";
export { CalWebhookTrigger, CAL_WEBHOOK_TRIGGER_VALUES } from "./enums/cal-webhook.enum";
export { API_ENDPOINTS } from "./endpoints.constants";

export const CAL_BOOKING_DEFAULTS = {
  SOURCE: "cal.id",
  PROJECT_TYPE: "Discovery Consultation (Cal.id)",
  BUDGET_RANGE: "Discovery",
  TIMELINE: "Immediate",
  FALLBACK_VISITOR_NAME: "Cal.id Visitor",
} as const;

export const BOOKING_ENDPOINTS = {
  SLOTS: "/api/slots",
  BOOK: "/api/book",
} as const;
