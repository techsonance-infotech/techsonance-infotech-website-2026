import { z } from "zod";

export const calWebhookAttendeeSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().optional(),
  timeZone: z.string().trim().optional(),
  language: z.string().trim().optional(),
});

export const calWebhookPayloadSchema = z.object({
  triggerEvent: z.string(),
  createdAt: z.string().optional(),
  payload: z.object({
    type: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    startTime: z.string(),
    endTime: z.string().optional(),
    organizer: z
      .object({
        id: z.number().optional(),
        name: z.string().optional(),
        email: z.string().optional(),
        timeZone: z.string().optional(),
      })
      .optional(),
    attendees: z.array(calWebhookAttendeeSchema).optional(),
    uid: z.string().optional(),
    bookingId: z.number().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type CalWebhookPayload = z.infer<typeof calWebhookPayloadSchema>;
