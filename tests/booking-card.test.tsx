import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { BookingCard } from "@/components/chat/BookingCard";

// Mock dependencies
vi.mock("@/lib/chat/storage", () => ({
  getVisitorProfile: vi.fn().mockResolvedValue(null),
  saveVisitorProfile: vi.fn().mockResolvedValue(undefined),
  saveBookingCopy: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/analytics", () => ({
  trackBookingFormSubmit: vi.fn(),
}));

vi.mock("@/features/booking/hooks/useBookingSlots", () => ({
  useBookingSlots: vi.fn(() => ({
    slots: [
      {
        id: "2026-11-10T04:30:00.000Z",
        iso: "2026-11-10T04:30:00.000Z",
        dateIST: "2026-11-10",
        startIST: "10:00 AM",
        endIST: "10:30 AM",
        dayOfWeek: "Tuesday",
        formattedTimeRange: "10:00 AM - 10:30 AM",
        formattedDateDisplay: "Tuesday, 2026-11-10",
      },
    ],
    slotsByDate: {
      "2026-11-10": [
        {
          id: "2026-11-10T04:30:00.000Z",
          iso: "2026-11-10T04:30:00.000Z",
          dateIST: "2026-11-10",
          startIST: "10:00 AM",
          endIST: "10:30 AM",
          dayOfWeek: "Tuesday",
          formattedTimeRange: "10:00 AM - 10:30 AM",
          formattedDateDisplay: "Tuesday, 2026-11-10",
        },
      ],
    },
    timezone: "Asia/Kolkata",
    count: 1,
    isEmpty: false,
    isLoading: false,
    errorMessage: null,
    refetch: vi.fn(),
  })),
}));

describe("BookingCard Component (React Hook Form & Slots Integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with consultation form fields", () => {
    const html = renderToString(<BookingCard />);

    expect(html).toContain("Book Free 30-Min Consultation");
    expect(html).toContain("Your Name");
    expect(html).toContain("Work Email");
    expect(html).toContain("Phone / WhatsApp");
    expect(html).toContain("Project Type");
    expect(html).toContain("Target Budget");
    expect(html).toContain("Select Preferred Time Slot");
    expect(html).toContain("Confirm Free Consultation");
  });

  it("renders available consultation slot options populated from useBookingSlots", () => {
    const html = renderToString(<BookingCard />);

    expect(html).toContain("Tuesday, 2026-11-10");
    expect(html).toMatch(/10:00 AM.*IST/);
  });
});
