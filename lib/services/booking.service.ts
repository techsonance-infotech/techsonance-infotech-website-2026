import "server-only";
import { inject } from "@needle-di/core";
import { EmailService, type BookingPayload } from "./email.service";
import { generateAvailableSlots, isValidSlot, type Slot } from "../slots";

export class BookingService {
  constructor(private emailService: EmailService = inject(EmailService)) {}

  getAvailableSlots(fromTimestamp = Date.now()): Slot[] {
    return generateAvailableSlots(fromTimestamp);
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
      throw new Error("Selected time slot is unavailable or invalid.");
    }

    const ref = this.generateBookingRef();
    await this.emailService.sendConsultationEmails(payload, ref);

    return { success: true, ref };
  }
}
