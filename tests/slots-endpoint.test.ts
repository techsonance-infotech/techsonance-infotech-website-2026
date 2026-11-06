import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/slots/route";
import { getSlotsContract } from "@/lib/contracts/booking.contract";
import { callApi } from "@/lib/api/callApi";
import { toSlotsViewModel } from "@/features/booking/view-models";
import { BOOKING_TIMEZONE } from "@/lib/constants/booking.constants";

describe("GET /api/slots Endpoint & Integration Tests", () => {
  beforeEach(() => {
    // Reset rate limiter between test runs
  });

  it("should return 200 with valid contract envelope on standard GET request", async () => {
    const req = new NextRequest("http://localhost:3000/api/slots", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data).toBeDefined();
    expect(json.data.timezone).toBe(BOOKING_TIMEZONE);
    expect(Array.isArray(json.data.slots)).toBe(true);
    expect(json.data.count).toBe(json.data.slots.length);
    expect(json.data.count).toBeGreaterThan(0);

    // Verify slot item shape
    const firstSlot = json.data.slots[0];
    expect(firstSlot).toHaveProperty("id");
    expect(firstSlot).toHaveProperty("iso");
    expect(firstSlot).toHaveProperty("dateIST");
    expect(firstSlot).toHaveProperty("startIST");
    expect(firstSlot).toHaveProperty("endIST");
    expect(firstSlot).toHaveProperty("dayOfWeek");

    // Verify headers
    expect(res.headers.get("Cache-Control")).toContain("public");
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=300");
    expect(res.headers.get("x-request-id")).toBeDefined();
    expect(res.headers.get("Content-Type")).toContain("application/json");
  });

  it("should support query parameter daysAhead to filter slot range", async () => {
    const req7 = new NextRequest("http://localhost:3000/api/slots?daysAhead=3", {
      method: "GET",
    });
    const res7 = await GET(req7);
    const json7 = await res7.json();

    const req30 = new NextRequest("http://localhost:3000/api/slots?daysAhead=14", {
      method: "GET",
    });
    const res30 = await GET(req30);
    const json30 = await res30.json();

    expect(json7.ok).toBe(true);
    expect(json30.ok).toBe(true);
    expect(json7.data.count).toBeLessThan(json30.data.count);
  });

  it("should reject invalid query parameters with 422 VALIDATION and fieldErrors", async () => {
    const req = new NextRequest("http://localhost:3000/api/slots?daysAhead=999", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(422);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("VALIDATION");
    expect(json.error.fieldErrors).toBeDefined();
    expect(json.error.fieldErrors.daysAhead).toBeDefined();
  });

  it("should reject negative daysAhead with 422 VALIDATION", async () => {
    const req = new NextRequest("http://localhost:3000/api/slots?daysAhead=-5", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(422);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("VALIDATION");
  });

  it("should reject forbidden origin with 403 FORBIDDEN", async () => {
    const req = new NextRequest("http://localhost:3000/api/slots", {
      method: "GET",
      headers: {
        origin: "https://malicious-site.com",
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("should allow valid origin headers", async () => {
    const req = new NextRequest("http://localhost:3000/api/slots", {
      method: "GET",
      headers: {
        origin: "https://techsonance.co.in",
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("toSlotsViewModel should group slots by date and format labels", () => {
    const mockDto = {
      timezone: "Asia/Kolkata",
      count: 2,
      slots: [
        {
          id: "2026-11-10T04:30:00.000Z",
          iso: "2026-11-10T04:30:00.000Z",
          dateIST: "2026-11-10",
          startIST: "10:00 AM",
          endIST: "10:30 AM",
          dayOfWeek: "Tuesday",
        },
        {
          id: "2026-11-10T05:00:00.000Z",
          iso: "2026-11-10T05:00:00.000Z",
          dateIST: "2026-11-10",
          startIST: "10:30 AM",
          endIST: "11:00 AM",
          dayOfWeek: "Tuesday",
        },
      ],
    };

    const vm = toSlotsViewModel(mockDto);
    expect(vm.count).toBe(2);
    expect(vm.isEmpty).toBe(false);
    expect(vm.slotsByDate["2026-11-10"]).toHaveLength(2);
    expect(vm.slots[0].formattedTimeRange).toBe("10:00 AM - 10:30 AM");
    expect(vm.slots[0].formattedDateDisplay).toBe("Tuesday, 2026-11-10");
  });
});
