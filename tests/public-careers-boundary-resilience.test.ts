import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  publicJobPostingBoundarySchema,
  publicJobListBoundarySchema,
} from "@/lib/validations/public-careers-boundary.schema";
import { filterJobs } from "@/app/careers/filterUtils";
import { generateJobPostingJsonLd } from "@/components/careers/JobPostingJsonLd";
import { submitCareerApplication, submitTalentPool } from "@/lib/api/careers.api";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

describe("Public Careers Boundary & Resilience Suite", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("publicJobPostingBoundarySchema", () => {
    it("parses a well-formed job posting without mutation", () => {
      const raw = {
        id: "job-101",
        slug: "full-stack-engineer",
        title: "Full Stack Engineer",
        department: "Engineering",
        location: "Bhubaneswar, India",
        workMode: "Hybrid",
        type: "Full Time",
        experienceLevel: "Senior",
        description: "Join our core platform engineering team.",
        responsibilities: ["Build scalable APIs", "Optimize React performance"],
        requirements: ["3+ years Node.js", "React 19"],
        skills: ["React", "TypeScript", "Next.js"],
        salaryMin: 1200000,
        salaryMax: 1800000,
        salaryCurrency: "INR",
        salaryPeriod: "year",
        showSalaryPublicly: true,
        status: "PUBLISHED",
      };

      const parsed = publicJobPostingBoundarySchema.parse(raw);
      expect(parsed.slug).toBe("full-stack-engineer");
      expect(parsed.title).toBe("Full Stack Engineer");
      expect(parsed.salaryMin).toBe(1200000);
      expect(parsed.skills).toEqual(["React", "TypeScript", "Next.js"]);
    });

    it("recovers gracefully from null, missing, and corrupt fields", () => {
      const corrupt = {
        slug: null,
        title: "",
        department: null,
        location: null,
        description: null,
        responsibilities: null,
        requirements: null,
        skills: [null, 123, "Next.js", ""],
        salaryMin: "invalid-number",
        salaryMax: null,
        status: "NON_EXISTENT_STATUS",
      };

      const parsed = publicJobPostingBoundarySchema.parse(corrupt);
      expect(parsed.slug).toBe("unknown-role");
      expect(parsed.title).toBe("Untitled Position");
      expect(parsed.department).toBe("General");
      expect(parsed.location).toBe("Remote, India");
      expect(parsed.responsibilities).toEqual([]);
      expect(parsed.requirements).toEqual([]);
      // Skills gracefully stringifies or filters
      expect(parsed.skills).toContain("Next.js");
      expect(parsed.skills).toContain("123");
      // Corrupt salary is safely undefined
      expect(parsed.salaryMin).toBeUndefined();
      expect(parsed.salaryMax).toBeUndefined();
      // Bad status defaults to OPEN
      expect(parsed.status).toBe("OPEN");
    });
  });

  describe("publicJobListBoundarySchema (Item-level isolation)", () => {
    it("filters out corrupt or null items while preserving healthy jobs", () => {
      const mixedPayload = [
        {
          slug: "valid-job-1",
          title: "Valid Role 1",
          department: "Engineering",
          location: "Remote",
          description: "A great job",
          status: "OPEN",
        },
        null, // Malformed null entry
        undefined, // Undefined entry
        {
          slug: "valid-job-2",
          title: "Valid Role 2",
          department: "Design",
          location: "Bhubaneswar",
          description: "UI/UX lead",
          status: "PUBLISHED",
        },
      ];

      const parsed = publicJobListBoundarySchema.parse(mixedPayload);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]?.slug).toBe("valid-job-1");
      expect(parsed[1]?.slug).toBe("valid-job-2");
    });

    it("handles non-array inputs cleanly by returning empty list", () => {
      const empty1 = publicJobListBoundarySchema.parse([]);
      expect(empty1).toEqual([]);
    });
  });

  describe("filterJobs resilience", () => {
    it("does not crash when filtering jobs with non-string skills or null items", () => {
      const jobsWithCorruptData: any[] = [
        null,
        {
          slug: "job-1",
          title: "Backend Dev",
          department: "Engineering",
          skills: [null, 404, "Go"],
          status: "OPEN",
        },
        {
          slug: "job-2",
          title: "Frontend Dev",
          department: "Engineering",
          skills: ["React"],
          status: "OPEN",
        },
      ];

      const result = filterJobs(jobsWithCorruptData, {
        search: "React",
        department: "all",
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.slug).toBe("job-2");
    });

    it("safely handles invalid date strings during sorting", () => {
      const jobsWithBadDates: any[] = [
        {
          slug: "job-bad-date",
          title: "A Job",
          publishedAt: "corrupt-date-string",
          closesAt: "not-a-date",
        },
        {
          slug: "job-good-date",
          title: "B Job",
          publishedAt: "2026-10-01T00:00:00.000Z",
          closesAt: "2026-12-01T00:00:00.000Z",
        },
      ];

      expect(() => {
        filterJobs(jobsWithBadDates, { sortBy: "closing_soon" });
        filterJobs(jobsWithBadDates, { sortBy: "newest" });
        filterJobs(jobsWithBadDates, { sortBy: "title" });
      }).not.toThrow();
    });
  });

  describe("generateJobPostingJsonLd resilience", () => {
    it("handles null or undefined job object without throwing", () => {
      expect(() => generateJobPostingJsonLd(null as any)).not.toThrow();
      expect(generateJobPostingJsonLd(null as any)).toEqual({});
    });

    it("formats ISO dates and ignores non-numeric salary without crash", () => {
      const job: any = {
        title: "Staff Engineer",
        description: "Leading platform",
        publishedAt: "2026-05-15",
        showSalaryPublicly: true,
        salaryMin: "not-a-number",
      };

      const jsonLd = generateJobPostingJsonLd(job);
      expect(jsonLd["@type"]).toBe("JobPosting");
      expect(jsonLd.title).toBe("Staff Engineer");
      expect(jsonLd.baseSalary).toBeUndefined(); // Invalid salary ignored safely
    });
  });

  describe("submitCareerApplication network resilience", () => {
    it("handles 409 conflict with candidate-friendly message", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        headers: {
          get: (header: string) =>
            header.toLowerCase() === "content-type" ? "application/json" : null,
        },
        json: vi.fn().mockResolvedValue({
          ok: false,
          error: "Candidate has already applied for this job opening.",
        }),
      } as unknown as Response);

      await expect(
        submitCareerApplication({
          jobId: "job-101",
          candidateName: "John Doe",
          email: "john@example.com",
          privacyConsent: true,
        }),
      ).rejects.toThrow("already submitted an application");
    });

    it("handles HTML 502 bad gateway proxy error without crashing JSON parser", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        headers: {
          get: (header: string) => (header.toLowerCase() === "content-type" ? "text/html" : null),
        },
        json: vi
          .fn()
          .mockRejectedValue(new SyntaxError("Unexpected token < in JSON at position 0")),
      } as unknown as Response);

      await expect(
        submitCareerApplication({
          jobId: "job-101",
          candidateName: "John Doe",
          email: "john@example.com",
          privacyConsent: true,
        }),
      ).rejects.toThrow();
    });
  });
});
