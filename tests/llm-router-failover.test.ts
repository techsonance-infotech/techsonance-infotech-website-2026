import { describe, it, expect, vi, beforeEach } from "vitest";
import { LLMRouterService } from "../lib/services/llm-router.service";
import { QuotaError } from "../lib/llm/types";

describe("LLMRouterService - Multi-Account & Dynamic Key Failover", () => {
  let mockHealth: any;
  let mockProviders: any;
  let mockBroker: any;
  let router: LLMRouterService;

  beforeEach(() => {
    mockHealth = {
      isUsable: vi.fn().mockResolvedValue(true),
      mark: vi.fn().mockResolvedValue(undefined),
      markOk: vi.fn().mockResolvedValue(undefined),
      earliestRetryAt: vi.fn().mockResolvedValue(Date.now() + 60000),
    };

    mockBroker = {
      claimKey: vi.fn(),
      reportSuccess: vi.fn(),
      reportFailure: vi.fn(),
    };

    const createMockProvider = (id: string, failWith?: any, chunks = ["Hello", " world"]) => ({
      id,
      name: id.toUpperCase(),
      enabled: vi.fn().mockReturnValue(true),
      chat: vi.fn().mockImplementation(async function* () {
        if (failWith) throw failWith;
        for (const c of chunks) yield c;
      }),
    });

    mockProviders = {
      getProviders: vi
        .fn()
        .mockReturnValue([
          createMockProvider("groq", new QuotaError("daily", undefined, "Daily limit reached")),
          createMockProvider("gemini", null, ["Answer", " from", " Gemini"]),
        ]),
    };

    router = new LLMRouterService(mockHealth, mockProviders, mockBroker);
  });

  it("should claim key from KeyBroker, failover on daily quota error, and complete on second provider", async () => {
    mockBroker.claimKey
      .mockResolvedValueOnce({
        key: "groq-key-1",
        credentialId: "cred-groq-1",
        isFallbackEnv: false,
      })
      .mockResolvedValueOnce({
        key: "gemini-key-1",
        credentialId: "cred-gemini-1",
        isFallbackEnv: false,
      });

    const chunks: string[] = [];
    for await (const chunk of router.routeChat({ messages: [{ role: "user", content: "Hi" }] })) {
      chunks.push(chunk);
    }

    expect(chunks.join("")).toBe("Answer from Gemini");
    expect(mockBroker.reportFailure).toHaveBeenCalledWith(
      "groq",
      "cred-groq-1",
      "QUOTA_EXHAUSTED",
      expect.any(Object),
    );
    expect(mockBroker.reportSuccess).toHaveBeenCalledWith("cred-gemini-1");
  });

  it("should not switch providers mid-stream once tokens have already been yielded", async () => {
    const streamError = new Error("Connection dropped mid-stream");
    const partialProvider = {
      id: "groq",
      name: "Groq",
      enabled: vi.fn().mockReturnValue(true),
      chat: vi.fn().mockImplementation(async function* () {
        yield "Partial start...";
        throw streamError;
      }),
    };

    mockProviders.getProviders.mockReturnValue([
      partialProvider,
      {
        id: "gemini",
        name: "Gemini",
        enabled: vi.fn().mockReturnValue(true),
        chat: vi.fn().mockImplementation(async function* () {
          yield "Should not reach here";
        }),
      },
    ]);

    mockBroker.claimKey.mockResolvedValue({ key: "some-key" });

    const chunks: string[] = [];
    for await (const chunk of router.routeChat({ messages: [{ role: "user", content: "Hi" }] })) {
      chunks.push(chunk);
    }

    const output = chunks.join("");
    expect(output).toContain("Partial start...");
    expect(output).toContain("connect directly with our engineering team");
    expect(output).not.toContain("Should not reach here");
  });
});
