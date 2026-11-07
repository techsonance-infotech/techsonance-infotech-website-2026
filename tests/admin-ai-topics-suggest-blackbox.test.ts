import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as suggestTopicsPOST } from "@/app/api/admin/ai/topics/suggest/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminTopicsService } from "@/lib/services/admin-topics.service";
import { AiTopicStatus } from "@/lib/constants/enums/ai.enum";
import { ErrorCode } from "@/lib/errors";
import { AI_TOPICS_ERRORS } from "@/lib/constants/ai.constants";

describe("POST /api/admin/ai/topics/suggest — Black Box Integration Tests", () => {
  let mockAuthService: any;
  let mockTopicsService: any;

  const sampleEditorSession = {
    userId: "admin-uuid-1111",
    email: "editor@techsonance.co.in",
    role: "editor",
    site: { id: "site-uuid-1111" },
  };

  const sampleViewerSession = {
    userId: "viewer-uuid-2222",
    email: "viewer@techsonance.co.in",
    role: "viewer",
    site: { id: "site-uuid-1111" },
  };

  const sampleAuthorSession = {
    userId: "author-uuid-3333",
    email: "author@techsonance.co.in",
    role: "author",
    site: { id: "site-uuid-1111" },
  };

  const sampleGeneratedTopics = [
    {
      id: "topic-uuid-1",
      siteId: "site-uuid-1111",
      title: "Building Production Multi-Agent Systems with Next.js 16",
      keywords: ["Multi-Agent AI", "Next.js 16", "Needle DI"],
      category: "Agentic AI",
      targetAudience: "Engineering Leads",
      difficulty: "advanced",
      status: AiTopicStatus.SUGGESTED,
      suggestedBy: "ai",
      priority: 1,
      notes: "Curated agency topic recommendation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "topic-uuid-2",
      siteId: "site-uuid-1111",
      title: "Zero-Downtime Migration from Zod 3 to Zod 4",
      keywords: ["Zod 4", "Validation", "TypeScript"],
      category: "Full-Stack",
      targetAudience: "Software Engineers",
      difficulty: "intermediate",
      status: AiTopicStatus.SUGGESTED,
      suggestedBy: "ai",
      priority: 1,
      notes: "High SEO developer search intent",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    resetRootContainer();

    mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(sampleEditorSession),
      hasPermission: vi.fn().mockImplementation((role: string, required: string) => {
        const hierarchy: Record<string, number> = {
          viewer: 1,
          author: 2,
          editor: 3,
          admin: 4,
          owner: 5,
        };
        return (hierarchy[role] ?? 0) >= (hierarchy[required] ?? 99);
      }),
    };

    mockTopicsService = {
      suggestTopicsWithAI: vi.fn().mockResolvedValue(sampleGeneratedTopics),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService });
    container.bind({ provide: AdminTopicsService, useValue: mockTopicsService });
  });

  // ─── SECURITY & ORIGIN TESTS ──────────────────────────────────────────────

  it("1. Rejects request with foreign origin with 403 Forbidden", async () => {
    const req = new Request("http://localhost:3000/api/admin/ai/topics/suggest", {
      method: "POST",
      headers: {
        origin: "https://malicious-attacker.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category: "Agentic AI" }),
    });

    const res = await suggestTopicsPOST(req as any);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(AI_TOPICS_ERRORS.FORBIDDEN_ORIGIN);
  });

  // ─── AUTHENTICATION & RBAC TESTS ──────────────────────────────────────────

  it("2. Rejects unauthenticated request with 401 Unauthenticated", async () => {
    mockAuthService.getCurrentSession.mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/admin/ai/topics/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "Agentic AI" }),
    });

    const res = await suggestTopicsPOST(req as any);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    expect(json.error.message).toBe(AI_TOPICS_ERRORS.UNAUTHORIZED);
  });

  it("3. Rejects viewer role with 403 Forbidden", async () => {
    mockAuthService.getCurrentSession.mockResolvedValue(sampleViewerSession);

    const req = new Request("http://localhost:3000/api/admin/ai/topics/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "Agentic AI" }),
    });

    const res = await suggestTopicsPOST(req as any);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(AI_TOPICS_ERRORS.FORBIDDEN_ROLE);
  });

  it("4. Rejects author role with 403 Forbidden", async () => {
    mockAuthService.getCurrentSession.mockResolvedValue(sampleAuthorSession);

    const req = new Request("http://localhost:3000/api/admin/ai/topics/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "Agentic AI" }),
    });

    const res = await suggestTopicsPOST(req as any);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(AI_TOPICS_ERRORS.FORBIDDEN_ROLE);
  });

  // ─── VALIDATION TESTS ─────────────────────────────────────────────────────

  it("5. Rejects malformed JSON body with 400 Bad Request", async () => {
    const req = new Request("http://localhost:3000/api/admin/ai/topics/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ not-a-json ",
    });

    const res = await suggestTopicsPOST(req as any);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.BAD_REQUEST);
  });

  it("6. Rejects overly long category (> 100 chars) with 422 Validation Error", async () => {
    const req = new Request("http://localhost:3000/api/admin/ai/topics/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "A".repeat(150) }),
    });

    const res = await suggestTopicsPOST(req as any);
    expect(res.status).toBe(422);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.fieldErrors).toBeDefined();
    expect(json.error.fieldErrors.category).toBeDefined();
  });

  it("7. Rejects unexpected properties with 422 (strictObject)", async () => {
    const req = new Request("http://localhost:3000/api/admin/ai/topics/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "Agentic AI", maliciousExtraKey: true }),
    });

    const res = await suggestTopicsPOST(req as any);
    expect(res.status).toBe(422);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
  });

  // ─── SUCCESSFUL SUGGESTION TESTS ──────────────────────────────────────────

  it("8. Generates topic suggestions successfully with custom category", async () => {
    const req = new Request("http://localhost:3000/api/admin/ai/topics/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "Distributed Systems" }),
    });

    const res = await suggestTopicsPOST(req as any);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.success).toBe(true);
    expect(json.count).toBe(2);
    expect(json.topics).toHaveLength(2);
    expect(json.data.count).toBe(2);
    expect(json.data.topics).toHaveLength(2);

    expect(mockTopicsService.suggestTopicsWithAI).toHaveBeenCalledWith("Distributed Systems");
  });

  it("9. Generates topic suggestions with default category when body is empty", async () => {
    const req = new Request("http://localhost:3000/api/admin/ai/topics/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "",
    });

    const res = await suggestTopicsPOST(req as any);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.count).toBe(2);
    expect(mockTopicsService.suggestTopicsWithAI).toHaveBeenCalledWith("Full-Stack & Agentic AI");
  });

  it("10. Handles internal service error cleanly with 500 status", async () => {
    mockTopicsService.suggestTopicsWithAI.mockRejectedValue(new Error("LLM provider timeout"));

    const req = new Request("http://localhost:3000/api/admin/ai/topics/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "Agentic AI" }),
    });

    const res = await suggestTopicsPOST(req as any);
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.INTERNAL);
    expect(json.error.message).toBe(AI_TOPICS_ERRORS.SUGGEST_FAILED);
  });
});
