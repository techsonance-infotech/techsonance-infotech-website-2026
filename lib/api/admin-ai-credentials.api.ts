import {
  type AddCredentialInput,
  type ReplaceCredentialInput,
  type KillSwitchInput,
} from "@/lib/validations/ai-credential.schema";
import {
  type CredentialViewDto,
} from "@/lib/contracts/admin-ai-credentials.contract";

export async function listAdminAiCredentials(
  provider?: string,
): Promise<CredentialViewDto[]> {
  const query = provider ? `?provider=${encodeURIComponent(provider)}` : "";
  const res = await fetch(`/api/admin/ai/credentials${query}`, {
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
  const res = await fetch("/api/admin/ai/credentials", {
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
  const res = await fetch("/api/admin/ai/credentials/replace", {
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

export async function killSwitchAdminAiCredential(
  input: KillSwitchInput,
): Promise<void> {
  const res = await fetch("/api/admin/ai/credentials/kill", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error?.message || "Failed to activate kill switch");
  }
}
