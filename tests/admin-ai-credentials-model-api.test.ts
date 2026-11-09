import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/admin/ai/credentials/model/route";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminAiCredentialsService } from "@/lib/services/ai/admin-ai-credentials.service";
import { AppError, ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";

describe("POST /api/admin/ai/credentials/model — Integration API Tests", () => {
  let mockAuthService: any;
  let mockCredentialsService: any;
  let loggerErrorSpy: any;

  const sampleAdminSession = {
    userId: "admin-uuid-1",
    email: "admin@techsonance.co.in",
    role: "super_admin",
  };

  const validCredId = "660e8400-e29b-41d4-a716-446655440001";

  beforeEach(() => {
    vi.restoreAllMocks();
    loggerErrorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

    mockAuthService = {
      getCurrentSession: vi.fn(),
    };

    mockCredentialsService = {
      updateModel: vi.fn(),
    };

    const container = getContainer();
    vi.spyOn(container, "get").mockImplementation((token: any) => {
      if (token === AdminAuthService) return mockAuthService;
      if (token === AdminAiCredentialsService) return mockCredentialsService;
      throw new Error(`Unexpected token: ${token}`);
    });
  });

  it("rejects unauthenticated requests with 401 UNAUTHENTICATED", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const req = new Request("http://localhost:3000/api/admin/ai/credentials/model", {
      method: "POST",
      body: JSON.stringify({ credentialId: validCredId, model: "llama-3.3-70b-versatile" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
  });

  it("rejects invalid input schema with 422 VALIDATION when UUID is invalid", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleAdminSession);

    const req = new Request("http://localhost:3000/api/admin/ai/credentials/model", {
      method: "POST",
      body: JSON.stringify({ credentialId: "invalid-uuid", model: "llama-3.3-70b-versatile" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
  });

  it("rejects invalid input schema with 422 VALIDATION when model is empty", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleAdminSession);

    const req = new Request("http://localhost:3000/api/admin/ai/credentials/model", {
      method: "POST",
      body: JSON.stringify({ credentialId: validCredId, model: "   " }),
    });
    const res = await POST(req);

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
  });

  it("successfully updates model and returns 200 with updated DTO", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleAdminSession);

    const updatedDto = {
      id: validCredId,
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      label: "Groq Main",
      last4: "wwY3",
      status: "active",
      priority: 10,
    };

    mockCredentialsService.updateModel.mockResolvedValueOnce(updatedDto);

    const req = new Request("http://localhost:3000/api/admin/ai/credentials/model", {
      method: "POST",
      body: JSON.stringify({ credentialId: validCredId, model: "llama-3.3-70b-versatile" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.success).toBe(true);
    expect(json.data.credential.model).toBe("llama-3.3-70b-versatile");
    expect(mockCredentialsService.updateModel).toHaveBeenCalledWith(
      { credentialId: validCredId, model: "llama-3.3-70b-versatile" },
      "admin-uuid-1",
      expect.any(String),
    );
  });

  it("handles domain AppError (e.g. NOT_FOUND) with appropriate status code", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleAdminSession);
    mockCredentialsService.updateModel.mockRejectedValueOnce(
      new AppError(ErrorCode.NOT_FOUND, "Credential not found."),
    );

    const req = new Request("http://localhost:3000/api/admin/ai/credentials/model", {
      method: "POST",
      body: JSON.stringify({ credentialId: validCredId, model: "llama-3.3-70b-versatile" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
  });
});
