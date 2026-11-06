import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/admin/careers/applications/[id]/resume/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { ApplicationsService } from "@/lib/services/applications.service";
import { AppError, ErrorCode } from "@/lib/errors";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";

describe("GET /api/admin/careers/applications/[id]/resume — End-to-End Black Box Tests", () => {
  let mockAuthService: any;
  let mockApplicationsService: any;

  const validAppId = "a1111111-2222-4333-8444-555555555555";
  const mockSignedUrl = "https://supabase.co/storage/v1/object/sign/resumes/candidate.pdf?token=abc123xyz";

  const adminSession = {
    userId: "admin-uuid-1111",
    email: "admin@techsonance.co.in",
    role: "admin",
  };

  beforeEach(() => {
    resetRootContainer();

    mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(adminSession),
    };

    mockApplicationsService = {
      getSignedResumeUrl: vi.fn().mockResolvedValue(mockSignedUrl),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService });
    container.bind({ provide: ApplicationsService, useValue: mockApplicationsService });
  });

  it("1. Rejects unauthenticated request with 401 UNAUTHENTICATED", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const req = new Request(`http://localhost:3000/api/admin/careers/applications/${validAppId}/resume`, {
      method: "GET",
    });

    const res = await GET(req, { params: Promise.resolve({ id: validAppId }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    expect(json.error.message).toBe(CAREER_ERRORS.UNAUTHORIZED);
    expect(res.headers.get("x-request-id")).toBeDefined();
  });

  it("2. Rejects foreign origin with 403 FORBIDDEN", async () => {
    const req = new Request(`http://localhost:3000/api/admin/careers/applications/${validAppId}/resume`, {
      method: "GET",
      headers: {
        origin: "https://malicious-attacker.com",
      },
    });

    const res = await GET(req, { params: Promise.resolve({ id: validAppId }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe("Forbidden origin");
  });

  it("3. Rejects invalid non-UUID application ID with 400 VALIDATION", async () => {
    const req = new Request(`http://localhost:3000/api/admin/careers/applications/invalid-uuid/resume`, {
      method: "GET",
    });

    const res = await GET(req, { params: Promise.resolve({ id: "invalid-uuid" }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.fieldErrors).toBeDefined();
    expect(json.error.fieldErrors.id).toContain("Invalid application ID format");
  });

  it("4. Rejects unauthorized role with 403 FORBIDDEN", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      userId: "guest-uuid-9999",
      email: "guest@techsonance.co.in",
      role: "viewer",
    });

    const req = new Request(`http://localhost:3000/api/admin/careers/applications/${validAppId}/resume`, {
      method: "GET",
    });

    const res = await GET(req, { params: Promise.resolve({ id: validAppId }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toContain("insufficient permissions");
  });

  it("5. Returns 404 NOT_FOUND when application does not exist", async () => {
    mockApplicationsService.getSignedResumeUrl.mockRejectedValueOnce(
      new AppError(ErrorCode.NOT_FOUND, CAREER_ERRORS.APPLICATION_NOT_FOUND),
    );

    const nonExistentId = "00000000-0000-4000-a000-000000000000";
    const req = new Request(`http://localhost:3000/api/admin/careers/applications/${nonExistentId}/resume`, {
      method: "GET",
    });

    const res = await GET(req, { params: Promise.resolve({ id: nonExistentId }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
    expect(json.error.message).toBe(CAREER_ERRORS.APPLICATION_NOT_FOUND);
  });

  it("6. Returns 404 NOT_FOUND when resume document is not attached", async () => {
    mockApplicationsService.getSignedResumeUrl.mockRejectedValueOnce(
      new AppError(ErrorCode.NOT_FOUND, CAREER_ERRORS.RESUME_NOT_ATTACHED),
    );

    const req = new Request(`http://localhost:3000/api/admin/careers/applications/${validAppId}/resume`, {
      method: "GET",
    });

    const res = await GET(req, { params: Promise.resolve({ id: validAppId }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
    expect(json.error.message).toBe(CAREER_ERRORS.RESUME_NOT_ATTACHED);
  });

  it("7. Happy path: returns 200 OK with signed URL and cache headers for admin", async () => {
    const req = new Request(`http://localhost:3000/api/admin/careers/applications/${validAppId}/resume`, {
      method: "GET",
    });

    const res = await GET(req, { params: Promise.resolve({ id: validAppId }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.signedUrl).toBe(mockSignedUrl);
    expect(json.signedUrl).toBe(mockSignedUrl); // Legacy compatibility for CandidateDrawer
    expect(res.headers.get("x-request-id")).toBeDefined();
    expect(res.headers.get("Cache-Control")).toBe("no-store, private");
    expect(mockApplicationsService.getSignedResumeUrl).toHaveBeenCalledWith(validAppId, "admin");
  });

  it("8. Happy path: returns 200 OK for recruiter role", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      userId: "recruiter-uuid-2222",
      email: "recruiter@techsonance.co.in",
      role: "recruiter",
    });

    const req = new Request(`http://localhost:3000/api/admin/careers/applications/${validAppId}/resume`, {
      method: "GET",
    });

    const res = await GET(req, { params: Promise.resolve({ id: validAppId }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.signedUrl).toBe(mockSignedUrl);
    expect(mockApplicationsService.getSignedResumeUrl).toHaveBeenCalledWith(validAppId, "recruiter");
  });

  it("9. Happy path: returns 200 OK for hiring_manager role", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      userId: "hm-uuid-3333",
      email: "hm@techsonance.co.in",
      role: "hiring_manager",
    });

    const req = new Request(`http://localhost:3000/api/admin/careers/applications/${validAppId}/resume`, {
      method: "GET",
    });

    const res = await GET(req, { params: Promise.resolve({ id: validAppId }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.signedUrl).toBe(mockSignedUrl);
  });

  it("10. Returns 500 INTERNAL on unexpected storage failure", async () => {
    mockApplicationsService.getSignedResumeUrl.mockRejectedValueOnce(
      new Error("Storage bucket connection timed out"),
    );

    const req = new Request(`http://localhost:3000/api/admin/careers/applications/${validAppId}/resume`, {
      method: "GET",
    });

    const res = await GET(req, { params: Promise.resolve({ id: validAppId }) });
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.INTERNAL);
    expect(json.error.message).toBe(CAREER_ERRORS.FAILED_GENERATE_RESUME_LINK);
  });
});
