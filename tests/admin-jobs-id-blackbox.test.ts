import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH, DELETE } from "@/app/api/admin/jobs/[id]/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { JobStatus, JobApprovalStatus, JobWorkMode, JobVisibility } from "@/lib/database/enum";
import { AppError, ErrorCode } from "@/lib/errors";

describe("GET, PATCH, DELETE /api/admin/jobs/[id] — End-to-End Black Box Tests", () => {
  let mockAuthService: any;
  let mockJobsService: any;

  const validJobId = "550e8400-e29b-41d4-a716-446655440000";

  const sampleAdminSession = {
    userId: "admin-uuid-1111",
    email: "admin@techsonance.co.in",
    role: "admin",
  };

  const sampleJob = {
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
    versionId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    resetRootContainer();

    mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(sampleAdminSession),
    };

    mockJobsService = {
      getJobById: vi.fn().mockResolvedValue(sampleJob),
      updateJob: vi.fn().mockResolvedValue({
        ...sampleJob,
        title: "Staff Cloud Architect",
        versionId: 2,
      }),
      deleteJob: vi.fn().mockResolvedValue(true),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService });
    container.bind({ provide: AdminJobsService, useValue: mockJobsService });
  });

  describe("GET /api/admin/jobs/[id]", () => {
    it("1. Rejects foreign origin with 403 FORBIDDEN", async () => {
      const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}`, {
        method: "GET",
        headers: { origin: "https://evil-site.com" },
      });

      const res = await GET(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
      expect(res.headers.get("x-request-id")).toBeDefined();
    });

    it("2. Rejects unauthenticated request with 401 UNAUTHENTICATED", async () => {
      mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

      const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}`);
      const res = await GET(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    });

    it("3. Rejects invalid non-UUID parameter with 400 VALIDATION", async () => {
      const invalidId = "invalid-uuid";
      const req = new Request(`http://localhost:3000/api/admin/jobs/${invalidId}`);
      const res = await GET(req, { params: Promise.resolve({ id: invalidId }) });
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.VALIDATION);
      expect(json.error.fieldErrors?.id).toBeDefined();
    });

    it("4. Returns 404 NOT_FOUND when job does not exist", async () => {
      mockJobsService.getJobById.mockResolvedValueOnce(null);

      const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}`);
      const res = await GET(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
    });

    it("5. Successfully returns job data with standard envelope and headers", async () => {
      const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}`);
      const res = await GET(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.job.id).toBe(validJobId);
      // Backward compatibility
      expect(json.job).toBeDefined();
      expect(json.job.id).toBe(validJobId);

      expect(mockJobsService.getJobById).toHaveBeenCalledWith(validJobId);
      expect(res.headers.get("x-request-id")).toBeDefined();
      expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    });
  });

  describe("PATCH /api/admin/jobs/[id]", () => {
    it("6. Rejects foreign origin with 403 FORBIDDEN", async () => {
      const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          origin: "https://evil-site.com",
        },
        body: JSON.stringify({ title: "Staff Cloud Architect" }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    });

    it("7. Rejects malformed JSON body with 400 BAD_REQUEST", async () => {
      const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{ broken json...",
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.BAD_REQUEST);
    });

    it("8. Rejects validation violation (salaryMin > salaryMax) with 400 VALIDATION", async () => {
      const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salaryMin: 900000,
          salaryMax: 400000,
        }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.VALIDATION);
      expect(json.error.fieldErrors).toBeDefined();
    });

    it("9. Returns 404 NOT_FOUND when job to update does not exist", async () => {
      mockJobsService.updateJob.mockRejectedValueOnce(
        new AppError(ErrorCode.NOT_FOUND, "Job not found"),
      );

      const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Staff Cloud Architect" }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
    });

    it("10. Successfully updates job and returns standard envelope", async () => {
      const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "103.22.45.10",
        },
        body: JSON.stringify({ title: "Staff Cloud Architect" }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.job.title).toBe("Staff Cloud Architect");
      expect(json.data.job.versionId).toBe(2);
      // Backward compatibility
      expect(json.job).toBeDefined();

      expect(mockJobsService.updateJob).toHaveBeenCalledWith(
        validJobId,
        expect.objectContaining({ title: "Staff Cloud Architect" }),
        sampleAdminSession.userId,
        "103.22.45.10",
      );
      expect(res.headers.get("x-request-id")).toBeDefined();
      expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    });
  });

  describe("DELETE /api/admin/jobs/[id]", () => {
    it("11. Rejects foreign origin with 403 FORBIDDEN", async () => {
      const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}`, {
        method: "DELETE",
        headers: { origin: "https://evil-site.com" },
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    });

    it("12. Rejects recruiter role with 403 FORBIDDEN (destructive action requires admin/owner)", async () => {
      mockAuthService.getCurrentSession.mockResolvedValueOnce({
        userId: "recruiter-uuid-2222",
        role: "recruiter",
      });

      const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}`, {
        method: "DELETE",
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    });

    it("13. Returns 404 NOT_FOUND when job does not exist for deletion", async () => {
      mockJobsService.deleteJob.mockResolvedValueOnce(false);

      const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}`, {
        method: "DELETE",
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
    });

    it("14. Successfully deletes job opening and returns envelope with success: true", async () => {
      const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}`, {
        method: "DELETE",
        headers: { "x-forwarded-for": "103.22.45.10" },
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: validJobId }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.success).toBe(true);
      expect(json.success).toBe(true);

      expect(mockJobsService.deleteJob).toHaveBeenCalledWith(
        validJobId,
        sampleAdminSession.userId,
        "103.22.45.10",
      );
      expect(res.headers.get("x-request-id")).toBeDefined();
      expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    });
  });
});
