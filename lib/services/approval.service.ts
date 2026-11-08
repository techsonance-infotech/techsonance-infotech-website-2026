import "server-only";
import crypto from "node:crypto";
import { inject } from "@needle-di/core";
import { revalidateTag } from "next/cache";
import { ApprovalRequestsRepository } from "@/lib/repositories/approval-requests.repository";
import { AiApprovalStatus, type AiApprovalDecision } from "@/lib/database/enum/ai.enum";
import { EmailService } from "./email.service";
import { logger } from "@/lib/logger";
import { getEnv } from "../env";
import { AppError, ErrorCode } from "@/lib/errors";

export interface CreateApprovalResult {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export type ApprovalDecision = "approve" | "reject" | "improve";

export class ApprovalService {
  constructor(
    private approvalRepo: ApprovalRequestsRepository = inject(ApprovalRequestsRepository),
    private emailService: EmailService = inject(EmailService),
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Generates a 32-byte cryptographic token, stores its SHA-256 hash, and sets expiry.
   */
  async createApprovalRequest(
    postId: string,
    postVersion: number = 1,
  ): Promise<CreateApprovalResult> {
    const env = getEnv();
    const expiryHours = env.AI_BLOG_APPROVAL_EXPIRY_HOURS || 72;
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + expiryHours * 3600 * 1000);

    await this.approvalRepo.create({
      postId,
      postVersion,
      tokenHash,
      status: AiApprovalStatus.PENDING,
      expiresAt,
    });

    return { token, tokenHash, expiresAt };
  }

  /**
   * Builds and dispatches an editorial review email with signed action URLs.
   */
  async sendApprovalEmail(
    token: string,
    post: { id: string; title: string; excerpt?: string | null; heroImage?: string | null },
  ): Promise<void> {
    const env = getEnv();
    const siteUrl = env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const approverEmail = env.AI_BLOG_APPROVER_EMAIL || env.ADMIN_EMAIL || "info@techsonance.co.in";
    const fromEmail = env.FROM_EMAIL || "TechSonance Editorial <info@techsonance.co.in>";

    const approveUrl = `${siteUrl}/approve/${token}?action=approve`;
    const rejectUrl = `${siteUrl}/approve/${token}?action=reject`;
    const improveUrl = `${siteUrl}/approve/${token}?action=improve`;
    const adminPreviewUrl = `${siteUrl}/admin/blog/${post.id}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; color: #1e293b;">
        <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center;">
          <div style="background: linear-gradient(135deg, #1155cc, #22b6f6); color: white; width: 36px; height: 36px; border-radius: 8px; font-weight: 900; font-size: 14px; text-align: center; line-height: 36px; display: inline-block;">
            TS
          </div>
          <span style="font-weight: 800; font-size: 16px; margin-left: 12px; color: #0f172a;">TechSonance Studio</span>
        </div>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <span style="background: #2563eb; color: white; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.5px;">
            Action Required
          </span>
          <h2 style="font-size: 18px; font-weight: 800; margin: 12px 0 6px 0; color: #1e3a8a;">
            New AI-Drafted Article Ready for Review
          </h2>
          <p style="font-size: 13px; color: #3b82f6; margin: 0;">
            Review and publish to the live TechSonance engineering blog with 1 click.
          </p>
        </div>

        ${
          post.heroImage
            ? `<div style="margin-bottom: 20px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
                <img src="${post.heroImage}" alt="${post.title}" style="width: 100%; max-height: 280px; object-fit: cover; display: block;" />
              </div>`
            : ""
        }

        <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; line-height: 1.3;">
          ${post.title}
        </h1>

        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
          ${post.excerpt || "No excerpt generated."}
        </p>

        <div style="margin-bottom: 28px;">
          <a href="${adminPreviewUrl}" style="display: inline-block; font-size: 13px; font-weight: 600; color: #1155cc; text-decoration: underline;">
            View full draft and inspect in Studio CMS &rarr;
          </a>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center;">
          <p style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-top: 0; margin-bottom: 16px;">
            Editorial Decision (Single-Use Secure Link)
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
            <tr>
              <td align="center" style="padding: 4px;">
                <a href="${approveUrl}" style="display: inline-block; padding: 12px 24px; background: #059669; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);">
                  ✓ Approve & Publish
                </a>
              </td>
              <td align="center" style="padding: 4px;">
                <a href="${improveUrl}" style="display: inline-block; padding: 12px 20px; background: #d97706; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">
                  ✎ Request Improvement
                </a>
              </td>
              <td align="center" style="padding: 4px;">
                <a href="${rejectUrl}" style="display: inline-block; padding: 12px 20px; background: #e11d48; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">
                  ✕ Reject Draft
                </a>
              </td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center;">
          This link expires in 72 hours. Protected against automated web crawlers (decision confirms on button click).<br>
          TechSonance Infotech • Autonomous Content Engine
        </div>
      </div>
    `;

    try {
      await this.emailService.sendMail({
        to: approverEmail,
        from: fromEmail,
        subject: `[Action Required] Review & Publish: ${post.title}`,
        text: `New AI-drafted article ready for review: "${post.title}"\n\nApprove: ${approveUrl}\nImprove: ${improveUrl}\nReject: ${rejectUrl}\n\nFull Preview: ${adminPreviewUrl}`,
        html,
      });

      const tokenHash = this.hashToken(token);
      await this.approvalRepo.updateEmailStatus(tokenHash, "SENT");
    } catch (err) {
      logger.error("Failed to send approval email", { error: String(err) });
    }
  }

