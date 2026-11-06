import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/admin/careers/jobs/[id]/versions/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { JobStatus, JobApprovalStatus, JobWorkMode, JobVisibility } from "@/lib/database/enum";
import { AppError, ErrorCode } from "@/lib/errors";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";

describe("GET & POST /api/admin/careers/jobs/[id]/versions — End-to-End Black Box Tests", () => {
  let mockAuthService: any;
  let mockJobsService: any;

  const validJobId = "550e8400-e29b-41d4-a716-446655440000";
  const validVersionId = "770e8400-e29b-41d4-a716-446655440000";

  const sampleAdminSession = {
    userId: "admin-uuid-1111",
    email: "admin@techsonance.co.in",
    role: "admin",
  };

  const sampleVersion = {
    id: validVersionId,
    entityType: "job",
    entityId: validJobId,
    snapshot: {
      versionId: 1,
      title: "Senior Cloud Architect",
      department: "Cloud Engineering",
      status: JobStatus.DRAFT,
      approvalStatus: JobApprovalStatus.PENDING,
    },
    changedBy: "admin-uuid-1111",
    createdAt: new Date().toISOString(),
  };

  const sampleRestoredJob = {
    id: validJobId,
    siteId: "site-uuid-1111",
    slug: "senior-cloud-architect",
    title: "Senior Cloud Architect",
    department: "Cloud Engineering",
    location: "Bhubaneswar",
    workMode: JobWorkMode.HYBRID,
    status: JobStatus.DRAFT,
    approvalStatus: JobApprovalStatus.PENDING,
    visibility: JobVisibility.PUBLIC,
    versionId: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    resetRootContainer();

    mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(sampleAdminSession),
    };

    mockJobsService = {
      listVersions: vi.fn().mockResolvedValue([sampleVersion]),
      restoreVersion: vi.fn().mockResolvedValue(sampleRestoredJob),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService });
    container.bind({ provide: AdminJobsService, useValue: mockJobsService });
  });

  describe("GET /api/admin/careers/jobs/[id]/versions", () => {
    it("1. Rejects foreign origin with 403 FORBIDDEN", async () => {
      const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/versions`, {
        method: "GET",
        headers: {
          origin: "https://untrusted-site.com",
        },
      });

      const res = await GET(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
      expect(res.headers.get("x-request-id")).toBeDefined();
    });

    it("2. Rejects unauthenticated caller with 401 UNAUTHENTICATED", async () => {
      mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

      const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/versions`);
      const res = await GET(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    });

    it("3. Rejects disallowed role with 403 FORBIDDEN", async () => {
      mockAuthService.getCurrentSession.mockResolvedValueOnce({
        userId: "guest-uuid-9999",
        role: "guest",
      });

      const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/versions`);
      const res = await GET(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    });

    it("4. Rejects invalid non-UUID job ID parameter with 400 VALIDATION", async () => {
      const invalidId = "invalid-id-123";
      const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${invalidId}/versions`);
      const res = await GET(req, { params: Promise.resolve({ id: invalidId }) });
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.VALIDATION);
      expect(json.error.fieldErrors?.id).toBeDefined();
    });

    it("5. Successfully lists version snapshots with standard envelope and headers", async () => {
      const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/versions`);
      const res = await GET(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.versions).toHaveLength(1);
      expect(json.data.versions[0].id).toBe(validVersionId);
      // Backward compatibility
      expect(json.versions).toBeDefined();
      expect(json.versions).toHaveLength(1);

      expect(mockJobsService.listVersions).toHaveBeenCalledWith(validJobId);
      expect(res.headers.get("x-request-id")).toBeDefined();
      expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    });
  });

  describe("POST /api/admin/careers/jobs/[id]/versions", () => {
    it("6. Rejects foreign origin with 403 FORBIDDEN", async () => {
      const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "https://unauthorized-domain.com",
        },
        body: JSON.stringify({ versionId: validVersionId }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    });

    it("7. Rejects unauthenticated request with 401 UNAUTHENTICATED", async () => {
      mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

      const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: validVersionId }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    });

    it("8. Rejects malformed JSON body with 400 BAD_REQUEST", async () => {
      const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ broken json string",
      });

      const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.BAD_REQUEST);
    });

    it("9. Rejects missing versionId with 400 VALIDATION", async () => {
      const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.VALIDATION);
      expect(json.error.message).toBe(CAREER_ERRORS.VERSION_ID_REQUIRED);
    });

    it("10. Returns 404 NOT_FOUND when target version does not exist", async () => {
      mockJobsService.restoreVersion.mockRejectedValueOnce(
        new AppError(ErrorCode.NOT_FOUND, `Version "${validVersionId}" not found`),
      );

      const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: validVersionId }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
    });

    it("11. Successfully restores snapshot and returns envelope with restored job", async () => {
      const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "103.22.45.10",
        },
        body: JSON.stringify({ versionId: validVersionId }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.job.id).toBe(validJobId);
      expect(json.data.job.versionId).toBe(2);
      // Backward compatibility
      expect(json.job).toBeDefined();
      expect(json.job.id).toBe(validJobId);

      expect(mockJobsService.restoreVersion).toHaveBeenCalledWith(
        validJobId,
        validVersionId,
        sampleAdminSession.userId,
        "103.22.45.10",
      );
      expect(res.headers.get("x-request-id")).toBeDefined();
      expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    });
  });
});
