import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/admin/jobs/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { JobStatus, JobWorkMode, JobVisibility } from "@/lib/database/enum";

describe("POST & GET /api/admin/jobs — End-to-End Black Box Tests", () => {
  let mockAuthService: any;
  let mockJobsService: any;

  const sampleAdminSession = {
    userId: "admin-uuid-1111",
    email: "admin@techsonance.co.in",
    role: "ADMIN",
  };

  const sampleCreatedJob = {
    id: "job-uuid-7777",
    siteId: "site-uuid-1111",
    slug: "staff-fullstack-engineer",
    title: "Staff Fullstack Engineer",
    department: "Engineering",
    location: "Bhubaneswar",
    workMode: JobWorkMode.HYBRID,
    status: JobStatus.DRAFT,
    visibility: JobVisibility.PUBLIC,
    openingsCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    resetRootContainer();

    mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(sampleAdminSession),
    };

    mockJobsService = {
      createJob: vi.fn().mockResolvedValue(sampleCreatedJob),
      listJobs: vi.fn().mockResolvedValue({
        jobs: [sampleCreatedJob],
        total: 1,
      }),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService });
    container.bind({ provide: AdminJobsService, useValue: mockJobsService });
  });

  it("1. POST /api/admin/jobs rejects unauthenticated request with 401 UNAUTHENTICATED", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const req = new Request("http://localhost:3000/api/admin/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Staff Engineer",
        slug: "staff-engineer",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("UNAUTHENTICATED");
  });

  it("2. POST /api/admin/jobs rejects foreign origin with 403 FORBIDDEN", async () => {
    const req = new Request("http://localhost:3000/api/admin/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: "https://evil-cross-site.com",
      },
      body: JSON.stringify({
        title: "Staff Engineer",
        slug: "staff-engineer",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("3. POST /api/admin/jobs rejects payload missing title with 400 VALIDATION", async () => {
    const req = new Request("http://localhost:3000/api/admin/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "staff-engineer",
        department: "Engineering",
        location: "Bhubaneswar",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("VALIDATION");
    expect(json.error.fieldErrors).toBeDefined();
    expect(json.error.fieldErrors.title).toBeDefined();
  });

  it("4. POST /api/admin/jobs rejects salaryMin > salaryMax with 400 VALIDATION", async () => {
    const req = new Request("http://localhost:3000/api/admin/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Staff Engineer",
        slug: "staff-engineer",
        department: "Engineering",
        location: "Bhubaneswar",
        salaryMin: 5000000,
        salaryMax: 3000000, // Invalid: Max < Min
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("VALIDATION");
    expect(json.error.fieldErrors.salaryMax).toBeDefined();
  });

  it("5. POST /api/admin/jobs rejects ambiguous location with 400 VALIDATION", async () => {
    const req = new Request("http://localhost:3000/api/admin/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Staff Engineer",
        slug: "staff-engineer",
        department: "Engineering",
        location: "multiple locations", // Ambiguous location
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("VALIDATION");
  });

  it("6. POST /api/admin/jobs creates job successfully when valid", async () => {
    const req = new Request("http://localhost:3000/api/admin/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: "https://www.techsonance.co.in",
      },
      body: JSON.stringify({
        title: "Staff Fullstack Engineer",
        slug: "staff-fullstack-engineer",
        department: "Engineering",
        location: "Bhubaneswar",
        workMode: "hybrid",
        salaryMin: 2500000,
        salaryMax: 4000000,
        openingsCount: 2,
        status: "DRAFT",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.job.id).toBe(sampleCreatedJob.id);
    expect(json.data.job.slug).toBe(sampleCreatedJob.slug);
    expect(res.headers.get("x-request-id")).toBeDefined();
  });

  it("7. GET /api/admin/jobs rejects unauthenticated request with 401", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const req = new Request("http://localhost:3000/api/admin/jobs", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("UNAUTHENTICATED");
  });

  it("8. GET /api/admin/jobs returns job list with 200 OK", async () => {
    const req = new Request("http://localhost:3000/api/admin/jobs?status=DRAFT&limit=10", {
      method: "GET",
      headers: {
        origin: "https://www.techsonance.co.in",
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.jobs).toHaveLength(1);
    expect(json.data.total).toBe(1);
    expect(res.headers.get("x-request-id")).toBeDefined();
  });
});
