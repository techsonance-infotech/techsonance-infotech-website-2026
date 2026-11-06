import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/admin/careers/jobs/[id]/return/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { JobStatus, JobApprovalStatus, JobWorkMode, JobVisibility } from "@/lib/database/enum";
import { AppError, ErrorCode } from "@/lib/errors";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";

describe("POST /api/admin/careers/jobs/[id]/return — End-to-End Black Box Tests", () => {
  let mockAuthService: any;
  let mockJobsService: any;

  const validJobId = "550e8400-e29b-41d4-a716-446655440000";
  const sampleAdminSession = {
    userId: "admin-uuid-1111",
    email: "admin@techsonance.co.in",
    role: "admin",
  };

  const sampleReturnedJob = {
    id: validJobId,
    siteId: "site-uuid-1111",
    slug: "senior-cloud-architect",
    title: "Senior Cloud Architect",
    department: "Cloud Engineering",
    location: "Bhubaneswar",
    workMode: JobWorkMode.HYBRID,
    status: JobStatus.DRAFT,
    approvalStatus: JobApprovalStatus.RETURNED,
    approvalComment: "Please specify salary range and add technical stack requirements.",
    visibility: JobVisibility.PUBLIC,
    versionId: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    resetRootContainer();

    mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(sampleAdminSession),
    };

    mockJobsService = {
      returnJob: vi.fn().mockResolvedValue(sampleReturnedJob),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService });
    container.bind({ provide: AdminJobsService, useValue: mockJobsService });
  });

  it("1. Rejects untrusted foreign origin with 403 FORBIDDEN", async () => {
    const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/return`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: "https://phishing-domain.com",
      },
      body: JSON.stringify({ comment: "Needs revision" }),
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

    const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: "Needs revision" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
  });

  it("3. Rejects recruiter / non-admin role with 403 FORBIDDEN", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      userId: "recruiter-uuid-2222",
      email: "recruiter@techsonance.co.in",
      role: "recruiter",
    });

    const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: "Needs revision" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it("4. Rejects invalid non-UUID job ID parameter with 400 VALIDATION", async () => {
    const invalidId = "invalid-uuid-string";
    const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${invalidId}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: "Needs revision" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: invalidId }) });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.fieldErrors).toBeDefined();
  });

  it("5. Rejects malformed JSON payload with 400 BAD_REQUEST", async () => {
    const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ broken json...",
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.BAD_REQUEST);
  });

  it("6. Rejects missing feedback comment with 400 VALIDATION", async () => {
    const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.message).toBe(CAREER_ERRORS.RETURN_FEEDBACK_REQUIRED);
  });

  it("7. Rejects whitespace-only feedback comment with 400 VALIDATION", async () => {
    const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: "     \n   " }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
  });

  it("8. Returns 404 NOT_FOUND when job does not exist", async () => {
    mockJobsService.returnJob.mockRejectedValueOnce(
      new AppError(ErrorCode.NOT_FOUND, "Job not found"),
    );

    const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: "Please update requirements." }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it("9. Successfully returns job to DRAFT status with reviewer comment", async () => {
    const feedbackComment = "Please specify salary range and add technical stack requirements.";
    const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/return`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "103.22.45.10",
      },
      body: JSON.stringify({
        comment: feedbackComment,
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.job.id).toBe(validJobId);
    expect(json.data.job.status).toBe(JobStatus.DRAFT);
    expect(json.data.job.approvalStatus).toBe(JobApprovalStatus.RETURNED);
    expect(json.data.job.approvalComment).toBe(feedbackComment);
    // Backward compatibility for existing UI
    expect(json.job).toBeDefined();
    expect(json.job.id).toBe(validJobId);

    // Verify service was called with actorId and ipAddress
    expect(mockJobsService.returnJob).toHaveBeenCalledWith(
      validJobId,
      feedbackComment,
      sampleAdminSession.userId,
      "103.22.45.10",
    );

    // Verify standard headers
    expect(res.headers.get("x-request-id")).toBeDefined();
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("10. Validates owner role authorization", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      userId: "owner-uuid-0001",
      email: "founder@techsonance.co.in",
      role: "owner",
    });

    const req = new Request(`http://localhost:3000/api/admin/careers/jobs/${validJobId}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: "Revise job description" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: validJobId }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(mockJobsService.returnJob).toHaveBeenCalledWith(
      validJobId,
      "Revise job description",
      "owner-uuid-0001",
      undefined,
    );
  });
});
