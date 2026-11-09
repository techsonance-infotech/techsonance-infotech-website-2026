import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { JobStatusModal } from "@/components/admin/careers/JobStatusModal";
import { JobStatus } from "@/lib/constants/enums";
import * as adminJobsApi from "@/lib/api/admin-jobs.api";

describe("JobStatusModal Component", () => {
  const sampleJob = {
    id: "job-123",
    title: "Lead Distributed Systems Engineer",
    slug: "lead-distributed-systems-engineer",
    status: JobStatus.PUBLISHED,
    department: "Engineering",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    const html = renderToString(
      <JobStatusModal
        isOpen={false}
        job={sampleJob}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );
    expect(html).toBe("");
  });

  it("renders modal header with position title and current status badge", () => {
    const html = renderToString(
      <JobStatusModal
        isOpen={true}
        job={sampleJob}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    expect(html).toContain("Update Position Status");
    expect(html).toContain("Lead Distributed Systems Engineer");
    expect(html).toContain("Current Stage:");
    expect(html).toContain("PUBLISHED");
  });

  it("lists valid lifecycle transitions for a PUBLISHED role (PAUSED, CLOSED, DRAFT, IN_REVIEW)", () => {
    const html = renderToString(
      <JobStatusModal
        isOpen={true}
        job={sampleJob}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    expect(html).toContain("PAUSED");
    expect(html).toContain("CLOSED");
    expect(html).toContain("DRAFT");
    expect(html).toContain("IN_REVIEW");
    expect(html).toContain("Update Status");
  });

  it("lists valid lifecycle transitions for a DRAFT role (PUBLISHED, IN_REVIEW)", () => {
    const draftJob = {
      ...sampleJob,
      status: JobStatus.DRAFT,
    };

    const html = renderToString(
      <JobStatusModal
        isOpen={true}
        job={draftJob}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    expect(html).toContain("PUBLISHED");
    expect(html).toContain("IN_REVIEW");
    // Should NOT allow pausing a draft
    expect(html).not.toContain("Temporarily freeze hiring");
  });

  it("lists valid lifecycle transitions for a PAUSED role (PUBLISHED, CLOSED, DRAFT)", () => {
    const pausedJob = {
      ...sampleJob,
      status: JobStatus.PAUSED,
    };

    const html = renderToString(
      <JobStatusModal
        isOpen={true}
        job={pausedJob}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    expect(html).toContain("PUBLISHED");
    expect(html).toContain("CLOSED");
    expect(html).toContain("DRAFT");
  });

  it("lists valid lifecycle transitions for a CLOSED role and displays schedule close time model", () => {
    const closedJob = {
      ...sampleJob,
      status: JobStatus.CLOSED,
    };

    const html = renderToString(
      <JobStatusModal
        isOpen={true}
        job={closedJob}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    expect(html).toContain("PUBLISHED");
    expect(html).toContain("IN_REVIEW");
    expect(html).toContain("DRAFT");
    expect(html).toContain("ARCHIVED");
    expect(html).toContain("Schedule Application Deadline (Close Time)");
  });
});
