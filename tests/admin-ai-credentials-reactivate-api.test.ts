import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/admin/ai/credentials/reactivate/route";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminAiCredentialsService } from "@/lib/services/ai/admin-ai-credentials.service";
import { AppError, ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";

describe("POST /api/admin/ai/credentials/reactivate — Integration API Tests", () => {
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
      reactivateCredential: vi.fn(),
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

    const req = new Request("http://localhost:3000/api/admin/ai/credentials/reactivate", {
      method: "POST",
      body: JSON.stringify({ credentialId: validCredId }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
  });

  it("rejects invalid input schema with 422 VALIDATION", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleAdminSession);

    const req = new Request("http://localhost:3000/api/admin/ai/credentials/reactivate", {
      method: "POST",
      body: JSON.stringify({ credentialId: "not-a-uuid" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
  });

  it("returns 404 NOT_FOUND when credential does not exist", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleAdminSession);
    mockCredentialsService.reactivateCredential.mockRejectedValueOnce(
      new AppError(ErrorCode.NOT_FOUND, "Credential not found"),
    );

    const req = new Request("http://localhost:3000/api/admin/ai/credentials/reactivate", {
      method: "POST",
      body: JSON.stringify({ credentialId: validCredId }),
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it("re-activates credential successfully and returns 200 with updated DTO", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleAdminSession);
    mockCredentialsService.reactivateCredential.mockResolvedValueOnce({
      id: validCredId,
      status: "active",
      provider: "groq",
      label: "Groq Llama Primary",
    });

    const req = new Request("http://localhost:3000/api/admin/ai/credentials/reactivate", {
      method: "POST",
      body: JSON.stringify({ credentialId: validCredId }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.credential.status).toBe("active");
  });

  it("handles unexpected error and logs with 500 INTERNAL", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleAdminSession);
    mockCredentialsService.reactivateCredential.mockRejectedValueOnce(
      new Error("Unexpected DB timeout"),
    );

    const req = new Request("http://localhost:3000/api/admin/ai/credentials/reactivate", {
      method: "POST",
      body: JSON.stringify({ credentialId: validCredId }),
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.INTERNAL);
    expect(loggerErrorSpy).toHaveBeenCalled();
  });
});
