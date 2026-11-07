import "server-only";
import { inject } from "@needle-di/core";
import { and, eq, gte, lte } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { Database } from "@/lib/database/index";
import {
  consultationBookingsTable,
  type ConsultationBooking,
  type InsertConsultationBooking,
} from "@/lib/database/schema/index.schema";
import { mapDbError } from "@/lib/dbErrors";
import { AppError, ErrorCode } from "@/lib/errors";
import { BOOKING_ERRORS, BookingStatus } from "@/lib/constants/booking.constants";

export class BookingRepository {
  constructor(private db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  /**
   * Finds an active consultation booking for a specific ISO slot.
   */
  async findBookingBySlot(slotIso: string): Promise<ConsultationBooking | null> {
    if (!slotIso || !slotIso.trim()) return null;

    try {
      const records = await this.db
        .select()
        .from(consultationBookingsTable)
        .where(
          and(
            eq(consultationBookingsTable.slotIso, slotIso),
            eq(consultationBookingsTable.status, BookingStatus.CONFIRMED),
          ),
        )
        .limit(1);

      return records[0] ?? null;
    } catch (err) {
      throw mapDbError(err, { context: "BookingRepository.findBookingBySlot" });
    }
  }

  /**
   * Finds a booking by its public reference code (e.g., TS-XXXXXXXX).
   */
  async findBookingByReference(reference: string): Promise<ConsultationBooking | null> {
    if (!reference || !reference.trim()) return null;

    try {
      const records = await this.db
        .select()
        .from(consultationBookingsTable)
        .where(eq(consultationBookingsTable.reference, reference))
        .limit(1);

      return records[0] ?? null;
    } catch (err) {
      throw mapDbError(err, { context: "BookingRepository.findBookingByReference" });
    }
  }

  /**
   * Inserts a new consultation booking with atomic slot-conflict protection.
   * If slot is already booked or a unique constraint race occurs, throws CONFLICT.
   */
  async createBookingWithSlotLock(
    bookingData: InsertConsultationBooking,
  ): Promise<ConsultationBooking> {
    try {
      const existing = await this.findBookingBySlot(bookingData.slotIso);
      if (existing) {
        throw new AppError(ErrorCode.CONFLICT, BOOKING_ERRORS.SLOT_ALREADY_BOOKED);
      }

      const rows = await this.db
        .insert(consultationBookingsTable)
        .values(bookingData)
        .returning();

      if (!rows || rows.length === 0) {
        throw new AppError(ErrorCode.INTERNAL, "Failed to insert consultation booking record");
      }

      return rows[0];
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      const mapped = mapDbError(err, { context: "BookingRepository.createBookingWithSlotLock" });
      if (mapped.code === ErrorCode.CONFLICT) {
        throw new AppError(ErrorCode.CONFLICT, BOOKING_ERRORS.SLOT_ALREADY_BOOKED, { cause: err });
      }
      throw mapped;
    }
  }

  /**
   * Retrieves list of already confirmed booked slot ISO strings within a time window.
   */
  async getBookedSlots(fromTimestamp?: Date, toTimestamp?: Date): Promise<string[]> {
    try {
      const conditions = [eq(consultationBookingsTable.status, BookingStatus.CONFIRMED)];

      if (fromTimestamp) {
        conditions.push(gte(consultationBookingsTable.createdAt, fromTimestamp));
      }
      if (toTimestamp) {
        conditions.push(lte(consultationBookingsTable.createdAt, toTimestamp));
      }

      const records = await this.db
        .select({ slotIso: consultationBookingsTable.slotIso })
        .from(consultationBookingsTable)
        .where(and(...conditions));

      return records.map((r) => r.slotIso);
    } catch (err) {
      throw mapDbError(err, { context: "BookingRepository.getBookedSlots" });
    }
  }
}
