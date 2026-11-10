import "server-only";
import { inject } from "@needle-di/core";
import { ContactInquiryRepository } from "@/lib/repositories/contact-inquiry.repository";
import { EmailService } from "@/lib/services/email.service";
import { ENV_CONFIG_TOKEN } from "@/lib/di/tokens";
import type { Env } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  ContactInquiryType,
  ContactInquiryStatus,
  CONTACT_DEFAULTS,
} from "@/lib/constants/contact.constants";

export interface SubmitInquiryInput {
  type: ContactInquiryType;
  name: string;
  email: string;
  phone?: string;
  countryCode?: string;
  company?: string;
  service?: string;
  interest?: string;
  message: string;
  ip?: string;
  userAgent?: string | null;
  referer?: string | null;
}

export interface SubmitInquiryResult {
  inquiryId: string;
  emailDelivered: boolean;
}

export class ContactInquiryService {
  constructor(
    private inquiryRepo: ContactInquiryRepository = inject(ContactInquiryRepository),
    private emailService: EmailService = inject(EmailService),
    private env: Env = inject(ENV_CONFIG_TOKEN),
  ) {}

  /**
   * Submits a contact inquiry: persists to database first to eliminate lead loss,
   * then attempts email dispatch and logs delivery metrics.
   */
  async submitInquiry(input: SubmitInquiryInput): Promise<SubmitInquiryResult> {
    // 1. Persist to Postgres database first
    const inquiry = await this.inquiryRepo.createInquiry({
      type: input.type,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      countryCode: input.countryCode ?? null,
      company: input.company ?? null,
      service: input.service ?? null,
      interest: input.interest ?? null,
      message: input.message,
      ip: input.ip ?? null,
      status: ContactInquiryStatus.NEW,
      emailDelivered: false,
      metadata: {
        userAgent: input.userAgent ?? null,
        referer: input.referer ?? null,
      },
    });

    const adminEmail = (this.env as Record<string, any>).ADMIN_EMAIL || CONTACT_DEFAULTS.ADMIN_EMAIL;
    const smtpFrom = (this.env as Record<string, any>).SMTP_USER || CONTACT_DEFAULTS.SMTP_FROM;

    let subject = "New Contact Inquiry - TechSonance";
    let textContent = "";
    let htmlContent = "";

    if (input.type === ContactInquiryType.CONTACT_PAGE) {
      subject = `New Project Inquiry from ${input.name} (${input.interest || "General"})`;
      textContent = `
New Project Inquiry received from the Contact Page:

Name: ${input.name}
Email: ${input.email}
Phone: ${input.countryCode || ""} ${input.phone || ""}
Interested in: ${input.interest || "Not specified"}

Message:
${input.message}
      `.trim();

      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 10px; color: #0f172a; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1155CC 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
                TECHSONANCE
              </h1>
              <span style="color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-top: 4px;">
                INFOTECH LLP
              </span>
              <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 9999px; padding: 4px 12px; margin-top: 16px;">
                <span style="font-size: 10px; color: #38bdf8; font-weight: 700; text-transform: uppercase;">
                  ⚡ Lead Notification
                </span>
              </div>
            </div>
            <div style="padding: 32px 24px;">
              <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">
                New Project Inquiry
              </h2>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
                <tbody>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b; width: 140px;">Name</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #0f172a;">${input.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b;">Email Address</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #1155CC;"><a href="mailto:${input.email}" style="color: #1155CC; text-decoration: none;">${input.email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b;">Phone Number</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #0f172a;">${input.countryCode || ""} ${input.phone || ""}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b;">Interested In</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #0f172a;">
                      <span style="background-color: #eff6ff; color: #1d4ed8; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; border: 1px solid #dbeafe;">
                        ${input.interest || "General"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                <h4 style="margin: 0 0 10px 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase;">Message:</h4>
                <p style="margin: 0; font-size: 13px; color: #334155; white-space: pre-wrap; line-height: 1.6;">${input.message}</p>
              </div>
              <div style="text-align: center; margin-top: 10px;">
                <a href="mailto:${input.email}" style="display: inline-block; background-color: #1155CC; color: #ffffff; font-weight: 700; font-size: 13px; padding: 14px 28px; text-decoration: none; border-radius: 10px;">
                  Reply Directly via Email ✉
                </a>
              </div>
            </div>
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 500;">
                Inquiry ID: ${inquiry.id}<br />
                Submission Time: ${new Date().toLocaleString("en-US", { timeZone: "UTC" })} UTC
              </p>
            </div>
          </div>
        </div>
      `;
    } else {
      subject = `New Scoping Request from ${input.name} (${input.service || "General"})`;
      textContent = `
New Scoping Request received:

Name: ${input.name}
Email: ${input.email}
Company: ${input.company || "Not specified"}
Service: ${input.service || "General"}

Message:
${input.message}
      `.trim();

      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 10px; color: #0f172a; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1155CC 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
                TECHSONANCE
              </h1>
              <span style="color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-top: 4px;">
                INFOTECH LLP
              </span>
              <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 9999px; padding: 4px 12px; margin-top: 16px;">
                <span style="font-size: 10px; color: #38bdf8; font-weight: 700; text-transform: uppercase;">
                  📅 Scoping Request
                </span>
              </div>
            </div>
            <div style="padding: 32px 24px;">
              <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">
                New Scoping Call Request
              </h2>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
                <tbody>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b; width: 140px;">Name</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #0f172a;">${input.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b;">Email Address</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #1155CC;"><a href="mailto:${input.email}" style="color: #1155CC; text-decoration: none;">${input.email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b;">Company Name</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #0f172a;">${input.company || "Not specified"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b;">Service Required</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #0f172a;">
                      <span style="background-color: #f5f3ff; color: #6d28d9; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; border: 1px solid #ddd6fe;">
                        ${input.service || "General"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                <h4 style="margin: 0 0 10px 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase;">Message:</h4>
                <p style="margin: 0; font-size: 13px; color: #334155; white-space: pre-wrap; line-height: 1.6;">${input.message}</p>
              </div>
              <div style="text-align: center; margin-top: 10px;">
                <a href="mailto:${input.email}" style="display: inline-block; background-color: #1155CC; color: #ffffff; font-weight: 700; font-size: 13px; padding: 14px 28px; text-decoration: none; border-radius: 10px;">
                  Reply Directly via Email ✉
                </a>
              </div>
            </div>
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 500;">
                Inquiry ID: ${inquiry.id}<br />
                Submission Time: ${new Date().toLocaleString("en-US", { timeZone: "UTC" })} UTC
              </p>
            </div>
          </div>
        </div>
      `;
    }

    try {
      const result = await this.emailService.sendMail({
        from: `"${input.name}" <${smtpFrom}>`,
        to: adminEmail,
        subject,
        text: textContent,
        html: htmlContent,
        replyTo: input.email,
      });

      if (result.ok) {
        await this.inquiryRepo.updateDeliveryStatus(inquiry.id, true);
        return { inquiryId: inquiry.id, emailDelivered: true };
      } else {
        logger.warn("ContactInquiryService: SMTP dispatch returned error", {
          inquiryId: inquiry.id,
          error: result.error,
        });
        await this.inquiryRepo.updateDeliveryStatus(inquiry.id, false, result.error);
        return { inquiryId: inquiry.id, emailDelivered: false };
      }
    } catch (sendErr) {
      const errMsg = sendErr instanceof Error ? sendErr.message : "SMTP send exception";
      logger.error("ContactInquiryService: SMTP dispatch threw exception", {
        inquiryId: inquiry.id,
        error: errMsg,
      });
      await this.inquiryRepo.updateDeliveryStatus(inquiry.id, false, errMsg);
      return { inquiryId: inquiry.id, emailDelivered: false };
    }
  }
}
