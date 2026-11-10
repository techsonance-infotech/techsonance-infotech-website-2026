/**
 * Supported trigger events from Cal.com / Cal.id Webhooks.
 * Dependency-free TypeScript enum per Rule 01 §3.
 */
export enum CalWebhookTrigger {
  BOOKING_CREATED = "BOOKING_CREATED",
  BOOKING_RESCHEDULED = "BOOKING_RESCHEDULED",
  BOOKING_CANCELLED = "BOOKING_CANCELLED",
  MEETING_ENDED = "MEETING_ENDED",
}

export const CAL_WEBHOOK_TRIGGER_VALUES = Object.values(CalWebhookTrigger) as [
  CalWebhookTrigger,
  ...CalWebhookTrigger[],
];
