import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as loginPOST } from "@/app/api/admin/auth/login/route";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { RateLimiterService } from "@/lib/services/ratelimit.service";
import { ErrorCode } from "@/lib/errors";

describe("Phase 4: Dual-Key Rate Limiting & Proxy IP Extraction", () => {
  let mockAuthService: any;
  let rateLimiter: RateLimiterService;

  beforeEach(() => {
    vi.restoreAllMocks();

    rateLimiter = new RateLimiterService({} as any);
    rateLimiter.reset();

    mockAuthService = {
      authenticate: vi.fn().mockResolvedValue({
        id: "admin-1",
        email: "admin@techsonance.co.in",
        name: "Admin User",
        role: "admin",
      }),
    };

    const container = getContainer();
    vi.spyOn(container, "get").mockImplementation((token: any) => {
      if (token === AdminAuthService) return mockAuthService;
      if (token === RateLimiterService) return rateLimiter;
      throw new Error(`Unexpected token: ${token}`);
    });
  });

  it("extracts trusted client IP preferring cf-connecting-ip then x-vercel-forwarded-for over x-forwarded-for", () => {
    // 1. CF connecting IP
    const cfReq = new Request("http://localhost:3000/api/admin/auth/login", {
      headers: {
        "cf-connecting-ip": "203.0.113.195",
        "x-forwarded-for": "198.51.100.1, 10.0.0.1",
      },
    });
    expect(rateLimiter.getClientIp(cfReq)).toBe("203.0.113.195");

    // 2. Vercel forwarded for
    const vercelReq = new Request("http://localhost:3000/api/admin/auth/login", {
      headers: {
        "x-vercel-forwarded-for": "203.0.113.88",
        "x-forwarded-for": "198.51.100.1",
      },
    });
    expect(rateLimiter.getClientIp(vercelReq)).toBe("203.0.113.88");

    // 3. Standard x-forwarded-for
    const stdReq = new Request("http://localhost:3000/api/admin/auth/login", {
      headers: {
        "x-forwarded-for": "198.51.100.5, 10.0.0.1",
      },
    });
    expect(rateLimiter.getClientIp(stdReq)).toBe("198.51.100.5");
  });

  it("throttles distributed login attacks targeting the same account across rotating IPs (account-level rate limit)", async () => {
    const targetEmail = "security-target@techsonance.co.in";

    // 5 attempts from 5 distinct IP addresses
    for (let i = 1; i <= 5; i++) {
      const req = new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `192.168.1.${i}`,
        },
        body: JSON.stringify({
          email: targetEmail,
          password: "password123",
        }),
      });

      const res = await loginPOST(req);
      expect(res.status).toBe(200);
    }

    // 6th attempt from a brand new 6th IP address targeting the same account
    const sixthReq = new Request("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "192.168.1.99",
      },
      body: JSON.stringify({
        email: targetEmail,
        password: "password123",
      }),
    });

    const sixthRes = await loginPOST(sixthReq);
    const sixthJson = await sixthRes.json();

    expect(sixthRes.status).toBe(429);
    expect(sixthJson.ok).toBe(false);
    expect(sixthJson.error.code).toBe(ErrorCode.RATE_LIMITED);
    expect(sixthRes.headers.get("Retry-After")).toBeDefined();
  });
});
