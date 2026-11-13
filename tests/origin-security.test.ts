import { describe, it, expect, vi } from "vitest";
import { isAllowedOrigin } from "@/lib/utils/text";

describe("Phase 2: Origin Security & CSRF Protection (isAllowedOrigin)", () => {
  it("allows exact official domain matches", () => {
    expect(isAllowedOrigin("https://www.techsonance.co.in")).toBe(true);
    expect(isAllowedOrigin("https://techsonance.co.in")).toBe(true);
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
  });

  it("permits null or empty origin for server-side / direct invocations", () => {
    expect(isAllowedOrigin(null)).toBe(true);
    expect(isAllowedOrigin("")).toBe(true);
  });

  it("strictly rejects attacker domain spoofing with techsonance.co.in substring", () => {
    // Malicious attacker domains attempting substring bypass
    expect(isAllowedOrigin("https://techsonance.co.in.attacker.com")).toBe(false);
    expect(isAllowedOrigin("https://attacker-techsonance.co.in.net")).toBe(false);
    expect(isAllowedOrigin("https://evil.com?ref=techsonance.co.in")).toBe(false);
    expect(isAllowedOrigin("https://attacker.com/techsonance.co.in")).toBe(false);
  });

  it("strictly rejects attacker domain spoofing with localhost substring", () => {
    expect(isAllowedOrigin("https://localhost.attacker.com")).toBe(false);
    expect(isAllowedOrigin("https://attacker.com?localhost")).toBe(false);
    expect(isAllowedOrigin("https://attacker.com/127.0.0.1")).toBe(false);
  });

  it("strictly rejects malformed origin strings", () => {
    expect(isAllowedOrigin("not-a-valid-url")).toBe(false);
    expect(isAllowedOrigin("javascript:alert(1)")).toBe(false);
  });

  it("in production, rejects loopback addresses not in allowed list", () => {
    vi.stubEnv("NODE_ENV", "production");

    // Random non-configured port in production
    expect(isAllowedOrigin("http://localhost:9999")).toBe(false);
    expect(isAllowedOrigin("http://127.0.0.1:8080")).toBe(false);

    vi.unstubAllEnvs();
  });
});
