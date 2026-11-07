import { z } from "zod";

/**
 * Resilient schema for recent posts rendered on the admin dashboard.
 */
export const dashboardPostItemSchema = z
  .object({
    id: z.string().trim().min(1).catch("unknown-id"),
    title: z.string().trim().min(1).catch("Untitled Post"),
    slug: z.string().trim().min(1).catch("post"),
    status: z.string().catch("DRAFT"),
    categoryId: z.string().nullish().catch(undefined),
    readTime: z
      .string()
      .nullish()
      .transform((v) => (v && v.trim().length > 0 ? v : "5 min"))
      .catch("5 min"),
    createdAt: z.union([z.string(), z.date()]).nullish().catch(undefined),
  })
  .loose();

export type DashboardPostItem = z.infer<typeof dashboardPostItemSchema>;

/**
 * Resilient schema for dashboard KPI metrics.
 */
export const dashboardMetricsBoundarySchema = z
  .object({
    totalArticles: z
      .union([z.number(), z.string()])
      .transform((v) => {
        const num = Number(v);
        return Number.isFinite(num) && num >= 0 ? num : 0;
      })
      .catch(0),
    publishedArticles: z
      .union([z.number(), z.string()])
      .transform((v) => {
        const num = Number(v);
        return Number.isFinite(num) && num >= 0 ? num : 0;
      })
      .catch(0),
    inReviewArticles: z
      .union([z.number(), z.string()])
      .transform((v) => {
        const num = Number(v);
        return Number.isFinite(num) && num >= 0 ? num : 0;
      })
      .catch(0),
    openJobs: z
      .union([z.number(), z.string()])
      .transform((v) => {
        const num = Number(v);
        return Number.isFinite(num) && num >= 0 ? num : 0;
      })
      .catch(0),
  })
  .loose();

export type DashboardMetrics = z.infer<typeof dashboardMetricsBoundarySchema>;
