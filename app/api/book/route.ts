import "server-only";
import { handleRoute } from "@/lib/server/route";
import { createBookingContract } from "@/lib/contracts/booking.contract";
import { getContainer } from "@/lib/di/container";
import { BookingService } from "@/lib/services/booking.service";

export const runtime = "nodejs";

export const POST = handleRoute(createBookingContract, async ({ body }) => {
  const container = getContainer();
  const bookingService = container.get(BookingService);
  return await bookingService.createBooking(body);
});
