import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/admin/ai/jobs/[id]/retry/route";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { JobOrchestratorService } from "@/lib/services/job-orchestrator.service";
import { AppError, ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";

describe("POST /api/admin/ai/jobs/[id]/retry — Integration API Tests", () => {
  let mockAuthService: any;
  let mockOrchestrator: any;
  let loggerErrorSpy: any;

  const sampleAdminSession = {
    userId: "admin-uuid-1",
    email: "admin@techsonance.co.in",
    role: "super_admin",
  };

  const validJobId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.restoreAllMocks();
    loggerErrorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

    mockAuthService = {
      getCurrentSession: vi.fn(),
      hasPermission: vi.fn().mockReturnValue(true),
    };

    mockOrchestrator = {
      retryJob: vi.fn(),
    };

    const container = getContainer();
    vi.spyOn(container, "get").mockImplementation((token: any) => {
      if (token === AdminAuthService) return mockAuthService;
      if (token === JobOrchestratorService) return mockOrchestrator;
      throw new Error(`Unexpected token: ${token}`);
    });
  });

  it("rejects unauthenticated requests with 401 UNAUTHENTICATED", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const req = new NextRequest(`http://localhost:3000/api/admin/ai/jobs/${validJobId}/retry`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
  });

  it("rejects non-editor role with 403 FORBIDDEN", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      userId: "viewer-1",
      role: "viewer",
    });
    mockAuthService.hasPermission.mockReturnValueOnce(false);

    const req = new NextRequest(`http://localhost:3000/api/admin/ai/jobs/${validJobId}/retry`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it("rejects invalid UUID param with 422 VALIDATION", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleAdminSession);

    const req = new NextRequest("http://localhost:3000/api/admin/ai/jobs/invalid-id/retry", {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: "invalid-id" }) });

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
  });

  it("returns 404 NOT_FOUND when job does not exist", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleAdminSession);
    mockOrchestrator.retryJob.mockRejectedValueOnce(
      new AppError(ErrorCode.NOT_FOUND, "Generation job not found"),
    );

    const req = new NextRequest(`http://localhost:3000/api/admin/ai/jobs/${validJobId}/retry`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it("restarts job and returns 200 on success", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleAdminSession);
    mockOrchestrator.retryJob.mockResolvedValueOnce({
      id: validJobId,
      status: "QUEUED",
      currentStep: "outline",
      topicText: "Why React 19 Actions Replace Client-Side Cache",
    });

    const req = new NextRequest(`http://localhost:3000/api/admin/ai/jobs/${validJobId}/retry`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.job.id).toBe(validJobId);
    expect(json.data.job.status).toBe("QUEUED");
  });

  it("handles unexpected server exceptions cleanly with 500 status", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleAdminSession);
    mockOrchestrator.retryJob.mockRejectedValueOnce(new Error("Database pool timeout"));

    const req = new NextRequest(`http://localhost:3000/api/admin/ai/jobs/${validJobId}/retry`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.INTERNAL);
    expect(loggerErrorSpy).toHaveBeenCalled();
  });
});
