import { describe, it, expect, vi, beforeEach } from "vitest";
import { ImageStepService } from "@/lib/services/image/image-step.service";
import { MediaService } from "@/lib/services/media.service";
import { AIWriterService } from "@/lib/services/ai-writer.service";
import { renderMarkdownForEmail } from "@/lib/utils/markdown";

describe("Blog Pipeline Architecture & Audit Verification", () => {
  describe("1. Email-to-Web Disconnect & Markdown Rendering", () => {
    it("renders markdown to bulletproof inline-styled HTML without script tags or broken flex classes", () => {
      const markdown = `
# System Architecture
This is an introductory paragraph explaining edge systems.

\`\`\`mermaid
flowchart TD
  A[Client] --> B[API Gateway]
  B --> C[Postgres]
\`\`\`

> Enterprise reliability note

| Feature | Status |
| --- | --- |
| Critic AI | Active |
`;

      const html = renderMarkdownForEmail(markdown);

      // Verify no broken flexbox classes in email output
      expect(html).not.toContain("<script");
      expect(html).not.toContain("copy-code-btn");
      expect(html).toContain("font-family:");
      expect(html).toContain("Architecture Diagram");
      expect(html).toContain("Critic AI");
      expect(html).toContain("Active");
    });
  });

  describe("2. Critic AI Quality Gate & Reprompting Loop", () => {
    let mockMediaService: MediaService;
    let mockAiWriter: AIWriterService;

    beforeEach(() => {
      mockMediaService = {
        uploadImage: vi.fn().mockResolvedValue({
          secureUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
          publicId: "sample_id",
        }),
        deleteImage: vi.fn().mockResolvedValue(true),
      } as unknown as MediaService;

      mockAiWriter = {
        generateVisualBrief: vi.fn().mockResolvedValue({
          core_concept: "Autonomous Agents",
          visual_metaphor: "Isometric servers",
          key_objects: ["servers", "nodes"],
          mood: "sleek",
          color_palette: ["navy", "cyan"],
          composition: "isometric",
          must_include: ["servers"],
          must_avoid: ["text"],
        }),
        composeFluxPrompt: vi.fn().mockResolvedValue("Isometric 3D servers, no text, no letters"),
        composeRetryPrompt: vi
          .fn()
          .mockResolvedValue(
            "Revised isometric 3D servers with emerald accents, no text, no letters",
          ),
        verifyHeroImage: vi
          .fn()
          // First attempt fails quality gate
          .mockResolvedValueOnce({
            verdict: "fail",
            scores: {
              relevance: 5,
              intent_match: 6,
              composition: 6,
              technical_quality: 5,
              brand_fit: 6,
              safety: 9,
            },
            average: 6.2,
            detected_text: "Unwanted text",
            watermark_present: true,
            seen: "A blurry logo",
            issues: ["Detected text", "Watermark present"],
            fix_instructions: "Remove lettering and watermarks",
          })
          // Second attempt passes with flying colors
          .mockResolvedValueOnce({
            verdict: "pass",
            scores: {
              relevance: 9,
              intent_match: 9,
              composition: 9,
              technical_quality: 9,
              brand_fit: 9,
              safety: 10,
            },
            average: 9.2,
            detected_text: null,
            watermark_present: false,
            seen: "Clean isometric servers",
            issues: [],
            fix_instructions: "",
          }),
      } as unknown as AIWriterService;
    });

    it("triggers self-correction reprompting loop when Critic AI rejects attempt 1 and accepts attempt 2", async () => {
      const service = new ImageStepService(mockMediaService, mockAiWriter);

      // Mock adapters to return buffer
      (service as any).cfAdapter = {
        generateImage: vi.fn().mockResolvedValue(Buffer.from("fake-image-bytes-1234567890")),
      };

      const result = await service.generateThumbnail("base prompt", {
        title: "Autonomous Agents",
        summary: "Article about agentic AI",
      });

      expect(mockAiWriter.verifyHeroImage).toHaveBeenCalledTimes(2);
      expect(mockAiWriter.composeRetryPrompt).toHaveBeenCalledTimes(1);
      expect(mockMediaService.uploadImage).toHaveBeenCalledTimes(1);
      expect(result.thumbnailMissing).toBe(false);
      expect(result.url).toBe("https://res.cloudinary.com/demo/image/upload/sample.jpg");
    });

    it("falls back gracefully to curated placeholder when all 3 attempts fail without infinite looping", async () => {
      // Configure Critic AI to fail all attempts
      (mockAiWriter.verifyHeroImage as any).mockReset().mockResolvedValue({
        verdict: "fail",
        scores: {
          relevance: 4,
          intent_match: 4,
          composition: 4,
          technical_quality: 4,
          brand_fit: 4,
          safety: 6,
        },
        average: 4.3,
        detected_text: "bad text",
        watermark_present: true,
        seen: "poor image",
        issues: ["Severely distorted"],
        fix_instructions: "Simplify",
      });

      const service = new ImageStepService(mockMediaService, mockAiWriter);
      (service as any).cfAdapter = {
        generateImage: vi.fn().mockResolvedValue(Buffer.from("fake-bytes-1234567890")),
      };

      const result = await service.generateThumbnail("base prompt", {
        title: "Autonomous Agents",
        summary: "Article about agentic AI",
      });

      // Exactly 3 attempts, no infinite loop
      expect(mockAiWriter.verifyHeroImage).toHaveBeenCalledTimes(3);
      expect(mockMediaService.uploadImage).not.toHaveBeenCalled();
      expect(result.thumbnailMissing).toBe(true);
      expect(result.url).toBe("/images/blog/default-hero.jpg");
    });
  });

  describe("3. Storage & Orphaned Asset Prevention (Recycle Bin / 15-30 Day Retention)", () => {
    it("MediaService deleteImage moves image to recycle bin for 30 days by default instead of direct hard delete", async () => {
      const mediaService = new MediaService({} as any);
      const publicId = "test_asset_for_bin_30d";

      // By default, soft-deletes into bin with 30-day retention
      await mediaService.deleteImage(publicId);

      const binnedItems = mediaService.listBin();
      const item = binnedItems.find((i) => i.publicId === publicId);

      expect(item).toBeDefined();
      expect(item?.retentionDays).toBe(30);
      expect(item?.status).toBe("in_bin");

      // Verify purge date is ~30 days in the future
      const binnedDate = new Date(item!.binnedAt);
      const purgeDate = new Date(item!.purgeAt);
      const diffDays = Math.round(
        (purgeDate.getTime() - binnedDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(diffDays).toBe(30);
    });

    it("MediaService supports 15-day retention window when explicitly requested", async () => {
      const mediaService = new MediaService({} as any);
      const publicId = "test_asset_for_bin_15d";

      await mediaService.moveToBin(publicId, { retentionDays: 15 });

      const item = mediaService.listBin().find((i) => i.publicId === publicId);
      expect(item).toBeDefined();
      expect(item?.retentionDays).toBe(15);
    });

    it("MediaService restoreFromBin marks item as restored and un-bins it", async () => {
      const mediaService = new MediaService({} as any);
      const publicId = "test_asset_to_restore";

      await mediaService.moveToBin(publicId);
      expect(mediaService.listBin().some((i) => i.publicId === publicId)).toBe(true);

      await mediaService.restoreFromBin(publicId);
      expect(mediaService.listBin().some((i) => i.publicId === publicId)).toBe(false);
    });

    it("cleanupExpiredTrash only purges items whose retention period has elapsed", async () => {
      const mediaService = new MediaService({} as any);

      // Create an expired item by simulating past purge date
      const expiredId = "expired_asset_to_purge";
      await mediaService.moveToBin(expiredId);

      // Artificially age the item past its retention window
      const item = (MediaService as any).binnedLedger.get(expiredId);
      item.purgeAt = new Date(Date.now() - 1000).toISOString();

      // Mock hardDeleteImage to return true for unit test
      vi.spyOn(mediaService, "hardDeleteImage").mockResolvedValue(true);

      const result = await mediaService.cleanupExpiredTrash();
      expect(result.purgedIds).toContain(expiredId);
      expect(result.purgedCount).toBeGreaterThanOrEqual(1);
    });

    it("MediaService deleteImage returns false when credentials are unset or invalid for hard delete", async () => {
      const mediaService = new MediaService({} as any);
      const res = await mediaService.deleteImage("some_public_id", { immediate: true });
      expect(res).toBe(false);
    });
  });

  describe("4. Granular Editorial Choices (Decoupled Content vs Hero Image Review)", () => {
    it("ApprovalService dispatches email containing all 4 granular action choices", async () => {
      const { ApprovalService } = await import("@/lib/services/approval.service");
      const mockApprovalRepo = {
        create: vi.fn().mockResolvedValue({ id: "req-1" }),
        updateEmailStatus: vi.fn().mockResolvedValue(undefined),
      };
      const mockEmailService = {
        sendMail: vi.fn().mockResolvedValue({ ok: true, messageId: "msg-1" }),
      };

      const approvalService = new ApprovalService(mockApprovalRepo as any, mockEmailService as any);

      await approvalService.sendApprovalEmail("test-token-123", {
        id: "post-1",
        title: "Microservices with Rust & Next.js",
        excerpt: "An architectural review",
        heroImage: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      });

      expect(mockEmailService.sendMail).toHaveBeenCalled();
      const callArgs = mockEmailService.sendMail.mock.calls[0][0];

      // Verify all 4 action links are present in both HTML and plain text
      expect(callArgs.html).toContain("action=approve");
      expect(callArgs.html).toContain("action=approve_content_retry_image");
      expect(callArgs.html).toContain("action=approve_image_revise_content");
      expect(callArgs.html).toContain("action=reject");

      expect(callArgs.text).toContain("action=approve");
      expect(callArgs.text).toContain("action=approve_content_retry_image");
      expect(callArgs.text).toContain("action=approve_image_revise_content");
      expect(callArgs.text).toContain("action=reject");
    });

    it("ApprovalService decide handles 'approve_content_retry_image' by moving old hero image to trash bin and setting status to DRAFT", async () => {
      const { ApprovalService } = await import("@/lib/services/approval.service");
      const heroImageUrl = "https://res.cloudinary.com/demo/image/upload/hero.jpg";

      const mockApprovalRepo = {
        findByTokenHash: vi.fn().mockResolvedValue({
          request: {
            id: "req-123",
            usedAt: null,
            expiresAt: new Date(Date.now() + 3600000),
            postVersion: 1,
          },
          post: {
            id: "post-123",
            title: "Distributed Caching",
            status: "DRAFT",
            heroImage: heroImageUrl,
          },
        }),
        applyDecisionWithPostUpdate: vi.fn().mockResolvedValue(undefined),
      };

      const mockMediaService = {
        moveToBin: vi.fn().mockResolvedValue(true),
      };

      const approvalService = new ApprovalService(
        mockApprovalRepo as any,
        {} as any,
        mockMediaService as any,
      );

      // Spy on triggerImageRegeneration to prevent background work in unit test
      (approvalService as any).triggerImageRegeneration = vi.fn().mockResolvedValue(undefined);

      const result = await approvalService.decide(
        "token-abc",
        "approve_content_retry_image",
        "Make it darker and more isometric",
      );

      expect(result.success).toBe(true);
      expect(result.decision).toBe("approve_content_retry_image");
      expect(result.newStatus).toBe("DRAFT");

      // Verify rejected image moved to 30-day recycle bin
      expect(mockMediaService.moveToBin).toHaveBeenCalledWith(
        heroImageUrl,
        expect.objectContaining({
          retentionDays: 30,
          reason: expect.stringContaining("Hero image rejected"),
        }),
      );

      // Verify post update cleared heroImage and recorded structured feedback
      expect(mockApprovalRepo.applyDecisionWithPostUpdate).toHaveBeenCalledWith(
        "req-123",
        "post-123",
        expect.objectContaining({
          decision: "improve",
          feedback: expect.stringContaining("[APPROVED_CONTENT_RETRY_IMAGE]"),
        }),
        expect.objectContaining({
          status: "DRAFT",
          heroImage: null,
        }),
        "AI_APPROVAL_APPROVE_CONTENT_RETRY_IMAGE",
      );
    });

    it("ApprovalService decide handles 'approve_image_revise_content' by locking hero image and recording content feedback", async () => {
      const { ApprovalService } = await import("@/lib/services/approval.service");
      const heroImageUrl = "https://res.cloudinary.com/demo/image/upload/verified-hero.jpg";

      const mockApprovalRepo = {
        findByTokenHash: vi.fn().mockResolvedValue({
          request: {
            id: "req-456",
            usedAt: null,
            expiresAt: new Date(Date.now() + 3600000),
            postVersion: 1,
          },
          post: {
            id: "post-456",
            title: "Database Indexing",
            status: "DRAFT",
            heroImage: heroImageUrl,
          },
        }),
        applyDecisionWithPostUpdate: vi.fn().mockResolvedValue(undefined),
      };

      const mockMediaService = {
        moveToBin: vi.fn(),
      };

      const approvalService = new ApprovalService(
        mockApprovalRepo as any,
        {} as any,
        mockMediaService as any,
      );

      const result = await approvalService.decide(
        "token-def",
        "approve_image_revise_content",
        "Deepen section 2 with benchmarks",
      );

      expect(result.success).toBe(true);
      expect(result.decision).toBe("approve_image_revise_content");

      // Hero image is approved, so it MUST NOT be moved to bin!
      expect(mockMediaService.moveToBin).not.toHaveBeenCalled();

      // Verify post update preserved hero image and recorded feedback
      expect(mockApprovalRepo.applyDecisionWithPostUpdate).toHaveBeenCalledWith(
        "req-456",
        "post-456",
        expect.objectContaining({
          decision: "improve",
          feedback: expect.stringContaining("[APPROVED_IMAGE_REVISE_CONTENT]"),
        }),
        expect.objectContaining({
          status: "DRAFT",
        }),
        "AI_APPROVAL_APPROVE_IMAGE_REVISE_CONTENT",
      );
    });
  });
});
