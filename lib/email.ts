import nodemailer from "nodemailer";
import * as ics from "ics";
import { getEnv } from "./env";
import { escapeHtml } from "./text";
import { BOT_CONFIG } from "./config";

export interface BookingPayload {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  projectType: string;
  budgetRange: string;
  timeline: string;
  slotIso: string;
  visitorTimezone: string;
  message?: string;
  recentMessages?: { role: "user" | "assistant"; content: string }[];
}

export function createICSCalendar(
  booking: BookingPayload,
  ref: string
): string {
  const startDate = new Date(booking.slotIso);
  const durationMinutes = BOT_CONFIG.slots.slotDurationMinutes;

  const event: ics.EventAttributes = {
    start: [
      startDate.getUTCFullYear(),
      startDate.getUTCMonth() + 1,
      startDate.getUTCDate(),
      startDate.getUTCHours(),
      startDate.getUTCMinutes(),
    ],
    duration: { minutes: durationMinutes },
    title: `TechSonance Discovery Consultation: ${booking.name} & TechSonance [${ref}]`,
    description: `Free 30-Minute Software Engineering Consultation with TechSonance Infotech LLP.\n\nProject Type: ${booking.projectType}\nReference: ${ref}\nVisitor: ${booking.name} (${booking.email})\nNotes: ${booking.message || "None"}\n\nOur team will connect with you via Google Meet / Video call link sent before the meeting.`,
    location: "Google Meet / Remote Video Call",
    url: "https://www.techsonance.co.in",
    organizer: {
      name: "TechSonance Infotech LLP",
      email: "info@techsonance.co.in",
    },
    attendees: [
      {
        name: booking.name,
        email: booking.email,
        rsvp: true,
        partstat: "ACCEPTED",
        role: "REQ-PARTICIPANT",
      },
    ],
    status: "CONFIRMED",
    busyStatus: "BUSY",
  };

  const { error, value } = ics.createEvent(event);
  if (error || !value) {
    throw new Error(`Failed to generate calendar invite: ${String(error)}`);
  }
  return value;
}

function getTransporter() {
  const env = getEnv();
  const smtpUser = env.SMTP_USER;
  const smtpPass = env.SMTP_PASS;

  if (smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST || "smtp.gmail.com",
      port: Number(env.SMTP_PORT || 465),
      secure: Number(env.SMTP_PORT || 465) === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
  }
  return null;
}

