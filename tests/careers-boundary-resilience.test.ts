import { describe, it, expect } from "vitest";
import {
  SafeApplicationsListResponseSchema,
  SafeJobsListResponseSchema,
  SafeJobItemSchema,
  SafeApplicationItemSchema,
} from "@/lib/validations/admin-careers-boundary.schema";
import { safeInitials, formatDateSafe, formatCurrencySafe } from "@/lib/utils/formatters";
import { JobStatus, ApplicationStatus } from "@/lib/constants/enums";

describe("Careers Boundary Schema Resilience", () => {
  it("drops malformed application items while preserving valid items", () => {
    const rawPayload = {
      applications: [
        {
          id: "app-1",
          candidateName: "Alice Smith",
          email: "alice@example.com",
          status: ApplicationStatus.NEW,
          createdAt: "2026-04-10T10:00:00Z",
        },
        null,
        "unexpected-string-entry",
        {
          id: "app-2",
          candidateName: null,
          email: null,
          status: "UNKNOWN_GARBAGE_STATUS",
          createdAt: null,
        },
      ],
      total: 4,
    };

    const parsed = SafeApplicationsListResponseSchema.safeParse(rawPayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.applications.length).toBe(2);
      expect(parsed.data.applications[0].candidateName).toBe("Alice Smith");
      expect(parsed.data.applications[0].status).toBe(ApplicationStatus.NEW);

      // Corrupted item gets default fallback values rather than crashing
      expect(parsed.data.applications[1].candidateName).toBe("Anonymous Candidate");
      expect(parsed.data.applications[1].email).toBe("no-email@provided");
      expect(parsed.data.applications[1].status).toBe(ApplicationStatus.NEW);
    }
  });

  it("handles empty or missing application arrays gracefully", () => {
    const emptyPayload = { applications: null, total: null };
    const parsed = SafeApplicationsListResponseSchema.safeParse(emptyPayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.applications).toEqual([]);
      expect(parsed.data.total).toBe(0);
    }
  });

  it("sanitizes job listing items with defensive defaults", () => {
    const rawJob = {
      id: "job-1",
      title: null,
      slug: null,
      department: null,
      status: "INVALID_STATUS",
      openingsCount: "not-a-number",
    };

    const parsed = SafeJobItemSchema.safeParse(rawJob);
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data) {
      expect(parsed.data.title).toBe("Untitled Position");
      expect(parsed.data.slug).toBe("job");
      expect(parsed.data.department).toBe("Engineering");
      expect(parsed.data.status).toBe(JobStatus.DRAFT);
      expect(parsed.data.openingsCount).toBe(1);
    }
  });
});

describe("Safe Formatters Defensive Execution", () => {
  it("safeInitials returns expected character or fallback without throwing", () => {
    expect(safeInitials("John Doe")).toBe("J");
    expect(safeInitials("   ")).toBe("?");
    expect(safeInitials(null)).toBe("?");
    expect(safeInitials(undefined)).toBe("?");
    expect(safeInitials(123 as unknown as string)).toBe("?");
  });

  it("formatDateSafe formats valid dates and provides fallback for invalid or null dates", () => {
    expect(formatDateSafe("2026-11-07T12:00:00Z")).toContain("Nov");
    expect(formatDateSafe(null)).toBe("—");
    expect(formatDateSafe(undefined)).toBe("—");
    expect(formatDateSafe("not-a-date")).toBe("—");
  });

  it("formatCurrencySafe returns formatted currency or fallback without NaN", () => {
    expect(formatCurrencySafe(1500000)).toContain("15,00,000");
    expect(formatCurrencySafe(null)).toBe("—");
    expect(formatCurrencySafe(undefined)).toBe("—");
    expect(formatCurrencySafe(NaN)).toBe("—");
  });
});
