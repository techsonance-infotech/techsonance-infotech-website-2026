import { z } from "zod";
import { defineContract, noParams, noQuery } from "@/lib/contracts/define";

export const careerApplyResponseSchema = z.object({
  applicationId: z.string().min(1),
  status: z.string().min(1),
});

export type CareerApplyResponseDto = z.infer<typeof careerApplyResponseSchema>;

export const careerApplyContract = defineContract({
  method: "POST",
  path: "/api/careers/apply",
  auth: "none",
  params: noParams,
  query: noQuery,
  body: z.any(), // Multipart FormData upload
  response: careerApplyResponseSchema,
  status: 200,
});