export async function sendConsultationEmails(
  booking: BookingPayload,
  ref: string
): Promise<{ ok: boolean; messageId?: string }> {
  const env = getEnv();
  const adminEmail = env.ADMIN_EMAIL || "info@techsonance.co.in";
  const fromEmail = env.FROM_EMAIL || `"TechSonance Consultations" <info@techsonance.co.in>`;

  const icsContent = createICSCalendar(booking, ref);
  const slotDate = new Date(booking.slotIso);

  // Time in IST
  const slotISTFormatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "short",
  }).format(slotDate);

  // Time in Visitor Timezone
  let slotVisitorFormatted = slotISTFormatted;
  try {
    slotVisitorFormatted = new Intl.DateTimeFormat("en-US", {
      timeZone: booking.visitorTimezone || "Asia/Kolkata",
      dateStyle: "full",
      timeStyle: "short",
    }).format(slotDate);
  } catch {
    // fallback
  }

  // Escape all user values for HTML safety
  const safeName = escapeHtml(booking.name);
  const safeEmail = escapeHtml(booking.email);
  const safePhone = escapeHtml(booking.phone || "Not provided");
  const safeCompany = escapeHtml(booking.company || "Not provided");
  const safeProject = escapeHtml(booking.projectType);
  const safeBudget = escapeHtml(booking.budgetRange);
  const safeTimeline = escapeHtml(booking.timeline);
  const safeMessage = escapeHtml(booking.message || "No additional message provided.");
  const safeTimezone = escapeHtml(booking.visitorTimezone || "Asia/Kolkata");

  // Format recent chat messages for admin context (cap to 5 messages)
  let chatContextHtml = "";
  if (booking.recentMessages && booking.recentMessages.length > 0) {
    const recent = booking.recentMessages.slice(-5);
    chatContextHtml = `
      <div style="margin-top: 24px; padding: 16px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
        <h4 style="margin: 0 0 12px 0; color: #0F172A; font-size: 14px;">Recent Visitor Chat Context:</h4>
        ${recent
          .map(
            (m) => `
          <div style="margin-bottom: 8px; font-size: 13px;">
            <strong style="color: ${m.role === "user" ? "#1155CC" : "#64748B"};">${m.role === "user" ? safeName : "Sonance AI"}:</strong>
            <span style="color: #334155;">${escapeHtml(m.content.slice(0, 300))}</span>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  const adminHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0F172A; line-height: 1.5;">
      <div style="background: linear-gradient(135deg, #0F52BA, #008BD9); padding: 24px; border-radius: 12px; color: white; margin-bottom: 24px;">
        <h2 style="margin: 0; font-size: 20px;">New Consultation Request</h2>
        <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">Booking Reference: <strong>${ref}</strong></p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #E2E8F0;"><td style="padding: 8px 0; color: #64748B; width: 140px;">Client Name</td><td style="padding: 8px 0; font-weight: 600;">${safeName}</td></tr>
        <tr style="border-bottom: 1px solid #E2E8F0;"><td style="padding: 8px 0; color: #64748B;">Email</td><td style="padding: 8px 0;"><a href="mailto:${safeEmail}" style="color: #1155CC;">${safeEmail}</a></td></tr>
        <tr style="border-bottom: 1px solid #E2E8F0;"><td style="padding: 8px 0; color: #64748B;">Phone / WhatsApp</td><td style="padding: 8px 0;">${safePhone}</td></tr>
        <tr style="border-bottom: 1px solid #E2E8F0;"><td style="padding: 8px 0; color: #64748B;">Company</td><td style="padding: 8px 0;">${safeCompany}</td></tr>
        <tr style="border-bottom: 1px solid #E2E8F0;"><td style="padding: 8px 0; color: #64748B;">Project Type</td><td style="padding: 8px 0; font-weight: 600;">${safeProject}</td></tr>
        <tr style="border-bottom: 1px solid #E2E8F0;"><td style="padding: 8px 0; color: #64748B;">Budget Range</td><td style="padding: 8px 0;">${safeBudget}</td></tr>
        <tr style="border-bottom: 1px solid #E2E8F0;"><td style="padding: 8px 0; color: #64748B;">Timeline</td><td style="padding: 8px 0;">${safeTimeline}</td></tr>
        <tr style="border-bottom: 1px solid #E2E8F0;"><td style="padding: 8px 0; color: #64748B;">Slot (IST)</td><td style="padding: 8px 0; font-weight: 600; color: #0F52BA;">${slotISTFormatted} (IST)</td></tr>
        <tr style="border-bottom: 1px solid #E2E8F0;"><td style="padding: 8px 0; color: #64748B;">Client Timezone</td><td style="padding: 8px 0;">${slotVisitorFormatted} (${safeTimezone})</td></tr>
        <tr><td style="padding: 8px 0; color: #64748B; vertical-align: top;">Message / Notes</td><td style="padding: 8px 0;">${safeMessage}</td></tr>
      </table>

      ${chatContextHtml}

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8;">
        Sent automatically by TechSonance Chatbot Assistant. Reply directly to this email to respond to ${safeName}.
      </div>
    </div>
  `;

  const clientHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0F172A; line-height: 1.5;">
      <div style="background: linear-gradient(135deg, #0F52BA, #008BD9); padding: 24px; border-radius: 12px; color: white; margin-bottom: 24px;">
        <h2 style="margin: 0; font-size: 20px;">Your Consultation is Confirmed!</h2>
        <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">Reference: <strong>${ref}</strong></p>
      </div>

      <p style="font-size: 15px;">Hi ${safeName},</p>
      <p style="font-size: 14px; color: #334155;">
        Thank you for booking a free 30-minute discovery consultation with <strong>TechSonance Infotech LLP</strong>. We have reserved your preferred time slot:
      </p>

      <div style="background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <div style="font-size: 16px; font-weight: 700; color: #0369A1; margin-bottom: 4px;">${slotVisitorFormatted}</div>
        <div style="font-size: 13px; color: #0284C7;">(${slotISTFormatted} IST)</div>
      </div>

      <h3 style="font-size: 15px; color: #0F172A; margin: 20px 0 8px 0;">What to Expect:</h3>
      <ul style="font-size: 14px; color: #334155; padding-left: 20px; margin: 0 0 20px 0;">
        <li>We'll review your project goals, core features, and target user personas.</li>
        <li>We'll discuss recommended architecture, frameworks, and milestones.</li>
        <li>We'll deliver a clear roadmap and estimated budget range with zero obligation.</li>
      </ul>

      <p style="font-size: 13px; color: #64748B;">
        A calendar invite (.ics file) is attached to this email. If you need to reschedule or have questions before our call, simply reply directly to this email or WhatsApp us at <strong>+91 9173101711</strong>.
      </p>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8;">
        TechSonance Infotech LLP • Surat, Gujarat, India • <a href="https://www.techsonance.co.in" style="color: #1155CC;">www.techsonance.co.in</a>
      </div>
    </div>
  `;

  const transporter = getTransporter();
  const resendApiKey = env.RESEND_API_KEY;

  if (resendApiKey) {
    // Send via Resend REST API
    const icsBase64 = Buffer.from(icsContent).toString("base64");

    // 1. Admin Email
    const adminRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: adminEmail.split(",").map((s) => s.trim()),
        reply_to: booking.email,
        subject: `New consultation request: ${booking.name} (${booking.projectType}) [Ref: ${ref}]`,
        html: adminHtml,
        attachments: [
          {
            filename: `techsonance-consultation-${ref}.ics`,
            content: icsBase64,
          },
        ],
      }),
    });

    if (!adminRes.ok) {
      const errText = await adminRes.text().catch(() => "");
      throw new Error(`Resend admin notification failed: ${errText}`);
    }

    // 2. Client Confirmation Email
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [booking.email],
        subject: `Your TechSonance Consultation Confirmation [Ref: ${ref}]`,
        html: clientHtml,
        attachments: [
          {
            filename: `techsonance-consultation-${ref}.ics`,
            content: icsBase64,
          },
        ],
      }),
    }).catch(() => {
      // Client delivery error is non-fatal if admin received it
    });

    return { ok: true };
  }

  if (transporter) {
    // Send via Nodemailer SMTP
    await transporter.sendMail({
      from: fromEmail,
      to: adminEmail,
      replyTo: booking.email,
      subject: `New consultation request: ${booking.name} (${booking.projectType}) [Ref: ${ref}]`,
      html: adminHtml,
      icalEvent: {
        filename: `techsonance-consultation-${ref}.ics`,
        method: "request",
        content: icsContent,
      },
    });

    // Client confirmation email
    await transporter
      .sendMail({
        from: fromEmail,
        to: booking.email,
        subject: `Your TechSonance Consultation Confirmation [Ref: ${ref}]`,
        html: clientHtml,
        icalEvent: {
          filename: `techsonance-consultation-${ref}.ics`,
          method: "request",
          content: icsContent,
        },
      })
      .catch(() => {
        // Non-fatal if admin received it
      });

    return { ok: true };
  }

  // If in local development without SMTP configured, log simulation
  console.log(`[Dev Simulation] Consultation booking ${ref} created for ${booking.name} (${booking.email})`);
  return { ok: true };
}
