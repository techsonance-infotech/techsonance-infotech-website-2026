import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { submitCareerApplication } from "@/lib/api/careers.api";
import { JobApplicationForm } from "@/components/careers/JobApplicationForm";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

describe("Career Application Client API & Component Integration", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("submitCareerApplication", () => {
    it("successfully submits an application and parses applicationId", async () => {
      const mockFile = new File(["%PDF-1.4 dummy"], "resume.pdf", { type: "application/pdf" });
      const mockResponse = {
        ok: true,
        data: {
          applicationId: "app-12345",
          status: "NEW",
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      const result = await submitCareerApplication({
        jobId: "job-fullstack-dev",
        candidateName: "Jane Doe",
        email: "jane@example.com",
        phone: "+91 9876543210",
        currentLocation: "Bhubaneswar",
        noticePeriodWeeks: 2,
        privacyConsent: true,
        resumeFile: mockFile,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.CAREERS.APPLY,
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        }),
      );

      expect(result.applicationId).toBe("app-12345");
      expect(result.status).toBe("NEW");
    });

    it("throws duplicate submission error on 409 Conflict", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: vi.fn().mockResolvedValue({
          ok: false,
          error: "Duplicate application",
        }),
      } as unknown as Response);

      await expect(
        submitCareerApplication({
          jobId: "job-1",
          candidateName: "Jane Doe",
          email: "jane@example.com",
          privacyConsent: true,
        }),
      ).rejects.toThrow("already submitted an application");
    });

    it("throws server error message on validation failure", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({
          ok: false,
          error: { message: "Resume document is required" },
        }),
      } as unknown as Response);

      await expect(
        submitCareerApplication({
          jobId: "job-1",
          candidateName: "Jane Doe",
          email: "jane@example.com",
          privacyConsent: true,
        }),
      ).rejects.toThrow("Resume document is required");
    });
  });

  describe("JobApplicationForm Component", () => {
    it("renders form elements, input labels, and screening questions", () => {
      const screeningQuestions = [
        {
          id: "q1",
          question: "Do you have 3+ years experience with Next.js?",
          type: "boolean" as const,
          required: true,
        },
      ];

      const html = renderToString(
        <JobApplicationForm
          jobId="job-sr-dev"
          jobTitle="Senior Full-Stack Engineer"
          screeningQuestions={screeningQuestions}
        />,
      );

      expect(html).toContain("Full Name");
      expect(html).toContain("Email Address");
      expect(html).toContain("Resume Document (PDF or DOCX, max 5MB)");
      expect(html).toContain("Do you have 3+ years experience with Next.js?");
      expect(html).toContain("Submit Application");
    });

    it("renders job details hero with id='apply-form' to guarantee valid anchor target", async () => {
      const { default: JobDetailClient } = await import("@/app/careers/[slug]/JobDetailClient");
      const mockJob: import("@/lib/content/types").JobPosting = {
        slug: "lead-engineer",
        title: "Lead Engineer",
        department: "Engineering",
        location: "Remote",
        workMode: "remote",
        type: "Full Time",
        description: "Leading frontend initiatives",
        responsibilities: ["Lead engineering projects"],
        requirements: ["Next.js proficiency"],
        benefits: ["Comprehensive health coverage"],
        status: "PUBLISHED",
      };

      const html = renderToString(<JobDetailClient job={mockJob} similarJobs={[]} />);
      expect(html).toContain('id="apply-form"');
      expect(html).toContain("Apply for this Role");
    });
  });
});
