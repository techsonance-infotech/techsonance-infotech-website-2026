import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/admin/blog/posts/[id]/ai-revise/route";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { JobOrchestratorService } from "@/lib/services/job-orchestrator.service";

describe("POST /api/admin/blog/posts/[id]/ai-revise", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPostId = "e6b440c9-f3f6-4cc4-b9ae-42a391d8098d";

  it("returns 401 when request is unauthenticated", async () => {
    const mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(null),
      hasPermission: vi.fn().mockReturnValue(false),
    };

    const container = getContainer();
    vi.spyOn(container, "get").mockImplementation((token: unknown) => {
      if (token === AdminAuthService) return mockAuthService as unknown;
      return {} as unknown;
    });

    const req = new Request(`http://localhost:3000/api/admin/blog/posts/${validPostId}/ai-revise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruction: "Fix the broken Mermaid diagrams" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("returns 403 when user lacks editor permission", async () => {
    const mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue({ userId: "u-1", role: "viewer" }),
      hasPermission: vi.fn().mockReturnValue(false),
    };

    const container = getContainer();
    vi.spyOn(container, "get").mockImplementation((token: unknown) => {
      if (token === AdminAuthService) return mockAuthService as unknown;
      return {} as unknown;
    });

    const req = new Request(`http://localhost:3000/api/admin/blog/posts/${validPostId}/ai-revise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruction: "Fix the broken Mermaid diagrams" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("returns 400 when instruction is too short", async () => {
    const mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue({ userId: "u-1", role: "editor" }),
      hasPermission: vi.fn().mockReturnValue(true),
    };

    const container = getContainer();
    vi.spyOn(container, "get").mockImplementation((token: unknown) => {
      if (token === AdminAuthService) return mockAuthService as unknown;
      return {} as unknown;
    });

    const req = new Request(`http://localhost:3000/api/admin/blog/posts/${validPostId}/ai-revise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruction: "bad" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("successfully triggers content revision and returns 200 with result payload", async () => {
    const mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue({ userId: "u-1", role: "editor" }),
      hasPermission: vi.fn().mockReturnValue(true),
    };

    const mockOrchestrator = {
      revisePostContent: vi.fn().mockResolvedValue({
        success: true,
        postId: validPostId,
        status: "IN_REVIEW",
        summary: "Updated Mermaid diagrams to valid sequenceDiagram format without label collisions.",
      }),
    };

    const container = getContainer();
    vi.spyOn(container, "get").mockImplementation((token: unknown) => {
      if (token === AdminAuthService) return mockAuthService as unknown;
      if (token === JobOrchestratorService) return mockOrchestrator as unknown;
      return {} as unknown;
    });

    const req = new Request(`http://localhost:3000/api/admin/blog/posts/${validPostId}/ai-revise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instruction: "Fix the Mermaid architecture diagrams in Section 4 and 5",
        targetSectionHeading: "4. Full request-response flow diagram",
        autoPublish: false,
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validPostId }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.success).toBe(true);
    expect(json.data.summary).toContain("Updated Mermaid diagrams");
    expect(mockOrchestrator.revisePostContent).toHaveBeenCalledWith({
      postId: validPostId,
      instruction: "Fix the Mermaid architecture diagrams in Section 4 and 5",
      targetSectionHeading: "4. Full request-response flow diagram",
      autoPublish: false,
    });
  });
});
