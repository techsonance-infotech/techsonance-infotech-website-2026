import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  evaluateCompleteness,
  computeCompleteness,
  CompletenessChecklist,
} from "@/components/admin/careers/CompletenessChecklist";
import { JobLivePreview } from "@/components/admin/careers/JobLivePreview";
import { JobEditorForm } from "@/components/admin/careers/JobEditorForm";

describe("CompletenessChecklist evaluation", () => {
  it("flags missing required fields", () => {
    const incompleteJob = {
      title: "",
      department: "",
      location: "",
      description: "",
      responsibilities: [],
      requirements: [],
    };
    const result = evaluateCompleteness(incompleteJob as any);
    expect(result.isComplete).toBe(false);
    expect(result.missingFields).toContain("Job Title");
    expect(result.missingFields).toContain("Key Responsibilities (at least 1)");
  });

  it("passes when all required fields are present and valid", () => {
    const completeJob = {
      title: "Senior Engineer",
      department: "Engineering",
      location: "Remote",
      workMode: "remote",
      type: "Full Time",
      description: "Building resilient systems",
      responsibilities: ["Lead arch"],
      requirements: ["Next.js", "TypeScript"],
      equalOpportunityStatement: "TechSonance is an EEO employer.",
      salaryMin: 1000000,
      salaryMax: 1500000,
    };
    const result = evaluateCompleteness(completeJob as any);
    expect(result.isComplete).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  it("fails if salaryMin > salaryMax", () => {
    const invalidSalaryJob = {
      title: "Role",
      department: "Dept",
      location: "Remote",
      description: "Desc",
      responsibilities: ["Resp"],
      requirements: ["Req"],
      salaryMin: 2000000,
      salaryMax: 1000000,
    };
    const result = evaluateCompleteness(invalidSalaryJob as any);
    expect(result.isComplete).toBe(false);
    expect(result.missingFields).toContain("Salary minimum cannot exceed maximum");
  });

  it("flags non-positive openings count", () => {
    const invalidOpeningsJob = {
      title: "Role",
      department: "Dept",
      location: "Remote",
      description: "Desc",
      responsibilities: ["Resp"],
      requirements: ["Req"],
      openingsCount: 0,
    };
    const result = evaluateCompleteness(invalidOpeningsJob as any);
    expect(result.isComplete).toBe(false);
    expect(result.missingFields).toContain("Openings count must be at least 1");
  });

  it("flags past deadline", () => {
    const pastDeadlineJob = {
      title: "Role",
      department: "Dept",
      location: "Remote",
      description: "Desc",
      responsibilities: ["Resp"],
      requirements: ["Req"],
      closesAt: new Date(Date.now() - 100000),
    };
    const result = evaluateCompleteness(pastDeadlineJob as any);
    expect(result.isComplete).toBe(false);
    expect(result.missingFields).toContain("Application deadline must be in the future");
  });

  it("returns recommendations/warnings for missing non-critical items", () => {
    const jobWithoutSummary = {
      title: "Role Title",
      department: "Engineering",
      location: "Remote",
      description: "A comprehensive description that is long enough.",
      responsibilities: ["Do things"],
      requirements: ["Know things"],
      summary: "",
      equalOpportunityStatement: "",
      benefits: [],
    };
    const result = evaluateCompleteness(jobWithoutSummary as any);
    expect(result.isComplete).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe("CompletenessChecklist Component Rendering", () => {
  it("renders checklist with missing items alert and disabled submit button", () => {
    const incompleteJob = {
      title: "",
      department: "",
      location: "",
      description: "",
      responsibilities: [],
      requirements: [],
    };

    const html = renderToString(
      <CompletenessChecklist job={incompleteJob} onSubmitForReview={vi.fn()} />,
    );

    expect(html).toContain("Completeness Checklist");
    expect(html).toContain("Missing Required Items");
    expect(html).toContain("Submit for Review");
    expect(html).toContain("disabled");
  });

  it("renders completeness checklist for ready job", () => {
    const completeJob = {
      title: "Principal Architect",
      department: "Engineering",
      location: "Bhubaneswar",
      description: "Leading multi-tenant distributed cloud platforms.",
      responsibilities: ["Architect systems"],
      requirements: ["10+ years experience"],
      openingsCount: 2,
    };

    const html = renderToString(
      <CompletenessChecklist job={completeJob} onSubmitForReview={vi.fn()} />,
    );

    expect(html).toContain("Completeness Checklist");
    expect(html).toContain("Ready for review");
    expect(html).toContain("Submit for Review");
  });
});

describe("JobLivePreview Component Rendering", () => {
  const sampleJob = {
    title: "Senior AI Engineer",
    slug: "senior-ai-engineer",
    department: "AI & ML",
    location: "Bhubaneswar, India",
    workMode: "hybrid",
    type: "Full Time",
    experienceLevel: "Senior",
    summary: "Build state of the art agentic systems",
    description: "Detailed job description about designing intelligent LLM pipelines.",
    responsibilities: ["Design pipelines", "Evaluate accuracy"],
    requirements: ["PyTorch", "Next.js"],
    skills: ["TypeScript", "Python"],
    benefits: ["Health coverage", "MacBook"],
    showSalaryPublicly: true,
    salaryMin: 1800000,
    salaryMax: 2400000,
    salaryCurrency: "INR",
    salaryPeriod: "year",
  };

  it("renders live preview with title, badges, and salary card", () => {
    const html = renderToString(<JobLivePreview job={sampleJob} />);

    expect(html).toContain("Senior AI Engineer");
    expect(html).toContain("AI &amp; ML");
    expect(html).toContain("HYBRID");
    expect(html).toContain("Bhubaneswar, India");
    expect(html).toContain("Estimated Compensation");
    expect(html).toContain("Design pipelines");
  });

  it("supports desktop and mobile viewport rendering", () => {
    const desktopHtml = renderToString(<JobLivePreview job={sampleJob} viewport="desktop" />);
    expect(desktopHtml).toContain("max-w-4xl");

    const mobileHtml = renderToString(<JobLivePreview job={sampleJob} viewport="mobile" />);
    expect(mobileHtml).toContain("w-[375px]");
  });
});

describe("JobEditorForm Component Rendering", () => {
  it("renders tab navigation with all 6 editing sections", () => {
    const html = renderToString(<JobEditorForm initialJob={{ title: "Test Role" }} />);

    expect(html).toContain("1. Basics");
    expect(html).toContain("2. Location &amp; Mode");
    expect(html).toContain("3. Content");
    expect(html).toContain("4. Compensation");
    expect(html).toContain("5. Application Settings");
    expect(html).toContain("6. Review &amp; Publish");
    expect(html).toContain("Role Identity &amp; Overview");
  });

  it("renders Publish Role Now in top header bar and omits the checklist sidebar", () => {
    const html = renderToString(<JobEditorForm initialJob={{ title: "Test Role" }} />);

    expect(html).toContain("Save Draft");
    expect(html).toContain("Publish Role Now");
    // Verify noisy sidebar is completely removed from the form
    expect(html).not.toContain("QUALITY RECOMMENDATIONS");
    expect(html).not.toContain("Complete all required checklist items to unlock publishing");
  });
});
