import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import type {
  ListApplicationsQueryInput,
  UpdateApplicationPatchInput,
} from "@/lib/contracts/admin-applications.contract";
import type {
  CandidateComplianceExportResponse,
  CandidateCompliancePurgeResponse,
} from "@/lib/contracts/admin-careers-compliance.contract";
import type { ApplicationItem } from "@/components/admin/careers/ApplicationsTable";

export interface ScreeningAnswerItem {
  question: string;
  answer: string | boolean | number;
  isKnockout?: boolean;
}

export interface CandidateApplicationDetail extends ApplicationItem {
  jobId?: string;
  currentLocation?: string | null;
  noticePeriodWeeks?: number | null;
  resumeFileName?: string | null;
  resumeUrl?: string | null;
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  coverLetter?: string | null;
  screeningAnswers?: ScreeningAnswerItem[] | null;
  rejectionReason?: string | null;
  internalNotes?: string | null;
  updatedAt?: string | Date;
}

export interface ListApplicationsResult {
  applications: ApplicationItem[];
  total: number;
}

/**
 * Lists candidate applications with optional filters.
 * Endpoint: GET /api/admin/careers/applications
 * Contract: listApplicationsContract
 */
export async function listAdminApplications(
  query?: ListApplicationsQueryInput,
): Promise<ListApplicationsResult> {
  const params = new URLSearchParams();

  if (query?.jobId) params.set("jobId", query.jobId);
  if (query?.status) params.set("status", query.status);
  if (query?.search?.trim()) params.set("search", query.search.trim());
  if (query?.knockoutTriggered !== undefined) {
    params.set("knockoutTriggered", String(query.knockoutTriggered));
  }
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.offset) params.set("offset", String(query.offset));

  const queryStr = params.toString();
  const url = queryStr
    ? `${API_ENDPOINTS.ADMIN.APPLICATIONS}?${queryStr}`
    : API_ENDPOINTS.ADMIN.APPLICATIONS;

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
        : resJson.error?.message || resJson.message || "Failed to load candidate applications.";
    throw new Error(errorMsg);
  }

  const applications = resJson.data?.applications || resJson.applications || [];
  const total = resJson.data?.total ?? resJson.total ?? applications.length;

  return { applications, total };
}

/**
 * Retrieves a candidate application by its ID.
 * Endpoint: GET /api/admin/careers/applications/[id]
 * Contract: getApplicationByIdContract
 */
export async function getAdminApplication(id: string): Promise<CandidateApplicationDetail> {
  const url = API_ENDPOINTS.ADMIN.APPLICATION(id);

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
        : resJson.error?.message || resJson.message || "Failed to load application details.";
    throw new Error(errorMsg);
  }

  return resJson.data?.application || resJson.application;
}

/**
 * Updates candidate application status, notes, rating, or rejection reason.
 * Endpoint: PATCH /api/admin/careers/applications/[id]
 * Contract: updateApplicationContract
 */
export async function updateAdminApplication(
  id: string,
  patch: UpdateApplicationPatchInput,
): Promise<CandidateApplicationDetail> {
  const url = API_ENDPOINTS.ADMIN.APPLICATION(id);

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(patch),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to update candidate application.";
    throw new Error(errorMsg);
  }

  return resJson.data?.application || resJson.application;
}

/**
 * Retrieves a secure short-lived signed URL to preview candidate resume.
 * Endpoint: GET /api/admin/careers/applications/[id]/resume
 * Contract: getApplicationResumeContract
 */
export async function getAdminApplicationResume(
  id: string,
): Promise<{ signedUrl: string; fileName?: string }> {
  const url = API_ENDPOINTS.ADMIN.APPLICATION_RESUME(id);

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
        : resJson.error?.message || resJson.message || "Failed to retrieve resume link.";
    throw new Error(errorMsg);
  }

  return {
    signedUrl: resJson.data?.signedUrl || resJson.signedUrl,
    fileName: resJson.data?.fileName || resJson.fileName,
  };
}

/**
 * Returns formatted URL for downloading candidate applications CSV.
 * Endpoint: GET /api/admin/careers/applications/export
 * Contract: exportApplicationsContract
 */
export function getAdminApplicationsExportUrl(jobId?: string): string {
  const params = new URLSearchParams();
  if (jobId) params.set("jobId", jobId);
  const queryStr = params.toString();
  return queryStr
    ? `${API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT}?${queryStr}`
    : API_ENDPOINTS.ADMIN.APPLICATIONS_EXPORT;
}

/**
 * Exports GDPR/EEOC compliance data bundle for a specific candidate email.
 * Endpoint: GET /api/admin/careers/compliance?email=...
 * Contract: exportCandidateDataContract
 */
export async function exportCandidateCompliance(
  email: string,
): Promise<CandidateComplianceExportResponse> {
  const params = new URLSearchParams({ email });
  const url = `${API_ENDPOINTS.ADMIN.COMPLIANCE}?${params.toString()}`;

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
        : resJson.error?.message ||
          resJson.message ||
          "Failed to export candidate compliance data.";
    throw new Error(errorMsg);
  }

  return resJson.data || resJson;
}

/**
 * Permanently purges all candidate data, resumes, and submissions (Right to be Forgotten).
 * Endpoint: POST /api/admin/careers/compliance
 * Contract: purgeCandidateDataContract
 */
export async function purgeCandidateCompliance(
  email: string,
): Promise<CandidateCompliancePurgeResponse> {
  const url = API_ENDPOINTS.ADMIN.COMPLIANCE;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email }),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to purge candidate data.";
    throw new Error(errorMsg);
  }

  return resJson.data || resJson;
}
