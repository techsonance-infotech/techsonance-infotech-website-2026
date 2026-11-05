import { z } from "zod";
import {
  JobStatus,
  JobType,
  JobWorkMode,
  JobVisaSupport,
  JobExperienceLevel,
  JobSalaryPeriod,
  JobApplicationMethod,
  JobCoverLetterRequirement,
  JobApprovalStatus,
  JobVisibility,
} from "@/lib/database/enum";

export const screeningQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(3),
  type: z.enum(["short_text", "long_text", "boolean", "choice"]),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(false),
  knockoutAnswer: z.union([z.string(), z.boolean()]).optional(),
});
export type ScreeningQuestion = z.infer<typeof screeningQuestionSchema>;

export const screeningAnswerSchema = z.object({
  questionId: z.string().min(1),
  question: z.string().min(1),
  answer: z.any(),
  isKnockout: z.boolean().default(false),
});
export type ScreeningAnswer = z.infer<typeof screeningAnswerSchema>;

export const jobPostingBaseFields = {
  siteId: z.string().uuid().optional(),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  referenceCode: z.string().optional(),
  department: z.string().min(2, "Department is required"),
  openingsCount: z.number().int().min(1, "Openings count must be at least 1").default(1),
  ownerId: z.string().uuid().optional(),
  hiringManagerId: z.string().uuid().optional(),
  summary: z.string().min(5, "Summary must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),

  workMode: z.nativeEnum(JobWorkMode).default(JobWorkMode.HYBRID),
  location: z.string().min(2, "Location is required"),
  remoteEligibility: z.string().optional(),
  visaSupport: z.nativeEnum(JobVisaSupport).default(JobVisaSupport.NO),

  type: z.nativeEnum(JobType).default(JobType.FULL_TIME),
  experienceLevel: z.nativeEnum(JobExperienceLevel).default(JobExperienceLevel.MID),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  preferredQualifications: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  aboutTeam: z.string().optional(),
  hiringProcess: z
    .array(
      z.object({
        step: z.string(),
        title: z.string(),
        desc: z.string().optional(),
      }),
    )
    .default([]),
  equalOpportunityStatement: z.string().optional(),

  salaryMin: z.number().int().min(0).optional(),
  salaryMax: z.number().int().min(0).optional(),
  salaryCurrency: z.string().default("INR"),
  salaryPeriod: z.nativeEnum(JobSalaryPeriod).default(JobSalaryPeriod.YEAR),
  showSalaryPublicly: z.boolean().default(false),
  compensationNotes: z.string().optional(),

  applicationMethod: z.enum(JobApplicationMethod).default(JobApplicationMethod.BUILTIN),
  externalApplyUrl: z.url("Must be a valid URL").optional().or(z.literal("")),
  resumeRequired: z.boolean().default(true),
  coverLetterRequirement: z.nativeEnum(JobCoverLetterRequirement).default(JobCoverLetterRequirement.OPTIONAL),
  screeningQuestions: z.array(screeningQuestionSchema).default([]),

  status: z.nativeEnum(JobStatus).default(JobStatus.DRAFT),
  publishAt: z.union([z.date()]).optional(),
  closesAt: z.union([z.date()]).optional(),
  visibility: z.nativeEnum(JobVisibility).default(JobVisibility.PUBLIC),
  featured: z.boolean().default(false),

  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  ogImage: z.string().optional(),
};

export const jobPostingInputSchema = z.object(jobPostingBaseFields);

export const createJobSchema = jobPostingInputSchema
  .refine(
    (data) => {
      if (data.salaryMin !== undefined && data.salaryMax !== undefined) {
        return data.salaryMin <= data.salaryMax;
      }
      return true;
    },
    {
      message: "Maximum salary must be greater than or equal to minimum salary",
      path: ["salaryMax"],
    },
  )
  .refine(
    (data) => {
      if (!data.location) return true;
      const loc = data.location.trim().toLowerCase();
      if (/^(multiple|various)(\s+locations?)?$/i.test(loc)) return false;
      if (/\b(and|or|\/)\b/i.test(loc) && !/^(hybrid|remote)$/i.test(loc)) return false;
      return true;
    },
    {
      message: "Please specify a single location or 'Remote'. Multiple locations must be posted as separate roles.",
      path: ["location"],
    },
  )
  .refine(
    (data) => {
      if (data.applicationMethod === JobApplicationMethod.EXTERNAL) {
        return Boolean(data.externalApplyUrl && data.externalApplyUrl.length > 0);
      }
      return true;
    },
    {
      message: "External application URL is required when application method is external",
      path: ["externalApplyUrl"],
    },
  );

export const updateJobSchema = jobPostingInputSchema
  .partial()
  .refine(
    (data) => {
      if (data.salaryMin !== undefined && data.salaryMax !== undefined) {
        return data.salaryMin <= data.salaryMax;
      }
      return true;
    },
    {
      message: "Maximum salary must be greater than or equal to minimum salary",
      path: ["salaryMax"],
    },
  )
  .refine(
    (data) => {
      if (data.location === undefined) return true;
      const loc = data.location.trim().toLowerCase();
      if (/^(multiple|various)(\s+locations?)?$/i.test(loc)) return false;
      if (/\b(and|or|\/)\b/i.test(loc) && !/^(hybrid|remote)$/i.test(loc)) return false;
      return true;
    },
    {
      message: "Please specify a single location or 'Remote'. Multiple locations must be posted as separate roles.",
      path: ["location"],
    },
  );

export const jobStatusTransitionSchema = z
  .object({
    targetStatus: z.nativeEnum(JobStatus).optional(),
    status: z.nativeEnum(JobStatus).optional(),
    comment: z.string().optional(),
  })
  .refine((data) => Boolean(data.targetStatus || data.status), {
    message: "Target status is required",
    path: ["targetStatus"],
  })
  .transform((data) => ({
    targetStatus: (data.targetStatus || data.status)!,
    status: (data.targetStatus || data.status)!,
    comment: data.comment,
  }));

export const applicationSubmissionSchema = z.object({
  jobId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
  candidateName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  currentLocation: z.string().optional(),
  portfolioUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  githubUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  resumeStoragePath: z.string().min(1, "Resume file path is required"),
  resumeFileName: z.string().min(1, "Resume file name is required"),
  resumeMimeType: z.string().min(1, "Resume mime type is required"),
  coverLetter: z.string().optional(),
  noticePeriodWeeks: z.number().int().min(0).optional(),
  screeningAnswers: z.array(screeningAnswerSchema).default([]),
  privacyConsent: z.literal(true, {
    message: "You must accept the privacy policy to submit your application",
  }),
  talentPoolConsent: z.boolean().default(false),
  source: z.string().default("direct"),
});

export const talentPoolSubmissionSchema = z.object({
  siteId: z.uuid().optional(),
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  skills: z.array(z.string()).default([]),
  preferredRole: z.string().optional(),
  experienceLevel: z.nativeEnum(JobExperienceLevel).default(JobExperienceLevel.MID),
  portfolioUrl: z.url("Must be a valid URL").optional().or(z.literal("")),
  resumeStoragePath: z.string().optional(),
  notes: z.string().optional(),
});

export type JobPostingInput = z.infer<typeof jobPostingInputSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type JobStatusTransitionInput = z.infer<typeof jobStatusTransitionSchema>;
export type ApplicationSubmissionInput = z.infer<typeof applicationSubmissionSchema>;
export type TalentPoolSubmissionInput = z.infer<typeof talentPoolSubmissionSchema>;
