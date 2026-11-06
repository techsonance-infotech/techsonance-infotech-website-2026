import { describe, it, expect } from "vitest";
import { jobsTable } from "@/lib/database/schema/core/job.schema";
import { applicationsTable } from "@/lib/database/schema/core/application.schema";
import { talentPoolTable } from "@/lib/database/schema/core/talent-pool.schema";
import { careersSettingsTable } from "@/lib/database/schema/core/careers-settings.schema";
import { eeocResponsesTable } from "@/lib/database/schema/core/eeoc.schema";
import { updateJobSchema, createJobSchema } from "@/lib/validations/careers";
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
  ApplicationStatus,
} from "@/lib/database/enum/index.enum";

describe("Careers Production Database Schemas", () => {
  it("exports all tables with required columns", () => {
    expect(jobsTable).toBeDefined();
    expect(applicationsTable).toBeDefined();
    expect(talentPoolTable).toBeDefined();
    expect(careersSettingsTable).toBeDefined();
    expect(eeocResponsesTable).toBeDefined();

    // Job extended columns
    expect(jobsTable.workMode).toBeDefined();
    expect(jobsTable.showSalaryPublicly).toBeDefined();
    expect(jobsTable.screeningQuestions).toBeDefined();
    expect(jobsTable.referenceCode).toBeDefined();
    expect(jobsTable.openingsCount).toBeDefined();
    expect(jobsTable.ownerId).toBeDefined();
    expect(jobsTable.hiringManagerId).toBeDefined();
    expect(jobsTable.summary).toBeDefined();
    expect(jobsTable.approvalStatus).toBeDefined();

    // Application extended columns
    expect(applicationsTable.resumeStoragePath).toBeDefined();
    expect(applicationsTable.resumeFileName).toBeDefined();
    expect(applicationsTable.resumeMimeType).toBeDefined();
    expect(applicationsTable.knockoutTriggered).toBeDefined();
    expect(applicationsTable.screeningAnswers).toBeDefined();
    expect(applicationsTable.jobVersionId).toBeDefined();
    expect(applicationsTable.rating).toBeDefined();
    expect(applicationsTable.talentPoolConsent).toBeDefined();

    // Companion tables columns
    expect(talentPoolTable.preferredRole).toBeDefined();
    expect(careersSettingsTable.requireApprovalToPublish).toBeDefined();
    expect(eeocResponsesTable.veteranStatus).toBeDefined();
  });

  it("exports and validates enum definitions matching zion-api architecture", () => {
    expect(JobStatus.PUBLISHED).toBe("PUBLISHED");
    expect(JobStatus.IN_REVIEW).toBe("IN_REVIEW");
    expect(JobType.FULL_TIME).toBe("full_time");
    expect(JobWorkMode.HYBRID).toBe("hybrid");
    expect(JobVisaSupport.CASE_BY_CASE).toBe("case_by_case");
    expect(JobExperienceLevel.SENIOR).toBe("senior");
    expect(JobSalaryPeriod.YEAR).toBe("year");
    expect(JobApplicationMethod.BUILTIN).toBe("builtin");
    expect(JobCoverLetterRequirement.OPTIONAL).toBe("optional");
    expect(JobApprovalStatus.PENDING).toBe("pending");
    expect(JobVisibility.PUBLIC).toBe("public");
    expect(ApplicationStatus.SHORTLISTED).toBe("SHORTLISTED");
  });

  it("safely accepts null for database-nullable fields in updateJobSchema and createJobSchema", () => {
    const updatePayload = {
      title: "Staff Distributed Systems Engineer",
      ownerId: null,
      hiringManagerId: null,
      seoTitle: null,
      seoDescription: null,
      ogImage: null,
      referenceCode: null,
      salaryMin: null,
      salaryMax: null,
      compensationNotes: null,
      externalApplyUrl: null,
      remoteEligibility: null,
      aboutTeam: null,
      equalOpportunityStatement: null,
    };

    const updateResult = updateJobSchema.safeParse(updatePayload);
    expect(updateResult.success).toBe(true);

    const createPayload = {
      slug: "staff-distributed-systems-engineer",
      title: "Staff Distributed Systems Engineer",
      department: "Engineering",
      location: "Bhubaneswar, India",
      ownerId: null,
      hiringManagerId: null,
      seoTitle: null,
      seoDescription: null,
      ogImage: null,
      referenceCode: null,
      salaryMin: null,
      salaryMax: null,
      compensationNotes: null,
      externalApplyUrl: null,
      remoteEligibility: null,
      aboutTeam: null,
      equalOpportunityStatement: null,
    };

    const createResult = createJobSchema.safeParse(createPayload);
    expect(createResult.success).toBe(true);
  });
});
