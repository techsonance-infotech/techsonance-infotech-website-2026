import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/book/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { BookingService } from "@/lib/services/booking.service";
import { EmailService } from "@/lib/services/email.service";
import { BookingRepository } from "@/lib/repositories/booking.repository";
import { generateAvailableSlots } from "@/lib/slots";
import { AppError, ErrorCode } from "@/lib/errors";
import { BOOKING_ERRORS, BookingStatus } from "@/lib/constants/booking.constants";

describe("POST /api/book — Consultation Booking Engine Black Box Tests", () => {
  let mockEmailService: any;
  let mockBookingRepo: any;
  let emailSentCount = 0;
  let storedBookings: any[] = [];

  const futureSlots = generateAvailableSlots();
  const validSlot = futureSlots[5].iso;
  const alreadyBookedSlot = futureSlots[2].iso;

  const validPayload = {
    name: "Dr. Alexander Wright",
    email: "alexander.wright@techinnovations.com",
    phone: "+91 9876543210",
    company: "Tech Innovations Global",
    projectType: "AI Chatbot & Workflow Automation",
    budgetRange: "₹6L - ₹15L ($8k - $20k)",
    timeline: "Within 1 Month",
    slotIso: validSlot,
    visitorTimezone: "Asia/Kolkata",
    message: "Seeking RAG architecture and autonomous agent integration.",
  };

  beforeEach(() => {
    resetRootContainer();
    emailSentCount = 0;
    storedBookings = [
      {
        id: "existing-booking-uuid-1",
        reference: "TS-EXISTING",
        name: "Prior Booker",
        email: "prior@example.com",
        slotIso: alreadyBookedSlot,
        status: BookingStatus.CONFIRMED,
      },
    ];

    mockEmailService = {
      createICSCalendar: vi.fn().mockReturnValue("BEGIN:VCALENDAR\nSUMMARY:Discovery Call\nEND:VCALENDAR"),
      sendConsultationEmails: vi.fn().mockImplementation(async () => {
        emailSentCount++;
        return { ok: true, messageId: "msg-test-12345" };
      }),
    };

    mockBookingRepo = {
      findBookingBySlot: vi.fn().mockImplementation(async (slotIso: string) => {
        return storedBookings.find((b) => b.slotIso === slotIso) ?? null;
      }),
      findBookingByReference: vi.fn().mockImplementation(async (ref: string) => {
        return storedBookings.find((b) => b.reference === ref) ?? null;
      }),
      createBookingWithSlotLock: vi.fn().mockImplementation(async (data: any) => {
        if (storedBookings.some((b) => b.slotIso === data.slotIso)) {
          throw new AppError(ErrorCode.CONFLICT, BOOKING_ERRORS.SLOT_ALREADY_BOOKED);
        }
        const created = {
          id: `booking-${Date.now()}`,
          reference: data.reference,
          name: data.name,
          email: data.email,
          phone: data.phone,
          company: data.company,
          projectType: data.projectType,
          budgetRange: data.budgetRange,
          timeline: data.timeline,
          slotIso: data.slotIso,
          visitorTimezone: data.visitorTimezone,
          message: data.message,
          status: BookingStatus.CONFIRMED,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        storedBookings.push(created);
        return created;
      }),
      getBookedSlots: vi.fn().mockImplementation(async () => {
        return storedBookings.map((b) => b.slotIso);
      }),
    };

    const container = getContainer();
    container.bind({ provide: EmailService, useValue: mockEmailService });
    container.bind({ provide: BookingRepository, useValue: mockBookingRepo });
  });

  it("1. Rejects untrusted origin with 403 FORBIDDEN", async () => {
    const req = new Request("http://localhost:3000/api/book", {
      method: "POST",
      headers: {
        origin: "https://malicious-phishing-site.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(res.headers.get("x-request-id")).toBeDefined();
  });

  it("2. Rejects missing required name with 422 VALIDATION", async () => {
    const { name: _, ...missingName } = validPayload;
    const req = new Request("http://localhost:3000/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(missingName),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(422);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.fieldErrors).toBeDefined();
    expect(json.error.fieldErrors.name).toBeDefined();
  });

  it("3. Rejects invalid email address with 422 VALIDATION", async () => {
    const req = new Request("http://localhost:3000/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validPayload,
        email: "not-an-email",
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(422);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.fieldErrors.email).toBeDefined();
  });

  it("4. Rejects past or invalid slot time with 422 VALIDATION", async () => {
    const pastSlot = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const req = new Request("http://localhost:3000/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validPayload,
        slotIso: pastSlot,
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(422);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.message).toBe(BOOKING_ERRORS.SLOT_UNAVAILABLE_OR_INVALID);
  });

  it("5. Traps spambots via honeypot field without DB write or email dispatch", async () => {
    const req = new Request("http://localhost:3000/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validPayload,
        website: "https://spam-marketing-bot.example", // Honeypot filled!
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.ref).toMatch(/^TS-[A-Z0-9]+$/);
    expect(json.data.status).toBe(BookingStatus.CONFIRMED);

    // Spambot trapped: No DB insertion and no emails dispatched!
    expect(mockBookingRepo.createBookingWithSlotLock).not.toHaveBeenCalled();
    expect(mockEmailService.sendConsultationEmails).not.toHaveBeenCalled();
    expect(emailSentCount).toBe(0);
  });

  it("6. Rejects already booked slot with 409 CONFLICT", async () => {
    const req = new Request("http://localhost:3000/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validPayload,
        slotIso: alreadyBookedSlot,
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.CONFLICT);
    expect(json.error.message).toBe(BOOKING_ERRORS.SLOT_ALREADY_BOOKED);
    expect(emailSentCount).toBe(0);
  });

  it("7. Successfully creates booking with 201 CREATED, DB persistence & email dispatch", async () => {
    const req = new Request("http://localhost:3000/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data).toBeDefined();
    expect(json.data.ref).toMatch(/^TS-[A-Z0-9]+$/);
    expect(json.data.slotIso).toBe(validSlot);
    expect(json.data.status).toBe(BookingStatus.CONFIRMED);

    // Verify DB insertion occurred
    expect(mockBookingRepo.createBookingWithSlotLock).toHaveBeenCalledTimes(1);
    expect(storedBookings.length).toBe(2);

    // Verify email notification occurred
    expect(mockEmailService.sendConsultationEmails).toHaveBeenCalledTimes(1);
    expect(emailSentCount).toBe(1);

    // Verify tracing header
    expect(res.headers.get("x-request-id")).toBeDefined();
  });

  it("8. Prevents concurrent race condition with unique slot constraint 409 CONFLICT", async () => {
    // Simulate unique constraint collision from concurrent database transaction
    mockBookingRepo.createBookingWithSlotLock.mockRejectedValueOnce(
      new AppError(ErrorCode.CONFLICT, BOOKING_ERRORS.SLOT_ALREADY_BOOKED),
    );

    const req = new Request("http://localhost:3000/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.CONFLICT);
    expect(json.error.message).toBe(BOOKING_ERRORS.SLOT_ALREADY_BOOKED);
  });
});
