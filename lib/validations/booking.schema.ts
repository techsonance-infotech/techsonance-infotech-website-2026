import { z } from "zod";
import { SLOTS_MAX_DAYS_AHEAD } from "@/lib/constants/booking.constants";

export const slotSchema = z.strictObject({
  id: z.string().min(1).max(100),
  iso: z.string().min(1).max(100),
  dateIST: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Invalid IST date format (YYYY-MM-DD)" }),
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
