import { defineContract, noParams, noBody } from "@/lib/contracts/define";
import { slotsQuerySchema, slotsResponseSchema } from "@/lib/validations/booking.schema";
import { BOOKING_SLOTS_CACHE_CONTROL } from "@/lib/constants/booking.constants";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

export const getSlotsContract = defineContract({
  method: "GET",
  path: API_ENDPOINTS.BOOKING.SLOTS,
  auth: "none",
  params: noParams,
  query: slotsQuerySchema,
  body: noBody,
  response: slotsResponseSchema,
  status: 200,
  cacheControl: BOOKING_SLOTS_CACHE_CONTROL,
});
