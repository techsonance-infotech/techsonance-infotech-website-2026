export enum BookingStatus {
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

export const BOOKING_STATUS_VALUES = Object.values(BookingStatus) as [
  BookingStatus,
  ...BookingStatus[],
];
