import { z } from "zod";
import { defineContract, noParams, noQuery } from "@/lib/contracts/define";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";

// ─── Query Schema for Export (GET) ──────────────────────────────────────────

export const exportCandidateDataQuerySchema = z.strictObject({
  email: z
    .string()
    .trim()
    .min(1, { error: CAREER_ERRORS.CANDIDATE_EMAIL_REQUIRED })
    .email({ error: "Invalid candidate email format" }),
});

export type ExportCandidateDataQueryInput = z.input<typeof exportCandidateDataQuerySchema>;
export type ExportCandidateDataQueryOutput = z.output<typeof exportCandidateDataQuerySchema>;

// ─── Body Schema for Purge (POST) ───────────────────────────────────────────

export const purgeCandidateDataBodySchema = z.strictObject({
  email: z
    .string()
    .trim()
    .min(1, { error: CAREER_ERRORS.CANDIDATE_EMAIL_REQUIRED_GDPR })
    .email({ error: "Invalid candidate email format" }),
});

export type PurgeCandidateDataBodyInput = z.input<typeof purgeCandidateDataBodySchema>;
export type PurgeCandidateDataBodyOutput = z.output<typeof purgeCandidateDataBodySchema>;

// ─── Response Schemas ───────────────────────────────────────────────────────

export const candidateComplianceExportResponseSchema = z.object({
  email: z.string().email(),
  exportedAt: z.any(),
  applications: z.array(z.any()),
  talentPoolSubmissions: z.array(z.any()),
});

export type CandidateComplianceExportResponse = z.infer<
  typeof candidateComplianceExportResponseSchema
>;

export const candidateCompliancePurgeResponseSchema = z.object({
  success: z.boolean(),
  email: z.string().email(),
  deletedApplicationsCount: z.number().int().min(0),
  deletedTalentPoolCount: z.number().int().min(0),
  deletedFilesCount: z.number().int().min(0),
  message: z.string().optional(),
});

export type CandidateCompliancePurgeResponse = z.infer<
  typeof candidateCompliancePurgeResponseSchema
>;

// ─── Contracts ──────────────────────────────────────────────────────────────

export const exportCandidateDataContract = defineContract({
  method: "GET",
  path: API_ENDPOINTS.ADMIN.COMPLIANCE,
  auth: "required",
  params: noParams,
  query: exportCandidateDataQuerySchema,
  body: z.undefined(),
  response: candidateComplianceExportResponseSchema,
  status: 200,
});

export const purgeCandidateDataContract = defineContract({
  method: "POST",
  path: API_ENDPOINTS.ADMIN.COMPLIANCE,
  auth: "required",
  params: noParams,
  query: noQuery,
  body: purgeCandidateDataBodySchema,
  response: candidateCompliancePurgeResponseSchema,
  status: 200,
});
