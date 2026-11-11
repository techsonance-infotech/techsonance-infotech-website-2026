import "server-only";
import crypto from "node:crypto";
import { inject } from "@needle-di/core";
import { revalidateTag } from "next/cache";
import { ApprovalRequestsRepository } from "@/lib/repositories/approval-requests.repository";
import { AiApprovalStatus, AiApprovalDecision } from "@/lib/database/enum/ai.enum";
import { EmailService } from "./email.service";
import { MediaService } from "./media.service";
import { logger } from "@/lib/logger";
import { getEnv } from "../env";
import { AppError, ErrorCode } from "@/lib/errors";

import { renderMarkdownForEmail } from "@/lib/utils/markdown";

export interface CreateApprovalResult {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export type ApprovalDecision =
  | "approve"
  | "reject"
  | "improve"
  | "approve_content_retry_image"
  | "approve_image_revise_content";

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
    private mediaService?: MediaService,
  ) {
    if (!this.mediaService) {
      try {
        this.mediaService = inject(MediaService);
      } catch {
        // Safe when constructed directly in isolated tests
      }
    }
  }

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

    const approveBothUrl = `${siteUrl}/approve/${token}?action=approve&auto=true`;
    const approveContentRetryImageUrl = `${siteUrl}/approve/${token}?action=approve_content_retry_image&auto=true`;
    const approveImageReviseContentUrl = `${siteUrl}/approve/${token}?action=approve_image_revise_content&auto=true`;
    const rejectUrl = `${siteUrl}/approve/${token}?action=reject&auto=true`;
    const improveUrl = `${siteUrl}/approve/${token}?action=improve&auto=true`;
    const adminPreviewUrl = `${siteUrl}/admin/blog/${post.id}`;

    const sourceTopic = topicText || post.title;
    const readTime = post.readTime || "5 min read";
    const tagsList =
      post.tags && post.tags.length > 0 ? post.tags.join(", ") : "Engineering, Architecture";

    // Convert article content markdown to email-friendly HTML with 100% inline styles
    let renderedContentHtml = "";
    if (post.content) {
      try {
        renderedContentHtml = renderMarkdownForEmail(post.content);
      } catch {
        renderedContentHtml = `<p style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #334155;">${(post.content || "").replace(/\n/g, "<br/>")}</p>`;
      }
    }

    // Ensure hero image URL is canonical absolute URL for email clients
    let heroImageUrl = post.heroImage;
    if (heroImageUrl && heroImageUrl.startsWith("/")) {
      heroImageUrl = `${siteUrl}${heroImageUrl}`;
    }

    const isMissingOrPlaceholder =
      !heroImageUrl ||
      heroImageUrl.includes("default-hero") ||
      heroImageUrl.includes("fallback");

    const heroImageHtml = !isMissingOrPlaceholder && heroImageUrl
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; background: #0f172a;">
          <tr>
            <td style="padding: 0;">
              <img src="${heroImageUrl}" alt="${post.title}" width="632" style="width: 100%; max-width: 100%; height: auto; aspect-ratio: 16/9; max-height: 380px; object-fit: cover; display: block; border: 0;" />
            </td>
          </tr>
          <tr>
            <td style="background: #1e293b; padding: 8px 12px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="font-size: 11px; color: #94a3b8; font-family: sans-serif;">
                    Validated 16:9 Hero Graphic (Critic AI Verified)
                  </td>
                  <td align="right" style="font-size: 11px; font-family: sans-serif;">
                    <a href="${heroImageUrl}" target="_blank" style="color: #38bdf8; text-decoration: underline; font-weight: 600;">Full Resolution &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`
      : `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border-radius: 12px; overflow: hidden; border: 1px solid #3b82f6; background: #0f172a;">
          <tr>
            <td style="padding: 28px 20px; text-align: center; color: #ffffff; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);">
              <div style="display: inline-block; background: rgba(59, 130, 246, 0.25); border: 1px solid rgba(147, 197, 253, 0.4); border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: #93c5fd; margin-bottom: 10px;">
                16:9 Hero Graphic Notice
              </div>
              <h3 style="margin: 0 0 6px 0; font-size: 17px; font-weight: 800; color: #ffffff; line-height: 1.3;">
                ${post.title}
              </h3>
              <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.4;">
                ${heroImageUrl ? "Default Agency Graphic Active" : "Hero visual pending generation — Use 'Keep Content, Regenerate Image' below"}
              </p>
            </td>
          </tr>
        </table>`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; background: #ffffff; color: #1e293b;">
        <!-- Header (Table-based layout for Outlook/Gmail parity) -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
          <tr>
            <td align="left" style="vertical-align: middle;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(135deg, #1155cc, #22b6f6); color: white; width: 40px; height: 40px; border-radius: 10px; font-weight: 900; font-size: 16px; text-align: center; vertical-align: middle;">
                    TS
                  </td>
                  <td style="padding-left: 12px; vertical-align: middle;">
                    <span style="display: block; font-weight: 800; font-size: 16px; color: #0f172a; line-height: 1.2;">TechSonance Studio</span>
                    <span style="display: block; font-size: 11px; font-weight: 600; color: #1155cc; text-transform: uppercase; letter-spacing: 0.5px;">Editorial Pipeline & Quality Gate</span>
                  </td>
                </tr>
              </table>
            </td>
            <td align="right" style="vertical-align: middle;">
              <span style="background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 700; padding: 6px 12px; border-radius: 6px; border: 1px solid #bfdbfe; display: inline-block;">
                Action Required
              </span>
            </td>
          </tr>
        </table>

        <!-- Topic Banner -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #1155cc; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; display: block; margin-bottom: 4px;">
            Approved Source Topic
          </span>
          <span style="font-size: 15px; font-weight: 700; color: #0f172a; display: block;">
            ${sourceTopic}
          </span>
        </div>

        <!-- Hero Graphic (16:9 Containment with graceful fallback) -->
        ${heroImageHtml}

        <!-- Post Title & Excerpt -->
        <div style="margin-bottom: 20px;">
          <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 8px; line-height: 1.3;">
            ${post.title}
          </h1>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 12px 0;">
            ${post.excerpt || "Technical analysis and engineering best practices by TechSonance."}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
            <tr>
              <td align="left" style="font-size: 11px; color: #64748b; font-family: sans-serif; line-height: 1.5;">
                <strong style="color: #334155;">Read Time:</strong> ${readTime} &nbsp;•&nbsp; 
                <strong style="color: #334155;">Tags:</strong> ${tagsList}
              </td>
            </tr>
            <tr>
              <td align="left" style="padding-top: 6px; font-size: 11px; color: #64748b; font-family: monospace;">
                <span style="background: #e2e8f0; color: #1e293b; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Slug:</span> /${post.slug || "blog"}
              </td>
            </tr>
          </table>
        </div>

        <!-- 1-Click Publishing & Granular Review Actions (Full-Width Touch Targets) -->
        <div style="background: #ffffff; border: 2px solid #1155cc; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 28px; box-shadow: 0 10px 15px -3px rgba(17, 85, 204, 0.08);">
          <p style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #1e3a8a; margin-top: 0; margin-bottom: 14px;">
            Publishing Approval Actions
          </p>

          <!-- 1. Primary: Approve Both -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 14px;">
            <tr>
              <td align="center">
                <a href="${approveBothUrl}" style="display: block; width: 100%; box-sizing: border-box; padding: 14px 20px; background: #059669; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 14px; line-height: 1.3; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.25);">
                  ✓ Approve Everything (Content + Hero Graphic) &amp; Publish Live
                </a>
              </td>
            </tr>
          </table>

          <!-- Granular Review Divider -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0 12px 0;">
            <tr>
              <td style="border-bottom: 1px dashed #cbd5e1; height: 1px; width: 15%;"></td>
              <td align="center" style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; padding: 0 8px; white-space: nowrap;">
                Or Choose Granular Component Review
              </td>
              <td style="border-bottom: 1px dashed #cbd5e1; height: 1px; width: 15%;"></td>
            </tr>
          </table>

          <!-- 2. Granular Option A: Keep Text, Regenerate Image -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">
            <tr>
              <td align="center">
                <a href="${approveContentRetryImageUrl}" style="display: block; width: 100%; box-sizing: border-box; padding: 12px 18px; background: #0284c7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px; line-height: 1.3; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.2);">
                  🎨 Keep Content, Regenerate Hero Image
                </a>
                <span style="display: block; font-size: 10px; color: #64748b; margin-top: 4px; line-height: 1.3;">
                  Locks article text • Critic AI vision loop regenerates hero graphic
                </span>
              </td>
            </tr>
          </table>

          <!-- 3. Granular Option B: Keep Image, Revise Article Text -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 14px;">
            <tr>
              <td align="center">
                <a href="${approveImageReviseContentUrl}" style="display: block; width: 100%; box-sizing: border-box; padding: 12px 18px; background: #d97706; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px; line-height: 1.3; box-shadow: 0 2px 4px rgba(217, 119, 6, 0.2);">
                  ✍️ Keep Image, Revise Article Text
                </a>
                <span style="display: block; font-size: 10px; color: #64748b; margin-top: 4px; line-height: 1.3;">
                  Locks validated hero graphic • Marks article draft for content revision
                </span>
              </td>
            </tr>
          </table>

          <!-- 4. Danger Option: Reject Both -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 14px;">
            <tr>
              <td align="center">
                <a href="${rejectUrl}" style="display: block; width: 100%; box-sizing: border-box; padding: 10px 16px; background: #fff1f2; border: 1px solid #fecdd3; color: #be123c; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 12px;">
                  ✕ Reject Both &amp; Archive Entire Draft
                </a>
              </td>
            </tr>
          </table>

          <div style="padding-top: 4px; border-top: 1px solid #f1f5f9;">
            <a href="${adminPreviewUrl}" style="font-size: 12px; font-weight: 600; color: #1155cc; text-decoration: underline;">
              Open in Studio CMS Editor &rarr;
            </a>
          </div>
        </div>

        <!-- Complete Blog Content Review (Email Table Layout) -->
        <div style="margin-bottom: 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9;">
            <tr>
              <td align="left" style="vertical-align: middle;">
                <span style="font-size: 16px; font-weight: 800; color: #0f172a; font-family: sans-serif;">
                  Complete Article Draft Review
                </span>
              </td>
              <td align="right" style="vertical-align: middle;">
                <span style="font-size: 11px; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 3px 8px; border-radius: 4px; font-family: sans-serif;">
                  Full Text Preview
                </span>
              </td>
            </tr>
          </table>
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
        text: `New AI-drafted article ready for review.\n\nApproved Topic: ${sourceTopic}\nTitle: "${post.title}"\n\nEDITORIAL CHOICES:\n1. Approve Both (Content + Hero Graphic) & Publish Live:\n   ${approveBothUrl}\n\n2. Keep Content, Regenerate Hero Image:\n   ${approveContentRetryImageUrl}\n\n3. Keep Image, Revise Article Text:\n   ${approveImageReviseContentUrl}\n\n4. Reject Both & Archive:\n   ${rejectUrl}\n\nInspect in Studio CMS: ${adminPreviewUrl}`,
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
      logger.error("Exception during approval email dispatch", {
        error: String(err),
      });
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
   * Asynchronously triggers Critic AI vision loop to regenerate the hero image,
   * updates the post record via repository, and dispatches a fresh approval request.
   */
  private async triggerImageRegeneration(
    postId: string,
    postTitle: string,
    postExcerpt: string,
    feedback?: string,
    currentVersion: number = 1,
  ): Promise<void> {
    try {
      const { getContainer } = await import("@/lib/di/container");
      const { ImageStepService } = await import("./image/image-step.service");
      const { AdminPostsRepository } = await import("@/lib/repositories/admin-posts.repository");

      const container = getContainer();
      const imageStepService = container.get(ImageStepService);
      const postsRepo = container.get(AdminPostsRepository);

      const regenerationPrompt = feedback
        ? `${postTitle} (Editorial feedback: ${feedback})`
        : postTitle;

      logger.info("Triggering autonomous hero image regeneration", {
        postId,
        prompt: regenerationPrompt,
      });

      const result = await imageStepService.generateThumbnail(regenerationPrompt, {
        title: postTitle,
        summary: postExcerpt,
        contentExcerpt: postExcerpt,
      });

      if (result.url && !result.thumbnailMissing) {
        await postsRepo.updatePostWithAudit(
          postId,
          {
            heroImage: result.url,
            thumbnailAlt: result.alt,
          },
          {
            action: "AI_HERO_IMAGE_REGENERATED",
            entityType: "post",
          },
        );

        logger.info("Hero image successfully regenerated and updated in database", {
          postId,
          newUrl: result.url,
        });

        // Re-dispatch approval email with new image
        const newReq = await this.createApprovalRequest(postId, currentVersion + 1);
        await this.sendApprovalEmail(
          newReq.token,
          {
            id: postId,
            title: postTitle,
            excerpt: postExcerpt,
            heroImage: result.url,
          },
          postTitle,
        );
      }
    } catch (genErr) {
      logger.error("Failed to regenerate hero image autonomously", {
        postId,
        error: String(genErr),
      });
    }
  }

  /**
   * Asynchronously triggers the AI Content Revision pipeline when an editor requests text improvements.
   */
  private async triggerContentRevision(
    postId: string,
    feedback: string,
  ): Promise<void> {
    try {
      const { getContainer } = await import("@/lib/di/container");
      const { JobOrchestratorService } = await import("./job-orchestrator.service");

      const container = getContainer();
      const orchestrator = container.get(JobOrchestratorService);

      logger.info("Triggering autonomous content revision from editorial feedback", {
        postId,
        feedback,
      });

      await orchestrator.revisePostContent({
        postId,
        instruction: feedback,
        autoPublish: false,
      });
    } catch (revErr) {
      logger.error("Failed to execute autonomous content revision", {
        postId,
        error: String(revErr),
      });
    }
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
    const postUpdates: {
      status: string;
      publishedAt?: Date;
      heroImage?: string | null;
    } = {
      status: newStatus,
    };

    if (decision === "approve") {
      newStatus = "PUBLISHED";
      postUpdates.status = "PUBLISHED";
      postUpdates.publishedAt = now;
    } else if (decision === "reject") {
      newStatus = "ARCHIVED";
      postUpdates.status = "ARCHIVED";
      if (post.heroImage && this.mediaService) {
        try {
          await this.mediaService.moveToBin(post.heroImage, {
            retentionDays: 30,
            reason: "Post draft rejected and archived during editorial review",
          });
        } catch (binErr) {
          logger.warn("Non-blocking bin move error for rejected post hero image", {
            error: String(binErr),
          });
        }
      }
    } else if (decision === "approve_content_retry_image") {
      newStatus = "DRAFT";
      postUpdates.status = "DRAFT";
      if (post.heroImage && this.mediaService) {
        try {
          await this.mediaService.moveToBin(post.heroImage, {
            retentionDays: 30,
            reason: "Hero image rejected during editorial review; queued for AI regeneration",
          });
        } catch (binErr) {
          logger.warn("Non-blocking bin move error for rejected hero image", {
            error: String(binErr),
          });
        }
      }
      postUpdates.heroImage = null;
    } else if (decision === "approve_image_revise_content") {
      newStatus = "DRAFT";
      postUpdates.status = "DRAFT";
      logger.info("Hero graphic approved and locked; content draft flagged for revision", {
        postId: post.id,
        heroImage: post.heroImage,
      });
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

    const dbDecision =
      decision === "approve"
        ? AiApprovalDecision.APPROVE
        : decision === "reject"
          ? AiApprovalDecision.REJECT
          : AiApprovalDecision.IMPROVE;

    let formattedFeedback = feedback || null;
    if (decision === "approve_content_retry_image") {
      formattedFeedback = feedback
        ? `[APPROVED_CONTENT_RETRY_IMAGE]: ${feedback}`
        : "[APPROVED_CONTENT_RETRY_IMAGE]: Content approved. Hero image rejected for AI regeneration.";
    } else if (decision === "approve_image_revise_content") {
      formattedFeedback = feedback
        ? `[APPROVED_IMAGE_REVISE_CONTENT]: ${feedback}`
        : "[APPROVED_IMAGE_REVISE_CONTENT]: Hero graphic approved and locked. Revise article text.";
    }

    await this.approvalRepo.applyDecisionWithPostUpdate(
      req.id,
      post.id,
      {
        decision: dbDecision,
        status: approvalStatus,
        feedback: formattedFeedback,
        decidedBy,
      },
      postUpdates,
      `AI_APPROVAL_${decision.toUpperCase()}`,
    );

    if (decision === "approve_content_retry_image") {
      this.triggerImageRegeneration(
        post.id,
        post.title,
        post.excerpt || "",
        feedback,
        req.postVersion,
      ).catch((genErr) => {
        logger.error("Async hero image regeneration error", {
          postId: post.id,
          error: String(genErr),
        });
      });
    }

    if (decision === "approve_image_revise_content" || decision === "improve") {
      if (feedback && feedback.trim()) {
        this.triggerContentRevision(
          post.id,
          feedback,
        ).catch((revErr) => {
          logger.error("Async content revision error", {
            postId: post.id,
            error: String(revErr),
          });
        });
      }
    }

    if (decision === "approve") {
      try {
        revalidateTag("posts", "default");
        if (post.slug) {
          revalidateTag(`post:${post.slug}`, "default");
        }
      } catch (err) {
        logger.warn("Edge revalidation error on approval", {
          error: String(err),
        });
      }

      // Phase 5: Publishing & Scheduler Reset
      // Automatically pick up the next scheduled draft in the queue and restart the cycle
      try {
        const { getContainer } = await import("@/lib/di/container");
        const { AdminTopicsService } = await import("./admin-topics.service");
        const topicsService = getContainer().get(AdminTopicsService);
        topicsService.autoGenerateNextTopic().catch((iterErr) => {
          logger.info("Autonomous next iteration: Queue empty or already scheduled", {
            detail: String(iterErr),
          });
        });
      } catch (iterErr) {
        logger.warn("Non-blocking scheduler reset error on approval", {
          error: String(iterErr),
        });
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
