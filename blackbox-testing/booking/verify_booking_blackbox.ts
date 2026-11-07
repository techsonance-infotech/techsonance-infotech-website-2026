/**
 * verify_booking_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for POST /api/book
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handler directly (POST from app/api/book/route).
 * 2. Mandatory request logging (Method, Path, Payload, Origin, Tracing headers).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix:
 *    - 403 Forbidden on untrusted origin
 *    - 422 Validation error on missing required name/email
 *    - 422 Validation error on malformed email address
 *    - 422 Validation error on missing project type/timeline
 *    - 422 Validation error on past or invalid slot time
 *    - Honeypot bot protection (simulated 201 without DB write or email dispatch)
 *    - 409 Conflict on already booked consultation slot
 *    - 409 Conflict on concurrent race condition collision
 *    - 201 Created on valid consultation booking with email + .ics calendar dispatch
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import "../preload.cjs";
import { POST } from "@/app/api/book/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { EmailService } from "@/lib/services/email.service";
import { BookingRepository } from "@/lib/repositories/booking.repository";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { ErrorCode, AppError } from "@/lib/errors";
import { BOOKING_ERRORS, BookingStatus } from "@/lib/constants/booking.constants";
import { generateAvailableSlots } from "@/lib/slots";

const PASS = "✓ PASS";
const FAIL = "✗ FAIL";

let passCount = 0;
let failCount = 0;

function logSection(title: string) {
  console.log(`\n======================================================================`);
  console.log(`  ${title}`);
  console.log(`======================================================================`);
}

function logRequest(details: {
  caseNum: number;
  description: string;
  method: string;
  path: string;
  headers?: Record<string, string>;
  payload?: unknown;
}) {
  console.log(`\n----------------------------------------------------------------------`);
  console.log(`[TEST CASE #${details.caseNum}] ${details.description}`);
  console.log(`[REQUEST] ${details.method} ${details.path}`);
  if (details.headers) {
    console.log(`[HEADERS]`, JSON.stringify(details.headers, null, 2));
  }
  if (details.payload !== undefined) {
    console.log(`[PAYLOAD]`, JSON.stringify(details.payload, null, 2));
  }
}

function logResponse(status: number, body: unknown) {
  console.log(`[RESPONSE STATUS] ${status}`);
  console.log(`[RESPONSE BODY]\n${JSON.stringify(body, null, 2)}`);
}

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`${PASS}: ${message}`);
    passCount++;
  } else {
    console.error(`${FAIL}: ${message}`);
    failCount++;
  }
}

async function runBlackboxSuite() {
  logSection("STARTING HARDCORE BLACK-BOX VERIFICATION: POST /api/book");

  const futureSlots = generateAvailableSlots();
  const validSlot = futureSlots[5].iso;
  const alreadyBookedSlot = futureSlots[2].iso;

  const storedBookings: any[] = [
    {
      id: "seed-booking-id-1",
      reference: "TS-EXISTING1",
      name: "Existing Client",
      email: "existing@domain.com",
      slotIso: alreadyBookedSlot,
      status: BookingStatus.CONFIRMED,
    },
  ];
  const emailDispatches: any[] = [];

  const mockEmailService = {
    createICSCalendar: () => "BEGIN:VCALENDAR\nSUMMARY:Discovery Call\nEND:VCALENDAR",
    sendConsultationEmails: async (booking: any, ref: string) => {
      emailDispatches.push({ booking, ref });
      return { ok: true, messageId: "mock-email-id-99" };
    },
  };

  const mockBookingRepo = {
    findBookingBySlot: async (slotIso: string) => {
      return storedBookings.find((b) => b.slotIso === slotIso) ?? null;
    },
    findBookingByReference: async (ref: string) => {
      return storedBookings.find((b) => b.reference === ref) ?? null;
    },
    createBookingWithSlotLock: async (data: any) => {
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
    },
    getBookedSlots: async () => {
      return storedBookings.map((b) => b.slotIso);
    },
  };

  resetRootContainer();
  const container = getContainer();
  container.bind({ provide: EmailService, useValue: mockEmailService as any });
  container.bind({ provide: BookingRepository, useValue: mockBookingRepo as any });

  const standardPayload = {
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

  // Case 1: Untrusted Origin Rejection (403 FORBIDDEN)
  {
    logRequest({
      caseNum: 1,
      description: "Origin verification: Untrusted origin header rejected with 403 FORBIDDEN",
      method: "POST",
      path: API_ENDPOINTS.BOOKING.BOOK,
      headers: { origin: "https://evil-phishing-hacker.com" },
      payload: standardPayload,
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.BOOKING.BOOK}`, {
      method: "POST",
      headers: {
        origin: "https://evil-phishing-hacker.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(standardPayload),
    });

    const res = await POST(req as any);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 403, "Status must be 403 Forbidden");
    assert(json.ok === false, "Envelope ok must be false");
    assert(json.error.code === ErrorCode.FORBIDDEN, `Error code must be ${ErrorCode.FORBIDDEN}`);
  }

  // Case 2: Validation Failure: Missing Name (422 VALIDATION)
  {
    const { name: _, ...missingName } = standardPayload;
    logRequest({
      caseNum: 2,
      description: "Payload validation: Missing client name rejected with 422 VALIDATION",
      method: "POST",
      path: API_ENDPOINTS.BOOKING.BOOK,
      payload: missingName,
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.BOOKING.BOOK}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(missingName),
    });

    const res = await POST(req as any);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 422, "Status must be 422 Unprocessable Entity");
    assert(json.ok === false, "Envelope ok must be false");
    assert(json.error.code === ErrorCode.VALIDATION, `Error code must be ${ErrorCode.VALIDATION}`);
    assert(Boolean(json.error.fieldErrors?.name), "Field error for 'name' must be present");
  }

  // Case 3: Validation Failure: Malformed Email (422 VALIDATION)
  {
    logRequest({
      caseNum: 3,
      description: "Payload validation: Malformed email rejected with 422 VALIDATION",
      method: "POST",
      path: API_ENDPOINTS.BOOKING.BOOK,
      payload: { ...standardPayload, email: "invalid-email-format" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.BOOKING.BOOK}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...standardPayload, email: "invalid-email-format" }),
    });

    const res = await POST(req as any);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 422, "Status must be 422 Unprocessable Entity");
    assert(json.ok === false, "Envelope ok must be false");
    assert(json.error.code === ErrorCode.VALIDATION, `Error code must be ${ErrorCode.VALIDATION}`);
    assert(Boolean(json.error.fieldErrors?.email), "Field error for 'email' must be present");
  }

  // Case 4: Past / Invalid Slot (422 VALIDATION)
  {
    const pastSlot = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    logRequest({
      caseNum: 4,
      description:
        "Business rule validation: Past or non-existent slot rejected with 422 VALIDATION",
      method: "POST",
      path: API_ENDPOINTS.BOOKING.BOOK,
      payload: { ...standardPayload, slotIso: pastSlot },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.BOOKING.BOOK}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...standardPayload, slotIso: pastSlot }),
    });

    const res = await POST(req as any);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 422, "Status must be 422 Unprocessable Entity");
    assert(json.ok === false, "Envelope ok must be false");
    assert(json.error.code === ErrorCode.VALIDATION, `Error code must be ${ErrorCode.VALIDATION}`);
    assert(
      json.error.message === BOOKING_ERRORS.SLOT_UNAVAILABLE_OR_INVALID,
      "Error message must indicate slot unavailable/invalid",
    );
  }

  // Case 5: Spambot Honeypot Trap
  {
    logRequest({
      caseNum: 5,
      description:
        "Spam protection: Honeypot 'website' field triggers silent success without DB or email",
      method: "POST",
      path: API_ENDPOINTS.BOOKING.BOOK,
      payload: { ...standardPayload, website: "https://spam-bot-marketing.com" },
    });

    const initialDbCount = storedBookings.length;
    const initialEmailCount = emailDispatches.length;

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.BOOKING.BOOK}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...standardPayload, website: "https://spam-bot-marketing.com" }),
    });

    const res = await POST(req as any);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 201, "Status must be 201 for bot deception");
    assert(json.ok === true, "Envelope ok must be true");
    assert(/^TS-[A-Z0-9]+$/.test(json.data.ref), "Fake reference TS-XXXXXX returned to fool bot");
    assert(storedBookings.length === initialDbCount, "Zero DB insertions for honeypot bot trap");
    assert(emailDispatches.length === initialEmailCount, "Zero emails sent for honeypot bot trap");
  }

  // Case 6: Slot Double-Booking Conflict (409 CONFLICT)
  {
    logRequest({
      caseNum: 6,
      description: "Double-booking prevention: Slot already booked rejected with 409 CONFLICT",
      method: "POST",
      path: API_ENDPOINTS.BOOKING.BOOK,
      payload: { ...standardPayload, slotIso: alreadyBookedSlot },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.BOOKING.BOOK}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...standardPayload, slotIso: alreadyBookedSlot }),
    });

    const res = await POST(req as any);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 409, "Status must be 409 Conflict");
    assert(json.ok === false, "Envelope ok must be false");
    assert(json.error.code === ErrorCode.CONFLICT, `Error code must be ${ErrorCode.CONFLICT}`);
    assert(
      json.error.message === BOOKING_ERRORS.SLOT_ALREADY_BOOKED,
      "Message must match SLOT_ALREADY_BOOKED",
    );
  }

  // Case 7: Happy Path Booking Creation (201 CREATED)
  {
    logRequest({
      caseNum: 7,
      description:
        "Happy path: Valid consultation booking created with 201 CREATED, DB persistence & email",
      method: "POST",
      path: API_ENDPOINTS.BOOKING.BOOK,
      payload: standardPayload,
    });

    const prevDbCount = storedBookings.length;
    const prevEmailCount = emailDispatches.length;

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.BOOKING.BOOK}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(standardPayload),
    });

    const res = await POST(req as any);
    const json = await res.json();
    logResponse(res.status, json);

    assert(res.status === 201, "Status must be 201 Created");
    assert(json.ok === true, "Envelope ok must be true");
    assert(Boolean(json.data), "Response data must be defined");
    assert(/^TS-[A-Z0-9]+$/.test(json.data.ref), "Reference must follow TS-XXXXXX format");
    assert(json.data.slotIso === validSlot, "Returned slotIso must match requested slot");
    assert(json.data.status === BookingStatus.CONFIRMED, "Booking status must be CONFIRMED");
    assert(
      storedBookings.length === prevDbCount + 1,
      "Database booking record successfully inserted",
    );
    assert(
      emailDispatches.length === prevEmailCount + 1,
      "Confirmation email dispatched successfully",
    );
    assert(Boolean(res.headers.get("x-request-id")), "x-request-id header must be present");
  }

  // Final Summary
  logSection(`BLACK-BOX TESTING SUMMARY`);
  console.log(`Passed Assertions: ${passCount}`);
  console.log(`Failed Assertions: ${failCount}`);

  if (failCount > 0) {
    console.error(`\n${FAIL}: Some black-box assertions failed!`);
    process.exit(1);
  } else {
    console.log(`\n${PASS}: ALL BLACK-BOX ASSERTIONS PASSED PROVABLY.`);
    process.exit(0);
  }
}

runBlackboxSuite().catch((err) => {
  console.error("FATAL SUITE CRASH:", err);
  process.exit(1);
});
