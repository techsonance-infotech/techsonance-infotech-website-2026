import { describe, it, expect, vi, beforeEach } from "vitest";
import { AiCredentialsRepository } from "../lib/repositories/ai-credentials.repository";
import { AiCredentialStatus, AiAccountBillingMode } from "../lib/constants/enums/ai.enum";

describe("AiCredentialsRepository", () => {
  let mockDb: any;
  let repo: AiCredentialsRepository;

  beforeEach(() => {
    mockDb = {
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    repo = new AiCredentialsRepository(mockDb);
  });

  it("should insert a new account record", async () => {
    const fakeAccount = {
      id: "acc-123",
      provider: "groq",
      accountEmail: "team@techsonance.co.in",
      displayName: "Groq Enterprise Account",
      billingMode: AiAccountBillingMode.PREPAID,
      monthlyBudgetUsd: "50.00",
    };

    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([fakeAccount]),
      }),
    });

    const result = await repo.createAccount(fakeAccount as any);
    expect(result).toEqual(fakeAccount);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("should insert a new credential record", async () => {
    const fakeCredential = {
      id: "cred-uuid-1",
      provider: "gemini",
      label: "Gemini Primary Key",
      ciphertext: Buffer.from("sealed"),
      iv: Buffer.from("12bytesiv123"),
      authTag: Buffer.from("16bytesauthtag12"),
      keyVersion: 1,
      fingerprint: "hmac-sha256-fp-string",
      last4: "49a1",
      status: AiCredentialStatus.ACTIVE,
      priority: 10,
    };

    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([fakeCredential]),
      }),
    });

    const result = await repo.createCredential(fakeCredential as any);
    expect(result).toEqual(fakeCredential);
  });

  it("should claim next active credential for a given provider", async () => {
    const activeCredential = {
      id: "cred-uuid-1",
      provider: "groq",
      label: "Groq Key 1",
      status: AiCredentialStatus.ACTIVE,
      priority: 1,
      lastUsedAt: null,
      cooldownUntil: null,
      dailyBudgetUsd: "10.00",
      spentTodayUsd: "2.50",
    };

    const queryChain: any = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([activeCredential]),
    };
    mockDb.select.mockReturnValue(queryChain);

    const result = await repo.claimNextActiveCredential("groq");
    expect(result).toEqual(activeCredential);
  });

  it("should wipe compromised ciphertext while retaining metadata", async () => {
    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    await repo.wipeCompromisedCredential("cred-uuid-compromised");
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("should record an append-only audit event", async () => {
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue([]),
    });

    await repo.recordEvent(
      "cred-uuid-1",
      "created",
      "admin-user-id",
      { note: "Initial onboarding" },
      "req-123",
    );
    expect(mockDb.insert).toHaveBeenCalled();
  });
});
