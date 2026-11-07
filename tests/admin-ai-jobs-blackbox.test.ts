import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/admin/ai/jobs/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { JobOrchestratorService } from "@/lib/services/job-orchestrator.service";
import { AiJobStatus, AiJobStep } from "@/lib/constants/enums/ai.enum";
import { ErrorCode } from "@/lib/errors";
import { AI_JOBS_ERRORS, AI_JOBS_MESSAGES } from "@/lib/constants/ai.constants";

describe("GET & POST /api/admin/ai/jobs — Black Box Integration Tests", () => {
  let mockAuthService: any;
  let mockOrchestrator: any;
  let backgroundExecutionTriggered: string | null = null;

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

  const sampleJobs = [
    {
      id: "job-uuid-101",
      siteId: "site-uuid-1111",
      topicText: "Autonomous Multi-Agent Orchestration Patterns",
      category: "Engineering",
      status: AiJobStatus.COMPLETED,
      currentStep: AiJobStep.COMPLETED,
      attempt: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "job-uuid-102",
      siteId: "site-uuid-1111",
      topicText: "PostgreSQL 17 B-Tree Query Optimization",
      category: "Architecture",
      status: AiJobStatus.RUNNING,
      currentStep: AiJobStep.SECTIONS,
      attempt: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    resetRootContainer();
    backgroundExecutionTriggered = null;

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
        return (hierarchy[role] ?? 0) >= (hierarchy[required] ?? 0);
      }),
    };

    mockOrchestrator = {
      listJobs: vi.fn().mockResolvedValue(sampleJobs),
      createJob: vi.fn().mockImplementation(async (options: any) => {
        return {
          id: "job-new-uuid-999",
          siteId: options.siteId || "site-uuid-1111",
          topicText: options.topicText,
          category: options.category || "Engineering",
          status: AiJobStatus.QUEUED,
          currentStep: AiJobStep.OUTLINE,
          attempt: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }),
      executeJob: vi.fn().mockImplementation(async (id: string) => {
        backgroundExecutionTriggered = id;
        return { success: true };
      }),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService });
    container.bind({ provide: JobOrchestratorService, useValue: mockOrchestrator });
  });

  // ─── GET /api/admin/ai/jobs ──────────────────────────────────────────────────

  it("1. GET rejects unauthenticated request with 401 UNAUTHENTICATED", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const req = new Request("http://localhost:3000/api/admin/ai/jobs", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    expect(json.error.message).toBe(AI_JOBS_ERRORS.UNAUTHORIZED);
    expect(res.headers.get("x-request-id")).toBeDefined();
  });

  it("2. GET rejects untrusted foreign origin with 403 FORBIDDEN", async () => {
    const req = new Request("http://localhost:3000/api/admin/ai/jobs", {
      method: "GET",
      headers: { origin: "https://malicious-site.example" },
    });

    const res = await GET(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(AI_JOBS_ERRORS.FORBIDDEN_ORIGIN);
  });

  it("3. GET returns 200 OK with list of recent jobs for authenticated admin", async () => {
    const req = new Request("http://localhost:3000/api/admin/ai/jobs?limit=10", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.jobs).toHaveLength(2);
    expect(json.data.count).toBe(2);
    expect(json.jobs).toHaveLength(2); // Backward compatibility
    expect(mockOrchestrator.listJobs).toHaveBeenCalledWith(10);
    expect(res.headers.get("x-request-id")).toBeDefined();
  });

  it("4. GET returns 500 INTERNAL when orchestrator service throws", async () => {
    mockOrchestrator.listJobs.mockRejectedValueOnce(new Error("Database pool timeout"));

    const req = new Request("http://localhost:3000/api/admin/ai/jobs", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.INTERNAL);
    expect(json.error.message).toBe(AI_JOBS_ERRORS.LIST_FAILED);
  });

  // ─── POST /api/admin/ai/jobs ─────────────────────────────────────────────────

  it("5. POST rejects unauthenticated request with 401 UNAUTHENTICATED", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const req = new Request("http://localhost:3000/api/admin/ai/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicText: "Valid AI Article Topic" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    expect(json.error.message).toBe(AI_JOBS_ERRORS.UNAUTHORIZED);
  });

  it("6. POST rejects untrusted origin with 403 FORBIDDEN", async () => {
    const req = new Request("http://localhost:3000/api/admin/ai/jobs", {
      method: "POST",
      headers: {
        origin: "https://phishing-site.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topicText: "Valid AI Article Topic" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(AI_JOBS_ERRORS.FORBIDDEN_ORIGIN);
  });

  it("7. POST rejects viewer role with 403 FORBIDDEN (Editor+ required)", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleViewerSession);

    const req = new Request("http://localhost:3000/api/admin/ai/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicText: "Autonomous Agent Orchestration" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(AI_JOBS_ERRORS.FORBIDDEN_ROLE);
  });

  it("8. POST rejects author role with 403 FORBIDDEN (Editor+ required)", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleAuthorSession);

    const req = new Request("http://localhost:3000/api/admin/ai/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicText: "Autonomous Agent Orchestration" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(AI_JOBS_ERRORS.FORBIDDEN_ROLE);
  });

  it("9. POST rejects empty or too short topic with 422 VALIDATION", async () => {
    const req = new Request("http://localhost:3000/api/admin/ai/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicText: "Tiny" }), // < 5 chars
    });

    const res = await POST(req);
    expect(res.status).toBe(422);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.fieldErrors?.topicText).toBeDefined();
  });

  it("10. POST successfully creates and enqueues job with 201 CREATED for editor", async () => {
    const payload = {
      topicText: "Micro-Frontend Federation Patterns in Next.js 16",
      category: "Architecture",
    };

    const req = new Request("http://localhost:3000/api/admin/ai/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.job).toBeDefined();
    expect(json.data.job.id).toBe("job-new-uuid-999");
    expect(json.data.job.topicText).toBe(payload.topicText);
    expect(json.data.message).toBe(AI_JOBS_MESSAGES.JOB_ENQUEUED);

    // Verify background pipeline trigger was invoked
    expect(mockOrchestrator.createJob).toHaveBeenCalledWith({
      topicText: payload.topicText,
      category: payload.category,
      siteId: undefined,
    });
    expect(mockOrchestrator.executeJob).toHaveBeenCalledWith("job-new-uuid-999");
    expect(backgroundExecutionTriggered).toBe("job-new-uuid-999");
    expect(res.headers.get("x-request-id")).toBeDefined();
  });

  it("11. POST returns 500 INTERNAL when orchestrator service throws", async () => {
    mockOrchestrator.createJob.mockRejectedValueOnce(new Error("Supabase insert crash"));

    const req = new Request("http://localhost:3000/api/admin/ai/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicText: "Distributed Systems Failures" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.INTERNAL);
    expect(json.error.message).toBe(AI_JOBS_ERRORS.TRIGGER_FAILED);
  });
});
