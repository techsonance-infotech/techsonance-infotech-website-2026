import { z } from "zod";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import type { Job } from "@/lib/types/careers";
import type { JobFormData } from "@/components/admin/careers/JobEditorForm";
import type { JobStatus } from "@/lib/constants/enums";
import { safeFetch } from "@/lib/http/safeFetch";
import {
  SafeJobsListResponseSchema,
  SafeJobItemSchema,
} from "@/lib/validations/admin-careers-boundary.schema";

export interface UpdateJobStatusPayload {
  targetStatus: JobStatus | string;
  comment?: string;
  closesAt?: string | Date | null;
  publishAt?: string | Date | null;
}

export interface ListAdminJobsParams {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}

export interface ListAdminJobsResponse {
  jobs: Job[];
  total: number;
}

export interface JobSnapshot {
  id?: string;
  versionId?: number;
  title?: string;
  department?: string;
  status?: string;
  approvalStatus?: string;
  responsibilities?: string[];
  [key: string]: unknown;
}

export interface JobVersionItem {
  id: string;
  entityType: string;
  entityId: string;
  snapshot: JobSnapshot;
  changedBy?: string | null;
  createdAt: string | Date;
}

const SingleJobResponseSchema = z
  .object({
    job: z.any(),
  })
  .or(SafeJobItemSchema);

const VersionsResponseSchema = z
  .object({
    versions: z.array(z.any()).catch([]),
  })
  .catch({ versions: [] });

/**
 * Creates a new job posting in draft status.
 * Endpoint: POST /api/admin/jobs
 */
export async function createAdminJob(payload: Partial<JobFormData>): Promise<Job> {
  const url = API_ENDPOINTS.ADMIN.JOBS;

  const data = await safeFetch(url, SingleJobResponseSchema, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return (data && "job" in data ? data.job : data) as unknown as Job;
}

/**
 * Lists job postings with optional status and text search filtering.
 * Endpoint: GET /api/admin/jobs
 */
export async function listAdminJobs(params?: ListAdminJobsParams): Promise<Job[]> {
  const searchParams = new URLSearchParams();

  if (params?.status && params.status !== "ALL") {
    searchParams.set("status", params.status);
  }
  if (params?.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }
  if (params?.limit) {
    searchParams.set("limit", String(params.limit));
  }
  if (params?.offset) {
    searchParams.set("offset", String(params.offset));
  }

  const queryStr = searchParams.toString();
  const url = queryStr ? `${API_ENDPOINTS.ADMIN.JOBS}?${queryStr}` : API_ENDPOINTS.ADMIN.JOBS;

  const result = await safeFetch(url, SafeJobsListResponseSchema, {
    method: "GET",
    credentials: "include",
    signal: params?.signal,
  });

  return result.jobs as unknown as Job[];
}

/**
 * Fetches an existing job posting by its ID.
 * Endpoint: GET /api/admin/jobs/[id]
 */
export async function getAdminJob(id: string, signal?: AbortSignal): Promise<Job> {
  const url = API_ENDPOINTS.ADMIN.JOB(id);

  const data = await safeFetch(url, SingleJobResponseSchema, {
    method: "GET",
    credentials: "include",
    signal,
  });

  return (data && "job" in data ? data.job : data) as unknown as Job;
}

/**
 * Updates an existing job posting.
 * Endpoint: PATCH /api/admin/jobs/[id]
 */
export async function updateAdminJob(id: string, payload: Partial<JobFormData>): Promise<Job> {
  const url = API_ENDPOINTS.ADMIN.JOB(id);

  const data = await safeFetch(url, SingleJobResponseSchema, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return (data && "job" in data ? data.job : data) as unknown as Job;
}

/**
 * Permanently deletes a job posting.
 * Endpoint: DELETE /api/admin/jobs/[id]
 */
export async function deleteAdminJob(id: string): Promise<boolean> {
  const url = API_ENDPOINTS.ADMIN.JOB(id);

  await safeFetch(url, z.any(), {
    method: "DELETE",
    credentials: "include",
  });

  return true;
}

/**
 * Executes a lifecycle state transition on a job requisition.
 * Endpoint: POST /api/admin/jobs/[id]/status
 */
export async function updateAdminJobStatus(
  id: string,
  payload: UpdateJobStatusPayload,
): Promise<Job> {
  const url = API_ENDPOINTS.ADMIN.JOB_STATUS(id);

  const data = await safeFetch(url, SingleJobResponseSchema, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return (data && "job" in data ? data.job : data) as unknown as Job;
}

/**
 * Approves a job requisition moving it to PUBLISHED or SCHEDULED.
 * Endpoint: POST /api/admin/careers/jobs/[id]/approve
 */
export async function approveAdminJob(id: string, comment?: string): Promise<Job> {
  const url = API_ENDPOINTS.ADMIN.CAREER_JOB_APPROVE(id);

  const data = await safeFetch(url, SingleJobResponseSchema, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(comment ? { comment } : {}),
  });

  return (data && "job" in data ? data.job : data) as unknown as Job;
}

/**
 * Returns a job requisition to draft with reviewer feedback.
 * Endpoint: POST /api/admin/careers/jobs/[id]/return
 */
export async function returnAdminJob(id: string, comment: string): Promise<Job> {
  const url = API_ENDPOINTS.ADMIN.CAREER_JOB_RETURN(id);

  const data = await safeFetch(url, SingleJobResponseSchema, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ comment }),
  });

  return (data && "job" in data ? data.job : data) as unknown as Job;
}

