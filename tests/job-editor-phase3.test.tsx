import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { FormSelect } from "@/components/admin/careers/FormSelect";
import { JobEditorForm, DEFAULT_JOB_FORM } from "@/components/admin/careers/JobEditorForm";
import { evaluateCompleteness } from "@/components/admin/careers/CompletenessChecklist";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/careers/jobs/new",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("Phase 3: FormSelect Design-System Component", () => {
  it("renders with label, asterisk when required, and custom select options", () => {
    const html = renderToString(
      <FormSelect label="Department" required value="Engineering" onChange={() => {}}>
        <option value="Engineering">Engineering</option>
        <option value="Design">Design &amp; Creative</option>
      </FormSelect>,
    );

    expect(html).toContain("Department");
    expect(html).toContain("*");
    expect(html).toContain("Engineering");
    expect(html).toContain("Design &amp; Creative");
    expect(html).toContain("lucide-chevron-down");
  });

  it("renders with error styling when error message is supplied", () => {
    const html = renderToString(
      <FormSelect
        label="Work Authorization"
        error="Please choose a valid authorization type"
        value=""
        onChange={() => {}}
      >
        <option value="">Select option</option>
      </FormSelect>,
    );

    expect(html).toContain("border-rose-500");
    expect(html).toContain("Please choose a valid authorization type");
    expect(html).toContain('aria-invalid="true"');
  });
});

describe("Phase 3: JobEditorForm Quality, Accessibility & Step Badges", () => {
  it("renders compact admin layout with 6 wizard tabs and save draft buttons", () => {
    const html = renderToString(
      <JobEditorForm initialJob={DEFAULT_JOB_FORM} onSave={() => {}} isNew={false} />,
    );

    // Header controls
    expect(html).toContain("Save Draft");
    expect(html).toContain("Publish Role Now");

    // All 6 tabs with accessible roles
    expect(html).toContain('role="tablist"');
    expect(html).toContain("1. Basics");
    expect(html).toContain("2. Location &amp; Mode");
    expect(html).toContain("3. Content");
    expect(html).toContain("4. Compensation");
    expect(html).toContain("5. Application Settings");
    expect(html).toContain("6. Review &amp; Publish");

    // Step requirement notice
    expect(html).toContain(
      "Job Title and Department are mandatory fields in this step to publish.",
    );
  });

  it("evaluates completeness and flags missing mandatory requirements accurately", () => {
    const incomplete = evaluateCompleteness({
      title: "",
      department: "",
      location: "",
      description: "",
      responsibilities: [],
      requirements: [],
    });

    expect(incomplete.isComplete).toBe(false);
    expect(incomplete.missingFields).toContain("Job Title");
    expect(incomplete.missingFields).toContain("Department");
    expect(incomplete.missingFields).toContain("Location");
    expect(incomplete.missingFields).toContain("Role Description");
    expect(incomplete.missingFields).toContain("Key Responsibilities (at least 1)");
    expect(incomplete.missingFields).toContain("Requirements & Qualifications (at least 1)");

    const complete = evaluateCompleteness({
      title: "Senior Full Stack Engineer",
      department: "Engineering",
      location: "Bhubaneswar, India",
      description: "Full position overview description here that exceeds ten chars.",
      responsibilities: ["Lead system architecture"],
      requirements: ["5+ years experience"],
      openingsCount: 1,
    });

    expect(complete.isComplete).toBe(true);
    expect(complete.missingFields).toHaveLength(0);
  });
});
