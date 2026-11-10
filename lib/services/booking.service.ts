import "server-only";
import crypto from "node:crypto";
import { inject } from "@needle-di/core";
import { EmailService, type BookingPayload } from "./email.service";
import { BookingRepository } from "../repositories/booking.repository";
import { generateAvailableSlots, isValidSlot } from "../slots";
import { AppError, ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { BOOKING_ERRORS, BookingStatus } from "@/lib/constants/booking.constants";
import type {
  SlotDto,
  CreateBookingOutput,
  CreateBookingResponseDto,
} from "@/lib/validations/booking.schema";
import { getEnv } from "@/lib/env";

export class BookingService {
  constructor(
    private emailService: EmailService = inject(EmailService),
    private bookingRepo: BookingRepository = inject(BookingRepository),
  ) {}

  getAvailableSlots(fromTimestamp = Date.now(), daysAhead?: number): SlotDto[] {
    try {
      return generateAvailableSlots(fromTimestamp, daysAhead);
    } catch (error) {
      logger.error("Failed to generate available slots", { error });
      throw new AppError(ErrorCode.INTERNAL, BOOKING_ERRORS.FAILED_TO_FETCH_SLOTS, {
        cause: error,
      });
    }
  }

  validateSlot(slotIso: string, now = Date.now()): boolean {
    return isValidSlot(slotIso, now);
  }

  generateBookingRef(): string {
    const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `TS-${randomHex}`;
  }

  /**
   * Primary booking workflow:
   * 1. Honeypot check (silently trap bots)
   * 2. Captcha verification (if configured)
   * 3. Slot timing validity
   * 4. Double-booking race prevention in repository
   * 5. Email confirmation + .ics dispatch
   * 6. Returns standard response DTO
   */
  async createBooking(
    payload: CreateBookingOutput,
    clientIp?: string,
  ): Promise<CreateBookingResponseDto> {
    // 1. Honeypot check (bot trap)
    if (payload.website && payload.website.trim().length > 0) {
      logger.warn("Bot trapped in booking honeypot", { email: payload.email });
      return {
        ref: `TS-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`,
        slotIso: payload.slotIso,
        status: BookingStatus.CONFIRMED,
      };
    }

    // 2. Cloudflare Turnstile Verification (if configured)
    try {
      const env = getEnv();
      if (env.TURNSTILE_SECRET && payload.turnstileToken) {
        const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret: env.TURNSTILE_SECRET,
            response: payload.turnstileToken,
            ...(clientIp ? { remoteip: clientIp } : {}),
          }),
        });
        const verifyJson = (await verifyRes.json()) as { success?: boolean };
        if (!verifyJson.success) {
          throw new AppError(ErrorCode.VALIDATION, BOOKING_ERRORS.CAPTCHA_FAILED);
        }
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      // Network failure on captcha verification should not block legitimate users
    }

    // 3. Validate slot availability and business hours
    if (!this.validateSlot(payload.slotIso)) {
      throw new AppError(ErrorCode.VALIDATION, BOOKING_ERRORS.SLOT_UNAVAILABLE_OR_INVALID);
    }

    // 4. Generate unique booking reference code
    const ref = this.generateBookingRef();

    // 5. Store booking in database with atomic slot lock to prevent double bookings
    const saved = await this.bookingRepo.createBookingWithSlotLock({
      reference: ref,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      company: payload.company,
      projectType: payload.projectType,
      budgetRange: payload.budgetRange,
      timeline: payload.timeline,
      slotIso: payload.slotIso,
      visitorTimezone: payload.visitorTimezone || "Asia/Kolkata",
      message: payload.message,
      status: BookingStatus.CONFIRMED,
      metadata: payload.recentMessages ? { recentMessages: payload.recentMessages } : undefined,
    });

    // 6. Send confirmation email to client (with .ics attachment) and admin notification
    try {
      await this.emailService.sendConsultationEmails(payload, ref);
    } catch (err) {
      logger.error("Failed to send consultation emails", { ref, error: err });
    }

    return {
      ref: saved.reference,
      slotIso: saved.slotIso,
      status: saved.status,
    };
  }

  /**
   * Backwards-compatible delegator for legacy test suites
   */
  async processBooking(payload: BookingPayload): Promise<{ success: boolean; ref: string }> {
    const res = await this.createBooking({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      company: payload.company,
      projectType: payload.projectType,
      budgetRange: payload.budgetRange,
      timeline: payload.timeline,
      slotIso: payload.slotIso,
      visitorTimezone: payload.visitorTimezone,
      message: payload.message,
      recentMessages: payload.recentMessages,
    });

    return { success: true, ref: res.ref };
  }
}
