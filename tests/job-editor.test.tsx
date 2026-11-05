import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  computeCompleteness,
  CompletenessChecklist,
  type JobCompletenessState,
} from "@/components/admin/careers/CompletenessChecklist";
import { JobLivePreview } from "@/components/admin/careers/JobLivePreview";
import {
  JobStatus,
  JobType,
  JobWorkMode,
  JobSalaryPeriod,
} from "@/lib/database/enum";

describe("Job Editor - Completeness Checklist Engine", () => {
  it("evaluates an empty job as incomplete with low score and isReady=false", () => {
    const emptyJob: Partial<JobCompletenessState> = {};
    const result = computeCompleteness(emptyJob);

    expect(result.isReady).toBe(false);
    expect(result.percentage).toBeLessThan(50);
    expect(result.items.find((i) => i.id === "title")?.passed).toBe(false);
    expect(result.items.find((i) => i.id === "department")?.passed).toBe(false);
    expect(result.items.find((i) => i.id === "location")?.passed).toBe(false);
    expect(result.items.find((i) => i.id === "description")?.passed).toBe(false);
    expect(result.items.find((i) => i.id === "responsibilities")?.passed).toBe(false);
    expect(result.items.find((i) => i.id === "requirements")?.passed).toBe(false);
  });

  it("fails salary validation when salaryMin > salaryMax", () => {
    const invalidSalaryJob: Partial<JobCompletenessState> = {
      title: "Senior Full Stack Engineer",
      slug: "senior-full-stack-engineer",
      department: "Engineering",
      location: "Bengaluru, India",
      description: "Exciting leadership position building high scale systems.",
      responsibilities: ["Build microservices", "Lead squad"],
      requirements: ["5+ years Node.js", "TypeScript"],
      salaryMin: 2500000,
      salaryMax: 1800000, // Invalid: min > max
    };

    const result = computeCompleteness(invalidSalaryJob);
    const salaryItem = result.items.find((i) => i.id === "salary");
    expect(salaryItem?.passed).toBe(false);
    expect(salaryItem?.error).toContain("minimum cannot exceed maximum");
    expect(result.isReady).toBe(false);
  });

  it("fails deadline validation when closesAt is in the past", () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const expiredJob: Partial<JobCompletenessState> = {
      title: "Senior Full Stack Engineer",
      slug: "senior-full-stack-engineer",
      department: "Engineering",
      location: "Bengaluru, India",
      description: "Exciting leadership position building high scale systems.",
      responsibilities: ["Build microservices"],
      requirements: ["5+ years Node.js"],
      closesAt: pastDate,
    };

    const result = computeCompleteness(expiredJob);
    const deadlineItem = result.items.find((i) => i.id === "deadline");
    expect(deadlineItem?.passed).toBe(false);
    expect(deadlineItem?.error).toContain("future");
  });

  it("evaluates a complete job as 100% and isReady=true", () => {
    const completeJob: Partial<JobCompletenessState> = {
      title: "Senior Full Stack Engineer",
      slug: "senior-full-stack-engineer",
      department: "Engineering",
      location: "Bengaluru, India",
      workMode: JobWorkMode.HYBRID,
      type: JobType.FULL_TIME,
      summary: "Lead our next generation frontend architecture.",
      description: "Exciting leadership position building high scale systems with Next.js 16.",
      responsibilities: ["Architect web applications", "Mentor junior engineers"],
      requirements: ["5+ years modern TypeScript", "Proficiency in React 19"],
      equalOpportunityStatement: "We are an equal opportunity employer committed to diversity.",
      salaryMin: 1800000,
      salaryMax: 2600000,
      closesAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };

    const result = computeCompleteness(completeJob);
    expect(result.isReady).toBe(true);
    expect(result.percentage).toBe(100);
    expect(result.items.every((i) => i.passed)).toBe(true);
  });
});

describe("CompletenessChecklist Component Rendering", () => {
  it("renders checklist summary progress and missing item callouts", () => {
    const partialJob: Partial<JobCompletenessState> = {
      title: "Staff DevOps Engineer",
      department: "Infrastructure",
    };

    const html = renderToString(
      <CompletenessChecklist
        job={partialJob}
        onSubmitForReview={() => {}}
        onPublish={() => {}}
      />,
    );

    expect(html).toContain("Readiness Checklist");
    expect(html).toContain("Staff DevOps Engineer");
    expect(html).toContain("Description");
    expect(html).toContain("Responsibilities");
  });
});

describe("JobLivePreview Component Rendering", () => {
  const previewJob = {
    title: "Lead Cloud Architect",
    slug: "lead-cloud-architect",
    department: "Cloud Engineering",
    location: "Bengaluru, India",
    workMode: JobWorkMode.REMOTE,
    type: JobType.FULL_TIME,
    summary: "Architect enterprise multi-cloud solutions for Fortune 500 clients.",
    description: "In this role you will own the cloud roadmap across AWS and GCP.",
    responsibilities: ["Design resilient architectures", "Automate infrastructure with Terraform"],
    requirements: ["AWS Certified Solutions Architect", "10+ years infrastructure experience"],
    skills: ["AWS", "Kubernetes", "Terraform", "Go"],
    salaryMin: 3500000,
    salaryMax: 5000000,
    salaryCurrency: "INR",
    salaryPeriod: JobSalaryPeriod.YEAR,
    showSalaryPublicly: true,
    status: JobStatus.PUBLISHED,
  };

  it("renders desktop preview with title, workMode, compensation, and requirements", () => {
    const html = renderToString(
      <JobLivePreview
        job={previewJob}
        viewport="desktop"
      />,
    );

    expect(html).toContain("Lead Cloud Architect");
    expect(html).toContain("Cloud Engineering");
    expect(html).toContain("REMOTE");
    expect(html).toContain("35,00,000");
    expect(html).toContain("50,00,000");
    expect(html).toContain("Design resilient architectures");
    expect(html).toContain("AWS Certified Solutions Architect");
    expect(html).toContain("Apply Now");
  });

  it("hides salary compensation when showSalaryPublicly is false", () => {
    const html = renderToString(
      <JobLivePreview
        job={{ ...previewJob, showSalaryPublicly: false }}
        viewport="desktop"
      />,
    );

    expect(html).not.toContain("3,500,000");
  });

  it("renders mobile device frame when viewport is mobile", () => {
    const html = renderToString(
      <JobLivePreview
        job={previewJob}
        viewport="mobile"
      />,
    );

    expect(html).toContain("w-[375px]");
    expect(html).toContain("Lead Cloud Architect");
  });
});
