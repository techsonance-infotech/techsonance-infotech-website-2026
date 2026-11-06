import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { auditJobQuality } from "@/lib/utils/job-quality-assistant";
import { JobQualityWidget } from "@/components/admin/careers/JobQualityWidget";
import { JobEditorForm, DEFAULT_JOB_FORM } from "@/components/admin/careers/JobEditorForm";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/careers/jobs/test-id",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("Phase 4: Job Quality & Language Assistant", () => {
  it("detects cliché buzzwords and provides constructive replacements", () => {
    const report = auditJobQuality({
      title: "Rockstar Engineer",
      description:
        "We are looking for an experienced software engineer to lead technical architecture sessions across our distributed enterprise cloud platforms.",
      responsibilities: [
        "Architect and maintain mission-critical distributed services",
        "Lead technical post-mortems and chaos engineering",
        "Collaborate closely with product management and designers",
      ],
      requirements: ["5+ years of software engineering in Go or TypeScript"],
      showSalaryPublicly: true,
    });

    const words = report.issues.map((i) => i.word);
    expect(words).toContain("rockstar");
    expect(report.score).toBeLessThan(100);
  });

  it("rates clean professional descriptions with high scores", () => {
    const report = auditJobQuality({
      title: "Lead Distributed Systems Engineer",
      summary: "Architect and scale fault-tolerant distributed backends and event streams.",
      description:
        "TechSonance Infotech is looking for a Lead Distributed Systems Engineer to spearhead our high-scale cloud backend architecture. In this role, you will design resilient event-driven systems, guide engineering standards across microservices, optimize database throughput, and partner closely with product teams to ship mission-critical agency platforms.",
      responsibilities: [
        "Architect, deploy, and maintain mission-critical distributed microservices with 99.99% uptime SLAs",
        "Design scalable event-driven architectures utilizing Kafka, Redis Streams, and PostgreSQL",
        "Perform deep-dive performance profiling, query optimization, and latency reduction",
        "Establish engineering best practices and conduct rigorous code reviews",
      ],
      requirements: [
        "7+ years of experience engineering high-throughput backend services in Go, TypeScript, or Rust",
        "Deep expertise in PostgreSQL schema design, indexing, and connection poolers",
        "Hands-on production proficiency with Docker, Kubernetes, and AWS",
      ],
      showSalaryPublicly: true,
    });

    expect(report.score).toBeGreaterThanOrEqual(85);
    expect(report.grade).toBe("Excellent");
    expect(report.passedChecks).toContain("Zero exclusionary buzzwords or gendered clichés");
  });

  it("renders JobQualityWidget with score badge and assistance copy", () => {
    const html = renderToString(
      <JobQualityWidget
        data={{
          title: "Staff Systems Engineer",
          description: "Full position overview description here that exceeds forty words and provides clear team context for all prospective candidates.",
          responsibilities: ["Lead system architecture", "Mentor teammates", "Design APIs"],
          requirements: ["5+ years experience", "Next.js proficiency"],
          showSalaryPublicly: true,
        }}
      />,
    );

    expect(html).toContain("Job Quality &amp; Inclusive Language Assistant");
    expect(html).toContain("Excellent");
  });
});

describe("Phase 4: Admin Form UI Polish & Duplicate Action", () => {
  it("renders compact admin form with Save Draft and Duplicate controls", () => {
    const html = renderToString(
      <JobEditorForm
        initialJob={{ ...DEFAULT_JOB_FORM, id: "job-123" }}
        onSave={() => {}}
        onDuplicate={() => {}}
        isNew={false}
      />,
    );

    expect(html).toContain("Save Draft");
    expect(html).toContain("Duplicate");
    expect(html).toContain("Publish Role Now");
  });
});
