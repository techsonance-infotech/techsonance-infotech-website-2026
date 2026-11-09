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

import { renderMarkdownToHtml } from "@/lib/utils/markdown";

export interface CreateApprovalResult {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export type ApprovalDecision = "approve" | "reject" | "improve";

export interface PostApprovalContext {
  id: string;
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  content?: string | null;
  heroImage?: string | null;
  tags?: string[] | null;
  readTime?: string | null;
  seo?: unknown;
}

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
   * Builds and dispatches an editorial review email with signed action URLs,
   * approved topic context, and complete article content review.
   */
  async sendApprovalEmail(
    token: string,
    post: PostApprovalContext,
    topicText?: string,
  ): Promise<void> {
    const env = getEnv();
    const siteUrl = env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Primary admin address receives all approval notices
    const primaryAdmin =
      env.ADMIN_EMAIL || env.AI_BLOG_APPROVER_EMAIL || "manish.kuswaha.9601@gmail.com";
    const approverEmail = env.AI_BLOG_APPROVER_EMAIL;
    const recipients = Array.from(
      new Set(
        [primaryAdmin, approverEmail].filter((e): e is string =>
          Boolean(e && e.trim() && e.includes("@")),
        ),
      ),
    );
    const toRecipients = recipients.length === 1 ? recipients[0] : recipients;
    const fromEmail = env.FROM_EMAIL || `"TechSonance Studio" <connect.techsonance@gmail.com>`;

    const approveUrl = `${siteUrl}/approve/${token}?action=approve`;
    const rejectUrl = `${siteUrl}/approve/${token}?action=reject`;
    const improveUrl = `${siteUrl}/approve/${token}?action=improve`;
    const adminPreviewUrl = `${siteUrl}/admin/blog/${post.id}`;

    const sourceTopic = topicText || post.title;
    const readTime = post.readTime || "5 min read";
    const tagsList =
      post.tags && post.tags.length > 0 ? post.tags.join(", ") : "Engineering, Architecture";

    // Convert article content markdown to email-friendly HTML
    let renderedContentHtml = "";
    if (post.content) {
      try {
        renderedContentHtml = renderMarkdownToHtml(post.content);
      } catch {
        renderedContentHtml = `<p>${(post.content || "").replace(/\n/g, "<br/>")}</p>`;
      }
    }

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; background: #ffffff; color: #1e293b;">
        <!-- Header -->
        <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center;">
            <div style="background: linear-gradient(135deg, #1155cc, #22b6f6); color: white; width: 40px; height: 40px; border-radius: 10px; font-weight: 900; font-size: 16px; text-align: center; line-height: 40px; display: inline-block;">
              TS
            </div>
            <div style="margin-left: 12px; display: inline-block; vertical-align: middle;">
              <span style="display: block; font-weight: 800; font-size: 16px; color: #0f172a; line-height: 1.2;">TechSonance Studio</span>
              <span style="display: block; font-size: 11px; font-weight: 600; color: #1155cc; text-transform: uppercase; letter-spacing: 0.5px;">Editorial Pipeline & Quality Gate</span>
            </div>
          </div>
          <span style="background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; border: 1px solid #bfdbfe;">
            Action Required
          </span>
        </div>

        <!-- Topic Banner -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #1155cc; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; display: block; margin-bottom: 4px;">
            Approved Source Topic
          </span>
          <span style="font-size: 15px; font-weight: 700; color: #0f172a; display: block;">
            ${sourceTopic}
          </span>
        </div>

        <!-- Hero Image (16:9) -->
        ${
          post.heroImage
            ? `<div style="margin-bottom: 24px; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; background: #0f172a; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <img src="${post.heroImage}" alt="${post.title}" style="width: 100%; aspect-ratio: 16/9; max-height: 380px; object-fit: cover; display: block;" />
                <div style="background: #1e293b; padding: 8px 14px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between;">
                  <span>Generated 16:9 Hero Graphic (FLUX.1-schnell)</span>
                  <a href="${post.heroImage}" target="_blank" style="color: #38bdf8; text-decoration: underline;">View Full Resolution &rarr;</a>
                </div>
              </div>`
            : ""
        }

        <!-- Post Title & Excerpt -->
        <div style="margin-bottom: 20px;">
          <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 8px; line-height: 1.3;">
            ${post.title}
          </h1>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 12px 0;">
            ${post.excerpt || "Technical analysis and engineering best practices by TechSonance."}
          </p>
          <div style="font-size: 12px; color: #64748b; padding: 8px 0; border-top: 1px dashed #e2e8f0; border-bottom: 1px dashed #e2e8f0;">
            <strong>Read Time:</strong> ${readTime} &nbsp;•&nbsp; 
            <strong>Tags:</strong> ${tagsList} &nbsp;•&nbsp; 
            <strong>Slug:</strong> /${post.slug || "blog"}
          </div>
        </div>

        <!-- 1-Click Action Buttons -->
        <div style="background: #ffffff; border: 2px solid #1155cc; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 28px; box-shadow: 0 10px 15px -3px rgba(17, 85, 204, 0.08);">
          <p style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #1e3a8a; margin-top: 0; margin-bottom: 14px;">
            Publishing Approval Actions
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
            <tr>
              <td align="center" style="padding: 6px;">
                <a href="${approveUrl}" style="display: block; padding: 14px 24px; background: #059669; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 15px; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.25);">
                  ✓ Approve & Publish Live
                </a>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 6px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 4px; width: 50%;">
                      <a href="${improveUrl}" style="display: block; padding: 10px 16px; background: #fef3c7; border: 1px solid #fde68a; color: #b45309; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px;">
                        ✎ Request Improvement
                      </a>
                    </td>
                    <td align="center" style="padding: 4px; width: 50%;">
                      <a href="${rejectUrl}" style="display: block; padding: 10px 16px; background: #ffe4e6; border: 1px solid #fecdd3; color: #be123c; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px;">
                        ✕ Reject & Archive
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <div style="margin-top: 14px;">
            <a href="${adminPreviewUrl}" style="font-size: 12px; font-weight: 600; color: #1155cc; text-decoration: underline;">
              Open in Studio CMS Editor &rarr;
            </a>
          </div>
        </div>

        <!-- Complete Blog Content Review -->
        <div style="margin-bottom: 28px;">
          <h2 style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between;">
            <span>Complete Article Draft Review</span>
            <span style="font-size: 11px; font-weight: 600; color: #64748b;">Full Text Preview</span>
          </h2>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; font-size: 13px; line-height: 1.7; color: #334155; max-height: 550px; overflow-y: auto;">
            ${renderedContentHtml || "<p>Draft content is awaiting preview rendering.</p>"}
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.6;">
          This secure verification link is valid for 72 hours and protected against crawler pre-fetching.<br>
          TechSonance Infotech LLP • Autonomous Content & Publishing Engine
        </div>
      </div>
    `;

    try {
      const mailRes = await this.emailService.sendMail({
        to: toRecipients,
        from: fromEmail,
        subject: `[Action Required] Review & Publish: ${post.title}`,
        text: `New AI-drafted article ready for review.\n\nApproved Topic: ${sourceTopic}\nTitle: "${post.title}"\n\nApprove & Publish: ${approveUrl}\nRequest Revision: ${improveUrl}\nReject Draft: ${rejectUrl}\n\nInspect in Studio CMS: ${adminPreviewUrl}`,
        html,
      });

      const tokenHash = this.hashToken(token);
      if (mailRes.ok) {
        logger.info("Approval review email dispatched successfully", {
          to: toRecipients,
          messageId: mailRes.messageId,
          postId: post.id,
        });
        await this.approvalRepo.updateEmailStatus(tokenHash, "SENT");
      } else {
        logger.error("Failed to transmit approval email via SMTP", {
          to: toRecipients,
          error: mailRes.error,
          postId: post.id,
        });
        await this.approvalRepo.updateEmailStatus(tokenHash, "FAILED");
      }
    } catch (err) {
      logger.error("Exception during approval email dispatch", { error: String(err) });
      const tokenHash = this.hashToken(token);
      await this.approvalRepo.updateEmailStatus(tokenHash, "FAILED");
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
        if (post.slug) {
          revalidateTag(`post:${post.slug}`, "default");
        }
      } catch (err) {
        logger.warn("Edge revalidation error on approval", { error: String(err) });
      }
    }

    return {
      success: true,
      decision,
      postId: post.id,
      slug: post.slug,
      newStatus,
    };
  }
}
