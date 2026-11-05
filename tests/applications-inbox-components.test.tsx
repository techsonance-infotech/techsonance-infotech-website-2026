import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ApplicationsTable, type ApplicationItem } from "@/components/admin/careers/ApplicationsTable";
import { ApplicationsKanban } from "@/components/admin/careers/ApplicationsKanban";
import {
  RejectionReasonDialog,
  MANAGED_REJECTION_REASONS,
} from "@/components/admin/careers/RejectionReasonDialog";
import { CandidateDrawer } from "@/components/admin/careers/CandidateDrawer";
import { ApplicationStatus } from "@/lib/database/enum/content.enum";

describe("Applications Inbox UI Components", () => {
  const sampleApplications: ApplicationItem[] = [
    {
      id: "app-1",
      candidateName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+1-555-0100",
      status: ApplicationStatus.NEW,
      jobTitle: "Senior AI Systems Engineer",
      rating: 5,
      knockoutTriggered: false,
      createdAt: new Date("2026-11-01T10:00:00Z"),
    },
    {
      id: "app-2",
      candidateName: "Grace Hopper",
      email: "grace@example.com",
      phone: "+1-555-0101",
      status: ApplicationStatus.SCREENING,
      jobTitle: "Lead DevOps Specialist",
      rating: 4,
      knockoutTriggered: true,
      createdAt: new Date("2026-11-02T12:00:00Z"),
    },
    {
      id: "app-3",
      candidateName: "Alan Turing",
      email: "alan@example.com",
      phone: null,
      status: ApplicationStatus.REJECTED,
      jobTitle: "Cryptographic Engineer",
      rating: 3,
      knockoutTriggered: false,
      createdAt: new Date("2026-11-03T15:00:00Z"),
    },
  ];

  describe("ApplicationsTable", () => {
    it("renders applications table with candidates, roles, stages, and ratings", () => {
      const html = renderToString(
        <ApplicationsTable
          applications={sampleApplications}
          onSelectApplication={vi.fn()}
        />,
      );

      expect(html).toContain("Ada Lovelace");
      expect(html).toContain("Senior AI Systems Engineer");
      expect(html).toContain("ada@example.com");

      expect(html).toContain("Grace Hopper");
      expect(html).toContain("Lead DevOps Specialist");
      expect(html).toContain("Knockout"); // Knockout badge

      expect(html).toContain("Alan Turing");
      expect(html).toContain("Rejected");
    });

    it("renders empty state message when no applications match", () => {
      const html = renderToString(
        <ApplicationsTable applications={[]} onSelectApplication={vi.fn()} />,
      );

      expect(html).toContain("No applications match current filters");
    });
  });

  describe("ApplicationsKanban", () => {
    it("renders all 8 Kanban stages", () => {
      const html = renderToString(
        <ApplicationsKanban
          applications={sampleApplications}
          onSelectApplication={vi.fn()}
        />,
      );

      expect(html).toContain("New");
      expect(html).toContain("Screening");
      expect(html).toContain("Shortlisted");
      expect(html).toContain("Interview");
      expect(html).toContain("Offer");
      expect(html).toContain("Hired");
      expect(html).toContain("Rejected");
      expect(html).toContain("Withdrawn");
    });

    it("places candidate cards into matching stage columns and displays advance button", () => {
      const html = renderToString(
        <ApplicationsKanban
          applications={sampleApplications}
          onSelectApplication={vi.fn()}
          onStageChange={vi.fn()}
        />,
      );

      expect(html).toContain("Ada Lovelace");
      expect(html).toContain("Advance to Screening");

      expect(html).toContain("Grace Hopper");
      expect(html).toContain("Advance to Shortlisted");
    });
  });

  describe("RejectionReasonDialog", () => {
    it("renders null when isOpen is false", () => {
      const html = renderToString(
        <RejectionReasonDialog
          isOpen={false}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />,
      );

      expect(html).toBe("");
    });

    it("renders dialog with all managed rejection reasons when open", () => {
      const html = renderToString(
        <RejectionReasonDialog
          isOpen={true}
          candidateName="Test Candidate"
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />,
      );

      expect(html).toContain("Reject Candidate");
      expect(html).toContain("Test Candidate");
      for (const reason of MANAGED_REJECTION_REASONS) {
        expect(html).toContain(reason);
      }
      expect(html).toContain("Send polite status update email");
    });
  });

  describe("CandidateDrawer", () => {
    it("renders null when closed", () => {
      const html = renderToString(
        <CandidateDrawer
          applicationId={null}
          isOpen={false}
          onClose={vi.fn()}
        />,
      );

      expect(html).toBe("");
    });

    it("renders candidate evaluation slide-over when open", () => {
      const html = renderToString(
        <CandidateDrawer
          applicationId="app-1"
          isOpen={true}
          onClose={vi.fn()}
        />,
      );

      expect(html).toContain("Candidate Evaluation");
      expect(html).toContain("app-1");
    });
  });
});
