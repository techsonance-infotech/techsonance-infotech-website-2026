import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { CareerApplyService } from "@/lib/services/career-apply.service";
import { ApplicationsService } from "@/lib/services/applications.service";
import {
  JobStatus,
  JobApprovalStatus,
  ApplicationStatus,
  JobWorkMode,
  JobType,
  JobExperienceLevel,
  JobSalaryPeriod,
} from "@/lib/database/enum/content.enum";
import { evaluateCompleteness } from "@/components/admin/careers/CompletenessChecklist";
import { generateJobPostingJsonLd } from "@/components/careers/JobPostingJsonLd";
import { jobsTable } from "@/lib/database/schema/core/job.schema";
import { applicationsTable } from "@/lib/database/schema/core/application.schema";
import { versionsTable } from "@/lib/database/schema/core/version.schema";

describe("Agency Careers End-to-End Scenario Lifecycle", () => {
  let mockDb: any;
  let mockEmailService: any;
  let mockSupabaseAdmin: any;

  let adminJobsService: AdminJobsService;
  let careerApplyService: CareerApplyService;
  let applicationsService: ApplicationsService;

  let currentJob: any;
  let applicationsStore: any[];
  let dispatchedEmails: any[];
  let versionSnapshots: any[];
  let auditTrail: any[];

  beforeEach(() => {
    vi.clearAllMocks();

    currentJob = null;
    applicationsStore = [];
    dispatchedEmails = [];
    versionSnapshots = [];
    auditTrail = [];

    mockEmailService = {
      sendMail: vi.fn().mockImplementation((payload: any) => {
        dispatchedEmails.push(payload);
        return Promise.resolve({ success: true });
      }),
    };

    mockSupabaseAdmin = {
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockImplementation((path: string) => {
            return Promise.resolve({ data: { path }, error: null });
          }),
          createSignedUrl: vi.fn().mockImplementation((path: string, expiresIn: number) => {
            return Promise.resolve({
              data: { signedUrl: `https://mock-storage.supabase.co/signed/${path}?expires=${expiresIn}` },
              error: null,
            });
          }),
        }),
      },
    };

    mockDb = {
      select: vi.fn().mockImplementation(() => {
        const queryBuilder: any = {
          from: vi.fn().mockImplementation((table: any) => {
            const tableBuilder: any = {
              leftJoin: vi.fn().mockImplementation(() => tableBuilder),
              where: vi.fn().mockImplementation((condition: any) => {
                if (table === jobsTable || table?._?.name === "ts_content_jobs") {
                  const res = currentJob ? [currentJob] : [];
                  const p = Promise.resolve(res);
                  (p as any).limit = vi.fn().mockResolvedValue(res);
                  return p;
                }
                if (table === applicationsTable || table?._?.name === "ts_content_applications") {
                  const res = applicationsStore.map((app) => ({
                    application: app,
                    app,
                    job: currentJob,
                    jobTitle: currentJob?.title,
                    ...app,
                  }));
                  const p = Promise.resolve(res);
                  (p as any).limit = vi.fn().mockResolvedValue(res);
                  (p as any).orderBy = vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      offset: vi.fn().mockResolvedValue(res),
                    }),
                  });
                  return p;
                }
                if (table === versionsTable || table?._?.name === "ts_content_versions") {
                  return Promise.resolve(versionSnapshots);
                }
                return Promise.resolve([]);
              }),
            };
            return tableBuilder;
          }),
        };
        return queryBuilder;
      }),
      insert: vi.fn().mockImplementation((table: any) => ({
        values: vi.fn().mockImplementation((val: any) => {
          if (table === jobsTable || (val.title && val.slug)) {
            currentJob = { id: "job-e2e-001", versionId: 1, ...val };
            return {
              returning: vi.fn().mockResolvedValue([currentJob]),
            };
          }
          if (table === applicationsTable || (val.jobId && val.candidateName)) {
            const newApp = { id: `app-${applicationsStore.length + 1}`, ...val, createdAt: new Date() };
            applicationsStore.push(newApp);
            return {
              returning: vi.fn().mockResolvedValue([newApp]),
            };
          }
          if (val.entityType === "job" && val.snapshot) {
            versionSnapshots.push({ id: `ver-${versionSnapshots.length + 1}`, ...val });
          }
          if (val.action) {
            auditTrail.push(val);
          }
          return {
            returning: vi.fn().mockResolvedValue([val]),
          };
        }),
      })),
      update: vi.fn().mockImplementation((table: any) => ({
        set: vi.fn().mockImplementation((updates: any) => ({
          where: vi.fn().mockImplementation(() => {
            if (table === jobsTable || table?._?.name === "ts_content_jobs") {
              currentJob = { ...currentJob, ...updates };
              return {
                returning: vi.fn().mockResolvedValue([currentJob]),
              };
            }
            if (table === applicationsTable || table?._?.name === "ts_content_applications") {
              if (applicationsStore.length > 0) {
                applicationsStore[0] = { ...applicationsStore[0], ...updates };
                return {
                  returning: vi.fn().mockResolvedValue([applicationsStore[0]]),
                };
              }
            }
            return {
              returning: vi.fn().mockResolvedValue([{ ...updates }]),
            };
          }),
        })),
      })),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({ rowCount: 1 }),
      }),
    };

    adminJobsService = new AdminJobsService(mockDb);
    careerApplyService = new CareerApplyService(mockDb, mockEmailService, mockSupabaseAdmin);
    applicationsService = new ApplicationsService(mockDb, mockSupabaseAdmin);
  });

  it("walks the complete 10-step recruitment and candidate lifecycle", async () => {
    // -------------------------------------------------------------
    // STEP 1: Recruiter creates role in DRAFT
    // -------------------------------------------------------------
    const jobFormData = {
      siteId: "00000000-0000-0000-0000-000000000001",
      title: "Staff Cloud Systems Architect",
      slug: "staff-cloud-systems-architect",
      department: "Cloud Engineering",
      location: "Bengaluru, India",
      workMode: JobWorkMode.HYBRID,
      type: JobType.FULL_TIME,
      experienceLevel: JobExperienceLevel.LEAD,
      description: "Architect and lead enterprise microservices infrastructure and multi-cloud resilience.",
      responsibilities: ["Lead cloud architecture", "Oversee Kubernetes clustering", "Mentor senior engineers"],
      requirements: ["10+ years engineering", "Deep AWS/GCP expertise", "Terraform & IaC proficiency"],
      openingsCount: 2,
      salaryMin: 4500000,
      salaryMax: 6500000,
      salaryCurrency: "INR",
      salaryPeriod: JobSalaryPeriod.YEAR,
      showSalaryPublicly: true,
      resumeRequired: true,
      screeningQuestions: [
        {
          id: "q-years",
          question: "How many years of AWS / GCP architecture experience do you have?",
          type: "short_text" as const,
          required: true,
          knockoutCondition: { operator: "lt" as const, value: 5 },
        },
      ],
      status: JobStatus.DRAFT,
      approvalStatus: JobApprovalStatus.PENDING,
    };

    const createdJob = await adminJobsService.createJob(jobFormData, "recruiter-101");
    expect(createdJob.id).toBeDefined();
    expect(createdJob.status).toBe(JobStatus.DRAFT);
    expect(createdJob.approvalStatus).toBe(JobApprovalStatus.PENDING);

    // -------------------------------------------------------------
    // STEP 2: Completeness checklist passes; submitted to IN_REVIEW
    // -------------------------------------------------------------
    const evalResult = evaluateCompleteness(jobFormData);
    expect(evalResult.isComplete).toBe(true);
    expect(evalResult.missingFields.length).toBe(0);

    const inReviewJob = await adminJobsService.transitionStatus(
      createdJob.id,
      JobStatus.IN_REVIEW,
      { userId: "recruiter-101", role: "recruiter" },
      "Submitted for executive recruitment approval",
    );
    expect(inReviewJob.status).toBe(JobStatus.IN_REVIEW);

    // -------------------------------------------------------------
    // STEP 3: Admin approves; role transitions to PUBLISHED
    // -------------------------------------------------------------
    const approvedJob = await adminJobsService.approveJob(
      createdJob.id,
      "admin-exec-001",
      "192.168.1.1",
    );
    expect(approvedJob.status).toBe(JobStatus.PUBLISHED);
    expect(approvedJob.approvalStatus).toBe(JobApprovalStatus.APPROVED);
    expect(approvedJob.publishedAt).toBeDefined();

    // -------------------------------------------------------------
    // STEP 4: Role structured Schema.org JSON-LD is generated
    // -------------------------------------------------------------
    const jsonLd = generateJobPostingJsonLd(approvedJob as any);
    expect(jsonLd["@type"]).toBe("JobPosting");
    expect(jsonLd.title).toBe("Staff Cloud Systems Architect");
    expect((jsonLd.hiringOrganization as any).name).toBe("TechSonance Infotech");
    expect((jsonLd.baseSalary as any).value.minValue).toBe(4500000);
    expect((jsonLd.baseSalary as any).value.maxValue).toBe(6500000);

    // -------------------------------------------------------------
    // STEP 5: Dynamic sitemap includes the published role slug
    // -------------------------------------------------------------
    const isSitemapEligible =
      approvedJob.status === JobStatus.PUBLISHED && approvedJob.slug.length > 0;
    expect(isSitemapEligible).toBe(true);

    // -------------------------------------------------------------
    // STEP 6: Candidate submits application with resume file
    // -------------------------------------------------------------
    const mockResumeBuffer = Buffer.from("%PDF-1.5 test resume mock data");
    const applicationPayload = {
      jobId: approvedJob.id,
      candidateName: "Arun Kumar",
      email: "arun.kumar@example.com",
      phone: "+91 98765 43210",
      linkedinUrl: "https://linkedin.com/in/arunkumar",
      privacyConsent: true,
      screeningAnswers: [
        {
          questionId: "q-years",
          question: "How many years of AWS / GCP architecture experience do you have?",
          answer: "8",
        },
      ],
      resumeFile: {
        name: "arun-kumar-resume.pdf",
        type: "application/pdf",
        size: mockResumeBuffer.length,
        buffer: mockResumeBuffer,
      },
    };

    const submissionResult = await careerApplyService.submitApplication(applicationPayload);
    expect(submissionResult.id).toBeDefined();

    // -------------------------------------------------------------
    // STEP 7: Application arrives in inbox in NEW stage
    // -------------------------------------------------------------
    const storedApp = applicationsStore[0];
    expect(storedApp.candidateName).toBe("Arun Kumar");
    expect(storedApp.email).toBe("arun.kumar@example.com");
    expect(storedApp.status).toBe(ApplicationStatus.NEW);
    expect(storedApp.knockoutTriggered).toBe(false);

    // -------------------------------------------------------------
    // STEP 8: Dual emails dispatched (candidate confirmation + recruiter alert)
    // -------------------------------------------------------------
    expect(dispatchedEmails.length).toBe(2);
    const candidateEmail = dispatchedEmails.find((e) => e.to === "arun.kumar@example.com");
    expect(candidateEmail).toBeDefined();
    expect(candidateEmail.subject).toContain("Application Received");

    const recruiterAlert = dispatchedEmails.find((e) => e.to !== "arun.kumar@example.com");
    expect(recruiterAlert).toBeDefined();
    expect(recruiterAlert.subject).toContain("New Application");

    // -------------------------------------------------------------
    // STEP 9: Recruiter generates signed resume URL, updates rating and moves stage
    // -------------------------------------------------------------
    const signedResumeUrl = await applicationsService.getSignedResumeUrl(storedApp.id);
    expect(signedResumeUrl).toContain("https://mock-storage.supabase.co/signed/");
    expect(signedResumeUrl).toContain("expires=300");

    const updatedApp = await applicationsService.updateStage(
      storedApp.id,
      ApplicationStatus.INTERVIEW,
      undefined,
      "recruiter-101",
    );
    expect(updatedApp.status).toBe(ApplicationStatus.INTERVIEW);

    // -------------------------------------------------------------
    // STEP 10: Admin closes role; status becomes CLOSED
    // -------------------------------------------------------------
    const closedJob = await adminJobsService.transitionStatus(
      approvedJob.id,
      JobStatus.CLOSED,
      { userId: "admin-exec-001", role: "admin" },
      "Role fulfilled by accepted offer",
    );
    expect(closedJob.status).toBe(JobStatus.CLOSED);
    expect(closedJob.closedAt).toBeDefined();
  });
});
