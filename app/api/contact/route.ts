import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { RateLimiterService } from "@/lib/services/ratelimit.service";
import { ContactInquiryService } from "@/lib/services/contact-inquiry.service";
import {
  ContactInquiryType,
  CONTACT_ERRORS,
} from "@/lib/constants/contact.constants";

export async function POST(request: Request) {
  try {
    const container = getContainer();
    const rateLimiter = container.get(RateLimiterService);
    const inquiryService = container.get(ContactInquiryService);

    const clientIp = rateLimiter.getClientIp(request);
    const rateLimitResult = await rateLimiter.check(`contact:${clientIp}`, {
      maxRequests: 5,
      windowSeconds: 15 * 60,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again after 15 minutes." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.retryAfter || 900),
          },
        },
      );
    }

    const body = await request.json();

    // 1. Honeypot check (anti-spam)
    if (body.website || body.honeypot) {
      console.warn(`Honeypot triggered from IP ${clientIp}. Ignoring spam submission.`);
      return NextResponse.json({ success: true, message: "Request received." });
    }

    // 2. Server-side validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isContactPage = body.firstName !== undefined || body.lastName !== undefined;

    if (isContactPage) {
      const { firstName, lastName, email, countryCode, phone, message } = body;

      if (
        !firstName?.trim() ||
        !lastName?.trim() ||
        !email?.trim() ||
        !phone?.trim() ||
        !message?.trim()
      ) {
        return NextResponse.json({ error: "All required fields must be filled." }, { status: 400 });
      }

      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
      }

      const cleanPhone = phone.replace(/\D/g, "");
      if (countryCode === "+91") {
        if (cleanPhone.length !== 10) {
          return NextResponse.json(
            { error: "Please enter a valid 10-digit Indian phone number." },
            { status: 400 },
          );
        }
      } else {
        if (cleanPhone.length < 7) {
          return NextResponse.json(
            { error: "Please enter a valid phone number." },
            { status: 400 },
          );
        }
      }

      const wordsCount = message.trim().split(/\s+/).filter(Boolean).length;
      if (wordsCount > 1000) {
        return NextResponse.json({ error: "Message cannot exceed 1000 words." }, { status: 400 });
      }
    } else {
      // Scoping Form verification
      const { name, email, message } = body;

      if (!name?.trim() || !email?.trim() || !message?.trim()) {
        return NextResponse.json({ error: "All required fields must be filled." }, { status: 400 });
      }

      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
      }

      const wordsCount = message.trim().split(/\s+/).filter(Boolean).length;
      if (wordsCount > 1000) {
        return NextResponse.json({ error: "Message cannot exceed 1000 words." }, { status: 400 });
      }
    }

    const senderName = isContactPage
      ? `${body.firstName} ${body.lastName}`.trim()
      : body.name.trim();

    const result = await inquiryService.submitInquiry({
      type: isContactPage ? ContactInquiryType.CONTACT_PAGE : ContactInquiryType.SCOPING,
      name: senderName,
      email: body.email.trim(),
      phone: body.phone ? String(body.phone).trim() : undefined,
      countryCode: body.countryCode ? String(body.countryCode).trim() : undefined,
      company: body.company ? String(body.company).trim() : undefined,
      service: body.service ? String(body.service).trim() : undefined,
      interest: body.interest ? String(body.interest).trim() : undefined,
      message: body.message.trim(),
      ip: clientIp,
      userAgent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
    });

    return NextResponse.json({
      success: true,
      inquiryId: result.inquiryId,
      delivered: result.emailDelivered,
    });
  } catch (error: unknown) {
    console.error("Error processing contact submission:", error);
    return NextResponse.json(
      {
        error:
          (error instanceof Error ? error.message : "Failed to process request") ||
          "Failed to process request",
      },
      { status: 500 },
    );
  }
}
