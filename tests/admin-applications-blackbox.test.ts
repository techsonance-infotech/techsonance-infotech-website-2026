import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as listApplications } from "@/app/api/admin/careers/applications/route";
import {
  GET as getApplication,
  PATCH as patchApplication,
} from "@/app/api/admin/careers/applications/[id]/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { ApplicationsService } from "@/lib/services/applications.service";
import { ApplicationStatus } from "@/lib/constants/enums/content.enum";

describe("Admin Careers Applications — End-to-End Black Box Tests", () => {
  let mockAuthService: any;
  let mockApplicationsService: any;

  const sampleAdminSession = {
    userId: "admin-uuid-5555",
    email: "hr@techsonance.co.in",
    role: "RECRUITER",
  };

  const sampleApplication = {
    id: "app-uuid-1111-2222-3333-444444444444",
    jobId: "job-uuid-aaaaaaaa-bbbb-cccc-dddddddddddd",
    candidateName: "Elena Rostova",
    email: "elena@example.com",
    phone: "+91 9123456789",
    status: ApplicationStatus.NEW,
    rating: 4,
    internalNotes: "Strong background in distributed architecture.",
    knockoutTriggered: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    resetRootContainer();

    mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(sampleAdminSession),
    };

    mockApplicationsService = {
      listApplications: vi.fn().mockResolvedValue({
        applications: [sampleApplication],
        total: 1,
      }),
      getApplicationById: vi.fn().mockImplementation((id: string) => {
        if (id === sampleApplication.id) return Promise.resolve(sampleApplication);
        return Promise.resolve(null);
      }),
      updateStage: vi
        .fn()
        .mockImplementation((id: string, stage: ApplicationStatus, reason?: string) => {
          return Promise.resolve({
            ...sampleApplication,
            status: stage,
            rejectionReason: reason,
          });
        }),
      updateNotesAndRating: vi
        .fn()
        .mockImplementation((id: string, notes?: string, rating?: number) => {
          return Promise.resolve({
            ...sampleApplication,
            internalNotes: notes ?? sampleApplication.internalNotes,
            rating: rating ?? sampleApplication.rating,
          });
        }),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService });
    container.bind({ provide: ApplicationsService, useValue: mockApplicationsService });
  });

  // 1. GET /api/admin/careers/applications tests
  it("1. GET /api/admin/careers/applications rejects unauthenticated request with 401", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const req = new Request("http://localhost:3000/api/admin/careers/applications", {
      method: "GET",
    });

    const res = await listApplications(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("UNAUTHENTICATED");
  });

  it("2. GET /api/admin/careers/applications rejects foreign origin with 403", async () => {
    const req = new Request("http://localhost:3000/api/admin/careers/applications", {
      method: "GET",
      headers: {
        origin: "https://unauthorized-domain.com",
      },
    });

    const res = await listApplications(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("3. GET /api/admin/careers/applications filters applications successfully", async () => {
    const req = new Request(
      "http://localhost:3000/api/admin/careers/applications?status=NEW&knockoutTriggered=false&limit=25",
      {
        method: "GET",
        headers: {
          origin: "https://www.techsonance.co.in",
        },
      },
    );

    const res = await listApplications(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.applications).toHaveLength(1);
    expect(json.data.total).toBe(1);
    expect(json.applications).toHaveLength(1);
    expect(res.headers.get("x-request-id")).toBeDefined();
  });

  it("4. GET /api/admin/careers/applications rejects invalid query parameters with 400", async () => {
    const req = new Request(
      "http://localhost:3000/api/admin/careers/applications?jobId=not-a-uuid",
      {
        method: "GET",
      },
    );

    const res = await listApplications(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("VALIDATION");
    expect(json.error.fieldErrors.jobId).toBeDefined();
  });

  // 2. GET /api/admin/careers/applications/[id] tests
  it("5. GET /api/admin/careers/applications/[id] returns 404 for unknown application ID", async () => {
    const req = new Request("http://localhost:3000/api/admin/careers/applications/unknown-id", {
      method: "GET",
    });

    const res = await getApplication(req, {
      params: Promise.resolve({ id: "unknown-id" }),
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("6. GET /api/admin/careers/applications/[id] returns candidate application detail", async () => {
    const req = new Request(
      `http://localhost:3000/api/admin/careers/applications/${sampleApplication.id}`,
      {
        method: "GET",
        headers: {
          origin: "https://techsonance.co.in",
        },
      },
    );

    const res = await getApplication(req, {
      params: Promise.resolve({ id: sampleApplication.id }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.application.id).toBe(sampleApplication.id);
    expect(json.data.application.candidateName).toBe("Elena Rostova");
    expect(res.headers.get("x-request-id")).toBeDefined();
  });

  // 3. PATCH /api/admin/careers/applications/[id] tests
  it("7. PATCH /api/admin/careers/applications/[id] updates stage to SHORTLISTED", async () => {
    const req = new Request(
      `http://localhost:3000/api/admin/careers/applications/${sampleApplication.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          origin: "https://techsonance.co.in",
        },
        body: JSON.stringify({
          status: ApplicationStatus.SHORTLISTED,
        }),
      },
    );

    const res = await patchApplication(req, {
      params: Promise.resolve({ id: sampleApplication.id }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.application.status).toBe(ApplicationStatus.SHORTLISTED);
  });

  it("8. PATCH /api/admin/careers/applications/[id] updates internal notes and rating", async () => {
    const req = new Request(
      `http://localhost:3000/api/admin/careers/applications/${sampleApplication.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          internalNotes: "Passed technical interview with flying colors.",
          rating: 5,
        }),
      },
    );

    const res = await patchApplication(req, {
      params: Promise.resolve({ id: sampleApplication.id }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.application.rating).toBe(5);
    expect(json.data.application.internalNotes).toBe(
      "Passed technical interview with flying colors.",
    );
  });

  it("9. PATCH /api/admin/careers/applications/[id] rejects rating > 5 with 400 VALIDATION", async () => {
    const req = new Request(
      `http://localhost:3000/api/admin/careers/applications/${sampleApplication.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: 10, // Invalid: Max is 5
        }),
      },
    );

    const res = await patchApplication(req, {
      params: Promise.resolve({ id: sampleApplication.id }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("VALIDATION");
  });
});
