import { z } from "zod";
import { defineContract, noParams, noQuery, noBody } from "@/lib/contracts/define";
import { createJobSchema } from "@/lib/validations/careers";
import { JobStatus } from "@/lib/database/enum";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";

export const listJobsQuerySchema = z.strictObject({
  status: z.enum(JobStatus).optional(),
  search: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListJobsQueryInput = z.input<typeof listJobsQuerySchema>;

export const createJobResponseSchema = z.object({
  job: z.any(),
});

export const listJobsResponseSchema = z.object({
  jobs: z.array(z.any()),
  total: z.number().int().min(0),
});

export const createJobContract = defineContract({
  method: "POST",
  path: "/api/admin/jobs",
  auth: "required",
  params: noParams,
  query: noQuery,
  body: createJobSchema,
  response: createJobResponseSchema,
  status: 201,
});

export const listJobsContract = defineContract({
  method: "GET",
  path: "/api/admin/jobs",
  auth: "required",
  params: noParams,
  query: listJobsQuerySchema,
  body: noBody,
  response: listJobsResponseSchema,
  status: 200,
});

export const approveJobParamsSchema = z.strictObject({
  id: z.string().uuid("Invalid job ID format"),
});

export type ApproveJobParamsInput = z.input<typeof approveJobParamsSchema>;

export const approveJobBodySchema = z.strictObject({
  comment: z.string().trim().max(1000).optional(),
});

export type ApproveJobBodyInput = z.input<typeof approveJobBodySchema>;

export const approveJobResponseSchema = z.object({
  job: z.any(),
});

export const approveJobContract = defineContract({
  method: "POST",
  path: "/api/admin/careers/jobs/[id]/approve",
  auth: "required",
  params: approveJobParamsSchema,
  query: noQuery,
  body: approveJobBodySchema,
  response: approveJobResponseSchema,
  status: 200,
});

export const returnJobParamsSchema = z.strictObject({
  id: z.string().uuid("Invalid job ID format"),
});

export type ReturnJobParamsInput = z.input<typeof returnJobParamsSchema>;

export const returnJobBodySchema = z.strictObject({
  comment: z
    .string()
    .trim()
    .min(1, CAREER_ERRORS.RETURN_FEEDBACK_REQUIRED)
    .max(2000, "Comment cannot exceed 2000 characters"),
});

export type ReturnJobBodyInput = z.input<typeof returnJobBodySchema>;

export const returnJobResponseSchema = z.object({
  job: z.any(),
});

export const returnJobContract = defineContract({
  method: "POST",
  path: "/api/admin/careers/jobs/[id]/return",
  auth: "required",
  params: returnJobParamsSchema,
  query: noQuery,
  body: returnJobBodySchema,
  response: returnJobResponseSchema,
  status: 200,
});
