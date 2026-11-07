import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GET as getComplianceGET,
  POST as postCompliancePOST,
} from "@/app/api/admin/careers/compliance/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { ApplicationsService } from "@/lib/services/applications.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { ErrorCode } from "@/lib/errors";
import {
  CAREER_ERRORS,
  CAREER_COMPLIANCE_MESSAGES,
} from "@/lib/constants/careers.constants";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

describe("GET & POST /api/admin/careers/compliance — Black Box Integration Tests", () => {
  let mockAuthService: any;
  let mockApplicationsService: any;

  const adminSession = {
    userId: "admin-uuid-1111",
    email: "admin@techsonance.co.in",
    role: "admin",
    site: { id: "site-uuid-1111" },
  };

  const editorSession = {
    userId: "editor-uuid-2222",
    email: "editor@techsonance.co.in",
    role: "editor",
    site: { id: "site-uuid-1111" },
  };

  const sampleCandidateData = {
    email: "candidate@example.com",
    exportedAt: new Date(),
    applications: [
      {
        id: "app-1",
        candidateName: "Jane Candidate",
        jobId: "job-100",
        email: "candidate@example.com",
      },
    ],
    talentPoolSubmissions: [],
  };

  const samplePurgeResult = {
    success: true,
    email: "candidate@example.com",
    deletedApplicationsCount: 1,
    deletedTalentPoolCount: 0,
    deletedFilesCount: 1,
  };

  beforeEach(() => {
    resetRootContainer();

    mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(adminSession),
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

    mockApplicationsService = {
      exportCandidateData: vi.fn().mockResolvedValue(sampleCandidateData),
      purgeCandidateData: vi.fn().mockResolvedValue(samplePurgeResult),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService as any });
    container.bind({ provide: ApplicationsService, useValue: mockApplicationsService as any });
  });

  const makeGetReq = (query: string = "", extraHeaders: Record<string, string> = {}) =>
    new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.COMPLIANCE}${query}`, {
      method: "GET",
      headers: { ...extraHeaders },
    });

  const makePostReq = (body: unknown, extraHeaders: Record<string, string> = {}) =>
    new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.COMPLIANCE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    });

  // ─── GET /api/admin/careers/compliance (GDPR Export) ──────────────────────

  describe("GET /api/admin/careers/compliance", () => {
    it("1. Rejects foreign origin with 403 Forbidden", async () => {
      const req = makeGetReq("?email=candidate@example.com", {
        origin: "https://evil-untrusted-site.com",
      });

      const res = await getComplianceGET(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
      expect(json.error.message).toBe(CAREER_ERRORS.FORBIDDEN_ORIGIN);
    });

    it("2. Rejects unauthenticated request with 401", async () => {
      mockAuthService.getCurrentSession.mockResolvedValue(null);

      const req = makeGetReq("?email=candidate@example.com");
      const res = await getComplianceGET(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    });

    it("3. Rejects editor role with 403 Forbidden (Admin/Owner required)", async () => {
      mockAuthService.getCurrentSession.mockResolvedValue(editorSession);

      const req = makeGetReq("?email=candidate@example.com");
      const res = await getComplianceGET(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
      expect(json.error.message).toBe(CAREER_ERRORS.FORBIDDEN_COMPLIANCE_EXPORT);
    });

    it("4. Rejects request with missing or invalid email with 422 Validation Error", async () => {
      const req = makeGetReq("?email=not-an-email");
      const res = await getComplianceGET(req);
      expect(res.status).toBe(422);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.VALIDATION);
      expect(json.error.fieldErrors).toBeDefined();
    });

    it("5. Successfully exports candidate data with 200 OK for Admin", async () => {
      const req = makeGetReq("?email=candidate@example.com");
      const res = await getComplianceGET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.email).toBe("candidate@example.com");
      expect(json.data.applications).toHaveLength(1);
      expect(json.candidateData.email).toBe("candidate@example.com");
      expect(json.message).toBe(CAREER_COMPLIANCE_MESSAGES.EXPORT_SUCCESS);
      expect(mockApplicationsService.exportCandidateData).toHaveBeenCalledWith(
        "candidate@example.com",
      );
    });

    it("6. Handles unexpected service crash with clean 500 status", async () => {
      mockApplicationsService.exportCandidateData.mockRejectedValue(
        new Error("Database pool timeout"),
      );

      const req = makeGetReq("?email=candidate@example.com");
      const res = await getComplianceGET(req);
      expect(res.status).toBe(500);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.INTERNAL);
      expect(json.error.message).toBe(CAREER_ERRORS.FAILED_EXPORT_COMPLIANCE);
    });
  });

  // ─── POST /api/admin/careers/compliance (GDPR Purge) ───────────────────────

  describe("POST /api/admin/careers/compliance", () => {
    it("7. Rejects foreign origin on purge with 403 Forbidden", async () => {
      const req = makePostReq(
        { email: "candidate@example.com" },
        { origin: "https://evil-untrusted-site.com" },
      );

      const res = await postCompliancePOST(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    });

    it("8. Rejects editor role on purge with 403 Forbidden (Admin/Owner required)", async () => {
      mockAuthService.getCurrentSession.mockResolvedValue(editorSession);

      const req = makePostReq({ email: "candidate@example.com" });
      const res = await postCompliancePOST(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
      expect(json.error.message).toBe(CAREER_ERRORS.FORBIDDEN_COMPLIANCE_PURGE);
    });

    it("9. Rejects invalid email in body with 422 Validation Error", async () => {
      const req = makePostReq({ email: "invalid-email" });
      const res = await postCompliancePOST(req);
      expect(res.status).toBe(422);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.VALIDATION);
      expect(json.error.fieldErrors).toBeDefined();
    });

    it("10. Successfully purges candidate data with 200 OK for Admin", async () => {
      const req = makePostReq({ email: "candidate@example.com" });
      const res = await postCompliancePOST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.deletedApplicationsCount).toBe(1);
      expect(json.data.deletedFilesCount).toBe(1);
      expect(json.result.success).toBe(true);
      expect(json.message).toBe(CAREER_COMPLIANCE_MESSAGES.PURGE_SUCCESS);
      expect(mockApplicationsService.purgeCandidateData).toHaveBeenCalledWith(
        "candidate@example.com",
        adminSession.userId,
        undefined,
      );
    });

    it("11. Handles unexpected purge failure with clean 500 status", async () => {
      mockApplicationsService.purgeCandidateData.mockRejectedValue(
        new Error("Storage service unavailable"),
      );

      const req = makePostReq({ email: "candidate@example.com" });
      const res = await postCompliancePOST(req);
      expect(res.status).toBe(500);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.INTERNAL);
      expect(json.error.message).toBe(CAREER_ERRORS.FAILED_PURGE_CANDIDATE);
    });
  });
});