  /**
   * Retrieves an approval request by its raw token.
   */
  async getRequestByToken(token: string) {
    const tokenHash = this.hashToken(token);
    return this.approvalRepo.findByTokenHash(tokenHash);
  }

  /**
   * Atomically verifies the token and applies the decision.
   */
  async decide(
    token: string,
    decision: ApprovalDecision,
    feedback?: string,
    decidedBy: string = "approver",
  ) {
    const tokenHash = this.hashToken(token);
    const existing = await this.approvalRepo.findByTokenHash(tokenHash);

    if (!existing || !existing.request) {
      throw new AppError(ErrorCode.NOT_FOUND, "Invalid or unknown approval token.");
    }

    const { request: req, post } = existing;

    if (req.usedAt) {
      throw new AppError(ErrorCode.CONFLICT, "This approval link has already been used.");
    }

    if (new Date() > req.expiresAt) {
      throw new AppError(ErrorCode.BAD_REQUEST, "This approval link has expired.");
    }

    if (!post) {
      throw new AppError(ErrorCode.NOT_FOUND, "Associated post not found.");
    }

    const now = new Date();
    let newStatus = post.status;
    const postUpdates: { status: string; publishedAt?: Date } = { status: newStatus };

    if (decision === "approve") {
      newStatus = "PUBLISHED";
      postUpdates.status = "PUBLISHED";
      postUpdates.publishedAt = now;
    } else if (decision === "reject") {
      newStatus = "ARCHIVED";
      postUpdates.status = "ARCHIVED";
    } else if (decision === "improve") {
      newStatus = "DRAFT";
      postUpdates.status = "DRAFT";
    }

    const approvalStatus =
      decision === "approve"
        ? AiApprovalStatus.APPROVED
        : decision === "reject"
          ? AiApprovalStatus.REJECTED
          : AiApprovalStatus.IMPROVE;

    await this.approvalRepo.applyDecisionWithPostUpdate(
      req.id,
      post.id,
      {
        decision: decision as AiApprovalDecision,
        status: approvalStatus,
        feedback: feedback || null,
        decidedBy,
      },
      postUpdates,
      `AI_APPROVAL_${decision.toUpperCase()}`,
    );

    if (decision === "approve") {
      try {
        revalidateTag("posts", "default");
      } catch (err) {
        logger.warn("Edge revalidation error on approval", { error: String(err) });
      }
    }

    return {
      success: true,
      decision,
      postId: post.id,
      newStatus,
    };
  }
}
