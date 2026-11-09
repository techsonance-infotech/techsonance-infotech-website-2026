import "server-only";
import { inject } from "@needle-di/core";
import { and, asc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { Database } from "@/lib/database/index";
import {
  accountsTable,
  credentialsTable,
  credentialEventsTable,
  alertsTable,
  type AiAccount,
  type InsertAiAccount,
  type AiCredential,
  type InsertAiCredential,
} from "@/lib/database/schema/index.schema";
import {
  AiCredentialStatus,
  type AiProvider,
  type AiProviderId,
} from "@/lib/constants/enums/ai.enum";
import { mapDbError } from "@/lib/dbErrors";

export class AiCredentialsRepository {
  constructor(private db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  /**
   * Creates a new provider account (for grouping keys under one organization/billing email).
   */
  async createAccount(data: InsertAiAccount): Promise<AiAccount> {
    try {
      const [account] = await this.db.insert(accountsTable).values(data).returning();
      return account;
    } catch (err) {
      throw mapDbError(err, {
        context: "AiCredentialsRepository.createAccount",
        accountEmail: data.accountEmail,
      });
    }
  }

  /**
   * Lists provider accounts, optionally filtered by provider slug.
   */
  async listAccounts(provider?: string): Promise<AiAccount[]> {
    try {
      if (provider) {
        return await this.db
          .select()
          .from(accountsTable)
          .where(eq(accountsTable.provider, provider));
      }
      return await this.db.select().from(accountsTable);
    } catch (err) {
      throw mapDbError(err, {
        context: "AiCredentialsRepository.listAccounts",
        provider,
      });
    }
  }

  /**
   * Registers a new sealed credential in the vault.
   */
  async createCredential(data: InsertAiCredential): Promise<AiCredential> {
    try {
      const [credential] = await this.db.insert(credentialsTable).values(data).returning();
      return credential;
    } catch (err) {
      throw mapDbError(err, {
        context: "AiCredentialsRepository.createCredential",
        provider: data.provider,
        label: data.label,
      });
    }
  }

  /**
   * Finds a single credential record by UUID.
   */
  async findCredentialById(id: string): Promise<AiCredential | null> {
    if (!id || !id.trim()) return null;

    try {
      const [credential] = await this.db
        .select()
        .from(credentialsTable)
        .where(eq(credentialsTable.id, id))
        .limit(1);

      return credential ?? null;
    } catch (err) {
      throw mapDbError(err, {
        context: "AiCredentialsRepository.findCredentialById",
        id,
      });
    }
  }

  /**
   * Finds a credential by its HMAC fingerprint.
   */
  async findByFingerprint(fingerprint: string): Promise<AiCredential | null> {
    if (!fingerprint) return null;

    try {
      const [credential] = await this.db
        .select()
        .from(credentialsTable)
        .where(eq(credentialsTable.fingerprint, fingerprint))
        .limit(1);

      return credential ?? null;
    } catch (err) {
      throw mapDbError(err, {
        context: "AiCredentialsRepository.findByFingerprint",
      });
    }
  }

  /**
   * Lists credentials, optionally filtered by provider.
   */
  async listCredentials(provider?: AiProviderId | AiProvider | string): Promise<AiCredential[]> {
    try {
      if (provider) {
        return await this.db
          .select()
          .from(credentialsTable)
          .where(eq(credentialsTable.provider, String(provider)))
          .orderBy(asc(credentialsTable.priority));
      }
      return await this.db.select().from(credentialsTable).orderBy(asc(credentialsTable.priority));
    } catch (err) {
      throw mapDbError(err, {
        context: "AiCredentialsRepository.listCredentials",
        provider,
      });
    }
  }

  /**
   * Atomically claims the next healthy active credential for a given provider.
   * Filters out:
   *  - non-active statuses
   *  - credentials in cooldown (cooldownUntil > now)
   *  - credentials that have reached their daily budget limit
   *  - canary rows
   */
  async claimNextActiveCredential(
    provider: AiProviderId | AiProvider | string,
    now: Date = new Date(),
  ): Promise<AiCredential | null> {
    try {
      const [credential] = await this.db
        .select()
        .from(credentialsTable)
        .where(
          and(
            eq(credentialsTable.provider, String(provider)),
            or(
              and(
                eq(credentialsTable.status, AiCredentialStatus.ACTIVE),
                or(
                  isNull(credentialsTable.cooldownUntil),
                  lte(credentialsTable.cooldownUntil, now),
                ),
              ),
              and(
                eq(credentialsTable.status, AiCredentialStatus.COOLING_DOWN),
                lte(credentialsTable.cooldownUntil, now),
              ),
            ),
            eq(credentialsTable.isCanary, false),
            or(
              isNull(credentialsTable.dailyBudgetUsd),
              sql`${credentialsTable.spentTodayUsd} < ${credentialsTable.dailyBudgetUsd}`,
            ),
          ),
        )
        .orderBy(
          asc(credentialsTable.priority),
          asc(sql`COALESCE(${credentialsTable.lastUsedAt}, '1970-01-01')`),
        )
        .limit(1);

      if (credential && credential.status === AiCredentialStatus.COOLING_DOWN) {
        await this.updateStatus(credential.id, AiCredentialStatus.ACTIVE, null);
        credential.status = AiCredentialStatus.ACTIVE;
        credential.cooldownUntil = null;
      }

      return credential ?? null;
    } catch (err) {
      throw mapDbError(err, {
        context: "AiCredentialsRepository.claimNextActiveCredential",
        provider,
      });
    }
  }

  /**
   * Updates status and optional cooldown period for a credential.
   */
  async updateStatus(
    id: string,
    status: AiCredentialStatus,
    cooldownUntil?: Date | null,
    lastErrorKind?: string,
  ): Promise<AiCredential | null> {
    try {
      const updatePayload: Partial<InsertAiCredential> = {
        status,
        ...(cooldownUntil !== undefined ? { cooldownUntil } : {}),
        ...(lastErrorKind ? { lastErrorKind } : {}),
      };

      const [updated] = await this.db
        .update(credentialsTable)
        .set(updatePayload)
        .where(eq(credentialsTable.id, id))
        .returning();

      return updated ?? null;
    } catch (err) {
      throw mapDbError(err, {
        context: "AiCredentialsRepository.updateStatus",
        id,
        status,
      });
    }
  }

  /**
   * Updates last used timestamp and increments spent budget.
   */
  async recordUsage(id: string, costUsd: number = 0): Promise<void> {
    try {
      await this.db
        .update(credentialsTable)
        .set({
          lastUsedAt: new Date(),
          spentTodayUsd: sql`${credentialsTable.spentTodayUsd} + ${costUsd.toFixed(4)}`,
          consecutiveFailures: 0,
        })
        .where(eq(credentialsTable.id, id));
    } catch (err) {
      throw mapDbError(err, {
        context: "AiCredentialsRepository.recordUsage",
        id,
      });
    }
  }

  /**
   * Auto-quarantines a compromised credential by permanently wiping ciphertext and IV,
   * while keeping row metadata and fingerprint for audit and prevention.
   */
  async wipeCompromisedCredential(id: string): Promise<void> {
    try {
      await this.db
        .update(credentialsTable)
        .set({
          ciphertext: null,
          iv: null,
          authTag: null,
          status: AiCredentialStatus.COMPROMISED,
          lastErrorKind: "AUTH_FAILED_QUARANTINED",
        })
        .where(eq(credentialsTable.id, id));
    } catch (err) {
      throw mapDbError(err, {
        context: "AiCredentialsRepository.wipeCompromisedCredential",
        id,
      });
    }
  }

  /**
   * Updates the model identifier for an existing credential.
   * Enforces mandatory where clause (rule 03 §3 / rule 12 §3.5).
   */
  async updateModel(id: string, model: string): Promise<AiCredential | null> {
    try {
      const [updated] = await this.db
        .update(credentialsTable)
        .set({
          model,
          updatedAt: new Date(),
        })
        .where(eq(credentialsTable.id, id))
        .returning();

      return updated ?? null;
    } catch (err) {
      throw mapDbError(err, {
        context: "AiCredentialsRepository.updateModel",
        id,
      });
    }
  }

  /**
   * Records an append-only audit event in ts_ai_credential_events.
   */
  async recordEvent(
    credentialId: string | null,
    event: string,
    actor: string,
    meta: Record<string, unknown> = {},
    requestId?: string,
  ): Promise<void> {
    try {
      await this.db.insert(credentialEventsTable).values({
        credentialId,
        event,
        actor,
        requestId: requestId ?? null,
        meta,
      });
    } catch (err) {
      throw mapDbError(err, {
        context: "AiCredentialsRepository.recordEvent",
        credentialId,
        event,
      });
    }
  }
}
