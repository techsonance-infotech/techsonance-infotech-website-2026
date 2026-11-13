import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE } from "@/app/api/admin/ai/credentials/route";
import { POST as killPOST } from "@/app/api/admin/ai/credentials/kill/route";
import { POST as deactivatePOST } from "@/app/api/admin/ai/credentials/deactivate/route";
import { GET as resumeGET } from "@/app/api/admin/careers/applications/[id]/resume/route";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminAiCredentialsService } from "@/lib/services/ai/admin-ai-credentials.service";
import { ApplicationsService } from "@/lib/services/applications.service";
import { ErrorCode } from "@/lib/errors";
import { AdminRole } from "@/lib/constants/enums/content.enum";

describe("Phase 3: Admin API RBAC Enforcement", () => {
  let mockAuthService: any;
  let mockCredentialsService: any;
  let mockApplicationsService: any;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockAuthService = {
      getCurrentSession: vi.fn(),
      hasPermission: vi.fn((role: string, required: string) => {
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

    mockCredentialsService = {
      listCredentials: vi.fn().mockResolvedValue([]),
      addCredential: vi.fn(),
      deleteCredential: vi.fn(),
      deactivateCredential: vi.fn(),
      triggerKillSwitch: vi.fn(),
    };

    mockApplicationsService = {
      getSignedResumeUrl: vi.fn(),
    };

    const container = getContainer();
    vi.spyOn(container, "get").mockImplementation((token: any) => {
      if (token === AdminAuthService) return mockAuthService;
      if (token === AdminAiCredentialsService) return mockCredentialsService;
      if (token === ApplicationsService) return mockApplicationsService;
      throw new Error(`Unexpected token: ${token}`);
    });
  });

  describe("1. AI Credentials Vault RBAC", () => {
    it("rejects viewer and author from accessing GET /api/admin/ai/credentials", async () => {
      mockAuthService.getCurrentSession.mockResolvedValue({
        userId: "u-viewer",
        role: AdminRole.VIEWER,
      });

      const req = new Request("http://localhost:3000/api/admin/ai/credentials");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    });

    it("allows admin to access GET /api/admin/ai/credentials", async () => {
      mockAuthService.getCurrentSession.mockResolvedValue({
        userId: "u-admin",
        role: AdminRole.ADMIN,
      });

      const req = new Request("http://localhost:3000/api/admin/ai/credentials");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.ok).toBe(true);
    });

    it("rejects viewer and author from POST /api/admin/ai/credentials/deactivate", async () => {
      mockAuthService.getCurrentSession.mockResolvedValue({
        userId: "u-author",
        role: AdminRole.AUTHOR,
      });

      const req = new Request("http://localhost:3000/api/admin/ai/credentials/deactivate", {
        method: "POST",
        body: JSON.stringify({ credentialId: "cred-1" }),
      });
      const res = await deactivatePOST(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    });

    it("strictly requires owner role for POST /api/admin/ai/credentials/kill", async () => {
      // Admin should be rejected for kill switch
      mockAuthService.getCurrentSession.mockResolvedValue({
        userId: "u-admin",
        role: AdminRole.ADMIN,
      });

      const req = new Request("http://localhost:3000/api/admin/ai/credentials/kill", {
        method: "POST",
        body: JSON.stringify({ reason: "Emergency test" }),
      });
      const res = await killPOST(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.ok).toBe(false);
      expect(json.error.message).toContain("owner role required");
    });
  });

  describe("2. Careers Candidate Resume RBAC", () => {
    it("rejects viewer from accessing candidate resume with 403 FORBIDDEN", async () => {
      mockAuthService.getCurrentSession.mockResolvedValue({
        userId: "u-viewer",
        role: AdminRole.VIEWER,
      });

      const req = new Request(
        "http://localhost:3000/api/admin/careers/applications/11111111-2222-4333-8444-555555555555/resume",
      );
      const res = await resumeGET(req, {
        params: Promise.resolve({ id: "11111111-2222-4333-8444-555555555555" }),
      });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    });
  });
});
