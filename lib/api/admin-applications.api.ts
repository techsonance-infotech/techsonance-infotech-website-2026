import { z } from "zod";
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
import { safeFetch } from "@/lib/http/safeFetch";
import {
  SafeApplicationsListResponseSchema,
  SafeCandidateDetailSchema,
  type SafeCandidateDetail,
} from "@/lib/validations/admin-careers-boundary.schema";

export interface ScreeningAnswerItem {
  question: string;
  answer: string | boolean | number;
  isKnockout?: boolean;
}

export type CandidateApplicationDetail = SafeCandidateDetail;

export interface ListApplicationsResult {
  applications: ApplicationItem[];
  total: number;
}

export interface ListApplicationsFetchOptions {
  signal?: AbortSignal;
}

const SingleAppResponseSchema = z
  .object({
    application: SafeCandidateDetailSchema,
  })
  .or(SafeCandidateDetailSchema);

const ResumeResponseSchema = z.object({
  signedUrl: z.string(),
  fileName: z.string().optional(),
});

/**
 * Lists candidate applications with optional filters.
 * Endpoint: GET /api/admin/careers/applications
 */
export async function listAdminApplications(
  query?: ListApplicationsQueryInput,
  options?: ListApplicationsFetchOptions,
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

  const result = await safeFetch(url, SafeApplicationsListResponseSchema, {
    method: "GET",
    credentials: "include",
    signal: options?.signal,
  });

  return {
    applications: result.applications as unknown as ApplicationItem[],
    total: result.total,
  };
}

/**
 * Retrieves a candidate application by its ID.
 * Endpoint: GET /api/admin/careers/applications/[id]
 */
export async function getAdminApplication(
  id: string,
  signal?: AbortSignal,
): Promise<CandidateApplicationDetail> {
  const url = API_ENDPOINTS.ADMIN.APPLICATION(id);

  const data = await safeFetch(url, SingleAppResponseSchema, {
    method: "GET",
    credentials: "include",
    signal,
  });

  return (data && "application" in data ? data.application : data) as CandidateApplicationDetail;
}

/**
 * Updates candidate application status, notes, rating, or rejection reason.
 * Endpoint: PATCH /api/admin/careers/applications/[id]
 */
export async function updateAdminApplication(
  id: string,
  patch: UpdateApplicationPatchInput,
): Promise<CandidateApplicationDetail> {
  const url = API_ENDPOINTS.ADMIN.APPLICATION(id);

  const data = await safeFetch(url, SingleAppResponseSchema, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(patch),
  });

  return (data && "application" in data ? data.application : data) as CandidateApplicationDetail;
}

/**
 * Retrieves a secure short-lived signed URL to preview candidate resume.
 * Endpoint: GET /api/admin/careers/applications/[id]/resume
 */
export async function getAdminApplicationResume(
  id: string,
): Promise<{ signedUrl: string; fileName?: string }> {
  const url = API_ENDPOINTS.ADMIN.APPLICATION_RESUME(id);

  const data = await safeFetch(url, ResumeResponseSchema, {
    method: "GET",
    credentials: "include",
  });

  return data;
}

/**
 * Returns formatted URL for downloading candidate applications CSV.
 * Endpoint: GET /api/admin/careers/applications/export
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
 */
export async function exportCandidateCompliance(
  email: string,
): Promise<CandidateComplianceExportResponse> {
  const params = new URLSearchParams({ email });
  const url = `${API_ENDPOINTS.ADMIN.COMPLIANCE}?${params.toString()}`;

  const data = await safeFetch(url, z.any(), {
    method: "GET",
    credentials: "include",
  });

  return data as CandidateComplianceExportResponse;
}

/**
 * Permanently purges all candidate data, resumes, and submissions (Right to be Forgotten).
 * Endpoint: POST /api/admin/careers/compliance
 */
export async function purgeCandidateCompliance(
  email: string,
): Promise<CandidateCompliancePurgeResponse> {
  const url = API_ENDPOINTS.ADMIN.COMPLIANCE;

  const data = await safeFetch(url, z.any(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email }),
  });

  return data as CandidateCompliancePurgeResponse;
}

export interface TalentPoolCandidateItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  skills: string[];
  preferredRole?: string | null;
  experienceLevel?: string | null;
  portfolioUrl?: string | null;
  resumeStoragePath?: string | null;
  notes?: string | null;
  consentDate: string;
  createdAt: string;
}

export interface ListTalentPoolResult {
  candidates: TalentPoolCandidateItem[];
  total: number;
}

/**
 * Lists candidates from the talent pool.
 * Endpoint: GET /api/admin/careers/talent-pool
 */
export async function listAdminTalentPool(
  query?: { search?: string; limit?: number; offset?: number },
  options?: { signal?: AbortSignal },
): Promise<ListTalentPoolResult> {
  const params = new URLSearchParams();
  if (query?.search?.trim()) params.set("search", query.search.trim());
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.offset) params.set("offset", String(query.offset));

  const queryStr = params.toString();
  const url = queryStr
    ? `/api/admin/careers/talent-pool?${queryStr}`
    : "/api/admin/careers/talent-pool";

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new Error("Failed to load talent pool");
  }

  const json = await response.json();
  const rawData = json.data || json;
  return {
    candidates: rawData.candidates ?? [],
    total: rawData.total ?? 0,
  };
}
