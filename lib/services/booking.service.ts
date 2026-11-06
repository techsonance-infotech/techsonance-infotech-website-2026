import "server-only";
import { inject } from "@needle-di/core";
import { EmailService, type BookingPayload } from "./email.service";
import { generateAvailableSlots, isValidSlot } from "../slots";
import { AppError, ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { BOOKING_ERRORS } from "@/lib/constants/booking.constants";
import type { SlotDto } from "@/lib/validations/booking.schema";

export class BookingService {
  constructor(private emailService: EmailService = inject(EmailService)) {}

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
    const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `TS-${randomHex}`;
  }

  async processBooking(payload: BookingPayload): Promise<{ success: boolean; ref: string }> {
    if (!this.validateSlot(payload.slotIso)) {
      throw new AppError(ErrorCode.VALIDATION, BOOKING_ERRORS.SLOT_UNAVAILABLE_OR_INVALID);
    }

    const ref = this.generateBookingRef();
    await this.emailService.sendConsultationEmails(payload, ref);

    return { success: true, ref };
  }
}
