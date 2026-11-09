import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/admin/ai/credentials/route";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminAiCredentialsService } from "@/lib/services/ai/admin-ai-credentials.service";
import { ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";

describe("GET & POST /api/admin/ai/credentials — Black Box API Tests", () => {
  let mockAuthService: any;
  let mockCredentialsService: any;
  let loggerErrorSpy: any;

  const sampleAdminSession = {
    userId: "admin-uuid-1",
    email: "admin@techsonance.co.in",
    role: "super_admin",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    loggerErrorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

    mockAuthService = {
      getCurrentSession: vi.fn(),
    };

    mockCredentialsService = {
      listCredentials: vi.fn(),
      addCredential: vi.fn(),
    };

    const container = getContainer();
    vi.spyOn(container, "get").mockImplementation((token: any) => {
      if (token === AdminAuthService) return mockAuthService;
      if (token === AdminAiCredentialsService) return mockCredentialsService;
      throw new Error(`Unexpected token: ${token}`);
    });
  });

  describe("GET /api/admin/ai/credentials", () => {
    it("rejects unauthenticated requests with 401 UNAUTHENTICATED", async () => {
      mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3000/api/admin/ai/credentials");
      const res = await GET(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    });

    it("returns 200 with credentials list on success", async () => {
      mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleAdminSession);
      mockCredentialsService.listCredentials.mockResolvedValueOnce([
        {
          id: "cred-1",
          provider: "gemini",
          model: "gemini-3.0-flash",
          label: "Gemini Flash Primary",
          last4: "1234",
          status: "active",
        },
      ]);

      const req = new Request("http://localhost:3000/api/admin/ai/credentials");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.count).toBe(1);
      expect(json.data.credentials[0].provider).toBe("gemini");
    });

    it("logs complete server failure and returns 500 without leaking stack to client", async () => {
      mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleAdminSession);
      const dbCrash = new Error('relation "ts_ai_credentials" does not exist');
      mockCredentialsService.listCredentials.mockRejectedValueOnce(dbCrash);

      const req = new Request("http://localhost:3000/api/admin/ai/credentials");
      const res = await GET(req);

      expect(res.status).toBe(500);
      const json = await res.json();

      // Client sees generic sanitized error
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.INTERNAL);
      expect(json.error.message).toBe("Internal server error occurred");
      expect(json.error.requestId).toBeDefined();
      expect(json.error.stack).toBeUndefined(); // NEVER leaked to client

      // Server logged full detail
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        "Admin AI credentials GET failed",
        expect.objectContaining({
          error: dbCrash,
          requestId: json.error.requestId,
        }),
      );
    });
  });

  describe("POST /api/admin/ai/credentials", () => {
    it("rejects unauthenticated requests with 401", async () => {
      mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3000/api/admin/ai/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    });

    it("rejects invalid payload with 422 VALIDATION", async () => {
      mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleAdminSession);

      const req = new Request("http://localhost:3000/api/admin/ai/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "gemini",
          // missing apiKey and label
        }),
      });
      const res = await POST(req);

      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.VALIDATION);
      expect(json.error.fieldErrors).toBeDefined();
    });

    it("registers credential and returns 201 with sanitized view DTO", async () => {
      mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleAdminSession);
      mockCredentialsService.addCredential.mockResolvedValueOnce({
        id: "cred-uuid-new",
        provider: "gemini",
        model: "gemini-3.0-flash",
        label: "Production Flash",
        last4: "9999",
        status: "active",
      });

      const req = new Request("http://localhost:3000/api/admin/ai/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "gemini",
          model: "gemini-3.0-flash",
          label: "Production Flash",
          apiKey: "AIzaSy_super_secret_key_9999",
        }),
      });
      const res = await POST(req);

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.credential.id).toBe("cred-uuid-new");
      expect(json.data.credential.last4).toBe("9999");
      expect(json.data.credential.apiKey).toBeUndefined(); // Zero secret exposed
    });
  });
});
