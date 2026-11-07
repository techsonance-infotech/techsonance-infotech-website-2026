# Integration Guide: `POST /api/book`

This document outlines the architecture, security invariants, error handling, contract specification, and frontend integration details for the public consultation appointment booking endpoint (`POST /api/book`).

---

## 1. Architectural Overview (3-Tier Layering)

The consultation booking engine strictly complies with the project's 3-Tier Layer Architecture and Needle DI pattern:

```
┌────────────────────────────────────────────────────────┐
│  Client (Chatbot / BookingCard / Consult Modal)        │
└───────────────────────────┬────────────────────────────┘
                            │ POST /api/book (JSON)
                            ▼
┌────────────────────────────────────────────────────────┐
│  Controller: app/api/book/route.ts                     │
│  - Wrapped in handleRoute(createBookingContract)        │
│  - Enforces Origin, IP Rate Limiting, Request Tracing  │
│  - Strictly parses inbound payload via Zod 4           │
└───────────────────────────┬────────────────────────────┘
                            │ createBooking(payload)
                            ▼
┌────────────────────────────────────────────────────────┐
│  Service: lib/services/booking.service.ts              │
│  - Traps spambots via honeypot "website" field         │
│  - Optional Turnstile verification                     │
│  - Validates slot timing (IST, business hours, notice) │
│  - Generates human-friendly reference: TS-XXXXXXXX     │
│  - Dispatches calendar invite (.ics) & lead emails     │
└───────────────────────────┬────────────────────────────┘
                            │ createBookingWithSlotLock()
                            ▼
┌────────────────────────────────────────────────────────┐
│  Repository: lib/repositories/booking.repository.ts    │
│  - Drizzle ORM on table: ts_web_consultation_bookings  │
│  - Unique Slot Constraint:                             │
│    unique("ts_web_consultation_bookings_slot_uq")      │
│  - Atomically blocks double-booking race conditions    │
│  - Maps SQLSTATE 23505 to 409 CONFLICT via mapDbError   │
└────────────────────────────────────────────────────────┘
```

---

## 2. API Contract Specification

- **Method**: `POST`
- **Path**: `/api/book`
- **Authentication**: `none` (Public endpoint)
- **Status on Success**: `201 Created`
- **Rate Limit**: 5 requests per hour per IP (plus standard 60 req/min edge protection)

### Request Headers
| Header | Value | Description |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | Required |
| `origin` | `https://techsonance.co.in` or local dev | Verified via `isAllowedOrigin` |
| `x-request-id` | `uuid` (optional) | Echoed for distributed tracing |

### Request Payload (`createBookingSchema`)
```typescript
{
  name: string;             // 1-100 characters (trimmed)
  email: string;            // Valid email, max 150 characters
  phone?: string;           // Optional, max 40 characters
  company?: string;         // Optional, max 100 characters
  projectType: string;      // 1-100 characters (e.g., "Web Application", "AI Chatbot")
  budgetRange: string;      // 1-100 characters (e.g., "₹6L - ₹15L")
  timeline: string;         // 1-100 characters (e.g., "Within 1 Month")
  slotIso: string;          // ISO 8601 string in future business hours (12h notice required)
  visitorTimezone: string;  // Defaults to "Asia/Kolkata" (e.g., "America/New_York")
  message?: string;         // Optional additional requirements, max 500 characters
  website?: string;         // Honeypot field (must be left empty by legitimate users)
  turnstileToken?: string;  // Optional Cloudflare Turnstile token
  recentMessages?: Array<{  // Optional recent chatbot conversation context (max 5)
    role: "user" | "assistant";
    content: string;
  }>;
}
```

### Response Envelope (`envelopeSchema`)
```typescript
// 201 Created
{
  "ok": true,
  "data": {
    "ref": "TS-UDXTN9NV",
    "slotIso": "2026-11-10T07:00:00.000Z",
    "status": "CONFIRMED"
  }
}
```

### Error Responses
```typescript
// Standard Error Envelope
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN" | "VALIDATION" | "CONFLICT" | "RATE_LIMITED" | "INTERNAL",
    "message": string,
    "requestId": string,
    "fieldErrors"?: Record<string, string[]>
  }
}
```

---

## 3. Security, Anti-Spam & Concurrency Controls

1. **Origin Verification (`403 FORBIDDEN`)**:
   Enforced at the route boundary. Unauthorized third-party domains attempting cross-origin booking submissions are immediately blocked.
2. **Honeypot Trap**:
   The `website` field is rendered hidden in UI forms. If a spambot automatically populates this field, the server returns an immediate `201 Created` with a simulated reference code, completely bypassing database writes and preventing email spam attacks.
3. **Turnstile Captcha Verification**:
   When `TURNSTILE_SECRET` is configured in server environment, the client-provided `turnstileToken` is verified against Cloudflare Siteverify.
4. **Double-Booking Race Condition Prevention (`409 CONFLICT`)**:
   - Application-level check: queries active bookings for the requested `slotIso`.
   - Database-level atomic protection: `ts_web_consultation_bookings` enforces `unique("ts_web_consultation_bookings_slot_uq").on(table.slotIso)`.
   - Concurrent insert collisions generate Postgres error `23505`, which `mapDbError` safely maps to `AppError(ErrorCode.CONFLICT, "This consultation slot has already been booked. Please select another available time slot.")`.

---

## 4. Frontend Integration Guide

The frontend chatbot card (`components/chat/BookingCard.tsx`) integrates directly with `POST /api/book`:

```typescript
import { callApi } from "@/lib/api/callApi";
import { createBookingContract } from "@/lib/contracts/booking.contract";

export async function submitConsultationBooking(formData: BookingFormData) {
  const result = await callApi(createBookingContract, {
    body: {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      company: formData.company || undefined,
      projectType: formData.projectType,
      budgetRange: formData.budgetRange,
      timeline: formData.timeline,
      slotIso: formData.selectedSlotIso,
      visitorTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
      message: formData.message || undefined,
      website: formData.honeypot || undefined,
      recentMessages: formData.recentMessages?.slice(-5),
    },
  });

  if (!result.ok) {
    if (result.error.code === "CONFLICT") {
      // Slot was taken by another user during the form filling session
      alert("This slot was just booked by another visitor. Please choose another slot.");
      return null;
    }
    throw new Error(result.error.message);
  }

  // Booking confirmed
  const { ref, slotIso, status } = result.data;
  return { ref, slotIso, status };
}
```

---

## 5. Verification & Testing

The endpoint has been validated through both automated test layers:
- Unit & Blackbox Suite: `tests/booking-blackbox.test.ts` (8 integration tests covering 403, 422, honeypot, 409 conflict, and 201 success).
- Standalone Runner: `blackbox-testing/booking/verify_booking_blackbox.ts` (33 assertions passing provably with full request/response logging).
