import { z } from "zod";
import { AdminRole } from "@/lib/constants/enums";

/**
 * Defensive boundary schema for authenticated user object.
 * Catches malformed or missing fields and replaces with safe fallbacks.
 */
export const safeAuthenticatedUserDtoSchema = z
  .object({
    id: z.string().catch(""),
    email: z.string().email().catch("admin@techsonance.co.in"),
    name: z.string().catch("Admin"),
    role: z.enum(AdminRole).catch(AdminRole.VIEWER),
  })
  .loose();

/**
 * Defensive boundary schema for admin login response payload.
 */
export const safeAdminLoginResponseSchema = z
  .object({
    user: safeAuthenticatedUserDtoSchema,
    message: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined),
  })
  .loose();

/**
 * Defensive boundary schema for admin logout response payload.
 */
export const safeAdminLogoutResponseSchema = z
  .object({
    message: z.string().catch("Signed out successfully"),
  })
  .loose();

/**
 * Defensive boundary schema for admin cache revalidation response payload.
 */
export const safeAdminRevalidateResponseSchema = z
  .object({
    revalidatedTags: z.array(z.string()).catch([]),
    revalidatedPaths: z.array(z.string()).catch([]),
    timestamp: z.string().catch(() => new Date().toISOString()),
    message: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined),
  })
  .loose();

export type SafeAuthenticatedUserDto = z.infer<typeof safeAuthenticatedUserDtoSchema>;
export type SafeAdminLoginResponse = z.infer<typeof safeAdminLoginResponseSchema>;
export type SafeAdminLogoutResponse = z.infer<typeof safeAdminLogoutResponseSchema>;
export type SafeAdminRevalidateResponse = z.infer<typeof safeAdminRevalidateResponseSchema>;
