import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getAiUsageGET } from "@/app/api/admin/ai/usage/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminTelemetryService } from "@/lib/services/admin-telemetry.service";
import { ErrorCode } from "@/lib/errors";
import { AI_USAGE_ERRORS } from "@/lib/constants/ai.constants";

describe("GET /api/admin/ai/usage — Black Box Integration Tests", () => {
  let mockAuthService: any;
  let mockTelemetryService: any;

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

  const sampleSummary = {
    tokensToday: 14500,
    tokensThisWeek: 85200,
    dailyPostsUsed: 1,
    dailyPostCap: 1,
    weeklyPostsUsed: 2,
    weeklyPostCap: 3,
    totalJobs: 18,
    activeJobs: 1,
    providerStats: [
      {
        provider: "gemini-2.5-pro",
        totalCalls: 32,
        successCalls: 31,
        avgDurationMs: 1420,
      },
      {
        provider: "workers-ai-flux",
        totalCalls: 12,
        successCalls: 12,
        avgDurationMs: 2310,
      },
    ],
    recentEvents: [],
  };

  beforeEach(() => {
    resetRootContainer();

    mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(sampleEditorSession),
      hasPermission: vi.fn().mockReturnValue(true),
    };

    mockTelemetryService = {
      getTelemetrySummary: vi.fn().mockResolvedValue(sampleSummary),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService as any });
    container.bind({ provide: AdminTelemetryService, useValue: mockTelemetryService as any });
  });

  // ─── SECURITY & ORIGIN TESTS ──────────────────────────────────────────────

  it("1. Rejects request with foreign origin with 403 Forbidden", async () => {
    const req = new Request("http://localhost:3000/api/admin/ai/usage", {
      method: "GET",
      headers: {
        origin: "https://untrusted-cross-site.com",
      },
    });

    const res = await getAiUsageGET(req as any);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(AI_USAGE_ERRORS.FORBIDDEN_ORIGIN);
  });

  // ─── AUTHENTICATION TESTS ─────────────────────────────────────────────────

  it("2. Rejects unauthenticated request with 401 Unauthenticated", async () => {
    mockAuthService.getCurrentSession.mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/admin/ai/usage", {
      method: "GET",
    });

    const res = await getAiUsageGET(req as any);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    expect(json.error.message).toBe(AI_USAGE_ERRORS.UNAUTHORIZED);
  });

  // ─── SUCCESSFUL RETRIEVAL TESTS ───────────────────────────────────────────

  it("3. Returns 200 OK with telemetry metrics for viewer role", async () => {
    mockAuthService.getCurrentSession.mockResolvedValue(sampleViewerSession);

    const req = new Request("http://localhost:3000/api/admin/ai/usage", {
      method: "GET",
    });

    const res = await getAiUsageGET(req as any);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.tokensToday).toBe(14500);
    expect(json.data.tokensToday).toBe(14500);
    expect(json.dailyPostsUsed).toBe(1);
    expect(json.providerStats).toHaveLength(2);
  });

  it("4. Returns 200 OK with telemetry metrics for editor role", async () => {
    const req = new Request("http://localhost:3000/api/admin/ai/usage", {
      method: "GET",
    });

    const res = await getAiUsageGET(req as any);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.totalJobs).toBe(18);
    expect(json.data.activeJobs).toBe(1);
    expect(json.totalJobs).toBe(18);
    expect(mockTelemetryService.getTelemetrySummary).toHaveBeenCalledOnce();
  });

  // ─── ERROR HANDLING TESTS ─────────────────────────────────────────────────

  it("5. Handles unexpected telemetry service crash with clean 500 status", async () => {
    mockTelemetryService.getTelemetrySummary.mockRejectedValue(
      new Error("Telemetry DB pool timeout"),
    );

    const req = new Request("http://localhost:3000/api/admin/ai/usage", {
      method: "GET",
    });

    const res = await getAiUsageGET(req as any);
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.INTERNAL);
    expect(json.error.message).toBe(AI_USAGE_ERRORS.LOAD_FAILED);
  });
});
