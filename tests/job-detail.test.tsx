import { describe, it, expect } from "vitest";
import { generateJobPostingJsonLd } from "@/components/careers/JobPostingJsonLd";
import type { JobPosting } from "@/lib/content/types";

describe("JobPostingJsonLd Component", () => {
  it("formats valid Schema.org JobPosting object", () => {
    const mockJob: JobPosting = {
      slug: "frontend-engineer",
      title: "Frontend Engineer",
      department: "Engineering",
      location: "Remote",
      type: "full_time",
      description: "Building Next.js apps",
      responsibilities: ["Develop UI"],
      requirements: ["React 19"],
      benefits: ["Health insurance"],
      status: "PUBLISHED",
      salaryMin: 1200000,
      salaryMax: 1800000,
      salaryCurrency: "INR",
      salaryPeriod: "year",
      showSalaryPublicly: true,
      publishedAt: "2026-11-01T00:00:00.000Z",
    };

    const jsonLd = generateJobPostingJsonLd(mockJob);
    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("JobPosting");
    expect(jsonLd.title).toBe("Frontend Engineer");
    expect(jsonLd.description).toBe("Building Next.js apps");
    expect(jsonLd.hiringOrganization.name).toBe("TechSonance Infotech");
    expect(jsonLd.jobLocationType).toBe("TELECOMMUTE");
    expect(jsonLd.baseSalary).toBeDefined();
    expect(jsonLd.baseSalary.value.minValue).toBe(1200000);
    expect(jsonLd.baseSalary.value.maxValue).toBe(1800000);
  });

  it("omits baseSalary when showSalaryPublicly is false", () => {
    const mockJob: JobPosting = {
      slug: "frontend-engineer",
      title: "Frontend Engineer",
      department: "Engineering",
      location: "Bhubaneswar, India",
      type: "full_time",
      description: "Building Next.js apps",
      responsibilities: ["Develop UI"],
      requirements: ["React 19"],
      benefits: ["Health insurance"],
      status: "PUBLISHED",
      salaryMin: 1200000,
      salaryMax: 1800000,
      showSalaryPublicly: false,
    };

    const jsonLd = generateJobPostingJsonLd(mockJob);
    expect(jsonLd.baseSalary).toBeUndefined();
    expect(jsonLd.jobLocationType).toBeUndefined();
  });
});
