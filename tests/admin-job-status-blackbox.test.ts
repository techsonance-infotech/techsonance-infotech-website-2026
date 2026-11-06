import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/admin/jobs/[id]/status/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { JobStatus, JobApprovalStatus, JobWorkMode, JobVisibility } from "@/lib/database/enum";
import { AppError, ErrorCode } from "@/lib/errors";

describe("POST /api/admin/jobs/[id]/status — End-to-End Black Box Tests", () => {
  let mockAuthService: any;
  let mockJobsService: any;

  const validJobId = "550e8400-e29b-41d4-a716-446655440000";

  const sampleAdminSession = {
    userId: "admin-uuid-1111",
    email: "admin@techsonance.co.in",
    role: "admin",
  };

  const sampleUpdatedJob = {
    id: validJobId,
    siteId: "site-uuid-1111",
    slug: "senior-cloud-architect",
    title: "Senior Cloud Architect",
    department: "Cloud Engineering",
    location: "Bhubaneswar",
    workMode: JobWorkMode.HYBRID,
    status: JobStatus.IN_REVIEW,
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
      transitionStatus: vi.fn().mockResolvedValue(sampleUpdatedJob),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService });
    container.bind({ provide: AdminJobsService, useValue: mockJobsService });
  });

  it("1. Rejects untrusted foreign origin with 403 FORBIDDEN", async () => {
    const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: "https://cross-site-attacker.com",
      },
      body: JSON.stringify({ targetStatus: "IN_REVIEW" }),
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

    const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetStatus: "IN_REVIEW" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
  });

  it("3. Rejects disallowed role with 403 FORBIDDEN", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      userId: "viewer-uuid-3333",
      email: "viewer@techsonance.co.in",
      role: "viewer",
    });

    const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetStatus: "IN_REVIEW" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it("4. Rejects invalid non-UUID job ID parameter with 400 VALIDATION", async () => {
    const invalidId = "not-a-uuid-string";
    const req = new Request(`http://localhost:3000/api/admin/jobs/${invalidId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetStatus: "IN_REVIEW" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: invalidId }) });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.fieldErrors?.id).toBeDefined();
  });

  it("5. Rejects malformed JSON body with 400 BAD_REQUEST", async () => {
    const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ not json...",
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.BAD_REQUEST);
  });

  it("6. Rejects missing targetStatus with 400 VALIDATION", async () => {
    const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: "Missing status" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
  });

  it("7. Rejects invalid unrecognized status value with 400 VALIDATION", async () => {
    const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetStatus: "INVALID_STATUS_VALUE" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
  });

  it("8. Returns 404 NOT_FOUND when target job does not exist", async () => {
    mockJobsService.transitionStatus.mockRejectedValueOnce(
      new AppError(ErrorCode.NOT_FOUND, "Job not found"),
    );

    const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetStatus: "IN_REVIEW" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it("9. Propagates domain transition validation error with 400 BAD_REQUEST", async () => {
    mockJobsService.transitionStatus.mockRejectedValueOnce(
      new AppError(ErrorCode.BAD_REQUEST, "Illegal transition from DRAFT to CLOSED"),
    );

    const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetStatus: "CLOSED" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.BAD_REQUEST);
    expect(json.error.message).toBe("Illegal transition from DRAFT to CLOSED");
  });

  it("10. Successfully transitions status with standard uppercase targetStatus", async () => {
    const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "103.22.45.10",
      },
      body: JSON.stringify({
        targetStatus: "IN_REVIEW",
        comment: "Submitted by recruiter for executive approval.",
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.job.id).toBe(validJobId);
    expect(json.data.job.status).toBe(JobStatus.IN_REVIEW);
    // Backward compatibility
    expect(json.job).toBeDefined();
    expect(json.job.id).toBe(validJobId);

    expect(mockJobsService.transitionStatus).toHaveBeenCalledWith(
      validJobId,
      JobStatus.IN_REVIEW,
      { userId: sampleAdminSession.userId, role: sampleAdminSession.role },
      "Submitted by recruiter for executive approval.",
      "103.22.45.10",
    );

    expect(res.headers.get("x-request-id")).toBeDefined();
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("11. Normalizes lowercase targetStatus and legacy status property", async () => {
    const req = new Request(`http://localhost:3000/api/admin/jobs/${validJobId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "in_review",
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);

    expect(mockJobsService.transitionStatus).toHaveBeenCalledWith(
      validJobId,
      JobStatus.IN_REVIEW,
      { userId: sampleAdminSession.userId, role: sampleAdminSession.role },
      undefined,
      undefined,
    );
  });
});
