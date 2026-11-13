import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSessionToken,
  verifySessionToken,
  sessionPayloadSchema,
  type SessionPayload,
} from "@/lib/auth/session";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminRole } from "@/lib/constants/enums/content.enum";
import { serverEnvSchema } from "@/lib/env/server";

vi.mock("server-only", () => ({}));

// Mock next/headers
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookieStore),
}));

describe("Phase 1: Admin Authentication Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Session Payload Validation & Token Verification (verifySessionToken)", () => {
    it("successfully creates and verifies a valid session token", () => {
      const payload: Omit<SessionPayload, "exp"> = {
        userId: "user-123",
        email: "admin@techsonance.co.in",
        name: "Admin User",
        role: AdminRole.ADMIN,
      };

      const token = createSessionToken(payload);
      const verified = verifySessionToken(token);

      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe("user-123");
      expect(verified?.email).toBe("admin@techsonance.co.in");
      expect(verified?.role).toBe(AdminRole.ADMIN);
      expect(typeof verified?.exp).toBe("number");
    });

    it("rejects token with missing signature or malformed format", () => {
      expect(verifySessionToken("malformed-token")).toBeNull();
      expect(verifySessionToken("only.one.dot.too.many")).toBeNull();
      expect(verifySessionToken("")).toBeNull();
    });

    it("rejects token with tampered signature", () => {
      const payload: Omit<SessionPayload, "exp"> = {
        userId: "user-123",
        email: "admin@techsonance.co.in",
        name: "Admin User",
        role: AdminRole.OWNER,
      };
      const token = createSessionToken(payload);
      const [encoded] = token.split(".");
      const forgedToken = `${encoded}.invalid_tampered_signature`;

      expect(verifySessionToken(forgedToken)).toBeNull();
    });

    it("rejects token with missing or non-numeric exp field", () => {
      // Craft a payload missing exp
      const rawPayload = {
        userId: "user-123",
        email: "admin@techsonance.co.in",
        name: "Admin User",
        role: AdminRole.OWNER,
        // no exp
      };
      const parseResult = sessionPayloadSchema.safeParse(rawPayload);
      expect(parseResult.success).toBe(false);

      // Craft a payload with string exp
      const stringExpPayload = {
        ...rawPayload,
        exp: "never_expire",
      };
      expect(sessionPayloadSchema.safeParse(stringExpPayload).success).toBe(false);
    });

    it("rejects expired token", () => {
      const now = Math.floor(Date.now() / 1000);
      const expiredPayload: SessionPayload = {
        userId: "user-123",
        email: "admin@techsonance.co.in",
        name: "Admin User",
        role: AdminRole.OWNER,
        exp: now - 3600, // 1 hour in past
      };
      const encodedData = Buffer.from(JSON.stringify(expiredPayload)).toString("base64url");
      // Use crypto to sign with fallback dev secret
      const crypto = require("node:crypto");
      const signature = crypto
        .createHmac("sha256", "techsonance-studio-admin-secret-minimum-32-chars")
        .update(encodedData)
        .digest("base64url");
      const expiredToken = `${encodedData}.${signature}`;

      expect(verifySessionToken(expiredToken)).toBeNull();
    });
  });

  describe("2. AdminAuthService.getCurrentSession() Fail-Closed Behavior", () => {
    const mockUsersRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      getDefaultSite: vi.fn().mockResolvedValue({
        id: "site-1",
        name: "TechSonance Main Site",
        slug: "techsonance-main",
        domain: "techsonance.co.in",
      }),
      updateLastLogin: vi.fn(),
      create: vi.fn(),
    };

    it("returns null when no cookie exists and ALLOW_PLACEHOLDERS is false or in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      mockCookieStore.get.mockReturnValue(undefined);

      const authService = new AdminAuthService(mockUsersRepo as any);
      const session = await authService.getCurrentSession();

      expect(session).toBeNull();
      vi.unstubAllEnvs();
    });

    it("returns null when session cookie references non-existent user", async () => {
      const token = createSessionToken({
        userId: "deleted-user-uuid",
        email: "deleted@techsonance.co.in",
        name: "Deleted User",
        role: AdminRole.ADMIN,
      });
      mockCookieStore.get.mockReturnValue({ value: token });
      mockUsersRepo.findById.mockResolvedValue(null);

      const authService = new AdminAuthService(mockUsersRepo as any);
      const session = await authService.getCurrentSession();

      expect(session).toBeNull();
      expect(mockUsersRepo.findById).toHaveBeenCalledWith("deleted-user-uuid");
    });

    it("returns null when session cookie references disabled/inactive user", async () => {
      const token = createSessionToken({
        userId: "inactive-user-uuid",
        email: "inactive@techsonance.co.in",
        name: "Inactive User",
        role: AdminRole.ADMIN,
      });
      mockCookieStore.get.mockReturnValue({ value: token });
      mockUsersRepo.findById.mockResolvedValue({
        id: "inactive-user-uuid",
        email: "inactive@techsonance.co.in",
        name: "Inactive User",
        role: "admin",
        isActive: false, // Account is disabled
      });

      const authService = new AdminAuthService(mockUsersRepo as any);
      const session = await authService.getCurrentSession();

      expect(session).toBeNull();
    });

    it("returns null when repository throws an error (fail closed)", async () => {
      const token = createSessionToken({
        userId: "user-uuid",
        email: "user@techsonance.co.in",
        name: "User",
        role: AdminRole.ADMIN,
      });
      mockCookieStore.get.mockReturnValue({ value: token });
      mockUsersRepo.findById.mockRejectedValue(new Error("Database connection dropped"));

      const authService = new AdminAuthService(mockUsersRepo as any);
      const session = await authService.getCurrentSession();

      expect(session).toBeNull();
    });

    it("returns valid session when cookie is valid and user is active in database", async () => {
      const token = createSessionToken({
        userId: "valid-user-uuid",
        email: "valid@techsonance.co.in",
        name: "Valid User",
        role: AdminRole.ADMIN,
      });
      mockCookieStore.get.mockReturnValue({ value: token });
      mockUsersRepo.findById.mockResolvedValue({
        id: "valid-user-uuid",
        email: "valid@techsonance.co.in",
        name: "Valid User",
        role: AdminRole.ADMIN,
        isActive: true,
      });

      const authService = new AdminAuthService(mockUsersRepo as any);
      const session = await authService.getCurrentSession();

      expect(session).not.toBeNull();
      expect(session?.userId).toBe("valid-user-uuid");
      expect(session?.email).toBe("valid@techsonance.co.in");
      expect(session?.role).toBe(AdminRole.ADMIN);
      expect(session?.site?.domain).toBe("techsonance.co.in");
    });
  });

  describe("3. Server Environment Secret Validation in Production", () => {
    it("requires JWT_ACCESS_SECRET or BETTER_AUTH_SECRET with >= 32 chars in production", () => {
      vi.stubEnv("NODE_ENV", "production");

      const validBase = {
        AI_KEK_V1: "a".repeat(44), // custom base64 key
        AI_FP_PEPPER: "custom-production-pepper-string-12345",
      };

      // Missing session secret
      const invalidResult = serverEnvSchema.safeParse(validBase);
      expect(invalidResult.success).toBe(false);
      const issues = invalidResult.error?.issues || [];
      const secretIssue = issues.find((i) => i.path.includes("JWT_ACCESS_SECRET"));
      expect(secretIssue).toBeDefined();

      // Short secret
      const shortResult = serverEnvSchema.safeParse({
        ...validBase,
        JWT_ACCESS_SECRET: "short-secret",
      });
      expect(shortResult.success).toBe(false);

      // Valid 32+ char secret
      const validResult = serverEnvSchema.safeParse({
        ...validBase,
        JWT_ACCESS_SECRET: "a-secure-production-secret-of-adequate-length-32+",
      });
      expect(validResult.success).toBe(true);

      vi.unstubAllEnvs();
    });
  });
});
