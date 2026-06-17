import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// In-memory rate limiting map
const ipCache = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 requests per 15 minutes per IP

function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const record = ipCache.get(ip);

  // Clear expired records from cache to avoid memory leaks
  for (const [key, val] of ipCache.entries()) {
    if (now > val.resetTime) {
      ipCache.delete(key);
    }
  }

  if (!record || now > record.resetTime) {
    const newRecord = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    ipCache.set(ip, newRecord);
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, reset: newRecord.resetTime };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0, reset: record.resetTime };
  }

  record.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count, reset: record.resetTime };
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(clientIp);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again after 15 minutes." },
        { 
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
          }
        }
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

    // Contact page form verification
    if (body.firstName !== undefined || body.lastName !== undefined) {
      const { firstName, lastName, email, countryCode, phone, interest, message } = body;

      if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim() || !message?.trim()) {
        return NextResponse.json({ error: "All required fields must be filled." }, { status: 400 });
      }

      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
      }

      const cleanPhone = phone.replace(/\D/g, "");
      if (countryCode === "+91") {
        if (cleanPhone.length !== 10) {
          return NextResponse.json({ error: "Please enter a valid 10-digit Indian phone number." }, { status: 400 });
        }
      } else {
        if (cleanPhone.length < 7) {
          return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
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

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const adminEmail = process.env.ADMIN_EMAIL;

    // Check if SMTP configuration is missing
    if (!smtpHost || !smtpPort || !emailUser || !emailPass || !adminEmail) {
      console.error("Missing SMTP environment variables");
      return NextResponse.json(
        { error: "Mail server configuration is missing on the server." },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    let subject = "New Contact Inquiry - TechSonance";
    let textContent = "";
    let htmlContent = "";

    if (body.firstName !== undefined || body.lastName !== undefined) {
      const { firstName, lastName, email, countryCode, phone, interest, message } = body;
      subject = `New Project Inquiry from ${firstName} ${lastName} (${interest})`;
      textContent = `
New Project Inquiry received from the Contact Page:

Name: ${firstName} ${lastName}
Email: ${email}
Phone: ${countryCode} ${phone}
Interested in: ${interest}

Message:
${message}
      `;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 10px; color: #0f172a; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);">
            
            <!-- Header with TechSonance Brand colors -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #0d47a1 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
                TECHSONANCE
              </h1>
              <span style="color: #94a3b8; font-size: 10px; font-weight: 700; tracking-widest; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-top: 4px;">
                INFOTECH LLP
              </span>
              <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 9999px; padding: 4px 12px; margin-top: 16px;">
                <span style="font-size: 10px; color: #38bdf8; font-weight: 700; text-transform: uppercase; tracking-wider;">
                  ⚡ Lead Notification
                </span>
              </div>
            </div>
            
            <!-- Content Body -->
            <div style="padding: 32px 24px;">
              <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">
                New Project Inquiry
              </h2>
              <p style="color: #475569; font-size: 14px; margin: 0 0 24px 0;">
                A new contact form submission has been captured from the website contact page. Here are the prospect's details:
              </p>
              
              <!-- Key-Value Metadata block -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
                <tbody>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b; width: 140px;">Name</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #0f172a;">${firstName} ${lastName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b;">Email Address</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #0d47a1;"><a href="mailto:${email}" style="color: #0d47a1; text-decoration: none;">${email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b;">Phone Number</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #0f172a;">${countryCode} ${phone}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b;">Interested In</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #0f172a;">
                      <span style="background-color: #eff6ff; color: #1d4ed8; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; border: 1px solid #dbeafe;">
                        ${interest}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <!-- Message Content -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                <h4 style="margin: 0 0 10px 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; tracking-wider;">Message:</h4>
                <p style="margin: 0; font-size: 13px; color: #334155; white-space: pre-wrap; line-height: 1.6;">${message}</p>
              </div>
              
              <!-- CTA Button for quick reply -->
              <div style="text-align: center; margin-top: 10px;">
                <a href="mailto:${email}" style="display: inline-block; background-color: #0d47a1; color: #ffffff; font-weight: 700; font-size: 13px; padding: 14px 28px; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 10px rgba(13, 71, 161, 0.2);">
                  Reply Directly via Email ✉
                </a>
              </div>
              
            </div>
            
            <!-- Footer info -->
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 500;">
                This lead was securely delivered by the TechSonance Web App server.<br />
                Submission Time: ${new Date().toLocaleString("en-US", { timeZone: "UTC" })} UTC
              </p>
            </div>
            
          </div>
        </div>
      `;
    } else {
      // Scoping Form
      const { name, email, company, service, message } = body;
      subject = `New Scoping Request from ${name} (${service})`;
      textContent = `
New Scoping Request received:

Name: ${name}
Email: ${email}
Company: ${company || "Not specified"}
Service: ${service}

Message:
${message}
      `;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 10px; color: #0f172a; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);">
            
            <!-- Header with TechSonance Brand colors -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #0d47a1 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
                TECHSONANCE
              </h1>
              <span style="color: #94a3b8; font-size: 10px; font-weight: 700; tracking-widest; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-top: 4px;">
                INFOTECH LLP
              </span>
              <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 9999px; padding: 4px 12px; margin-top: 16px;">
                <span style="font-size: 10px; color: #38bdf8; font-weight: 700; text-transform: uppercase; tracking-wider;">
                  📅 Scoping Request
                </span>
              </div>
            </div>
            
            <!-- Content Body -->
            <div style="padding: 32px 24px;">
              <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">
                New Scoping Call Request
              </h2>
              <p style="color: #475569; font-size: 14px; margin: 0 0 24px 0;">
                A new project scoping call request has been captured from the website. Here are the scoping details:
              </p>
              
              <!-- Key-Value Metadata block -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
                <tbody>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b; width: 140px;">Name</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #0f172a;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b;">Email Address</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #0d47a1;"><a href="mailto:${email}" style="color: #0d47a1; text-decoration: none;">${email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b;">Company Name</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #0f172a;">${company || "Not specified"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b;">Service Required</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #0f172a;">
                      <span style="background-color: #f5f3ff; color: #6d28d9; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; border: 1px solid #ddd6fe;">
                        ${service}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <!-- Message Content -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                <h4 style="margin: 0 0 10px 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; tracking-wider;">Message:</h4>
                <p style="margin: 0; font-size: 13px; color: #334155; white-space: pre-wrap; line-height: 1.6;">${message}</p>
              </div>
              
              <!-- CTA Button for quick reply -->
              <div style="text-align: center; margin-top: 10px;">
                <a href="mailto:${email}" style="display: inline-block; background-color: #0d47a1; color: #ffffff; font-weight: 700; font-size: 13px; padding: 14px 28px; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 10px rgba(13, 71, 161, 0.2);">
                  Reply Directly via Email ✉
                </a>
              </div>
              
            </div>
            
            <!-- Footer info -->
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 500;">
                This scoping request was securely delivered by the TechSonance Web App server.<br />
                Submission Time: ${new Date().toLocaleString("en-US", { timeZone: "UTC" })} UTC
              </p>
            </div>
            
          </div>
        </div>
      `;
    }

    const mailOptions = {
      from: `"${body.firstName ? `${body.firstName} ${body.lastName}` : body.name}" <${emailUser}>`,
      to: adminEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
      replyTo: body.email,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending email via SMTP:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
