import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createAdminJob,
  listAdminJobs,
  getAdminJob,
  updateAdminJob,
  deleteAdminJob,
  updateAdminJobStatus,
} from "@/lib/api/admin-jobs.api";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

describe("Admin Jobs Client API", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("createAdminJob", () => {
    it("creates a job draft successfully and returns the job", async () => {
      const mockJob = {
        id: "job-101",
        title: "Senior Next.js Architect",
        slug: "senior-nextjs-architect",
        status: "DRAFT",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          ok: true,
          data: { job: mockJob },
        }),
      } as unknown as Response);

      const result = await createAdminJob({
        title: "Senior Next.js Architect",
        slug: "senior-nextjs-architect",
        department: "Engineering",
        location: "Bhubaneswar",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.JOBS,
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }),
      );

      expect(result.id).toBe("job-101");
      expect(result.title).toBe("Senior Next.js Architect");
    });

    it("throws an error when creation fails", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({
          ok: false,
          error: "Salary max must exceed salary min",
        }),
      } as unknown as Response);

      await expect(
        createAdminJob({
          title: "Staff Dev",
        }),
      ).rejects.toThrow("Salary max must exceed salary min");
    });
  });

  describe("listAdminJobs", () => {
    it("fetches list of jobs with query filters", async () => {
      const mockJobs = [
        { id: "j1", title: "Backend Engineer", status: "PUBLISHED" },
        { id: "j2", title: "Frontend Engineer", status: "PUBLISHED" },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          ok: true,
          data: { jobs: mockJobs },
        }),
      } as unknown as Response);

      const result = await listAdminJobs({
        status: "PUBLISHED",
        search: "Engineer",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_ENDPOINTS.ADMIN.JOBS}?status=PUBLISHED&search=Engineer`,
        expect.objectContaining({
          method: "GET",
          credentials: "include",
        }),
      );

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("j1");
    });
  });

  describe("getAdminJob", () => {
    it("fetches a specific job by id", async () => {
      const mockJob = { id: "j1", title: "AI Lead", status: "DRAFT" };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          ok: true,
          data: { job: mockJob },
        }),
      } as unknown as Response);

      const result = await getAdminJob("j1");

      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.JOB("j1"),
        expect.objectContaining({
          method: "GET",
          credentials: "include",
        }),
      );

      expect(result.title).toBe("AI Lead");
    });
  });

  describe("updateAdminJob", () => {
    it("updates existing job via PATCH", async () => {
      const updatedJob = { id: "j1", title: "Principal AI Lead", status: "DRAFT" };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          ok: true,
          data: { job: updatedJob },
        }),
      } as unknown as Response);

      const result = await updateAdminJob("j1", { title: "Principal AI Lead" });

      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.JOB("j1"),
        expect.objectContaining({
          method: "PATCH",
          credentials: "include",
        }),
      );

      expect(result.title).toBe("Principal AI Lead");
    });
  });

  describe("deleteAdminJob", () => {
    it("deletes a job posting via DELETE", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true }),
      } as unknown as Response);

      const result = await deleteAdminJob("j1");

      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.JOB("j1"),
        expect.objectContaining({
          method: "DELETE",
          credentials: "include",
        }),
      );

      expect(result).toBe(true);
    });
  });

  describe("updateAdminJobStatus", () => {
    it("transitions job status successfully via POST /status", async () => {
      const mockJob = {
        id: "j1",
        title: "Principal AI Lead",
        status: "IN_REVIEW",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          ok: true,
          data: { job: mockJob },
        }),
      } as unknown as Response);

      const result = await updateAdminJobStatus("j1", {
        targetStatus: "IN_REVIEW",
        comment: "Ready for review",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.JOB_STATUS("j1"),
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetStatus: "IN_REVIEW",
            comment: "Ready for review",
          }),
        }),
      );

      expect(result.status).toBe("IN_REVIEW");
    });

    it("throws an error when status transition is rejected", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({
          ok: false,
          error: "Illegal transition from DRAFT to ARCHIVED",
        }),
      } as unknown as Response);

      await expect(
        updateAdminJobStatus("j1", {
          targetStatus: "ARCHIVED",
        }),
      ).rejects.toThrow("Illegal transition from DRAFT to ARCHIVED");
    });
  });
});
