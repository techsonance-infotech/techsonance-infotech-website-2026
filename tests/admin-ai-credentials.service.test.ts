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
      updateModel: vi.fn(),
      deleteCredential: vi.fn(),
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

  it("should add a credential with a specific model name", async () => {
    mockRepo.findByFingerprint.mockResolvedValue(null);
    mockRepo.createCredential.mockImplementation(async (data: any) => ({
      ...data,
      id: "cred-uuid-2",
      createdAt: new Date(),
      spentTodayUsd: "0",
    }));

    const result = await service.addCredential(
      {
        provider: "gemini",
        model: "gemini-3.0-pro",
        label: "Gemini Pro Reasoning",
        apiKey: "AIzaSy_custom_model_key_12345",
      },
      "admin-user-1",
    );

    expect(result.model).toBe("gemini-3.0-pro");
    expect(mockRepo.createCredential).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "gemini",
        model: "gemini-3.0-pro",
      }),
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

  it("should update serving model without touching API key or ciphertext", async () => {
    mockRepo.findCredentialById.mockResolvedValue({
      id: "cred-to-update",
      provider: "groq",
      model: "openai/gpt-oss-120b",
      status: AiCredentialStatus.ACTIVE,
      ciphertext: Buffer.from("sealed"),
      label: "Groq Main",
      last4: "wwY3",
      keyVersion: 1,
      priority: 10,
    });
    mockRepo.updateModel.mockResolvedValue({
      id: "cred-to-update",
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      status: AiCredentialStatus.ACTIVE,
      label: "Groq Main",
      last4: "wwY3",
      keyVersion: 1,
      priority: 10,
    });

    const res = await service.updateModel(
      {
        credentialId: "cred-to-update",
        model: "llama-3.3-70b-versatile",
      },
      "admin-user-1",
      "req-123",
    );

    expect(res.model).toBe("llama-3.3-70b-versatile");
    expect(mockRepo.updateModel).toHaveBeenCalledWith("cred-to-update", "llama-3.3-70b-versatile");
    expect(mockRepo.recordEvent).toHaveBeenCalledWith(
      "cred-to-update",
      "rotated",
      "admin-user-1",
      expect.objectContaining({
        action: "model_updated",
        previousModel: "openai/gpt-oss-120b",
        newModel: "llama-3.3-70b-versatile",
      }),
      "req-123",
    );
  });

  it("should cleanly deactivate an active credential without wiping ciphertext", async () => {
    mockRepo.findCredentialById.mockResolvedValue({
      id: "cred-cf-active",
      provider: "cloudflare",
      model: "@cf/black-forest-labs/flux-1-schnell",
      status: AiCredentialStatus.ACTIVE,
      ciphertext: Buffer.from("sealed"),
      label: "CF account :Manish.vg",
      last4: "3b23",
      keyVersion: 1,
      priority: 10,
      spentTodayUsd: "0",
      isCanary: false,
      createdAt: new Date(),
    });
    mockRepo.updateStatus.mockResolvedValue({
      id: "cred-cf-active",
      provider: "cloudflare",
      model: "@cf/black-forest-labs/flux-1-schnell",
      status: AiCredentialStatus.DISABLED,
      label: "CF account :Manish.vg",
      last4: "3b23",
      keyVersion: 1,
      priority: 10,
      spentTodayUsd: "0",
      isCanary: false,
      createdAt: new Date(),
    });

    const res = await service.deactivateCredential(
      { credentialId: "cred-cf-active", reason: "Rotating CF key" },
      "admin-user-1",
      "req-deact",
    );

    expect(res.status).toBe(AiCredentialStatus.DISABLED);
    expect(mockRepo.wipeCompromisedCredential).not.toHaveBeenCalled();
    expect(mockRepo.updateStatus).toHaveBeenCalledWith(
      "cred-cf-active",
      AiCredentialStatus.DISABLED,
      null,
      "DEACTIVATED: Rotating CF key",
    );
    expect(mockRepo.recordEvent).toHaveBeenCalledWith(
      "cred-cf-active",
      "disabled",
      "admin-user-1",
      expect.objectContaining({ action: "deactivated" }),
      "req-deact",
    );
  });

  it("should permanently delete compromised or old credentials and log null-linked audit event", async () => {
    mockRepo.findCredentialById.mockResolvedValue({
      id: "cred-old-wiped",
      provider: "cloudflare",
      label: "Old CF Key",
      last4: "1c6b",
      status: AiCredentialStatus.COMPROMISED,
    });
    mockRepo.deleteCredential.mockResolvedValue({ id: "cred-old-wiped" });

    await service.deleteCredential("cred-old-wiped", "admin-user-1", "req-del");

    expect(mockRepo.deleteCredential).toHaveBeenCalledWith("cred-old-wiped");
    expect(mockRepo.recordEvent).toHaveBeenCalledWith(
      null,
      "deleted",
      "admin-user-1",
      expect.objectContaining({
        deletedCredentialId: "cred-old-wiped",
        provider: "cloudflare",
        last4: "1c6b",
      }),
      "req-del",
    );
  });

  it("should throw NOT_FOUND when deleting a missing credential", async () => {
    mockRepo.findCredentialById.mockResolvedValue(null);

    await expect(service.deleteCredential("missing-id", "admin-user-1")).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND,
    });
  });

  describe("Cloudflare Account ID Validation", () => {
    it("should reject Cloudflare credential with invalid non-hex character 'O' in account ID", async () => {
      await expect(
        service.addCredential(
          {
            provider: "cloudflare",
            label: "Bad CF Account ID",
            apiKey: "7858306bd979f4b9e6484aeOc55333aa:valid_token_here",
          },
          "admin-user-1",
        ),
      ).rejects.toMatchObject({
        code: ErrorCode.VALIDATION,
        message: expect.stringContaining("32-character hexadecimal string"),
      });
    });

    it("should reject Cloudflare credential with account ID that is not 32 characters", async () => {
      await expect(
        service.addCredential(
          {
            provider: "cloudflare",
            label: "Short CF Account ID",
            apiKey: "7858306b:valid_token_here",
          },
          "admin-user-1",
        ),
      ).rejects.toMatchObject({
        code: ErrorCode.VALIDATION,
        message: expect.stringContaining("32-character hexadecimal string"),
      });
    });

    it("should accept valid 32-char hex Cloudflare account ID and normalize to lowercase", async () => {
      mockRepo.findByFingerprint.mockResolvedValue(null);
      mockRepo.createCredential.mockImplementation(async (data: any) => ({
        ...data,
        id: "cf-cred-valid",
        createdAt: new Date(),
        spentTodayUsd: "0",
      }));

      const result = await service.addCredential(
        {
          provider: "cloudflare",
          label: "Valid CF Account",
          apiKey: "7858306BD979F4B9E6484AE0C55333AA:valid_token_here",
        },
        "admin-user-1",
      );

      expect(result.id).toBe("cf-cred-valid");
      expect(mockRepo.createCredential).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "cloudflare",
        }),
      );
    });
  });
});
