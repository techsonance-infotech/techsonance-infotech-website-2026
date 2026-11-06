import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  splitPastedItems,
  StructuredListInput,
} from "@/components/admin/careers/StructuredListInput";
import { JobReviewSummary } from "@/components/admin/careers/JobReviewSummary";
import { AdminShell } from "@/components/admin/AdminShell";
import { DEFAULT_JOB_FORM, type JobFormData } from "@/components/admin/careers/JobEditorForm";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/careers/jobs/new",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("Phase 2 — Structured List Input & Paste Parsing", () => {
  it("splits pasted bulleted text correctly into clean items", () => {
    const rawPasted = `
      • Design and implement distributed microservices in Go and TypeScript
      - Ensure 99.99% system availability and resilient fault tolerance
      * Lead technical architecture sessions with product teams
      1. Mentor junior and mid-level engineering team members
      2. Participate in weekly production on-call rotations
    `;
    const parsed = splitPastedItems(rawPasted);
    expect(parsed).toHaveLength(5);
    expect(parsed[0]).toBe("Design and implement distributed microservices in Go and TypeScript");
    expect(parsed[1]).toBe("Ensure 99.99% system availability and resilient fault tolerance");
    expect(parsed[2]).toBe("Lead technical architecture sessions with product teams");
    expect(parsed[3]).toBe("Mentor junior and mid-level engineering team members");
    expect(parsed[4]).toBe("Participate in weekly production on-call rotations");
  });

  it("handles single line and newline-separated paste without bullets", () => {
    const raw = "PostgreSQL indexing\nRedis caching\nNext.js 16 SSR";
    const parsed = splitPastedItems(raw);
    expect(parsed).toEqual(["PostgreSQL indexing", "Redis caching", "Next.js 16 SSR"]);
  });

  it("renders StructuredListInput with items and item count badge", () => {
    const items = ["Item Alpha", "Item Beta", "Item Gamma"];
    const html = renderToString(
      <StructuredListInput label="Key Deliverables" items={items} onChange={() => {}} required />,
    );

    expect(html).toContain("Key Deliverables");
    expect(html).toContain("3");
    expect(html).toContain("Item Alpha");
    expect(html).toContain("Item Beta");
    expect(html).toContain("Item Gamma");
  });
});

describe("Phase 2 — Review & Publish Step Summaries & SERP Preview", () => {
  const mockJob: JobFormData = {
    ...DEFAULT_JOB_FORM,
    title: "Lead Cloud Infrastructure Architect",
    department: "Engineering",
    location: "Bhubaneswar, India",
    workMode: "hybrid",
    summary:
      "Lead our enterprise cloud modernization practice across high-concurrency microservices.",
    seoTitle: "Lead Cloud Infrastructure Architect Careers | TechSonance",
    seoDescription:
      "Join TechSonance Infotech as Lead Cloud Architect. Competitive salary and remote flexibility.",
    salaryMin: 1500000,
    salaryMax: 2200000,
    salaryCurrency: "INR",
    showSalaryPublicly: true,
  };

  it("renders 5 step verification cards and Google SERP preview", () => {
    const html = renderToString(
      <JobReviewSummary job={mockJob} onNavigateToTab={() => {}} updateField={() => {}} />,
    );

    // Step verification cards
    expect(html).toContain("Step 1: Role Identity &amp; Overview");
    expect(html).toContain("Step 2: Workplace Location &amp; Mode");
    expect(html).toContain("Step 3: Role Content &amp; Requirements");
    expect(html).toContain("Step 4: Compensation &amp; Pay Transparency");
    expect(html).toContain("Step 5: Application Settings &amp; Screening");

    // Google SERP Search Snippet Preview
    expect(html).toContain("Google Search Snippet Preview");
    expect(html).toContain("Lead Cloud Infrastructure Architect Careers | TechSonance");
    expect(html).toContain("Join TechSonance Infotech as Lead Cloud Architect.");

    // Publication Schedule Summary
    expect(html).toContain("Publication Schedule Summary");
    expect(html).toContain("Upon confirmation, this position will be published immediately");
  });
});

describe("Phase 2 — Admin Shell Scroll Architecture Guard", () => {
  it("renders AdminShell with data-lenis-prevent and bounded scrollable container", () => {
    const html = renderToString(
      <AdminShell userEmail="admin@techsonance.co.in" userRole="owner">
        <div data-testid="admin-content">Admin Content Inner</div>
      </AdminShell>,
    );

    // Root shell must carry data-lenis-prevent to guard against smooth-scroll interception
    expect(html).toContain("data-lenis-prevent");

    // Must contain overflow-y-auto for internal main scroll
    expect(html).toContain("overflow-y-auto");
    expect(html).toContain("Admin Content Inner");
  });
});
