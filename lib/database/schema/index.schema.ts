export * from "./base.schema";
export * from "./core/user.schema";
export * from "./core/site.schema";
export * from "./core/author.schema";
export * from "./core/category.schema";
export * from "./core/post.schema";
export * from "./core/job.schema";
export * from "./core/application.schema";
export * from "./core/version.schema";
export * from "./core/audit.schema";

// Backward compatibility table alias exports
export {
  sitesTable as tsAdminSites,
  membershipsTable as tsAdminMemberships,
} from "./core/site.schema";
export { authorsTable as tsContentAuthors } from "./core/author.schema";
export { categoriesTable as tsContentCategories } from "./core/category.schema";
export { postsTable as tsContentPosts } from "./core/post.schema";
export { jobsTable as tsContentJobs } from "./core/job.schema";
export { applicationsTable as tsContentApplications } from "./core/application.schema";
export { versionsTable as tsContentVersions } from "./core/version.schema";
export { auditLogsTable as tsContentAuditLog } from "./core/audit.schema";
