import { z } from "zod";
import { SLOTS_MAX_DAYS_AHEAD } from "@/lib/constants/booking.constants";

export const slotSchema = z.strictObject({
  id: z.string().min(1).max(100),
  iso: z.string().min(1).max(100),
  dateIST: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Invalid IST date format (YYYY-MM-DD)" }),
  startIST: z.string().min(1).max(20),
  endIST: z.string().min(1).max(20),
  dayOfWeek: z.string().min(1).max(20),
});

export type SlotDto = z.infer<typeof slotSchema>;

export const slotsQuerySchema = z.strictObject({
  fromTimestamp: z.coerce.number().int().positive().optional(),
  daysAhead: z.coerce.number().int().min(1).max(SLOTS_MAX_DAYS_AHEAD).optional(),
});

export type SlotsQueryInput = z.input<typeof slotsQuerySchema>;
export type SlotsQueryOutput = z.output<typeof slotsQuerySchema>;

export const slotsResponseSchema = z.strictObject({
  slots: z.array(slotSchema),
  timezone: z.string().min(1).max(64),
  count: z.number().int().min(0),
});

export type SlotsResponseDto = z.infer<typeof slotsResponseSchema>;

export const createBookingSchema = z.strictObject({
  name: z.string().trim().min(1, { error: "Name is required" }).max(100),
  email: z.string().trim().email({ error: "Valid email is required" }).max(150),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(100).optional(),
  projectType: z.string().trim().min(1, { error: "Project type is required" }).max(100),
  budgetRange: z.string().trim().min(1, { error: "Budget range is required" }).max(100),
  timeline: z.string().trim().min(1, { error: "Timeline is required" }).max(100),
  slotIso: z.string().trim().min(1, { error: "Time slot is required" }).max(100),
  visitorTimezone: z.string().trim().default("Asia/Kolkata"),
  message: z.string().trim().max(500).optional(),
  website: z.string().max(200).optional(), // Honeypot field
  turnstileToken: z.string().max(2048).optional(),
  recentMessages: z
    .array(
      z.strictObject({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(300),
      }),
    )
    .max(5)
    .optional(),
});

export type CreateBookingInput = z.input<typeof createBookingSchema>;
export type CreateBookingOutput = z.output<typeof createBookingSchema>;

export const createBookingResponseSchema = z.strictObject({
  ref: z.string().min(1),
  slotIso: z.string().min(1),
  status: z.string().min(1),
});

export type CreateBookingResponseDto = z.infer<typeof createBookingResponseSchema>;
