import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/admin/careers/applications/export/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { ApplicationsService } from "@/lib/services/applications.service";
import { AppError, ErrorCode } from "@/lib/errors";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";

describe("GET /api/admin/careers/applications/export — End-to-End Black Box Tests", () => {
  let mockAuthService: any;
  let mockApplicationsService: any;

  const validJobId = "550e8400-e29b-41d4-a716-446655440000";
  const mockCsvContent =
    'ID,Candidate Name,Email,Phone,Status,Job Title,Knockout Triggered,Rating,Created At\n' +
    '"app-1","Sarah Connor","sarah@techsonance.co.in","+919876543210","interview","Lead DevOps Engineer","No","5","2026-11-06T12:00:00.000Z"\n' +
    '"app-2","John Doe","john@example.com","","new","Lead DevOps Engineer","Yes","","2026-11-06T14:30:00.000Z"';

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
      generateApplicationsCsv: vi.fn().mockResolvedValue({
        csvData: mockCsvContent,
        filename: "applications-all-2026-11-06.csv",
        rowCount: 2,
        storagePath: "exports/applications-all-2026-11-06.csv",
      }),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService });
    container.bind({ provide: ApplicationsService, useValue: mockApplicationsService });
  });

  it("1. Rejects unauthenticated request with 401 UNAUTHENTICATED", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const req = new Request("http://localhost:3000/api/admin/careers/applications/export", {
      method: "GET",
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    expect(json.error.message).toBe(CAREER_ERRORS.UNAUTHORIZED);
    expect(res.headers.get("x-request-id")).toBeDefined();
  });

  it("2. Rejects foreign origin with 403 FORBIDDEN", async () => {
    const req = new Request("http://localhost:3000/api/admin/careers/applications/export", {
      method: "GET",
      headers: {
        origin: "https://untrusted-pirate-site.com",
      },
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe("Forbidden origin");
  });

  it("3. Rejects recruiter or non-admin role with 403 FORBIDDEN (Owner/Admin required)", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      userId: "recruiter-uuid-2222",
      email: "recruiter@techsonance.co.in",
      role: "recruiter",
    });

    const req = new Request("http://localhost:3000/api/admin/careers/applications/export", {
      method: "GET",
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(CAREER_ERRORS.FORBIDDEN_ADMIN_OR_OWNER);
  });

  it("4. Rejects invalid non-UUID jobId query parameter with 400 VALIDATION", async () => {
    const req = new Request("http://localhost:3000/api/admin/careers/applications/export?jobId=not-a-uuid", {
      method: "GET",
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.fieldErrors).toBeDefined();
    expect(json.error.fieldErrors.jobId).toContain("Invalid job ID format");
  });

  it("5. Happy path: streams real CSV attachment for browser download", async () => {
    const req = new Request("http://localhost:3000/api/admin/careers/applications/export", {
      method: "GET",
    });

    const res = await GET(req);
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("Content-Disposition")).toContain('attachment; filename="applications-all-2026-11-06.csv"');
    expect(res.headers.get("x-export-row-count")).toBe("2");
    expect(res.headers.get("x-export-storage-path")).toBe("exports/applications-all-2026-11-06.csv");
    expect(res.headers.get("Cache-Control")).toBe("no-store, private");
    expect(text).toContain("Sarah Connor");
    expect(text).toContain("john@example.com");
    expect(mockApplicationsService.generateApplicationsCsv).toHaveBeenCalledWith(undefined, "admin-uuid-1111");
  });

  it("6. Happy path: filters by jobId and generates scoped filename", async () => {
    mockApplicationsService.generateApplicationsCsv.mockResolvedValueOnce({
      csvData: mockCsvContent,
      filename: `applications-${validJobId}-2026-11-06.csv`,
      rowCount: 2,
      storagePath: `exports/applications-${validJobId}-2026-11-06.csv`,
    });

    const req = new Request(`http://localhost:3000/api/admin/careers/applications/export?jobId=${validJobId}`, {
      method: "GET",
    });

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain(`attachment; filename="applications-${validJobId}-2026-11-06.csv"`);
    expect(mockApplicationsService.generateApplicationsCsv).toHaveBeenCalledWith(validJobId, "admin-uuid-1111");
  });

  it("7. Happy path: returns JSON envelope when Accept: application/json requested", async () => {
    const req = new Request("http://localhost:3000/api/admin/careers/applications/export", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.filename).toBe("applications-all-2026-11-06.csv");
    expect(json.data.rowCount).toBe(2);
    expect(json.data.csvData).toContain("Sarah Connor");
    expect(json.data.storagePath).toBe("exports/applications-all-2026-11-06.csv");
  });

  it("8. Happy path: allows owner role to export", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce({
      userId: "owner-uuid-0000",
      email: "founder@techsonance.co.in",
      role: "owner",
    });

    const req = new Request("http://localhost:3000/api/admin/careers/applications/export", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockApplicationsService.generateApplicationsCsv).toHaveBeenCalledWith(undefined, "owner-uuid-0000");
  });

  it("9. Returns 500 INTERNAL when unexpected service error occurs", async () => {
    mockApplicationsService.generateApplicationsCsv.mockRejectedValueOnce(
      new Error("Database connection pool timeout"),
    );

    const req = new Request("http://localhost:3000/api/admin/careers/applications/export", {
      method: "GET",
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.INTERNAL);
    expect(json.error.message).toBe(CAREER_ERRORS.FAILED_EXPORT_APPLICATIONS);
  });
});
