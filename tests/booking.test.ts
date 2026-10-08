import { describe, it, expect } from "vitest";
import { generateAvailableSlots, isValidSlot } from "../lib/slots";
import { createICSCalendar, type BookingPayload } from "../lib/email";
import { checkRateLimit } from "../lib/ratelimit";

describe("Booking Slots and Validation Tests", () => {
  it("should generate valid 30-minute consultation slots in IST", () => {
    const slots = generateAvailableSlots();
    expect(slots.length).toBeGreaterThan(10);

    const firstSlot = slots[0];
    expect(firstSlot.id).toBeDefined();
    expect(firstSlot.iso).toBeDefined();
    expect(firstSlot.dateIST).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(firstSlot.startIST).toMatch(/\b(AM|PM)\b/);
    expect(firstSlot.endIST).toMatch(/\b(AM|PM)\b/);
    expect(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]).toContain(
      firstSlot.dayOfWeek
    );
  });

  it("should validate that future business hour slots are valid", () => {
    const slots = generateAvailableSlots();
    const testSlot = slots[5];
    expect(isValidSlot(testSlot.iso)).toBe(true);
  });

  it("should reject slots in the past or within 12h notice", () => {
    const pastSlot = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    expect(isValidSlot(pastSlot)).toBe(false);

    const tooSoonSlot = new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString();
    expect(isValidSlot(tooSoonSlot)).toBe(false);
  });

  it("should reject invalid ISO date strings", () => {
    expect(isValidSlot("not-a-date")).toBe(false);
  });

  it("should generate a valid .ics calendar invite string", () => {
    const slots = generateAvailableSlots();
    const slotIso = slots[0].iso;

    const payload: BookingPayload = {
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "+1234567890",
      company: "Acme Corp",
      projectType: "Mobile App (Flutter)",
      budgetRange: "$10k - $25k",
      timeline: "1 - 2 Months",
      slotIso,
      visitorTimezone: "America/New_York",
      message: "Looking for Flutter mobile app development.",
    };

    const icsString = createICSCalendar(payload, "TS-TEST1234");
    const unfoldedIcs = icsString.replace(/\r?\n[ \t]/g, "");
    expect(icsString).toContain("BEGIN:VCALENDAR");
    expect(icsString).toContain("BEGIN:VEVENT");
    expect(unfoldedIcs).toContain("TS-TEST1234");
    expect(unfoldedIcs).toContain("TechSonance");
    expect(unfoldedIcs).toContain("Jane Doe");
    expect(icsString).toContain("END:VCALENDAR");
  });

  it("should enforce in-memory token bucket rate limits", async () => {
    const key = "test-rate-limit-ip";
    const config = { maxRequests: 3, windowSeconds: 60 };

    // Request 1, 2, 3 should succeed
    const r1 = await checkRateLimit(key, config);
    const r2 = await checkRateLimit(key, config);
    const r3 = await checkRateLimit(key, config);

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r3.success).toBe(true);

    // Request 4 should be rate limited
    const r4 = await checkRateLimit(key, config);
    expect(r4.success).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.retryAfter).toBeGreaterThan(0);
  });
});
