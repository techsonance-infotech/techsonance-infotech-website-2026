import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "@/lib/logger";

describe("lib/logger — Structured Logging & Error Serialization", () => {
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("extracts Error message, name, and stack trace instead of serializing to empty object", () => {
    const testError = new Error("Database relation ts_ai_credentials does not exist");
    testError.name = "PostgresQueryError";

    logger.error("DB Query Failed", { error: testError, requestId: "req-123" });

    expect(consoleErrorSpy).toHaveBeenCalled();
    const [msg, contextStr] = consoleErrorSpy.mock.calls[0];
    expect(msg).toBe("[ERROR] DB Query Failed");

    const parsedContext = JSON.parse(contextStr);
    expect(parsedContext.requestId).toBe("req-123");
    expect(parsedContext.error.name).toBe("PostgresQueryError");
    expect(parsedContext.error.message).toBe("Database relation ts_ai_credentials does not exist");
    expect(parsedContext.error.stack).toBeDefined();
  });

  it("extracts nested cause and custom error codes", () => {
    const rootCause = new Error("Connection reset by peer");
    const appErr = Object.assign(new Error("Service unavailable"), {
      code: "UNAVAILABLE",
      cause: rootCause,
    });

    logger.error("Service Fault", { err: appErr });

    const [, contextStr] = consoleErrorSpy.mock.calls[0];
    const parsedContext = JSON.parse(contextStr);
    expect(parsedContext.err.code).toBe("UNAVAILABLE");
    expect(parsedContext.err.cause.message).toBe("Connection reset by peer");
  });

  it("redacts sensitive fields like apiKey, token, password, and ciphertext", () => {
    logger.warn("Credential Debug", {
      accountId: "acc-uuid-1",
      apiKey: "sk-proj-super-secret-key-12345",
      password: "admin_password_plaintext",
      ciphertext: "4f7a8b9c1d2e3f...",
      keyVersion: 1,
    });

    const [, contextStr] = consoleWarnSpy.mock.calls[0];
    const parsedContext = JSON.parse(contextStr);
    expect(parsedContext.accountId).toBe("acc-uuid-1"); // ID allowed
    expect(parsedContext.keyVersion).toBe(1); // keyVersion number allowed
    expect(parsedContext.apiKey).toBe("[REDACTED]");
    expect(parsedContext.password).toBe("[REDACTED]");
    expect(parsedContext.ciphertext).toBe("[REDACTED]");
  });
});
