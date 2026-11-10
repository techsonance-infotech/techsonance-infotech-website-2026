export {
  ContactInquiryType,
  CONTACT_INQUIRY_TYPE_VALUES,
} from "./enums/contact-inquiry-type.enum";
export {
  ContactInquiryStatus,
  CONTACT_INQUIRY_STATUS_VALUES,
} from "./enums/contact-inquiry-status.enum";

export const CONTACT_ERRORS = {
  REQUIRED_FIELDS: "All required fields must be filled.",
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_PHONE_IN: "Please enter a valid 10-digit Indian phone number.",
  INVALID_PHONE: "Please enter a valid phone number.",
  MESSAGE_TOO_LONG: "Message cannot exceed 1000 words.",
  RATE_LIMITED: "Too many requests. Please try again after 15 minutes.",
  SEND_FAILED: "Failed to send email",
} as const;

export const CONTACT_DEFAULTS = {
  ADMIN_EMAIL: "info@techsonance.co.in",
  SMTP_FROM: "info@techsonance.co.in",
  RATE_LIMIT_MAX_REQUESTS: 5,
  RATE_LIMIT_WINDOW_SECONDS: 15 * 60,
  MAX_MESSAGE_WORDS: 1000,
} as const;
