import { describe, it, expect, vi, beforeEach } from "vitest";
import { KeyBrokerService } from "../lib/services/ai/key-broker.service";
import { seal, generateMasterKey } from "../lib/crypto/vault";
import { AiCredentialStatus } from "../lib/constants/enums/ai.enum";

describe("KeyBrokerService", () => {
  let mockRepo: any;
  let mockHealth: any;
  let mockEnv: any;
  let mockConfig: any;
  let broker: KeyBrokerService;

  beforeEach(() => {
    mockRepo = {
      claimNextActiveCredential: vi.fn(),
      updateStatus: vi.fn(),
      recordUsage: vi.fn(),
      wipeCompromisedCredential: vi.fn(),
      recordEvent: vi.fn(),
    };
    mockHealth = {
      mark: vi.fn(),
      markOk: vi.fn(),
    };
    mockEnv = {
      GROQ_API_KEY: "gsk_env_fallback_groq",
      GEMINI_API_KEY: "AIza_env_fallback_gemini",
    };
    mockConfig = {
      providers: {
        groq: { id: "groq", apiKeyEnv: "GROQ_API_KEY" },
        gemini: { id: "gemini", apiKeyEnv: "GEMINI_API_KEY" },
      },
    };

    broker = new KeyBrokerService(mockRepo, mockHealth, mockEnv, mockConfig as any);
  });

  it("should claim an active DB credential and unseal it in memory", async () => {
    const rawSecret = "gsk_live_db_unsealed_key_123";
    const credId = "cred-uuid-101";
    const sealed = seal(rawSecret, `${credId}:groq`);

    mockRepo.claimNextActiveCredential.mockResolvedValue({
      id: credId,
      provider: "groq",
      label: "Groq Main Key",
      ciphertext: sealed.ciphertext,
      iv: sealed.iv,
      authTag: sealed.authTag,
      keyVersion: sealed.keyVersion,
      status: AiCredentialStatus.ACTIVE,
    });

    const claimed = await broker.claimKey("groq");
    expect(claimed).not.toBeNull();
    expect(claimed?.key).toBe(rawSecret);
    expect(claimed?.credentialId).toBe(credId);
    expect(claimed?.isFallbackEnv).toBe(false);
  });

  it("should fall back to environment variable if no active DB credential exists", async () => {
    mockRepo.claimNextActiveCredential.mockResolvedValue(null);

    const claimed = await broker.claimKey("gemini");
    expect(claimed).not.toBeNull();
    expect(claimed?.key).toBe("AIza_env_fallback_gemini");
    expect(claimed?.credentialId).toBeUndefined();
    expect(claimed?.isFallbackEnv).toBe(true);
  });

  it("should auto-quarantine and wipe ciphertext when AUTH_FAILED is reported", async () => {
    const credId = "cred-compromised-99";
    await broker.reportFailure("groq", credId, "AUTH_FAILED", {
      errorMessage: "401 Unauthorized API Key Revoked",
    });

    expect(mockRepo.wipeCompromisedCredential).toHaveBeenCalledWith(credId);
    expect(mockRepo.recordEvent).toHaveBeenCalledWith(
      credId,
      "compromised",
      "system",
      expect.objectContaining({ reason: "AUTH_FAILED" }),
    );
  });

  it("should set cooling_down status when RATE_LIMITED is reported", async () => {
    const credId = "cred-rate-limited-1";
    await broker.reportFailure("groq", credId, "RATE_LIMITED", {
      retryAfterSec: 45,
    });

    expect(mockRepo.updateStatus).toHaveBeenCalledWith(
      credId,
      AiCredentialStatus.COOLING_DOWN,
      expect.any(Date),
      "RATE_LIMITED",
    );
  });
});
