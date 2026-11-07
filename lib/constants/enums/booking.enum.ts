export const BookingStatus = {
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];
export const BOOKING_STATUS_VALUES = Object.values(BookingStatus) as [
  BookingStatus,
  ...BookingStatus[],
];
