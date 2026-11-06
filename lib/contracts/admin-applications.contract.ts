import { z } from "zod";
import { defineContract, noParams, noQuery, noBody } from "@/lib/contracts/define";
import { ApplicationStatus } from "@/lib/constants/enums/content.enum";

export const listApplicationsQuerySchema = z.strictObject({
  jobId: z.string().uuid().optional(),
  status: z.enum(ApplicationStatus).optional(),
  search: z.string().trim().max(100).optional(),
  knockoutTriggered: z.preprocess((val) => {
    if (val === "true" || val === true) return true;
    if (val === "false" || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListApplicationsQueryInput = z.input<typeof listApplicationsQuerySchema>;

export const updateApplicationPatchSchema = z.strictObject({
  status: z.enum(ApplicationStatus).optional(),
  rejectionReason: z.string().trim().max(500).optional(),
  internalNotes: z.string().trim().max(5000).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

export type UpdateApplicationPatchInput = z.input<typeof updateApplicationPatchSchema>;

export const listApplicationsResponseSchema = z.object({
  applications: z.array(z.any()),
  total: z.number().int().min(0),
});

export const singleApplicationResponseSchema = z.object({
  application: z.any(),
});

export const listApplicationsContract = defineContract({
  method: "GET",
  path: "/api/admin/careers/applications",
  auth: "required",
  params: noParams,
  query: listApplicationsQuerySchema,
  body: noBody,
  response: listApplicationsResponseSchema,
  status: 200,
});

export const getApplicationByIdContract = defineContract({
  method: "GET",
  path: "/api/admin/careers/applications",
  auth: "required",
  params: z.strictObject({ id: z.string().uuid() }),
  query: noQuery,
  body: noBody,
  response: singleApplicationResponseSchema,
  status: 200,
});

export const updateApplicationContract = defineContract({
  method: "PATCH",
  path: "/api/admin/careers/applications",
  auth: "required",
  params: z.strictObject({ id: z.string().uuid() }),
  query: noQuery,
  body: updateApplicationPatchSchema,
  response: singleApplicationResponseSchema,
  status: 200,
});
