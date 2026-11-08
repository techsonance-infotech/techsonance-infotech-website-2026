import { z } from "zod";
import { ApplicationStatus, JobStatus } from "@/lib/constants/enums";

// Resilient single job item in listing
export const SafeJobItemSchema = z
  .object({
    id: z.string().default(() => crypto.randomUUID()),
    siteId: z.string().optional(),
    title: z
      .string()
      .nullish()
      .transform((v) => v?.trim() || "Untitled Position"),
    slug: z
      .string()
      .nullish()
      .transform((v) => v?.trim() || "job"),
    referenceCode: z.string().nullish().catch(null),
    department: z
      .string()
      .nullish()
      .transform((v) => v?.trim() || "Engineering"),
    location: z
      .string()
      .nullish()
      .transform((v) => v?.trim() || "Bhubaneswar, India"),
    type: z
      .string()
      .nullish()
      .transform((v) => v?.trim() || "Full Time"),
    workMode: z
      .string()
      .nullish()
      .transform((v) => v?.trim() || "hybrid"),
    experienceLevel: z
      .string()
      .nullish()
      .transform((v) => v?.trim() || "Mid-Senior"),
    openingsCount: z.coerce.number().int().catch(1),
    status: z.enum(JobStatus).catch(JobStatus.DRAFT),
    approvalStatus: z
      .string()
      .nullish()
      .transform((v) => v || "DRAFT"),
    approvalComment: z.string().nullish().catch(null),
    publishAt: z.string().nullish().catch(null),
    closesAt: z.string().nullish().catch(null),
    visibility: z
      .string()
      .nullish()
      .transform((v) => v || "public"),
    featured: z.boolean().catch(false),
    createdAt: z.string().nullish().catch(null),
    updatedAt: z.string().nullish().catch(null),
  })
  .nullable()
  .catch(null);

export type SafeJobItem = NonNullable<z.infer<typeof SafeJobItemSchema>>;

export const SafeJobsListResponseSchema = z.object({
  jobs: z
    .array(SafeJobItemSchema)
    .nullish()
    .transform((items) =>
      (items ?? []).filter((item): item is NonNullable<typeof item> => item !== null),
    ),
  total: z.coerce.number().int().catch(0),
});

export type SafeJobsListResponse = z.infer<typeof SafeJobsListResponseSchema>;

// Resilient single application item in inbox
export const SafeApplicationItemSchema = z
  .object({
    id: z.string().default(() => crypto.randomUUID()),
    candidateName: z
      .string()
      .nullish()
      .transform((v) => v?.trim() || "Anonymous Candidate"),
    email: z
      .string()
      .nullish()
      .transform((v) => v?.trim() || "no-email@provided"),
    phone: z.string().nullish().catch(null),
    status: z.enum(ApplicationStatus).catch(ApplicationStatus.NEW),
    jobTitle: z
      .string()
      .nullish()
      .transform((v) => v?.trim() || "Open Position"),
    rating: z.coerce.number().int().min(1).max(5).nullish().catch(null),
    knockoutTriggered: z.boolean().catch(false),
    createdAt: z
      .string()
      .nullish()
      .transform((v) => v || new Date().toISOString()),
  })
  .nullable()
  .catch(null);

export type SafeApplicationItem = NonNullable<z.infer<typeof SafeApplicationItemSchema>>;

export const SafeApplicationsListResponseSchema = z.object({
  applications: z
    .array(SafeApplicationItemSchema)
    .nullish()
    .transform((items) =>
      (items ?? []).filter((item): item is NonNullable<typeof item> => item !== null),
    ),
  total: z.coerce.number().int().catch(0),
});

export type SafeApplicationsListResponse = z.infer<typeof SafeApplicationsListResponseSchema>;

// Resilient Candidate Application Detail
export const SafeCandidateDetailSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  candidateName: z
    .string()
    .nullish()
    .transform((v) => v?.trim() || "Anonymous Candidate"),
  email: z
    .string()
    .nullish()
    .transform((v) => v?.trim() || "no-email@provided"),
  phone: z.string().nullish().catch(null),
  status: z.enum(ApplicationStatus).catch(ApplicationStatus.NEW),
  jobTitle: z
    .string()
    .nullish()
    .transform((v) => v?.trim() || "Open Position"),
  jobId: z.string().nullish().catch(null),
  rating: z.coerce.number().int().min(1).max(5).nullish().catch(null),
  knockoutTriggered: z.boolean().catch(false),
  createdAt: z
    .string()
    .nullish()
    .transform((v) => v || new Date().toISOString()),
  currentLocation: z.string().nullish().catch(null),
  noticePeriodWeeks: z.coerce.number().int().nullish().catch(null),
  resumeFileName: z.string().nullish().catch(null),
  resumeUrl: z.string().nullish().catch(null),
  portfolioUrl: z.string().nullish().catch(null),
  linkedinUrl: z.string().nullish().catch(null),
  githubUrl: z.string().nullish().catch(null),
  websiteUrl: z.string().nullish().catch(null),
  coverLetter: z.string().nullish().catch(null),
  screeningAnswers: z
    .array(
      z.object({
        question: z.string().default("Question"),
        answer: z.union([z.string(), z.boolean(), z.number()]).default(""),
        isKnockout: z.boolean().catch(false),
      }),
    )
    .nullish()
    .transform((answers) => answers ?? []),
  rejectionReason: z.string().nullish().catch(null),
  internalNotes: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  updatedAt: z.string().nullish().catch(null),
});

export type SafeCandidateDetail = z.infer<typeof SafeCandidateDetailSchema>;
