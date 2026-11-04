import { pgEnum } from "drizzle-orm/pg-core";
import {
  AiJobStatus,
  AiJobStep,
  AiStepStatus,
  AiApprovalStatus,
  AiApprovalDecision,
  AiTopicStatus,
  AiProviderStatus,
} from "../enum/ai.enum";
import {
  AdminRoleValues,
  PostStatusValues,
  JobStatusValues,
  JobTypeValues,
  ApplicationStatusValues,
} from "../enum/content.enum";

// AI Engine Enums (Matching zion-api Architecture)
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

// Content & Admin Enums
export const AdminRoleEnum = pgEnum(
  "admin_role",
  AdminRoleValues as unknown as [string, ...string[]],
);

export const PostStatusEnum = pgEnum(
  "post_status",
  PostStatusValues as unknown as [string, ...string[]],
);

export const JobStatusEnum = pgEnum(
  "job_status",
  JobStatusValues as unknown as [string, ...string[]],
);

export const JobTypeEnum = pgEnum(
  "job_type",
  JobTypeValues as unknown as [string, ...string[]],
);

export const ApplicationStatusEnum = pgEnum(
  "application_status",
  ApplicationStatusValues as unknown as [string, ...string[]],
);
