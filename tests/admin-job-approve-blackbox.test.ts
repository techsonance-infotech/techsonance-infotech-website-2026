import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/admin/careers/jobs/[id]/approve/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { JobStatus, JobApprovalStatus, JobWorkMode, JobVisibility } from "@/lib/database/enum";
import { AppError, ErrorCode } from "@/lib/errors";

describe("POST /api/admin/careers/jobs/[id]/approve — End-to-End Black Box Tests", () => {
  let mockAuthService: any;
  let mockJobsService: any;

  const validJobId = "550e8400-e29b-41d4-a716-446655440000";
  const sampleAdminSession = {
    userId: "admin-uuid-1111",
    email: "admin@techsonance.co.in",
    role: "admin",
  };

  const sampleApprovedJob = {
    id: validJobId,
    siteId: "site-uuid-1111",
    slug: "senior-cloud-architect",
    title: "Senior Cloud Architect",
    department: "Cloud Engineering",
    location: "Bhubaneswar",
    workMode: JobWorkMode.HYBRID,
    status: JobStatus.PUBLISHED,
    approvalStatus: JobApprovalStatus.APPROVED,
    visibility: JobVisibility.PUBLIC,
    publishedAt: new Date().toISOString(),
    approvalComment: null,
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
      approveJob: vi.fn().mockResolvedValue(sampleApprovedJob),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService });
    container.bind({ provide: AdminJobsService, useValue: mockJobsService });
  });

  it("1. Rejects untrusted foreign origin with 403 FORBIDDEN", async () => {
    const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: "https://malicious-attacker.com",
      },
      body: JSON.stringify({}),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(res.headers.get("x-request-id")).toBeDefined();
  });

  it("2. Rejects unauthenticated request with 401 UNAUTHENTICATED", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
  });

  it("3. Rejects non-admin / non-owner role with 403 FORBIDDEN", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      userId: "recruiter-uuid-2222",
      email: "recruiter@techsonance.co.in",
      role: "recruiter",
    });

    const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it("4. Rejects invalid non-UUID job ID parameter with 400 VALIDATION", async () => {
    const invalidId = "not-a-valid-uuid";
    const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${invalidId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req, { params: Promise.resolve({ id: invalidId }) });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.fieldErrors).toBeDefined();
  });

  it("5. Rejects malformed JSON body with 400 BAD_REQUEST", async () => {
    const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ not valid json: broken ",
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.BAD_REQUEST);
  });

  it("6. Returns 404 NOT_FOUND when target job does not exist", async () => {
    mockJobsService.approveJob.mockRejectedValueOnce(
      new AppError(ErrorCode.NOT_FOUND, "Job not found"),
    );

    const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it("7. Successfully approves job without comment and returns envelope + job", async () => {
    const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "103.22.45.10",
      },
      body: JSON.stringify({}),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.job.id).toBe(validJobId);
    expect(json.data.job.status).toBe(JobStatus.PUBLISHED);
    expect(json.data.job.approvalStatus).toBe(JobApprovalStatus.APPROVED);
    // Backward compatibility for existing UI
    expect(json.job).toBeDefined();
    expect(json.job.id).toBe(validJobId);

    // Verify service was called with actorId and ipAddress
    expect(mockJobsService.approveJob).toHaveBeenCalledWith(
      validJobId,
      sampleAdminSession.userId,
      undefined,
      "103.22.45.10",
    );

    // Verify standard headers
    expect(res.headers.get("x-request-id")).toBeDefined();
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("8. Successfully approves job with reviewer comment", async () => {
    const customApprovedJob = {
      ...sampleApprovedJob,
      approvalComment: "Approved by Head of Talent. Ready to publish.",
    };
    mockJobsService.approveJob.mockResolvedValueOnce(customApprovedJob);

    const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comment: "Approved by Head of Talent. Ready to publish.",
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.job.approvalComment).toBe("Approved by Head of Talent. Ready to publish.");

    expect(mockJobsService.approveJob).toHaveBeenCalledWith(
      validJobId,
      sampleAdminSession.userId,
      "Approved by Head of Talent. Ready to publish.",
      undefined,
    );
  });

  it("9. Handles owner role authentication", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      userId: "owner-uuid-0001",
      email: "founder@techsonance.co.in",
      role: "owner",
    });

    const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(mockJobsService.approveJob).toHaveBeenCalledWith(
      validJobId,
      "owner-uuid-0001",
      undefined,
      undefined,
    );
  });
});
