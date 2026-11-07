import { z } from "zod";
import { defineContract, noParams, noQuery, noBody } from "@/lib/contracts/define";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { AUTH_ERRORS, AUTH_LIMITS } from "@/lib/constants/auth.constants";

export const adminLoginBodySchema = z.strictObject({
  email: z
    .string()
    .trim()
    .min(1, { error: AUTH_ERRORS.EMAIL_REQUIRED })
    .email({ error: AUTH_ERRORS.EMAIL_REQUIRED })
    .max(AUTH_LIMITS.EMAIL_MAX),
  password: z
    .string()
    .min(AUTH_LIMITS.PASSWORD_MIN, { error: AUTH_ERRORS.PASSWORD_REQUIRED })
    .max(AUTH_LIMITS.PASSWORD_MAX),
});

export type AdminLoginBodyInput = z.input<typeof adminLoginBodySchema>;
export type AdminLoginBodyOutput = z.output<typeof adminLoginBodySchema>;

export const authenticatedUserDtoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(["owner", "admin", "editor", "author", "viewer"]),
});

export type AuthenticatedUserDto = z.infer<typeof authenticatedUserDtoSchema>;

export const adminLoginResponseSchema = z.object({
  user: authenticatedUserDtoSchema,
  message: z.string().optional(),
});

export type AdminLoginResponse = z.infer<typeof adminLoginResponseSchema>;

export const adminLoginContract = defineContract({
  method: "POST",
  path: API_ENDPOINTS.ADMIN.AUTH.LOGIN,
  auth: "none",
  params: noParams,
  query: noQuery,
  body: adminLoginBodySchema,
  response: adminLoginResponseSchema,
  status: 200,
});

export const adminLogoutResponseSchema = z.object({
  message: z.string(),
});

export type AdminLogoutResponse = z.infer<typeof adminLogoutResponseSchema>;

export const adminLogoutContract = defineContract({
  method: "POST",
  path: API_ENDPOINTS.ADMIN.AUTH.LOGOUT,
  auth: "none",
  params: noParams,
  query: noQuery,
  body: noBody,
  response: adminLogoutResponseSchema,
  status: 200,
});

