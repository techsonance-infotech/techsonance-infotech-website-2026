import { pgEnum } from "drizzle-orm/pg-core";
import {
  AiJobStatus,
  AiJobStep,
  AiStepStatus,
  AiApprovalStatus,
  AiApprovalDecision,
  AiTopicStatus,
  AiProviderStatus,
  AiCredentialStatus,
  AiAccountBillingMode,
  AiAlertSeverity,
} from "../enum/ai.enum";
import {
  AdminRole,
  PostStatus,
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
  ApplicationStatus,
} from "../enum/content.enum";

// AI Engine Enums
export const AiJobStatusEnum = pgEnum(
  "ts_ai_job_status",
  Object.values(AiJobStatus) as [string, ...string[]],
);

export const AiJobStepEnum = pgEnum(
  "ts_ai_job_step",
  Object.values(AiJobStep) as [string, ...string[]],
);

export const AiStepStatusEnum = pgEnum(
  "ts_ai_step_status",
  Object.values(AiStepStatus) as [string, ...string[]],
);

export const AiApprovalStatusEnum = pgEnum(
  "ts_ai_approval_status",
  Object.values(AiApprovalStatus) as [string, ...string[]],
);

export const AiApprovalDecisionEnum = pgEnum(
  "ts_ai_approval_decision",
  Object.values(AiApprovalDecision) as [string, ...string[]],
);

export const AiTopicStatusEnum = pgEnum(
  "ts_ai_topic_status",
  Object.values(AiTopicStatus) as [string, ...string[]],
);

export const AiProviderStatusEnum = pgEnum(
  "ts_ai_provider_status",
  Object.values(AiProviderStatus) as [string, ...string[]],
);

export const AiCredentialStatusEnum = pgEnum(
  "ts_ai_credential_status",
  Object.values(AiCredentialStatus) as [string, ...string[]],
);

export const AiAccountBillingModeEnum = pgEnum(
  "ts_ai_account_billing_mode",
  Object.values(AiAccountBillingMode) as [string, ...string[]],
);

export const AiAlertSeverityEnum = pgEnum(
  "ts_ai_alert_severity",
  Object.values(AiAlertSeverity) as [string, ...string[]],
);

// Content & Admin Enums
export const AdminRoleEnum = pgEnum(
  "admin_role",
  Object.values(AdminRole) as [string, ...string[]],
);

export const PostStatusEnum = pgEnum(
  "post_status",
  Object.values(PostStatus) as [string, ...string[]],
);

export const JobStatusEnum = pgEnum("ts_content_job_status", [
  JobStatus.DRAFT,
  JobStatus.IN_REVIEW,
  JobStatus.SCHEDULED,
  JobStatus.PUBLISHED,
  JobStatus.OPEN,
  JobStatus.PAUSED,
  JobStatus.CLOSED,
  JobStatus.ARCHIVED,
]);

export const JobTypeEnum = pgEnum("ts_content_job_type", [
  JobType.FULL_TIME,
  JobType.PART_TIME,
  JobType.CONTRACT,
  JobType.INTERNSHIP,
  JobType.FREELANCE,
  JobType.TEMPORARY,
  JobType.LEGACY_FULL_TIME,
  JobType.LEGACY_CONTRACT,
  JobType.LEGACY_INTERNSHIP,
  JobType.LEGACY_PARTNER,
]);

export const JobWorkModeEnum = pgEnum("ts_content_job_work_mode", [
  JobWorkMode.ON_SITE,
  JobWorkMode.HYBRID,
  JobWorkMode.REMOTE,
]);

export const JobVisaSupportEnum = pgEnum("ts_content_job_visa_support", [
  JobVisaSupport.YES,
  JobVisaSupport.NO,
  JobVisaSupport.CASE_BY_CASE,
]);

export const JobExperienceLevelEnum = pgEnum("ts_content_job_experience_level", [
  JobExperienceLevel.ENTRY,
  JobExperienceLevel.MID,
  JobExperienceLevel.SENIOR,
  JobExperienceLevel.LEAD,
  JobExperienceLevel.EXECUTIVE,
  JobExperienceLevel.LEGACY_MID_SENIOR,
]);

export const JobSalaryPeriodEnum = pgEnum("ts_content_job_salary_period", [
  JobSalaryPeriod.HOUR,
  JobSalaryPeriod.MONTH,
  JobSalaryPeriod.YEAR,
]);

export const JobApplicationMethodEnum = pgEnum("ts_content_job_application_method", [
  JobApplicationMethod.BUILTIN,
  JobApplicationMethod.EXTERNAL,
]);

export const JobCoverLetterRequirementEnum = pgEnum("ts_content_job_cover_letter_requirement", [
  JobCoverLetterRequirement.OFF,
  JobCoverLetterRequirement.OPTIONAL,
  JobCoverLetterRequirement.REQUIRED,
]);

export const JobApprovalStatusEnum = pgEnum("ts_content_job_approval_status", [
  JobApprovalStatus.PENDING,
  JobApprovalStatus.APPROVED,
  JobApprovalStatus.RETURNED,
]);

export const JobVisibilityEnum = pgEnum("ts_content_job_visibility", [
  JobVisibility.PUBLIC,
  JobVisibility.UNLISTED,
]);

export const ApplicationStatusEnum = pgEnum("ts_content_application_status", [
  ApplicationStatus.NEW,
  ApplicationStatus.SCREENING,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFER,
  ApplicationStatus.HIRED,
  ApplicationStatus.ON_HOLD,
  ApplicationStatus.REJECTED,
  ApplicationStatus.WITHDRAWN,
]);
