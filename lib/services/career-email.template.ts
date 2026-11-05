import "server-only";

export interface CandidateConfirmationEmailParams {
  candidateName: string;
  jobTitle: string;
  applicationId: string;
  companyName?: string;
  websiteUrl?: string;
}

export interface RecruiterAlertEmailParams {
  candidateName: string;
  email: string;
  phone?: string;
  jobTitle: string;
  applicationId: string;
  knockoutTriggered: boolean;
  reviewUrl?: string;
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

/**
 * Generates the branded candidate confirmation email.
 */
export function renderCandidateConfirmationEmail(
  params: CandidateConfirmationEmailParams,
): RenderedEmail {
  const {
    candidateName,
    jobTitle,
    applicationId,
    companyName = "TechSonance Infotech LLP",
    websiteUrl = "https://www.techsonance.co.in",
  } = params;

  const subject = `Application Received: ${jobTitle} at ${companyName}`;

  const text = `Dear ${candidateName},

Thank you for applying for the ${jobTitle} position at ${companyName}.

We have received your resume and application details. Our engineering talent team reviews each application carefully. If your background aligns with our engineering requirements, we will reach out directly to schedule the next conversation.

Reference ID: ${applicationId}

Best regards,
Talent Acquisition Team
${companyName}
${websiteUrl}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1155cc 100%); padding: 28px 24px; text-align: center; border-radius: 12px; margin-bottom: 24px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
          TECHSONANCE
        </h1>
        <span style="color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; display: block; margin-top: 4px;">
          INFOTECH LLP
        </span>
      </div>

      <h2 style="color: #1155cc; margin-top: 0; font-size: 20px; font-weight: 700;">Application Received</h2>
      <p style="font-size: 14px; line-height: 1.6;">Dear <strong>${candidateName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6;">Thank you for your interest in joining <strong>${companyName}</strong>. We have received your application for the following opening:</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <h3 style="margin: 0 0 6px 0; color: #0f172a; font-size: 16px;">${jobTitle}</h3>
        <p style="margin: 0; color: #64748b; font-size: 13px; font-family: monospace;">Reference ID: ${applicationId}</p>
      </div>

      <div style="font-size: 14px; line-height: 1.6; color: #334155;">
        <h4 style="margin: 16px 0 8px 0; font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">What happens next:</h4>
        <ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 13px; color: #475569;">
          <li>Our engineering leads evaluate each candidate profile, past systems, and portfolio.</li>
          <li>If your background matches our technical scope, our recruiter will reach out within 3 business days.</li>
          <li>You may reply directly to this email or contact <a href="mailto:careers@techsonance.co.in" style="color: #1155cc; text-decoration: none;">careers@techsonance.co.in</a> for updates or data requests.</li>
        </ul>
      </div>

      <p style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #64748b;">
        Best regards,<br/>
        <strong>TechSonance Talent Acquisition Team</strong><br/>
        <a href="${websiteUrl}" style="color: #1155cc; text-decoration: none;">${websiteUrl.replace(/^https?:\/\//, "")}</a>
      </p>
    </div>
  `;

  return { subject, text, html };
}

/**
 * Generates the recruiter alert email with knockout question indicator.
 */
export function renderRecruiterAlertEmail(params: RecruiterAlertEmailParams): RenderedEmail {
  const {
    candidateName,
    email,
    phone = "N/A",
    jobTitle,
    applicationId,
    knockoutTriggered,
    reviewUrl = `https://www.techsonance.co.in/admin/careers/applications?id=${applicationId}`,
  } = params;

  const subject = `${knockoutTriggered ? "[ALERT: Knockout Triggered] " : ""}New Application: ${candidateName} for ${jobTitle}`;

  const text = `New candidate application submitted for ${jobTitle}.

Candidate: ${candidateName}
Email: ${email}
Phone: ${phone}
Knockout Triggered: ${knockoutTriggered ? "YES" : "NO"}
Application ID: ${applicationId}
Review Profile: ${reviewUrl}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #1155cc; margin-top: 0; font-size: 20px;">New Candidate Application</h2>

      ${
        knockoutTriggered
          ? `<div style="background-color: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-weight: bold; font-size: 13px;">
              ⚠️ KNOCKOUT QUESTION TRIGGERED: Candidate failed one or more required screening gates.
            </div>`
          : ""
      }

      <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #64748b; width: 140px;">Position:</td><td style="padding: 8px 0; font-weight: bold;">${jobTitle}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Candidate:</td><td style="padding: 8px 0; font-weight: bold;">${candidateName}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #1155cc; text-decoration: none;">${email}</a></td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Phone:</td><td style="padding: 8px 0;">${phone}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Application ID:</td><td style="padding: 8px 0; font-family: monospace;">${applicationId}</td></tr>
      </table>

      <div style="margin-top: 24px;">
        <a href="${reviewUrl}" style="display: inline-block; background-color: #1155cc; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px;">
          Review in ATS Inbox &rarr;
        </a>
      </div>
    </div>
  `;

  return { subject, text, html };
}

export interface TalentPoolConfirmationEmailParams {
  name: string;
  companyName?: string;
  websiteUrl?: string;
}

/**
 * Generates the talent pool candidate confirmation email.
 */
export function renderTalentPoolConfirmationEmail(
  params: TalentPoolConfirmationEmailParams,
): RenderedEmail {
  const {
    name,
    companyName = "TechSonance Infotech LLP",
    websiteUrl = "https://www.techsonance.co.in",
  } = params;

  const subject = `Welcome to the ${companyName} Talent Pool`;

  const text = `Dear ${name},

Thank you for joining the ${companyName} Talent Pool!

We have received your profile and resume. As new engineering initiatives and career opportunities open that match your skills, our talent team will reach out directly.

Best regards,
Talent Acquisition Team
${companyName}
${websiteUrl}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1155cc 100%); padding: 28px 24px; text-align: center; border-radius: 12px; margin-bottom: 24px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
          TECHSONANCE
        </h1>
        <span style="color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; display: block; margin-top: 4px;">
          INFOTECH LLP
        </span>
      </div>

      <h2 style="color: #1155cc; margin-top: 0; font-size: 20px;">Welcome to Our Talent Pool</h2>
      <p style="font-size: 14px; line-height: 1.6;">Dear <strong>${name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6;">Thank you for submitting your details to the <strong>${companyName}</strong> Talent Pool.</p>
      <p style="font-size: 14px; line-height: 1.6;">Our team keeps your profile active for upcoming engineering, product, and leadership roles. When an opportunity aligns with your experience and interests, our team will get in touch with you.</p>

      <p style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #64748b;">
        Best regards,<br/>
        <strong>TechSonance Talent Acquisition Team</strong><br/>
        <a href="${websiteUrl}" style="color: #1155cc; text-decoration: none;">${websiteUrl.replace(/^https?:\/\//, "")}</a>
      </p>
    </div>
  `;

  return { subject, text, html };
}
