import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  CompletenessChecklist,
  type JobCompletenessState,
} from "@/components/admin/careers/CompletenessChecklist";
import { JobStatus, JobType, JobWorkMode } from "@/lib/database/enum";

describe("Phase 1 Release Blockers - Publish Gating & Status Audit", () => {
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
    salaryMin: 1800000,
    salaryMax: 2600000,
  };

  it("disables Publish button when form is dirty even if all requirements are passed", () => {
    const html = renderToString(
      <CompletenessChecklist
        job={completeJob}
        canPublishDirectly={true}
        isDirty={true}
        onSubmitForReview={() => {}}
        onPublish={() => {}}
      />,
    );

    expect(html).toContain("disabled");
    expect(html).toContain("Save draft before publishing role");
  });

  it("disables Publish button when a blocking error is present", () => {
    const html = renderToString(
      <CompletenessChecklist
        job={completeJob}
        canPublishDirectly={true}
        isDirty={false}
        hasBlockingError={true}
        onSubmitForReview={() => {}}
        onPublish={() => {}}
      />,
    );

    expect(html).toContain("disabled");
    expect(html).toContain("Resolve active system error before publishing");
  });

  it("disables Publish button when save is actively in progress", () => {
    const html = renderToString(
      <CompletenessChecklist
        job={completeJob}
        canPublishDirectly={true}
        isDirty={false}
        isSaving={true}
        onSubmitForReview={() => {}}
        onPublish={() => {}}
      />,
    );

    expect(html).toContain("disabled");
    expect(html).toContain("Saving changes in progress");
  });

  it("enables Publish button only when complete, saved, clean, and error-free", () => {
    const html = renderToString(
      <CompletenessChecklist
        job={completeJob}
        canPublishDirectly={true}
        isDirty={false}
        isSaving={false}
        hasBlockingError={false}
        saveStatus="saved"
        onSubmitForReview={() => {}}
        onPublish={() => {}}
      />,
    );

    expect(html).toContain("Publish Role Now");
    // Ensure the button does not have the disabled attribute (avoiding Tailwind class disabled:*)
    expect(html).not.toMatch(/<button[^>]*\sdisabled(?:[=>\s])[^>]*>[\s\S]*Publish Role Now/);
  });
});
