import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminAiCredentialsService } from "../lib/services/ai/admin-ai-credentials.service";
import { AiCredentialStatus } from "../lib/constants/enums/ai.enum";
import { AppError, ErrorCode } from "../lib/errors";

describe("AdminAiCredentialsService", () => {
  let mockRepo: any;
  let service: AdminAiCredentialsService;

  beforeEach(() => {
    mockRepo = {
      listCredentials: vi.fn(),
      findByFingerprint: vi.fn(),
      findCredentialById: vi.fn(),
      createCredential: vi.fn(),
      updateStatus: vi.fn(),
      wipeCompromisedCredential: vi.fn(),
      recordEvent: vi.fn(),
    };
    service = new AdminAiCredentialsService(mockRepo);
  });

  it("should add a new credential sealed with AES-256-GCM and store only ciphertext", async () => {
    mockRepo.findByFingerprint.mockResolvedValue(null);
    mockRepo.createCredential.mockImplementation(async (data: any) => ({
      ...data,
      id: "cred-uuid-1",
      createdAt: new Date(),
      spentTodayUsd: "0",
    }));

    const result = await service.addCredential(
      {
        provider: "groq",
        label: "Groq Main Key",
        apiKey: "gsk_test_api_key_secret_12345678",
        priority: 10,
        dailyBudgetUsd: 15,
      },
      "admin-user-1",
    );

    expect(result.id).toBe("cred-uuid-1");
    expect(result.last4).toBe("5678");
    expect(result.provider).toBe("groq");
    expect(mockRepo.createCredential).toHaveBeenCalledWith(
      expect.objectContaining({
        ciphertext: expect.any(Buffer),
        iv: expect.any(Buffer),
        authTag: expect.any(Buffer),
        last4: "5678",
        status: AiCredentialStatus.ACTIVE,
      }),
    );
    expect(mockRepo.recordEvent).toHaveBeenCalledWith(
      "cred-uuid-1",
      "created",
      "admin-user-1",
      expect.any(Object),
      undefined,
    );
  });

  it("should reject duplicate API keys with CONFLICT error code", async () => {
    mockRepo.findByFingerprint.mockResolvedValue({ id: "existing-cred" });

    await expect(
      service.addCredential(
        {
          provider: "groq",
          label: "Duplicate Key",
          apiKey: "gsk_existing_key_secret_12345678",
        },
        "admin-user-1",
      ),
    ).rejects.toThrow(AppError);
  });

  it("should disable credential via kill switch and record justification in audit", async () => {
    mockRepo.findCredentialById.mockResolvedValue({
      id: "cred-to-kill",
      provider: "gemini",
      status: AiCredentialStatus.ACTIVE,
    });
    mockRepo.updateStatus.mockResolvedValue({
      id: "cred-to-kill",
      status: AiCredentialStatus.DISABLED,
    });

    await service.killSwitch(
      {
        credentialId: "cred-to-kill",
        reason: "Suspected rate limiting flood during high traffic",
      },
      "admin-user-1",
    );

    expect(mockRepo.updateStatus).toHaveBeenCalledWith(
      "cred-to-kill",
      AiCredentialStatus.DISABLED,
      null,
      "KILL_SWITCH: Suspected rate limiting flood during high traffic",
    );
    expect(mockRepo.recordEvent).toHaveBeenCalledWith(
      "cred-to-kill",
      "disabled",
      "admin-user-1",
      expect.objectContaining({
        reason: "Suspected rate limiting flood during high traffic",
      }),
      undefined,
    );
  });
});
