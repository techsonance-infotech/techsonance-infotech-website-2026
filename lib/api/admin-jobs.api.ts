import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import type { Job } from "@/lib/types/careers";
import type { JobFormData } from "@/components/admin/careers/JobEditorForm";
import type { JobStatus } from "@/lib/constants/enums";

export interface UpdateJobStatusPayload {
  targetStatus: JobStatus | string;
  comment?: string;
}

export interface ListAdminJobsParams {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
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

/**
 * Creates a new job posting in draft status.
 * Endpoint: POST /api/admin/jobs
 * Contract: createJobContract
 */
export async function createAdminJob(payload: Partial<JobFormData>): Promise<Job> {
  const url = API_ENDPOINTS.ADMIN.JOBS;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || "Failed to create position.";
    throw new Error(errorMsg);
  }

  return resJson.data?.job || resJson.job;
}

/**
 * Lists job postings with optional status and text search filtering.
 * Endpoint: GET /api/admin/jobs
 * Contract: listJobsContract
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

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || "Failed to load positions.";
    throw new Error(errorMsg);
  }

  return resJson.data?.jobs || resJson.jobs || [];
}

/**
 * Fetches an existing job posting by its ID.
 * Endpoint: GET /api/admin/jobs/[id]
 */
export async function getAdminJob(id: string): Promise<Job> {
  const url = API_ENDPOINTS.ADMIN.JOB(id);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || "Failed to load position.";
    throw new Error(errorMsg);
  }

  return resJson.data?.job || resJson.job;
}

/**
 * Updates an existing job posting.
 * Endpoint: PATCH /api/admin/jobs/[id]
 */
export async function updateAdminJob(id: string, payload: Partial<JobFormData>): Promise<Job> {
  const url = API_ENDPOINTS.ADMIN.JOB(id);

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || "Failed to save changes.";
    throw new Error(errorMsg);
  }

  return resJson.data?.job || resJson.job;
}

/**
 * Permanently deletes a job posting.
 * Endpoint: DELETE /api/admin/jobs/[id]
 */
export async function deleteAdminJob(id: string): Promise<boolean> {
  const url = API_ENDPOINTS.ADMIN.JOB(id);

  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
  });

  const resJson = await response.json().catch(() => ({ ok: response.ok }));

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || "Failed to delete position.";
    throw new Error(errorMsg);
  }

  return true;
}

/**
 * Executes a lifecycle state transition on a job requisition.
 * Endpoint: POST /api/admin/jobs/[id]/status
 * Contract: transitionJobStatusContract
 */
export async function updateAdminJobStatus(
  id: string,
  payload: UpdateJobStatusPayload,
): Promise<Job> {
  const url = API_ENDPOINTS.ADMIN.JOB_STATUS(id);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to update job status.";
    throw new Error(errorMsg);
  }

  return resJson.data?.job || resJson.job;
}

/**
 * Approves a job requisition moving it to PUBLISHED or SCHEDULED.
 * Endpoint: POST /api/admin/careers/jobs/[id]/approve
 * Contract: approveJobContract
 */
export async function approveAdminJob(id: string, comment?: string): Promise<Job> {
  const url = API_ENDPOINTS.ADMIN.CAREER_JOB_APPROVE(id);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(comment ? { comment } : {}),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to approve job requisition.";
    throw new Error(errorMsg);
  }

  return resJson.data?.job || resJson.job;
}

/**
 * Returns a job requisition to draft with reviewer feedback.
 * Endpoint: POST /api/admin/careers/jobs/[id]/return
 * Contract: returnJobContract
 */
export async function returnAdminJob(id: string, comment: string): Promise<Job> {
  const url = API_ENDPOINTS.ADMIN.CAREER_JOB_RETURN(id);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ comment }),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to return job requisition.";
    throw new Error(errorMsg);
  }

  return resJson.data?.job || resJson.job;
}

/**
 * Retrieves the version snapshot history for a job requisition.
 * Endpoint: GET /api/admin/careers/jobs/[id]/versions
 * Contract: listJobVersionsContract
 */
export async function listAdminJobVersions(id: string): Promise<JobVersionItem[]> {
  const url = API_ENDPOINTS.ADMIN.CAREER_JOB_VERSIONS(id);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to load version history.";
    throw new Error(errorMsg);
  }

  return resJson.data?.versions || resJson.versions || [];
}

/**
 * Restores a specific historical version snapshot for a job requisition.
 * Endpoint: POST /api/admin/careers/jobs/[id]/versions
 * Contract: restoreJobVersionContract
 */
export async function restoreAdminJobVersion(id: string, versionId: string): Promise<Job> {
  const url = API_ENDPOINTS.ADMIN.CAREER_JOB_VERSIONS(id);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ versionId }),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to restore version snapshot.";
    throw new Error(errorMsg);
  }

  return resJson.data?.job || resJson.job;
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
