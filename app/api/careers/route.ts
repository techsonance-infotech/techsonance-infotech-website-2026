import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const message = formData.get("message") as string;
    const resume = formData.get("resume") as File | null;

    // Server-side validation
    if (!fullName?.trim() || !email?.trim() || !role?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "All text fields are required." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    // SMTP Credentials Check
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!smtpHost || !smtpPort || !emailUser || !emailPass || !adminEmail) {
      console.error("Missing SMTP environment variables in careers route");
      return NextResponse.json(
        { error: "Mail server configuration is missing on the server." },
        { status: 500 }
      );
    }

    // Setup Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    // Handle File Attachment
    const attachments = [];
    if (resume && resume.size > 0) {
      const bytes = await resume.arrayBuffer();
      const buffer = Buffer.from(bytes);
      attachments.push({
        filename: resume.name,
        content: buffer,
      });
    }

    const subject = `[Career Application] ${fullName} - ${role}`;
    const textContent = `
New Job Application Received:

Full Name: ${fullName}
Email: ${email}
Role: ${role}

Message / Cover Letter:
${message}
    `;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 10px; color: #0f172a; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);">
          
          <!-- Branded Header -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1155CC 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
              TECHSONANCE
            </h1>
            <span style="color: #94a3b8; font-size: 10px; font-weight: 700; tracking-widest; text-transform: uppercase; letter-spacing: 0.15em; display: block; margin-top: 4px;">
              INFOTECH LLP
            </span>
            <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 9999px; padding: 5px 14px; margin-top: 18px;">
              <span style="font-size: 10px; color: #38bdf8; font-weight: 700; text-transform: uppercase; tracking-wider;">
                💼 Intern Application
              </span>
            </div>
          </div>
          
          <!-- Application Profile Details -->
          <div style="padding: 32px 24px;">
            <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">
              New Application Received
            </h2>
            <p style="color: #475569; font-size: 14px; margin: 0 0 24px 0;">
              A candidate has submitted an application form via the career portal. Here are their details:
            </p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
              <tbody>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b; width: 140px;">Candidate Name</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #0f172a;">${fullName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b;">Email Address</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #1155CC;">
                    <a href="mailto:${email}" style="color: #1155CC; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b;">Role Applied For</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #0f172a;">
                    <span style="background-color: #eff6ff; color: #1d4ed8; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; border: 1px solid #dbeafe;">
                      ${role}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #64748b;">Resume Attached</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #0f172a;">
                    ${resume && resume.size > 0 ? `📄 ${resume.name}` : "❌ No resume attached"}
                  </td>
                </tr>
              </tbody>
            </table>
            
            <!-- Cover Letter / Message -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
              <h4 style="margin: 0 0 10px 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; tracking-wider;">Message / Cover Letter:</h4>
              <p style="margin: 0; font-size: 13px; color: #334155; white-space: pre-wrap; line-height: 1.6;">${message}</p>
            </div>
            
            <!-- Quick Action Reply Button -->
            <div style="text-align: center; margin-top: 10px;">
              <a href="mailto:${email}" style="display: inline-block; background-color: #1155CC; color: #ffffff; font-weight: 700; font-size: 13px; padding: 14px 28px; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 10px rgba(17, 85, 204, 0.2);">
                Contact Applicant ✉
              </a>
            </div>
            
          </div>
          
          <!-- Branded Footer -->
          <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 500;">
              This application was securely received by the TechSonance Career portal.<br />
              Submission Time: ${new Date().toLocaleString("en-US", { timeZone: "UTC" })} UTC
            </p>
          </div>
          
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"${fullName}" <${emailUser}>`,
      to: adminEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
      replyTo: email,
      attachments: attachments,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending career application email via SMTP:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send application email" },
      { status: 500 }
    );
  }
}
