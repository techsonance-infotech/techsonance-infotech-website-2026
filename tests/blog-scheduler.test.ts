import { describe, it, expect, vi } from "vitest";
import { BlogSchedulerService } from "@/lib/services/blog-scheduler.service";

describe("BlogSchedulerService — Randomized Daytime 2-3 Blogs/Week Schedule", () => {
  const scheduler = new BlogSchedulerService();

  it("generates an ISO week key reliably", () => {
    const date = new Date("2026-11-09T14:00:00Z");
    const weekKey = scheduler.getIsoWeekKey(date);
    expect(weekKey).toMatch(/^2026-W\d{2}$/);
  });

  it("generates a weekly schedule with 2 or 3 blogs per week in daytime slots (09:00 - 18:00)", () => {
    const plan = scheduler.getWeeklyPlan("2026-W46");

    // Must be either 2 or 3 blogs per week
    expect([2, 3]).toContain(plan.targetWeeklyCount);
    expect(plan.slots.length).toBe(plan.targetWeeklyCount);

    // Each slot must be during daytime (09:00 - 17:59)
    for (const slot of plan.slots) {
      expect(slot.targetHour).toBeGreaterThanOrEqual(9);
      expect(slot.targetHour).toBeLessThan(18);
      expect(slot.targetMinute).toBeGreaterThanOrEqual(0);
      expect(slot.targetMinute).toBeLessThan(60);
      expect(slot.targetTimeFormatted).toMatch(/^0[9]|1[0-7]:\d{2}$/);
    }

    // Days must be distinct
    const dayIndices = plan.slots.map((s) => s.dayIndex);
    const uniqueDays = new Set(dayIndices);
    expect(uniqueDays.size).toBe(plan.slots.length);
  });

  it("rejects execution outside daytime hours (e.g. at 03:00 AM at night)", () => {
    const nightTime = new Date("2026-11-10T03:00:00"); // 3 AM
    const res = scheduler.evaluateSchedule(0, 0, { now: nightTime });

    expect(res.shouldGenerate).toBe(false);
    expect(res.isDaytime).toBe(false);
    expect(res.reason).toContain("Outside daytime publishing window");
  });

  it("skips execution when the weekly target of 2 or 3 blogs has already been reached", () => {
    const daytime = new Date("2026-11-10T14:00:00"); // 2 PM
    // Weekly target will be 2 or 3; passing 3 means target is reached
    const res = scheduler.evaluateSchedule(3, 0, { now: daytime, forceDaytime: true });

    expect(res.shouldGenerate).toBe(false);
    expect(res.reason).toContain("Weekly randomized publishing target");
  });

  it("skips execution when today is not an allocated publishing day for the week", () => {
    const plan = scheduler.getWeeklyPlan("2026-W46");
    const activeDayIndices = new Set(plan.slots.map((s) => s.dayIndex));

    // Find a day of week NOT in active slots
    let nonActiveDay = 0;
    for (let d = 0; d < 7; d++) {
      if (!activeDayIndices.has(d)) {
        nonActiveDay = d;
        break;
      }
    }

    // Create a date corresponding to nonActiveDay
    const testDate = new Date("2026-11-09T14:00:00");
    const diff = nonActiveDay - testDate.getDay();
    testDate.setDate(testDate.getDate() + diff);
    testDate.setHours(14, 0, 0, 0);

    const res = scheduler.evaluateSchedule(0, 0, { now: testDate, forceDaytime: true });
    expect(res.shouldGenerate).toBe(false);
    expect(res.reason).toContain("not an allocated publishing day");
  });

  it("waits when today is an allocated day but current time is before the daytime trigger", () => {
    const plan = scheduler.getWeeklyPlan("2026-W46");
    const firstSlot = plan.slots[0];

    // Set time on that slot's day, but 1 hour before trigger
    const testDate = new Date("2026-11-09T00:00:00");
    const diff = firstSlot.dayIndex - testDate.getDay();
    testDate.setDate(testDate.getDate() + diff);
    testDate.setHours(Math.max(9, firstSlot.targetHour - 1), 0, 0, 0);

    const res = scheduler.evaluateSchedule(0, 0, { now: testDate, forceDaytime: true });
    expect(res.shouldGenerate).toBe(false);
    expect(res.reason).toContain("Waiting: Today's randomized daytime trigger");
  });

  it("triggers execution when current time is at or past today's randomized daytime slot", () => {
    const plan = scheduler.getWeeklyPlan("2026-W46");
    const firstSlot = plan.slots[0];

    // Set time on that slot's day, 5 minutes AFTER the target time
    const testDate = new Date("2026-11-09T00:00:00");
    const diff = firstSlot.dayIndex - testDate.getDay();
    testDate.setDate(testDate.getDate() + diff);
    testDate.setHours(firstSlot.targetHour, firstSlot.targetMinute + 5, 0, 0);

    const res = scheduler.evaluateSchedule(0, 0, { now: testDate, forceDaytime: true });
    expect(res.shouldGenerate).toBe(true);
    expect(res.reason).toContain("Triggered: Matched randomized daytime slot");
    expect(res.todaySlot?.targetTimeFormatted).toBe(firstSlot.targetTimeFormatted);
  });
});
