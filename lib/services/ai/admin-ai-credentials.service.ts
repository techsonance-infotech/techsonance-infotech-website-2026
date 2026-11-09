import "server-only";
import { randomUUID } from "node:crypto";
import { inject } from "@needle-di/core";
import { AiCredentialsRepository } from "@/lib/repositories/ai-credentials.repository";
import { seal, fingerprint } from "@/lib/crypto/vault";
import {
  type AddCredentialInput,
  type ReplaceCredentialInput,
  type KillSwitchInput,
} from "@/lib/validations/ai-credential.schema";
import {
  type CredentialViewDto,
} from "@/lib/contracts/admin-ai-credentials.contract";
import type { AiCredential } from "@/lib/database/schema/index.schema";
import { AiCredentialStatus } from "@/lib/constants/enums/ai.enum";
import { AppError, ErrorCode } from "@/lib/errors";

export class AdminAiCredentialsService {
  constructor(
    private repo: AiCredentialsRepository = inject(AiCredentialsRepository),
  ) {}

  /**
   * Transforms database row into safe admin view DTO (zero keys or ciphertext exposed).
   */
  private toDto(row: AiCredential): CredentialViewDto {
    return {
      id: row.id,
      accountId: row.accountId ?? null,
      provider: row.provider,
      label: row.label,
      last4: row.last4,
      keyVersion: row.keyVersion,
      status: row.status,
      priority: row.priority,
      dailyBudgetUsd: row.dailyBudgetUsd ?? null,
      spentTodayUsd: row.spentTodayUsd ?? "0",
      cooldownUntil: row.cooldownUntil ? row.cooldownUntil.toISOString() : null,
      lastErrorKind: row.lastErrorKind ?? null,
      lastUsedAt: row.lastUsedAt ? row.lastUsedAt.toISOString() : null,
      isCanary: row.isCanary,
      createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Lists registered credentials with administrative metadata.
   */
  async listCredentials(provider?: string): Promise<CredentialViewDto[]> {
    const rows = await this.repo.listCredentials(provider);
    return rows.map((r) => this.toDto(r));
  }

  /**
   * Registers and encrypts a new provider API key in the vault.
   */
  async addCredential(
    input: AddCredentialInput,
    actorId: string,
    requestId?: string,
  ): Promise<CredentialViewDto> {
    const fp = fingerprint(input.apiKey);

    // 1. Prevent duplicate key registration
    const existing = await this.repo.findByFingerprint(fp);
    if (existing) {
      throw new AppError(
        ErrorCode.CONFLICT,
        "This API key has already been registered in the system.",
      );
    }

    // 2. Generate UUID and seal with AAD bound to row ID and provider slug
    const credId = randomUUID();
    const aad = `${credId}:${input.provider}`;
    const sealed = seal(input.apiKey, aad);
    const last4 = input.apiKey.slice(-4);

    // 3. Store encrypted record in database
    const created = await this.repo.createCredential({
      id: credId,
      accountId: input.accountId ?? null,
      provider: input.provider,
      label: input.label,
      ciphertext: sealed.ciphertext,
      iv: sealed.iv,
      authTag: sealed.authTag,
      keyVersion: sealed.keyVersion,
      fingerprint: fp,
      last4,
      status: AiCredentialStatus.ACTIVE,
      priority: typeof input.priority === "number" ? input.priority : 100,
      dailyBudgetUsd:
        typeof input.dailyBudgetUsd === "number"
          ? input.dailyBudgetUsd.toFixed(2)
          : null,
      createdBy: actorId ? actorId : null,
    });

    // 4. Record audit event
    await this.repo.recordEvent(
      created.id,
      "created",
      actorId,
      { label: input.label, provider: input.provider },
      requestId,
    );

    return this.toDto(created);
  }

  /**
   * Replaces an existing key with zero downtime (creates new key, marks old disabled/rotated).
   */
  async replaceCredential(
    input: ReplaceCredentialInput,
    actorId: string,
    requestId?: string,
  ): Promise<CredentialViewDto> {
    const oldCred = await this.repo.findCredentialById(input.credentialId);
    if (!oldCred) {
      throw new AppError(ErrorCode.NOT_FOUND, "Target credential not found.");
    }

    const fp = fingerprint(input.newApiKey);
    const existing = await this.repo.findByFingerprint(fp);
    if (existing && existing.id !== oldCred.id) {
      throw new AppError(
        ErrorCode.CONFLICT,
        "The replacement API key is already registered in another record.",
      );
    }

    const newCredId = randomUUID();
    const aad = `${newCredId}:${oldCred.provider}`;
    const sealed = seal(input.newApiKey, aad);
    const last4 = input.newApiKey.slice(-4);

    // 1. Insert new active credential inheriting old settings
    const created = await this.repo.createCredential({
      id: newCredId,
      accountId: oldCred.accountId,
      provider: oldCred.provider,
      label: oldCred.label,
      ciphertext: sealed.ciphertext,
      iv: sealed.iv,
      authTag: sealed.authTag,
      keyVersion: sealed.keyVersion,
      fingerprint: fp,
      last4,
      status: AiCredentialStatus.ACTIVE,
      priority: oldCred.priority,
      dailyBudgetUsd: oldCred.dailyBudgetUsd,
      createdBy: actorId ? actorId : null,
    });

    // 2. Wipe old ciphertext and mark disabled
    await this.repo.wipeCompromisedCredential(oldCred.id);
    await this.repo.recordEvent(
      oldCred.id,
      "rotated",
      actorId,
      {
        replacedBy: newCredId,
        reason: input.reason ?? "Manual rotation",
      },
      requestId,
    );

    await this.repo.recordEvent(
      newCredId,
      "created",
      actorId,
      {
        rotatedFrom: oldCred.id,
        reason: input.reason ?? "Manual rotation",
      },
      requestId,
    );

    return this.toDto(created);
  }

  /**
   * Emergency kill-switch: immediately halts all traffic to the credential.
   */
  async killSwitch(
    input: KillSwitchInput,
    actorId: string,
    requestId?: string,
  ): Promise<void> {
    const cred = await this.repo.findCredentialById(input.credentialId);
    if (!cred) {
      throw new AppError(ErrorCode.NOT_FOUND, "Credential not found.");
    }

    await this.repo.updateStatus(
      cred.id,
      AiCredentialStatus.DISABLED,
      null,
      `KILL_SWITCH: ${input.reason}`,
    );

    await this.repo.recordEvent(
      cred.id,
      "disabled",
      actorId,
      {
        reason: input.reason,
        action: "kill_switch",
      },
      requestId,
    );
  }
}
