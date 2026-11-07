import { z } from "zod";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";
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

function caseInsensitiveEnum<T extends Record<string, string>>(
  enumObj: T,
  defaultValue?: T[keyof T],
) {
  const values = Object.values(enumObj) as string[];
  const schema = z.preprocess((val) => {
    if (typeof val !== "string") return val;
    const trimmed = val.trim();
    if (values.includes(trimmed)) return trimmed;

    const normalized = trimmed.toLowerCase().replace(/[\s-]+/g, "_");
    for (const v of values) {
      if (
        v.toLowerCase() === trimmed.toLowerCase() ||
        v.toLowerCase().replace(/[\s-]+/g, "_") === normalized
      ) {
        return v;
      }
    }
    return val;
  }, z.enum(enumObj));

  return defaultValue ? schema.default(defaultValue) : schema;
}

export const jobPostingBaseFields = {
  siteId: z.string().uuid().optional().nullable(),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  referenceCode: z.string().optional().nullable(),
  department: z.string().min(2, "Department is required"),
  openingsCount: z.number().int().min(1, "Openings count must be at least 1").default(1),
  ownerId: z.uuid().optional().nullable(),
  hiringManagerId: z.uuid().optional().nullable(),
  summary: z.string().default(""),
  description: z.string().default(""),

  workMode: caseInsensitiveEnum(JobWorkMode, JobWorkMode.HYBRID),
  location: z.string().min(2, "Location is required"),
  remoteEligibility: z.string().optional().nullable(),
  visaSupport: caseInsensitiveEnum(JobVisaSupport, JobVisaSupport.NO)
    .optional()
    .nullable()
    .default(JobVisaSupport.NO),

  type: caseInsensitiveEnum(JobType, JobType.FULL_TIME),
  experienceLevel: caseInsensitiveEnum(JobExperienceLevel, JobExperienceLevel.MID),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  preferredQualifications: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  aboutTeam: z.string().optional().nullable(),
  hiringProcess: z
    .array(
      z.object({
        step: z.string(),
        title: z.string(),
        desc: z.string().optional().nullable(),
      }),
    )
    .default([]),
  equalOpportunityStatement: z.string().optional().nullable(),

  salaryMin: z.number().int().min(0).optional().nullable(),
  salaryMax: z.number().int().min(0).optional().nullable(),
  salaryCurrency: z.string().default("INR"),
  salaryPeriod: caseInsensitiveEnum(JobSalaryPeriod, JobSalaryPeriod.YEAR),
  showSalaryPublicly: z.boolean().default(false),
  compensationNotes: z.string().optional().nullable(),

  applicationMethod: caseInsensitiveEnum(JobApplicationMethod, JobApplicationMethod.BUILTIN),
  externalApplyUrl: z
    .url("Must be a valid URL")
    .optional()
    .nullable()
    .or(z.literal(""))
    .or(z.null()),
  resumeRequired: z.boolean().default(true),
  coverLetterRequirement: caseInsensitiveEnum(
    JobCoverLetterRequirement,
    JobCoverLetterRequirement.OPTIONAL,
  ),
  screeningQuestions: z.array(screeningQuestionSchema).default([]),

  status: caseInsensitiveEnum(JobStatus, JobStatus.DRAFT),
  publishAt: z.coerce.date().optional().nullable(),
  closesAt: z.coerce.date().optional().nullable(),
  visibility: caseInsensitiveEnum(JobVisibility, JobVisibility.PUBLIC),
  featured: z.boolean().default(false),

  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
};

export const jobPostingInputSchema = z.object(jobPostingBaseFields);

