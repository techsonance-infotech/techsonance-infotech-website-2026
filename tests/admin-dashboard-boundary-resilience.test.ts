import { describe, it, expect } from "vitest";
import {
  dashboardPostItemSchema,
  dashboardMetricsBoundarySchema,
} from "@/lib/validations/admin-dashboard-boundary.schema";
import { formatDateSafe } from "@/lib/utils/formatters";

describe("Admin Dashboard Boundary & Resilience Suite", () => {
  describe("dashboardPostItemSchema", () => {
    it("parses valid dashboard post item without mutation", () => {
      const valid = {
        id: "post-123",
        title: "Micro-frontends at Scale",
        slug: "micro-frontends-at-scale",
        status: "PUBLISHED",
        categoryId: "eng-1",
        readTime: "6 min",
        createdAt: "2026-10-15T12:00:00.000Z",
      };

      const parsed = dashboardPostItemSchema.parse(valid);
      expect(parsed.id).toBe("post-123");
      expect(parsed.title).toBe("Micro-frontends at Scale");
      expect(parsed.slug).toBe("micro-frontends-at-scale");
      expect(parsed.status).toBe("PUBLISHED");
    });

    it("recovers gracefully from missing or corrupt properties", () => {
      const corrupt = {
        id: "",
        title: null,
        slug: "",
        status: null,
        readTime: null,
      };

      const parsed = dashboardPostItemSchema.parse(corrupt);
      expect(parsed.id).toBe("unknown-id");
      expect(parsed.title).toBe("Untitled Post");
      expect(parsed.slug).toBe("post");
      expect(parsed.status).toBe("DRAFT");
      expect(parsed.readTime).toBe("5 min");
    });
  });

  describe("dashboardMetricsBoundarySchema", () => {
    it("normalizes and sanitizes metrics from API/DB numbers and strings", () => {
      const raw = {
        totalArticles: "42",
        publishedArticles: 20,
        inReviewArticles: "5",
        openJobs: 8,
      };

      const parsed = dashboardMetricsBoundarySchema.parse(raw);
      expect(parsed.totalArticles).toBe(42);
      expect(parsed.publishedArticles).toBe(20);
      expect(parsed.inReviewArticles).toBe(5);
      expect(parsed.openJobs).toBe(8);
    });

    it("falls back to 0 for null, negative, NaN or corrupted metrics", () => {
      const corrupt = {
        totalArticles: null,
        publishedArticles: "not-a-number",
        inReviewArticles: -5,
        openJobs: undefined,
      };

      const parsed = dashboardMetricsBoundarySchema.parse(corrupt);
      expect(parsed.totalArticles).toBe(0);
      expect(parsed.publishedArticles).toBe(0);
      expect(parsed.inReviewArticles).toBe(0);
      expect(parsed.openJobs).toBe(0);
    });
  });

  describe("formatDateSafe for dashboard tables", () => {
    it("returns formatted date for valid timestamps", () => {
      const formatted = formatDateSafe("2026-10-15T00:00:00.000Z");
      expect(formatted).toContain("Oct");
      expect(formatted).toContain("2026");
    });

    it("returns safe fallback '—' on null, undefined, or invalid dates", () => {
      expect(formatDateSafe(null)).toBe("—");
      expect(formatDateSafe(undefined)).toBe("—");
      expect(formatDateSafe("invalid-date-string")).toBe("—");
    });
  });
});
