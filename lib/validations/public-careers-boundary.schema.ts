import { z } from "zod";
import { JobStatus } from "@/lib/constants/enums";
import type { JobPosting } from "@/lib/content/types";

/**
 * Resilient schema for an individual public job posting.
 * Uses .catch() and .default() for non-critical fields so corrupt DB/API fields
 * gracefully fall back without causing a runtime white-screen crash.
 */
export const publicJobPostingBoundarySchema: z.ZodType<JobPosting> = z
  .object({
    id: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    slug: z.string().trim().min(1).catch("unknown-role"),
    title: z.string().trim().min(1).catch("Untitled Position"),
    referenceCode: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    department: z.string().trim().catch("General"),
    location: z.string().trim().catch("Remote, India"),
    workMode: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    remoteEligibility: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    visaSupport: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    type: z.string().trim().catch("Full Time"),
    experienceLevel: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    summary: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    description: z.string().catch("No description available for this role."),
    responsibilities: z
      .array(z.string().catch(""))
      .nullish()
      .transform((v) => (v ?? []).filter((s): s is string => typeof s === "string" && s.trim().length > 0))
      .catch([]),
    requirements: z
      .array(z.string().catch(""))
      .nullish()
      .transform((v) => (v ?? []).filter((s): s is string => typeof s === "string" && s.trim().length > 0))
      .catch([]),
    preferredQualifications: z
      .array(z.string().catch(""))
      .nullish()
      .transform((v) => {
        if (!v) return undefined;
        const filtered = v.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
        return filtered.length > 0 ? filtered : undefined;
      })
      .catch(undefined),
    skills: z
      .array(z.unknown())
      .nullish()
      .transform((v) => {
        if (!v) return undefined;
        const mapped = v
          .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "")))
          .filter((s) => s.length > 0);
        return mapped.length > 0 ? mapped : undefined;
      })
      .catch(undefined),
    benefits: z
      .array(z.string().catch(""))
      .nullish()
      .transform((v) => (v ?? []).filter((s): s is string => typeof s === "string" && s.trim().length > 0))
      .catch([]),
    aboutTeam: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    hiringProcess: z
      .array(
        z
          .object({
            step: z.string().catch("01"),
            title: z.string().catch("Step"),
            desc: z
              .string()
              .nullish()
              .transform((v) => v ?? undefined)
              .catch(undefined),
          })
          .loose(),
      )
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    equalOpportunityStatement: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    salaryMin: z
      .union([z.number(), z.string()])
      .nullish()
      .transform((v) => {
        if (v === null || v === undefined) return undefined;
        const num = Number(v);
        return Number.isFinite(num) ? num : undefined;
      })
      .catch(undefined),
    salaryMax: z
      .union([z.number(), z.string()])
      .nullish()
      .transform((v) => {
        if (v === null || v === undefined) return undefined;
        const num = Number(v);
        return Number.isFinite(num) ? num : undefined;
      })
      .catch(undefined),
    salaryCurrency: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    salaryPeriod: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    showSalaryPublicly: z
      .boolean()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    compensationNotes: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    applicationMethod: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    externalApplyUrl: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    resumeRequired: z
      .boolean()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    coverLetterRequirement: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    screeningQuestions: z
      .array(z.any())
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    closesAt: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    status: z
      .enum(JobStatus)
      .catch(JobStatus.OPEN),
    visibility: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    publishedAt: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    updatedAt: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    seoTitle: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    seoDescription: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    ogImage: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
  })
  .loose();

/**
 * Array parser with item-level isolation.
 * A malformed or corrupted job item is caught as null and filtered out,
 * ensuring the rest of the job listings render without failure.
 */
export const publicJobListBoundarySchema: z.ZodType<JobPosting[]> = z
  .array(z.unknown())
  .transform((items) => {
    const results: JobPosting[] = [];
    for (const item of items) {
      if (item && typeof item === "object") {
        const parsed = publicJobPostingBoundarySchema.safeParse(item);
        if (parsed.success) {
          results.push(parsed.data);
        }
      }
    }
    return results;
  });

/**
 * Application submission response boundary schema
 */
export const careerApplicationResponseSchema = z
  .object({
    applicationId: z.string().catch("unknown-application"),
    status: z.string().catch("NEW"),
  })
  .loose();

/**
 * Talent pool submission response boundary schema
 */
export const talentPoolResponseSchema = z
  .object({
    id: z.string().catch("unknown-candidate"),
    name: z.string().nullish().catch(undefined),
    email: z.string().nullish().catch(undefined),
  })
  .loose();
