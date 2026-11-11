import "server-only";
import { handleRoute } from "@/lib/server/route";
import { getSlotsContract } from "@/lib/contracts/booking.contract";
import { getContainer } from "@/lib/di/container";
import { BookingService } from "@/lib/services/booking.service";
import { BOOKING_TIMEZONE } from "@/lib/constants/booking.constants";

export const runtime = "nodejs";

export const GET = handleRoute(getSlotsContract, async ({ query }) => {
  const bookingService = getContainer().get(BookingService);
  const slots = await bookingService.getAvailableSlots(query.fromTimestamp, query.daysAhead);

  return {
    slots,
    timezone: BOOKING_TIMEZONE,
    count: slots.length,
  };
});
