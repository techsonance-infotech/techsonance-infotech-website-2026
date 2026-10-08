import { describe, it, expect, beforeEach } from "vitest";
import { routeChat } from "../lib/llm/router";
import { health } from "../lib/llm/health";
import {
  AllExhaustedError,
  QuotaError,
  type LLMProvider,
} from "../lib/llm/types";

describe("LLM Router & Failover State Machine Tests", () => {
  beforeEach(() => {
    health.reset();
  });

  it("should successfully yield tokens from the first healthy provider", async () => {
    const providerA: LLMProvider = {
      id: "mock-a",
      name: "Mock Provider A",
      enabled: () => true,
      async *chat() {
        yield "Hello ";
        yield "from ";
        yield "TechSonance!";
      },
    };

    const chunks: string[] = [];
    for await (const chunk of routeChat({ messages: [{ role: "user", content: "hi" }] }, [providerA])) {
      chunks.push(chunk);
    }

    expect(chunks.join("")).toBe("Hello from TechSonance!");
    const record = await health.getRecord("mock-a");
    expect(record.state).toBe("HEALTHY");
  });

  it("should failover to Provider B when Provider A hits a 429 rate limit before yielding tokens", async () => {
    const providerA: LLMProvider = {
      id: "mock-a",
      name: "Mock Provider A",
      enabled: () => true,
      async *chat() {
        throw new QuotaError("rate", 60, "Rate limit reached");
      },
    };

    const providerB: LLMProvider = {
      id: "mock-b",
      name: "Mock Provider B",
      enabled: () => true,
      async *chat() {
        yield "Response from provider B";
      },
    };

    const chunks: string[] = [];
    for await (const chunk of routeChat({ messages: [{ role: "user", content: "hi" }] }, [providerA, providerB])) {
      chunks.push(chunk);
    }

    expect(chunks.join("")).toBe("Response from provider B");

    // Provider A should be in COOLDOWN
    const recA = await health.getRecord("mock-a");
    expect(recA.state).toBe("COOLDOWN");
    expect(recA.nextTry).toBeGreaterThan(Date.now());

    // Provider B should be HEALTHY
    const recB = await health.getRecord("mock-b");
    expect(recB.state).toBe("HEALTHY");
  });

  it("should not switch providers mid-stream if tokens were already yielded", async () => {
    const providerA: LLMProvider = {
      id: "mock-a",
      name: "Mock Provider A",
      enabled: () => true,
      async *chat() {
        yield "Partial response...";
        throw new Error("Network drop midway");
      },
    };

    const providerB: LLMProvider = {
      id: "mock-b",
      name: "Mock Provider B",
      enabled: () => true,
      async *chat() {
        yield "Provider B should not be called";
      },
    };

    const chunks: string[] = [];
    for await (const chunk of routeChat({ messages: [{ role: "user", content: "hi" }] }, [providerA, providerB])) {
      chunks.push(chunk);
    }

    const fullResponse = chunks.join("");
    expect(fullResponse).toContain("Partial response...");
    expect(fullResponse).toContain("Would you like to connect directly with our engineering team");
    expect(fullResponse).not.toContain("Provider B should not be called");
  });

  it("should throw AllExhaustedError when all providers fail without infinite looping", async () => {
    let aAttempts = 0;
    let bAttempts = 0;

    const providerA: LLMProvider = {
      id: "mock-a",
      name: "Mock Provider A",
      enabled: () => true,
      async *chat() {
        aAttempts++;
        throw new QuotaError("daily", undefined, "Daily limit reached");
      },
    };

    const providerB: LLMProvider = {
      id: "mock-b",
      name: "Mock Provider B",
      enabled: () => true,
      async *chat() {
        bAttempts++;
        throw new QuotaError("server", 120, "Server 500 error");
      },
    };

    let errorThrown: unknown = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of routeChat({ messages: [{ role: "user", content: "hi" }] }, [providerA, providerB])) {
        // no-op
      }
    } catch (err) {
      errorThrown = err;
    }

    expect(errorThrown).toBeInstanceOf(AllExhaustedError);
    expect(aAttempts).toBe(1); // Single pass, exactly 1 try
    expect(bAttempts).toBe(1); // Single pass, exactly 1 try
  });

  it("should skip providers that are currently in cooldown", async () => {
    // Put provider A in cooldown
    await health.mark("mock-a", new QuotaError("rate", 60));

    let aCalled = false;
    const providerA: LLMProvider = {
      id: "mock-a",
      name: "Mock Provider A",
      enabled: () => true,
      async *chat() {
        aCalled = true;
        yield "Should not run";
      },
    };

    const providerB: LLMProvider = {
      id: "mock-b",
      name: "Mock Provider B",
      enabled: () => true,
      async *chat() {
        yield "Provider B answer";
      },
    };

    const chunks: string[] = [];
    for await (const chunk of routeChat({ messages: [{ role: "user", content: "hi" }] }, [providerA, providerB])) {
      chunks.push(chunk);
    }

    expect(aCalled).toBe(false);
    expect(chunks.join("")).toBe("Provider B answer");
  });
});
