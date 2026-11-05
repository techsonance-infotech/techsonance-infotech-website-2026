export enum AdminRole {
  OWNER = "owner",
  ADMIN = "admin",
  EDITOR = "editor",
  AUTHOR = "author",
  VIEWER = "viewer",
}

export enum PostStatus {
  DRAFT = "DRAFT",
  IN_REVIEW = "IN_REVIEW",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum JobStatus {
  DRAFT = "DRAFT",
  IN_REVIEW = "IN_REVIEW",
  SCHEDULED = "SCHEDULED",
  PUBLISHED = "PUBLISHED",
  OPEN = "OPEN",
  PAUSED = "PAUSED",
  CLOSED = "CLOSED",
  ARCHIVED = "ARCHIVED",
}

export enum JobType {
  FULL_TIME = "full_time",
  PART_TIME = "part_time",
  CONTRACT = "contract",
  INTERNSHIP = "internship",
  FREELANCE = "freelance",
  TEMPORARY = "temporary",
  LEGACY_FULL_TIME = "Full Time",
  LEGACY_CONTRACT = "Contract",
  LEGACY_INTERNSHIP = "Internship",
  LEGACY_PARTNER = "Partner",
}

export enum JobWorkMode {
  ON_SITE = "on_site",
  HYBRID = "hybrid",
  REMOTE = "remote",
}

export enum JobVisaSupport {
  YES = "yes",
  NO = "no",
  CASE_BY_CASE = "case_by_case",
}

export enum JobExperienceLevel {
  ENTRY = "entry",
  MID = "mid",
  SENIOR = "senior",
  LEAD = "lead",
  EXECUTIVE = "executive",
  LEGACY_MID_SENIOR = "Mid-Senior",
}

export enum JobSalaryPeriod {
  HOUR = "hour",
  MONTH = "month",
  YEAR = "year",
}

export enum JobApplicationMethod {
  BUILTIN = "builtin",
  EXTERNAL = "external",
}

export enum JobCoverLetterRequirement {
  OFF = "off",
  OPTIONAL = "optional",
  REQUIRED = "required",
}

export enum JobApprovalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  RETURNED = "returned",
}

export enum JobVisibility {
  PUBLIC = "public",
  UNLISTED = "unlisted",
}

export enum ApplicationStatus {
  NEW = "NEW",
  SCREENING = "SCREENING",
  SHORTLISTED = "SHORTLISTED",
  INTERVIEW = "INTERVIEW",
  OFFER = "OFFER",
  HIRED = "HIRED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
}
