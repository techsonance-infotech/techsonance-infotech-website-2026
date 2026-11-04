export const AdminRoleValues = ["owner", "admin", "editor", "author", "viewer"] as const;
export type AdminRole = (typeof AdminRoleValues)[number];

export const PostStatusValues = ["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"] as const;
export type PostStatus = (typeof PostStatusValues)[number];

export const JobStatusValues = ["DRAFT", "OPEN", "CLOSED", "ARCHIVED"] as const;
export type JobStatus = (typeof JobStatusValues)[number];

export const JobTypeValues = ["Full Time", "Internship", "Contract", "Partner"] as const;
export type JobType = (typeof JobTypeValues)[number];

export const ApplicationStatusValues = [
  "NEW",
  "REVIEWING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFERED",
  "REJECTED",
] as const;
export type ApplicationStatus = (typeof ApplicationStatusValues)[number];
