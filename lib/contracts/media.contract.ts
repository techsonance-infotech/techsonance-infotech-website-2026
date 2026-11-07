import { z } from "zod";
import { defineContract, noParams, noQuery } from "@/lib/contracts/define";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

export const uploadMediaResponseSchema = z.object({
  secureUrl: z.string().url(),
  publicId: z.string(),
  format: z.string().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  bytes: z.number().int().optional(),
});

export type UploadMediaResponse = z.infer<typeof uploadMediaResponseSchema>;

export const uploadMediaContract = defineContract({
  method: "POST",
  path: API_ENDPOINTS.ADMIN.MEDIA_UPLOAD,
  auth: "required",
  params: noParams,
  query: noQuery,
  body: z.any(), // Multipart FormData payload
  response: uploadMediaResponseSchema,
  status: 201,
});
