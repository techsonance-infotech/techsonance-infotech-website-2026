import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminTopicsService } from "../lib/services/admin-topics.service";
import { AdminPromptsService } from "../lib/services/admin-prompts.service";
import { AdminTelemetryService } from "../lib/services/admin-telemetry.service";
import { AiTopicStatus } from "../lib/database/enum/ai.enum";

describe("Phase 4: Admin Topics, Prompts & Telemetry Services", () => {
  let mockDb: any;
  let mockAiWriter: any;
  let mockJobOrchestrator: any;
  let topicsService: AdminTopicsService;
  let promptsService: AdminPromptsService;
  let telemetryService: AdminTelemetryService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      query: {
        sitesTable: {
          findFirst: vi.fn().mockResolvedValue({ id: "site-1", domain: "techsonance.co.in" }),
        },
        topicsTable: {
          findFirst: vi.fn().mockResolvedValue({
            id: "t1",
            title: "Real-time AI Agents with Next.js 16",
            status: AiTopicStatus.ACCEPTED,
            category: "Engineering",
            keywords: ["Next.js", "AI"],
          }),
        },
        promptTemplatesTable: {
          findFirst: vi.fn().mockResolvedValue({
            id: "pt1",
            stepName: "outline",
            version: 1,
            systemPrompt: "Default system prompt",
            userPromptTemplate: "Default template",
            isActive: true,
          }),
        },
      },
      select: vi.fn().mockImplementation(() => {
        const queryChain: any = {};
        const resolvedData = [
          {
            id: "t1",
            title: "Real-time AI Agents with Next.js 16",
            status: AiTopicStatus.ACCEPTED,
            stepName: "outline",
            version: 1,
            isActive: true,
            systemPrompt: "Default system prompt",
            userPromptTemplate: "Default template",
          },
        ];

        queryChain.from = vi.fn().mockReturnValue(queryChain);
        queryChain.where = vi.fn().mockReturnValue(queryChain);
        queryChain.orderBy = vi.fn().mockReturnValue(queryChain);
        queryChain.limit = vi.fn().mockReturnValue(queryChain);
        queryChain.offset = vi.fn().mockResolvedValue(resolvedData);
        queryChain.then = (resolve: any, reject: any) =>
          Promise.resolve(resolvedData).then(resolve, reject);

        return queryChain;
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: "new-id",
              title: "New Topic",
              status: AiTopicStatus.ACCEPTED,
              stepName: "outline",
              version: 1,
            },
          ]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: "t1",
                status: AiTopicStatus.QUEUED,
                version: 2,
              },
            ]),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(true),
      }),
    };

    mockAiWriter = {
      generateRaw: vi.fn().mockResolvedValue(
        JSON.stringify([
          {
            title: "Scaling Turbopack in Monorepos",
            keywords: ["Turbopack", "Monorepo"],
            category: "Full-Stack",
            targetAudience: "Tech Leads",
            difficulty: "advanced",
          },
        ])
      ),
    };

    mockJobOrchestrator = {
      createJob: vi.fn().mockResolvedValue({ id: "job-12345" }),
      executeJob: vi.fn().mockResolvedValue({ success: true, postId: "post-1" }),
    };

    topicsService = new AdminTopicsService(
      mockDb,
      mockAiWriter as any,
      mockJobOrchestrator as any
    );

    promptsService = new AdminPromptsService(mockDb);
    telemetryService = new AdminTelemetryService(mockDb);
  });

  describe("AdminTopicsService", () => {
    it("creates an accepted topic when created by admin", async () => {
      const topic = await topicsService.createTopic({
        title: "Test Topic",
        category: "Cloud",
        keywords: ["AWS", "Vercel"],
        suggestedBy: "admin",
      });

      expect(topic.id).toBe("new-id");
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("updates topic status", async () => {
      const updated = await topicsService.updateTopicStatus("t1", AiTopicStatus.QUEUED);
      expect(updated.status).toBe(AiTopicStatus.QUEUED);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it("launches topic generation and marks topic as QUEUED", async () => {
      const result = await topicsService.launchTopicGeneration("t1");
      expect(result.jobId).toBe("job-12345");
      expect(mockJobOrchestrator.createJob).toHaveBeenCalledWith(
        expect.objectContaining({
          topicText: "Real-time AI Agents with Next.js 16",
        })
      );
    });

    it("suggests topics via AI and stores them as SUGGESTED", async () => {
      const suggested = await topicsService.suggestTopicsWithAI("Agentic AI");
      expect(mockAiWriter.generateRaw).toHaveBeenCalled();
      expect(suggested.length).toBeGreaterThan(0);
    });
  });

  describe("AdminPromptsService", () => {
    it("retrieves template by step", async () => {
      const template = await promptsService.getTemplateByStep("outline");
      expect(template?.stepName).toBe("outline");
      expect(template?.version).toBe(1);
    });

    it("updates template and increments version", async () => {
      const updated = await promptsService.updateTemplate("outline", {
        systemPrompt: "New prompt",
        userPromptTemplate: "New user template",
        temperature: 80,
      });

      expect(updated).toBeDefined();
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe("AdminTelemetryService", () => {
    it("records a usage event", async () => {
      const event = await telemetryService.recordEvent({
        jobId: "job-12345",
        stepName: "outline",
        provider: "gemini",
        model: "gemini-2.5-flash",
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        durationMs: 450,
        status: "SUCCESS",
      });

      expect(event.id).toBe("new-id");
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });
});
