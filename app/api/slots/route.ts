import { getContainer } from "@/lib/di/container";
import { BookingService } from "@/lib/services/booking.service";
import { isAllowedOrigin } from "@/lib/text";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: "Forbidden origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const bookingService = getContainer().get(BookingService);
  const slots = bookingService.getAvailableSlots();

  return new Response(
    JSON.stringify({
      slots,
      timezone: "Asia/Kolkata",
      count: slots.length,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
