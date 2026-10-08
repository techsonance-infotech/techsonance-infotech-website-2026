import { z } from "zod";
import { nanoid } from "nanoid";
import { isValidSlot } from "@/lib/slots";
import { sendConsultationEmails } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { sanitizeInput, isAllowedOrigin } from "@/lib/text";
import { BOT_CONFIG } from "@/lib/config";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";

const bookingSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email is required").max(150),
  phone: z.string().max(40).optional(),
  company: z.string().max(100).optional(),
  projectType: z.string().min(1, "Project type is required").max(100),
  budgetRange: z.string().min(1, "Budget range is required").max(100),
  timeline: z.string().min(1, "Timeline is required").max(100),
  slotIso: z.string().min(1, "Time slot is required"),
  visitorTimezone: z.string().default("Asia/Kolkata"),
  message: z.string().max(500).optional(),
  website: z.string().optional(), // Honeypot field
  turnstileToken: z.string().optional(),
  recentMessages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(300),
      })
    )
    .max(5)
    .optional(),
});

export async function POST(req: Request) {
  // 1. Origin Check
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: "Forbidden origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. IP Rate Limit (5 bookings / 1 hour)
  const clientIp = getClientIp(req);
  const rateCheck = await checkRateLimit(`book:${clientIp}`, BOT_CONFIG.rateLimits.booking);
  if (!rateCheck.success) {
    return new Response(
      JSON.stringify({
        error: "Too many booking attempts. Please try again later or reach out via WhatsApp at +91 9173101711.",
        retryAfter: rateCheck.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rateCheck.retryAfter || 3600),
        },
      }
    );
  }

  // 3. Parse & Validate Payload
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parseResult = bookingSchema.safeParse(bodyJson);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: parseResult.error.format(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const body = parseResult.data;

  // 4. Honeypot check (bot trap)
  if (body.website && body.website.trim().length > 0) {
    // Silently succeed to fool spam bots
    return new Response(JSON.stringify({ ok: true, ref: `TS-${nanoid(8).toUpperCase()}` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 5. Cloudflare Turnstile Verification (Optional)
  try {
    const env = getEnv();
    if (env.TURNSTILE_SECRET && body.turnstileToken) {
      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET,
          response: body.turnstileToken,
          remoteip: clientIp,
        }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyJson.success) {
        return new Response(JSON.stringify({ error: "Captcha verification failed" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  } catch {
    // ignore turnstile verify error if network fails
  }

  // 6. Validate Selected Time Slot
  if (!isValidSlot(body.slotIso)) {
    return new Response(
      JSON.stringify({
        error: "Selected time slot is unavailable or invalid. Please select another slot.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 7. Generate Reference Code
  const ref = `TS-${nanoid(8).toUpperCase()}`;

  // 8. Sanitize fields and send notification emails
  const sanitizedBooking = {
    name: sanitizeInput(body.name),
    email: sanitizeInput(body.email),
    phone: body.phone ? sanitizeInput(body.phone) : undefined,
    company: body.company ? sanitizeInput(body.company) : undefined,
    projectType: sanitizeInput(body.projectType),
    budgetRange: sanitizeInput(body.budgetRange),
    timeline: sanitizeInput(body.timeline),
    slotIso: body.slotIso,
    visitorTimezone: sanitizeInput(body.visitorTimezone),
    message: body.message ? sanitizeInput(body.message) : undefined,
    recentMessages: body.recentMessages,
  };

  try {
    await sendConsultationEmails(sanitizedBooking, ref);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Failed to send booking notification email:", msg);
    return new Response(
      JSON.stringify({
        error: "We could not send your confirmation email. Please contact us directly at info@techsonance.co.in or WhatsApp +91 9173101711.",
        fallbackContact: "+91 9173101711",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify({ ok: true, ref }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