/**
 * Retrieves the version snapshot history for a job requisition.
 * Endpoint: GET /api/admin/careers/jobs/[id]/versions
 */
export async function listAdminJobVersions(
  id: string,
  signal?: AbortSignal,
): Promise<JobVersionItem[]> {
  const url = API_ENDPOINTS.ADMIN.CAREER_JOB_VERSIONS(id);

  const data = await safeFetch(url, VersionsResponseSchema, {
    method: "GET",
    credentials: "include",
    signal,
  });

  return (data?.versions || []) as unknown as JobVersionItem[];
}

/**
 * Restores a specific historical version snapshot for a job requisition.
 * Endpoint: POST /api/admin/careers/jobs/[id]/versions
 */
export async function restoreAdminJobVersion(id: string, versionId: string): Promise<Job> {
  const url = API_ENDPOINTS.ADMIN.CAREER_JOB_VERSIONS(id);

  const data = await safeFetch(url, SingleJobResponseSchema, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ versionId }),
  });

  return (data && "job" in data ? data.job : data) as unknown as Job;
}

/**
 * Maps a database/API Job row (with potential null values) to clean JobFormData for React Hook Form.
 */
export function toJobFormData(job: Partial<Job>): JobFormData {
  return {
    id: job.id,
    siteId: job.siteId,
    title: job.title || "",
    slug: job.slug || "",
    referenceCode: job.referenceCode ?? undefined,
    department: job.department || "Engineering",
    openingsCount: job.openingsCount ?? 1,
    summary: job.summary ?? undefined,
    workMode: job.workMode || "hybrid",
    location: job.location || "Bhubaneswar, India",
    remoteEligibility: job.remoteEligibility ?? undefined,
    visaSupport: job.visaSupport || "no",
    type: job.type || "Full Time",
    experienceLevel: job.experienceLevel || "Mid-Senior",
    description: job.description || "",
    responsibilities: job.responsibilities || [],
    requirements: job.requirements || [],
    preferredQualifications: job.preferredQualifications ?? [],
    skills: job.skills || [],
    benefits: job.benefits || [],
    aboutTeam: job.aboutTeam ?? undefined,
    hiringProcess: job.hiringProcess ?? undefined,
    equalOpportunityStatement: job.equalOpportunityStatement ?? undefined,
    salaryCurrency: job.salaryCurrency || "INR",
    salaryPeriod: job.salaryPeriod || "year",
    showSalaryPublicly: job.showSalaryPublicly ?? false,
    salaryMin: job.salaryMin ?? undefined,
    salaryMax: job.salaryMax ?? undefined,
    compensationNotes: job.compensationNotes ?? undefined,
    applicationMethod: job.applicationMethod || "builtin",
    externalApplyUrl: job.externalApplyUrl ?? undefined,
    resumeRequired: job.resumeRequired ?? true,
    coverLetterRequirement: job.coverLetterRequirement || "optional",
    screeningQuestions: job.screeningQuestions ?? [],
    status: job.status || "DRAFT",
    approvalStatus: job.approvalStatus || "DRAFT",
    approvalComment: job.approvalComment ?? undefined,
    publishAt: job.publishAt,
    closesAt: job.closesAt,
    visibility: job.visibility || "public",
    featured: job.featured ?? false,
    seoTitle: job.seoTitle ?? undefined,
    seoDescription: job.seoDescription ?? undefined,
    ogImage: job.ogImage ?? undefined,
  };
}
