import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import type {
  AdminLoginBodyInput,
  AdminLoginResponse,
  AdminLogoutResponse,
} from "@/lib/contracts/admin-auth.contract";
import type {
  AdminRevalidateBodyInput,
  AdminRevalidateResponse,
} from "@/lib/contracts/admin-revalidate.contract";
import { safeFetch } from "@/lib/http/safeFetch";
import {
  safeAdminLoginResponseSchema,
  safeAdminLogoutResponseSchema,
  safeAdminRevalidateResponseSchema,
} from "@/lib/validations/admin-login-boundary.schema";

export interface AdminGovernanceRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

/**
 * Authenticates an admin and issues an HTTP-only session cookie.
 * Endpoint: POST /api/admin/auth/login
 * Contract: adminLoginContract
 */
export async function loginAdmin(
  payload: AdminLoginBodyInput,
  options: AdminGovernanceRequestOptions = {},
): Promise<AdminLoginResponse> {
  const url = API_ENDPOINTS.ADMIN.AUTH.LOGIN;

  return safeFetch(url, safeAdminLoginResponseSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
    signal: options.signal,
    timeoutMs: options.timeoutMs ?? 10_000,
  });
}

/**
 * Revokes current administrative session.
 * Endpoint: POST /api/admin/auth/logout
 * Contract: adminLogoutContract
 */
export async function logoutAdmin(
  options: AdminGovernanceRequestOptions = {},
): Promise<AdminLogoutResponse> {
  const url = API_ENDPOINTS.ADMIN.AUTH.LOGOUT;

  return safeFetch(url, safeAdminLogoutResponseSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    signal: options.signal,
    timeoutMs: options.timeoutMs ?? 10_000,
  });
}

/**
 * Triggers on-demand CDN edge and ISR cache revalidation by tags or routes.
 * Endpoint: POST /api/admin/revalidate
 * Contract: adminRevalidateContract
 */
export async function revalidateAdminCache(
  payload: AdminRevalidateBodyInput,
  options: AdminGovernanceRequestOptions = {},
): Promise<AdminRevalidateResponse> {
  const url = API_ENDPOINTS.ADMIN.REVALIDATE;

  return safeFetch(url, safeAdminRevalidateResponseSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
    signal: options.signal,
    timeoutMs: options.timeoutMs ?? 10_000,
  });
}
