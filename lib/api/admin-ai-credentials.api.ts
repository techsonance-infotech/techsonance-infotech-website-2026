import {
  type AddCredentialInput,
  type ReplaceCredentialInput,
  type KillSwitchInput,
  type UpdateCredentialModelInput,
} from "@/lib/validations/ai-credential.schema";
import { type CredentialViewDto } from "@/lib/contracts/admin-ai-credentials.contract";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

export async function listAdminAiCredentials(provider?: string): Promise<CredentialViewDto[]> {
  const query = provider ? `?provider=${encodeURIComponent(provider)}` : "";
  const res = await fetch(`${API_ENDPOINTS.ADMIN.AI.CREDENTIALS}${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error?.message || "Failed to fetch AI credentials");
  }

  return json.data.credentials;
}

export async function createAdminAiCredential(
  input: AddCredentialInput,
): Promise<CredentialViewDto> {
  const res = await fetch(API_ENDPOINTS.ADMIN.AI.CREDENTIALS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error?.message || "Failed to register AI credential");
  }

  return json.data.credential;
}

export async function replaceAdminAiCredential(
  input: ReplaceCredentialInput,
): Promise<CredentialViewDto> {
  const res = await fetch(API_ENDPOINTS.ADMIN.AI.CREDENTIALS_REPLACE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error?.message || "Failed to replace AI credential");
  }

  return json.data.credential;
}

export async function killSwitchAdminAiCredential(input: KillSwitchInput): Promise<void> {
  const res = await fetch(API_ENDPOINTS.ADMIN.AI.CREDENTIALS_KILL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error?.message || "Failed to activate kill switch");
  }
}

export async function reactivateAdminAiCredential(
  credentialId: string,
): Promise<CredentialViewDto> {
  const res = await fetch(API_ENDPOINTS.ADMIN.AI.CREDENTIALS_REACTIVATE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credentialId }),
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error?.message || "Failed to reactivate credential");
  }

  return json.data.credential;
}

export async function updateAdminAiCredentialModel(
  input: UpdateCredentialModelInput,
): Promise<CredentialViewDto> {
  const res = await fetch(API_ENDPOINTS.ADMIN.AI.CREDENTIALS_MODEL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error?.message || "Failed to update credential model");
  }

  return json.data.credential;
}
