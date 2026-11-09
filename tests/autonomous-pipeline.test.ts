import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIWriterService } from "../lib/services/ai-writer.service";
import { ApprovalService } from "../lib/services/approval.service";
import { JobOrchestratorService } from "../lib/services/job-orchestrator.service";
import { ApprovalRequestsRepository } from "../lib/repositories/approval-requests.repository";
import { GenerationJobsRepository } from "../lib/repositories/generation-jobs.repository";
import { AdminPostsRepository } from "../lib/repositories/admin-posts.repository";
import type { Database } from "../lib/database/index";
import type { EmailService } from "../lib/services/email.service";

describe("Autonomous Blog Pipeline & Approval Flow (FD-1 to FD-5)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("AIWriterService Quality Validation", () => {
    const writerService = new AIWriterService({} as any);

    it("accepts a well-formed article exceeding 300 words without boilerplate", () => {
      const longContent = Array(350).fill("architecture").join(" ");
      const result = writerService.validateArticle({
        title: "Next.js 16 Micro-Frontends at Scale",
        slug: "nextjs-16-micro-frontends",
        content: `## Introduction\n\n${longContent}\n\n## Conclusion`,
      });

      expect(result.valid).toBe(true);
      expect(result.wordCount).toBeGreaterThan(300);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects an article with insufficient word count", () => {
      const result = writerService.validateArticle({
        title: "Short Note",
        slug: "short-note",
        content: "This is a tiny note with only a few words.",
      });

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("too short");
    });

    it("rejects boilerplate and AI hallucination patterns", () => {
      const longContent = Array(350).fill("engineering").join(" ");
      const result = writerService.validateArticle({
        title: "Building Real-time Systems",
        slug: "building-real-time-systems",
        content: `Lorem ipsum dolor sit amet. As an AI language model, I recommend ${longContent}`,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("disallowed boilerplate"))).toBe(true);
    });
  });

  describe("ApprovalService Token Security & Decision Transitions", () => {
    it("creates a secure 32-byte hex token and inserts its sha256 hash", async () => {
      const mockInsertValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "req-1" }]),
      });
      const mockDb = {
        insert: vi.fn(() => ({ values: mockInsertValues })),
      } as unknown as Database;

      const approvalRepo = new ApprovalRequestsRepository(mockDb);
      const approvalService = new ApprovalService(approvalRepo, {} as EmailService);

      const res = await approvalService.createApprovalRequest("post-123", 1);

      expect(res.token).toHaveLength(64); // 32 bytes hex = 64 characters
      expect(res.tokenHash).toHaveLength(64); // sha256 = 64 characters
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: "post-123",
          postVersion: 1,
          tokenHash: res.tokenHash,
          status: "PENDING",
        }),
      );
    });

    it("prevents double-decision on already used approval requests", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: "req-1",
                  usedAt: new Date(), // Already used!
                  expiresAt: new Date(Date.now() + 100000),
                },
              ]),
            }),
          }),
        }),
        query: {
          approvalRequestsTable: {
            findFirst: vi.fn().mockResolvedValue({
              id: "req-1",
              usedAt: new Date(), // Already used!
              expiresAt: new Date(Date.now() + 100000),
            }),
          },
        },
      } as unknown as Database;

      const approvalRepo = new ApprovalRequestsRepository(mockDb);
      const approvalService = new ApprovalService(approvalRepo, {} as EmailService);

      await expect(approvalService.decide("fake-token", "approve")).rejects.toThrow(
        "already been used",
      );
    });
  });

  describe("JobOrchestratorService Job Creation", () => {
    it("creates an autonomous generation job queued at outline step", async () => {
      const mockJob = {
        id: "job-101",
        topicText: "Distributed Caching with Redis",
        status: "QUEUED",
        currentStep: "outline",
      };

      const mockDb = {
        query: {
          sitesTable: {
            findFirst: vi.fn().mockResolvedValue({ id: "site-1" }),
          },
        },
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([mockJob]),
          })),
        })),
      } as unknown as Database;

      const jobsRepo = new GenerationJobsRepository(mockDb);
      const postsRepo = new AdminPostsRepository(mockDb);
      const orchestrator = new JobOrchestratorService(
        jobsRepo,
        postsRepo,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
      );

      const job = await orchestrator.createJob({
        topicText: "Distributed Caching with Redis",
        category: "Cloud Infrastructure",
      });

      expect(job.id).toBe("job-101");
      expect(job.status).toBe("QUEUED");
      expect(job.currentStep).toBe("outline");
    });
  });
});