export const createJobSchema = jobPostingInputSchema
  .refine(
    (data) => {
      if (data.salaryMin != null && data.salaryMax != null) {
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
      message:
        "Please specify a single location or 'Remote'. Multiple locations must be posted as separate roles.",
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
      if (data.salaryMin != null && data.salaryMax != null) {
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
      message:
        "Please specify a single location or 'Remote'. Multiple locations must be posted as separate roles.",
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
  siteId: z.preprocess(
    (val) => (typeof val === "string" && val.trim() ? val.trim() : undefined),
    z.string().uuid().optional(),
  ),
  name: z
    .string()
    .min(1, CAREER_ERRORS.FULL_NAME_REQUIRED)
    .min(2, "Full name must be at least 2 characters"),
  email: z.string().min(1, CAREER_ERRORS.EMAIL_REQUIRED).email(CAREER_ERRORS.TALENT_EMAIL_INVALID),
  phone: z.preprocess(
    (val) => (typeof val === "string" && val.trim() ? val.trim() : undefined),
    z.string().optional(),
  ),
  skills: z.preprocess((val) => {
    if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
    if (typeof val === "string")
      return val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    return [];
  }, z.array(z.string()).default([])),
  preferredRole: z.preprocess(
    (val) => (typeof val === "string" && val.trim() ? val.trim() : undefined),
    z.string().optional(),
  ),
  experienceLevel: caseInsensitiveEnum(JobExperienceLevel, JobExperienceLevel.MID),
  portfolioUrl: z.preprocess((val) => {
    if (!val || typeof val !== "string") return undefined;
    const trimmed = val.trim();
    if (!trimmed || trimmed === "https://" || trimmed.endsWith("/...")) return undefined;
    return trimmed;
  }, z.string().optional()),
  resumeStoragePath: z.string().optional(),
  notes: z.preprocess(
    (val) => (typeof val === "string" && val.trim() ? val.trim() : undefined),
    z.string().optional(),
  ),
  privacyConsent: z.boolean().default(true),
});

export type JobPostingInput = z.infer<typeof jobPostingInputSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type JobStatusTransitionInput = z.infer<typeof jobStatusTransitionSchema>;
export type ApplicationSubmissionInput = z.infer<typeof applicationSubmissionSchema>;
export type TalentPoolSubmissionInput = z.infer<typeof talentPoolSubmissionSchema>;

export const careerInquirySchema = z.object({
  fullName: z.string().trim().min(2, CAREER_ERRORS.FULL_NAME_REQUIRED),
  email: z.string().trim().email(CAREER_ERRORS.TALENT_EMAIL_INVALID),
  role: z.string().trim().min(2, CAREER_ERRORS.ROLE_REQUIRED),
  message: z.string().trim().min(5, CAREER_ERRORS.MESSAGE_REQUIRED),
  website_url: z.string().optional(),
  _hp: z.string().optional(),
  botCheck: z.string().optional(),
});
export type CareerInquiryInput = z.infer<typeof careerInquirySchema>;

export const careerApplyFormSchema = z.object({
  jobId: z.string().trim().min(1, CAREER_ERRORS.JOB_ID_REQUIRED),
  candidateName: z.string().trim().min(2, CAREER_ERRORS.CANDIDATE_NAME_REQUIRED),
  email: z.string().trim().email(CAREER_ERRORS.EMAIL_REQUIRED),
  phone: z.string().trim().optional(),
  currentLocation: z.string().trim().optional(),
  portfolioUrl: z.string().trim().url().optional().or(z.literal("")),
  githubUrl: z.string().trim().url().optional().or(z.literal("")),
  linkedinUrl: z.string().trim().url().optional().or(z.literal("")),
  coverLetter: z.string().trim().optional(),
  noticePeriodWeeks: z.coerce.number().int().min(0).optional(),
  privacyConsent: z.preprocess(
    (val) => val === true || val === "true" || val === "on" || val === 1 || val === "1",
    z.literal(true, {
      message: CAREER_ERRORS.PRIVACY_CONSENT_REQUIRED,
    }),
  ),
  talentPoolConsent: z.preprocess(
    (val) => val === true || val === "true" || val === "on" || val === 1 || val === "1",
    z.boolean().default(false),
  ),
  source: z.string().trim().optional(),
  screeningAnswers: z.preprocess(
    (val) => {
      if (!val) return [];
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return val;
    },
    z
      .array(
        z.object({
          questionId: z.string(),
          question: z.string(),
          answer: z.any(),
        }),
      )
      .default([]),
  ),
  website_url: z.string().optional(),
  _hp: z.string().optional(),
  botCheck: z.string().optional(),
});
export type CareerApplyFormInput = z.infer<typeof careerApplyFormSchema>;
