import type {
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
} from "@/lib/constants/enums";

export interface Job {
  id: string;
  siteId: string;
  slug: string;
  title: string;
  referenceCode?: string | null;
  department: string;
  openingsCount: number;
  ownerId?: string | null;
  hiringManagerId?: string | null;
  summary?: string | null;
  description: string;
  workMode: JobWorkMode;
  location: string;
  remoteEligibility?: string | null;
  visaSupport: JobVisaSupport;
  type: JobType;
  experienceLevel: JobExperienceLevel;
  responsibilities: string[];
  requirements: string[];
  preferredQualifications?: string[] | null;
  skills: string[];
  benefits: string[];
  aboutTeam?: string | null;
  hiringProcess?: Array<{ step: string; title: string; desc?: string }> | null;
  equalOpportunityStatement?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency: string;
  salaryPeriod: JobSalaryPeriod;
  showSalaryPublicly: boolean;
  compensationNotes?: string | null;
  applicationMethod: JobApplicationMethod;
  externalApplyUrl?: string | null;
  resumeRequired: boolean;
  coverLetterRequirement: JobCoverLetterRequirement;
  screeningQuestions?: any[] | null;
  status: JobStatus;
  approvalStatus: JobApprovalStatus;
  approvalComment?: string | null;
  publishAt?: Date | string | null;
  closesAt?: Date | string | null;
  visibility: JobVisibility;
  featured: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImage?: string | null;
  versionId: number;
  viewCount: number;
  applyCount: number;
  publishedAt?: Date | string | null;
  closedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Application {
  id: string;
  siteId: string;
  jobId: string;
  name: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  headline?: string | null;
  summary?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  resumeStoragePath: string;
  resumeFileName: string;
  coverLetter?: string | null;
  screeningAnswers?: any[] | null;
  knockoutTriggered: boolean;
  source: string;
  status: ApplicationStatus;
  rejectionReason?: string | null;
  internalNotes?: string | null;
  rating?: number | null;
  privacyConsentDate: Date | string;
  privacyNoticeVersion: string;
  talentPoolConsent: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}
