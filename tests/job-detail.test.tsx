import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  generateJobPostingJsonLd,
  JobPostingJsonLd,
} from "@/components/careers/JobPostingJsonLd";
import { ClosedJobBanner } from "@/components/careers/ClosedJobBanner";
import { legacyJobSource } from "@/lib/content/jobs";
import type { JobPosting } from "@/lib/content/types";

describe("JobPostingJsonLd Component & Generator", () => {
  it("formats valid Schema.org JobPosting object with full requirements", () => {
    const mockJob: JobPosting = {
      slug: "frontend-engineer",
      title: "Frontend Engineer",
      department: "Engineering",
      location: "Remote",
      workMode: "remote",
      type: "Full Time",
      description: "Building Next.js apps",
      responsibilities: ["Develop UI", "Optimize performance"],
      requirements: ["React 19", "TypeScript"],
      benefits: ["Health insurance", "Annual retreat"],
      status: "PUBLISHED",
      salaryMin: 1200000,
      salaryMax: 1800000,
      salaryCurrency: "INR",
      salaryPeriod: "year",
      showSalaryPublicly: true,
      closesAt: "2026-12-31T23:59:59.000Z",
      publishedAt: "2026-11-01T00:00:00.000Z",
    };

    const jsonLd = generateJobPostingJsonLd(mockJob);
    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("JobPosting");
    expect(jsonLd.title).toBe("Frontend Engineer");
    expect(jsonLd.description).toBe("Building Next.js apps");
    expect((jsonLd.hiringOrganization as any).name).toBe("TechSonance Infotech");
    expect(jsonLd.jobLocationType).toBe("TELECOMMUTE");
    expect(jsonLd.employmentType).toBe("FULL_TIME");
    expect(jsonLd.validThrough).toBe("2026-12-31T23:59:59.000Z");

    const baseSalary = jsonLd.baseSalary as any;
    expect(baseSalary).toBeDefined();
    expect(baseSalary.currency).toBe("INR");
    expect(baseSalary.value.minValue).toBe(1200000);
    expect(baseSalary.value.maxValue).toBe(1800000);
    expect(baseSalary.value.unitText).toBe("YEAR");
  });

  it("omits baseSalary when showSalaryPublicly is false", () => {
    const mockJob: JobPosting = {
      slug: "frontend-engineer",
      title: "Frontend Engineer",
      department: "Engineering",
      location: "Bhubaneswar, India",
      workMode: "on_site",
      type: "Full Time",
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

  it("renders a valid application/ld+json script tag", () => {
    const mockJob: JobPosting = {
      slug: "brand-designer",
      title: "Brand Designer",
      department: "Design",
      location: "Bhubaneswar",
      type: "Contract",
      description: "Crafting visual identities",
      responsibilities: ["Figma design"],
      requirements: ["5+ years"],
      benefits: ["Flexible hours"],
      status: "OPEN",
    };

    const html = renderToString(<JobPostingJsonLd job={mockJob} />);
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain("Brand Designer");
    expect(html).toContain("https://schema.org");
  });
});

describe("ClosedJobBanner Component", () => {
  const similarJobs: JobPosting[] = [
    {
      slug: "senior-backend-engineer",
      title: "Senior Backend Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full Time",
      description: "Go & Node microservices",
      responsibilities: ["Build APIs"],
      requirements: ["Go", "Node"],
      benefits: ["Health insurance"],
      status: "OPEN",
    },
    {
      slug: "intern-designer",
      title: "Design Intern",
      department: "Design",
      location: "Remote",
      type: "Internship",
      description: "UI design",
      responsibilities: ["Figma"],
      requirements: ["Portfolio"],
      benefits: ["Stipend"],
      status: "DRAFT", // Should not be recommended
    },
  ];

  it("returns null for OPEN and PUBLISHED status", () => {
    const openHtml = renderToString(<ClosedJobBanner status="OPEN" />);
    expect(openHtml).toBe("");

    const publishedHtml = renderToString(<ClosedJobBanner status="PUBLISHED" />);
    expect(publishedHtml).toBe("");
  });

  it("renders paused banner when status is PAUSED without apply button", () => {
    const html = renderToString(<ClosedJobBanner status="PAUSED" />);
    expect(html).toContain("This opening is temporarily on hold and not accepting applications");
    expect(html).not.toContain("Apply Now");
    expect(html).not.toContain("Apply for this Role");
  });

  it("renders closed banner and recommends active similar positions when CLOSED", () => {
    const html = renderToString(
      <ClosedJobBanner status="CLOSED" similarJobs={similarJobs} />,
    );
    expect(html).toContain("This opening is now closed and no longer accepting applications");
    expect(html).toContain("Senior Backend Engineer");
    // Draft job should NOT be rendered in similar jobs
    expect(html).not.toContain("Design Intern");
    expect(html).not.toContain("Apply Now");
  });
});

describe("Legacy Job Content Verification", () => {
  it("resolves open legacy job with full detail", async () => {
    const job = await legacyJobSource.get("business-development-partner");
    expect(job).not.toBeNull();
    expect(job?.title).toBe("Business Development Partner");
    expect(job?.status).toBe("OPEN");
    expect(job?.responsibilities.length).toBeGreaterThan(0);
    expect(job?.requirements.length).toBeGreaterThan(0);
  });

  it("resolves closed legacy job without 404ing", async () => {
    const job = await legacyJobSource.get("full-stack-developer-intern");
    expect(job).not.toBeNull();
    expect(job?.title).toBe("Full Stack Developer Intern");
    expect(job?.status).toBe("CLOSED");
  });
});
