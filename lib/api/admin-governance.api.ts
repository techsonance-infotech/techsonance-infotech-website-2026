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

/**
 * Authenticates an admin and issues an HTTP-only session cookie.
 * Endpoint: POST /api/admin/auth/login
 * Contract: adminLoginContract
 */
export async function loginAdmin(payload: AdminLoginBodyInput): Promise<AdminLoginResponse> {
  const url = API_ENDPOINTS.ADMIN.AUTH.LOGIN;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to sign in.";
    throw new Error(errorMsg);
  }

  return resJson.data || resJson;
}

/**
 * Revokes current administrative session.
 * Endpoint: POST /api/admin/auth/logout
 * Contract: adminLogoutContract
 */
export async function logoutAdmin(): Promise<AdminLogoutResponse> {
  const url = API_ENDPOINTS.ADMIN.AUTH.LOGOUT;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  const resJson = await response.json().catch(() => ({ ok: response.ok }));

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to sign out.";
    throw new Error(errorMsg);
  }

  return resJson.data || resJson;
}

/**
 * Triggers on-demand CDN edge and ISR cache revalidation by tags or routes.
 * Endpoint: POST /api/admin/revalidate
 * Contract: adminRevalidateContract
 */
export async function revalidateAdminCache(
  payload: AdminRevalidateBodyInput,
): Promise<AdminRevalidateResponse> {
  const url = API_ENDPOINTS.ADMIN.REVALIDATE;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.ok) {
    const errorMsg =
      typeof resJson.error === "string"
        ? resJson.error
        : resJson.error?.message || resJson.message || "Failed to revalidate cache.";
    throw new Error(errorMsg);
  }

  return resJson.data || resJson;
}
