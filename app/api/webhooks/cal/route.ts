import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { getContainer } from "@/lib/di/container";
import { BookingRepository } from "@/lib/repositories/booking.repository";
import { logger } from "@/lib/logger";
import { getEnv } from "@/lib/env";
import {
  BookingStatus,
  BOOKING_TIMEZONE,
  CalWebhookTrigger,
  CAL_BOOKING_DEFAULTS,
} from "@/lib/constants/booking.constants";
import {
  calWebhookPayloadSchema,
  type CalWebhookPayload,
} from "@/lib/validations/cal-webhook.schema";

export const runtime = "nodejs";

/**
 * POST /api/webhooks/cal
 * Captures external Cal.id / Cal.com iframe consultation bookings into the Supabase database.
 * No UI changes required.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const env = getEnv();
    const secret = env.CAL_WEBHOOK_SECRET;

    // Verify webhook signature if secret configured
    if (secret && secret.trim()) {
      const signatureHeader =
        req.headers.get("x-cal-signature-256") ||
        req.headers.get("x-cal-signature") ||
        req.headers.get("cal-signature");

      if (!signatureHeader) {
        logger.warn("Cal webhook received without required signature header");
        return NextResponse.json({ error: "Missing signature header" }, { status: 401 });
      }

      const hmac = crypto.createHmac("sha256", secret.trim());
      const expectedSignature = hmac.update(rawBody).digest("hex");

      const signatureBuffer = Buffer.from(signatureHeader, "hex");
      const expectedBuffer = Buffer.from(expectedSignature, "hex");

      if (
        signatureBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
      ) {
        logger.warn("Cal webhook signature mismatch");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const validationResult = calWebhookPayloadSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid Cal webhook payload structure" },
        { status: 400 },
      );
    }

    const parsed: CalWebhookPayload = validationResult.data;
    const { triggerEvent, payload } = parsed;
    const normalizedTrigger = triggerEvent.toUpperCase();

    // Only process booking creation/rescheduling events
    if (
      normalizedTrigger !== CalWebhookTrigger.BOOKING_CREATED &&
      normalizedTrigger !== CalWebhookTrigger.BOOKING_RESCHEDULED
    ) {
      logger.info(`Cal webhook ignored unhandled event: ${triggerEvent}`);
      return NextResponse.json({ received: true, ignored: true });
    }

    if (!payload?.startTime || !payload?.attendees || payload.attendees.length === 0) {
      return NextResponse.json(
        { error: "Missing attendee or start time details" },
        { status: 400 },
      );
    }

    const attendee = payload.attendees[0];
    const slotIso = new Date(payload.startTime).toISOString();
    const reference = payload.uid
      ? `CAL-${payload.uid.slice(0, 10).toUpperCase()}`
      : `CAL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const container = getContainer();
    const bookingRepo = container.get(BookingRepository);

    // Save to database
    try {
      const saved = await bookingRepo.createBookingWithSlotLock({
        reference,
        name: attendee.name || CAL_BOOKING_DEFAULTS.FALLBACK_VISITOR_NAME,
        email: attendee.email,
        phone: undefined,
        company: undefined,
        projectType: payload.title || CAL_BOOKING_DEFAULTS.PROJECT_TYPE,
        budgetRange: CAL_BOOKING_DEFAULTS.BUDGET_RANGE,
        timeline: CAL_BOOKING_DEFAULTS.TIMELINE,
        slotIso,
        visitorTimezone: attendee.timeZone || BOOKING_TIMEZONE,
        message: payload.description || undefined,
        status: BookingStatus.CONFIRMED,
        metadata: {
          source: CAL_BOOKING_DEFAULTS.SOURCE,
          calBookingId: payload.bookingId,
          calUid: payload.uid,
          triggerEvent: normalizedTrigger,
        },
      });

      logger.info("Cal.id booking successfully synchronized to database", {
        reference: saved.reference,
        slotIso: saved.slotIso,
        email: attendee.email,
      });

      return NextResponse.json({
        ok: true,
        reference: saved.reference,
        slotIso: saved.slotIso,
      });
    } catch (insertErr) {
      // If slot is already locked or duplicate reference, acknowledge safely
      logger.warn("Cal.id booking slot collision or duplicate", {
        slotIso,
        error: String(insertErr),
      });
      return NextResponse.json({
        ok: true,
        message: "Booking noted or slot already occupied",
      });
    }
  } catch (err) {
    logger.error("Cal webhook exception", { error: String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal webhook error" },
      { status: 500 },
    );
  }
}
