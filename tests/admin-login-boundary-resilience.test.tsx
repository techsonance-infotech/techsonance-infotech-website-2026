import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderToString } from "react-dom/server";
import {
  safeAdminLoginResponseSchema,
  safeAdminLogoutResponseSchema,
  safeAdminRevalidateResponseSchema,
  safeAuthenticatedUserDtoSchema,
} from "@/lib/validations/admin-login-boundary.schema";
import { loginAdmin, logoutAdmin, revalidateAdminCache } from "@/lib/api/admin-governance.api";
import { ApiError } from "@/lib/http/safeFetch";
import { AdminRole } from "@/lib/constants/enums";
import { ErrorCode } from "@/lib/errors";
import AdminLoginError from "@/app/admin/login/error";
import AdminLoginLoading from "@/app/admin/login/loading";

describe("Admin Login — Boundary Schemas & Resilience Test Suite", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("1. Zod Boundary Schemas Defense", () => {
    it("parses valid authenticated user DTO correctly", () => {
      const payload = {
        id: "usr_123",
        email: "superadmin@techsonance.co.in",
        name: "Super Admin",
        role: AdminRole.ADMIN,
      };

      const result = safeAuthenticatedUserDtoSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("usr_123");
        expect(result.data.email).toBe("superadmin@techsonance.co.in");
        expect(result.data.name).toBe("Super Admin");
        expect(result.data.role).toBe(AdminRole.ADMIN);
      }
    });

    it("handles corrupted user DTO by applying safe fallbacks", () => {
      const corrupted = {
        id: 12345, // invalid type
        email: "not-an-email", // invalid email
        name: null, // missing name
        role: "unrecognized_role", // invalid role
        extraProperty: "extra", // should be retained via .loose()
      };

      const result = safeAuthenticatedUserDtoSchema.safeParse(corrupted);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("");
        expect(result.data.email).toBe("admin@techsonance.co.in");
        expect(result.data.name).toBe("Admin");
        expect(result.data.role).toBe(AdminRole.VIEWER);
        expect((result.data as Record<string, unknown>).extraProperty).toBe("extra");
      }
    });

    it("parses login response envelope correctly", () => {
      const payload = {
        user: {
          id: "u_456",
          email: "editor@techsonance.co.in",
          name: "Lead Editor",
          role: AdminRole.EDITOR,
        },
        message: "Welcome back!",
      };

      const result = safeAdminLoginResponseSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.role).toBe(AdminRole.EDITOR);
        expect(result.data.message).toBe("Welcome back!");
      }
    });

    it("parses logout and revalidate schemas with fallbacks", () => {
      const emptyLogout = {};
      const parsedLogout = safeAdminLogoutResponseSchema.safeParse(emptyLogout);
      expect(parsedLogout.success).toBe(true);
      if (parsedLogout.success) {
        expect(parsedLogout.data.message).toBe("Signed out successfully");
      }

      const emptyRevalidate = {};
      const parsedRevalidate = safeAdminRevalidateResponseSchema.safeParse(emptyRevalidate);
      expect(parsedRevalidate.success).toBe(true);
      if (parsedRevalidate.success) {
        expect(parsedRevalidate.data.revalidatedTags).toEqual([]);
        expect(parsedRevalidate.data.revalidatedPaths).toEqual([]);
        expect(typeof parsedRevalidate.data.timestamp).toBe("string");
      }
    });
  });

  describe("2. Admin Governance API Client with safeFetch", () => {
    it("authenticates admin successfully on HTTP 200 with standard envelope", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          "content-type": "application/json",
          "x-request-id": "req-login-123",
        }),
        json: async () => ({
          ok: true,
          data: {
            user: {
              id: "usr_owner_1",
              email: "owner@techsonance.co.in",
              name: "Agency Owner",
              role: AdminRole.OWNER,
            },
            message: "Signed in successfully",
          },
        }),
      });

      const response = await loginAdmin({
        email: "owner@techsonance.co.in",
        password: "SuperSecretPassword123!",
      });

      expect(response.user.id).toBe("usr_owner_1");
      expect(response.user.role).toBe(AdminRole.OWNER);
      expect(response.message).toBe("Signed in successfully");
    });

    it("throws ApiError with UNAUTHENTICATED on HTTP 401 invalid credentials", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({
          "content-type": "application/json",
          "x-request-id": "req-err-401",
        }),
        json: async () => ({
          ok: false,
          error: {
            code: ErrorCode.UNAUTHENTICATED,
            message: "Invalid email or password",
          },
        }),
      });

      await expect(
        loginAdmin({
          email: "wrong@techsonance.co.in",
          password: "wrongPassword",
        }),
      ).rejects.toThrowError("Invalid email or password");
    });

    it("throws ApiError with RATE_LIMITED on HTTP 429 too many attempts", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({
          "content-type": "application/json",
          "x-request-id": "req-err-429",
          "retry-after": "60",
        }),
        json: async () => ({
          ok: false,
          error: {
            code: ErrorCode.RATE_LIMITED,
            message: "Too many login attempts. Please try again later.",
          },
        }),
      });

      await expect(
        loginAdmin({
          email: "admin@techsonance.co.in",
          password: "guess",
        }),
      ).rejects.toSatisfy((err: unknown) => {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.status).toBe(429);
        expect(apiErr.code).toBe(ErrorCode.RATE_LIMITED);
        return true;
      });
    });

    it("throws ApiError with INTERNAL on non-JSON HTML proxy response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        headers: new Headers({
          "content-type": "text/html",
        }),
        json: async () => {
          throw new Error("Unexpected token < in JSON");
        },
      });

      await expect(
        loginAdmin({
          email: "admin@techsonance.co.in",
          password: "password123",
        }),
      ).rejects.toSatisfy((err: unknown) => {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.status).toBe(502);
        expect(apiErr.message).toContain("Received unexpected non-JSON response");
        return true;
      });
    });

    it("aborts when caller signal triggers cancellation", async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        loginAdmin(
          {
            email: "admin@techsonance.co.in",
            password: "password123",
          },
          { signal: controller.signal },
        ),
      ).rejects.toSatisfy((err: unknown) => {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.code).toBe(ErrorCode.UNAVAILABLE);
        return true;
      });
    });

    it("calls logoutAdmin and returns sanitized response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          ok: true,
          data: { message: "Signed out successfully" },
        }),
      });

      const res = await logoutAdmin();
      expect(res.message).toBe("Signed out successfully");
    });

    it("calls revalidateAdminCache and returns sanitized response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          ok: true,
          data: {
            revalidatedTags: ["careers"],
            revalidatedPaths: ["/careers"],
            timestamp: "2026-11-07T12:00:00.000Z",
          },
        }),
      });

      const res = await revalidateAdminCache({ tags: ["careers"] });
      expect(res.revalidatedTags).toEqual(["careers"]);
      expect(res.revalidatedPaths).toEqual(["/careers"]);
    });
  });

  describe("3. Route Error & Loading Boundaries", () => {
    it("renders AdminLoginError with alert role, error message, and reference code", () => {
      const testError = Object.assign(new Error("Database auth handshake failed"), {
        digest: "ERR_AUTH_101",
      });

      const html = renderToString(<AdminLoginError error={testError} reset={() => {}} />);

      expect(html).toContain('role="alert"');
      expect(html).toContain("Authentication Error");
      expect(html).toContain("Database auth handshake failed");
      expect(html).toContain("ERR_AUTH_101");
      expect(html).toContain("Retry Authentication Portal");
      expect(html).toContain("Return to Main Website");
    });

    it("renders AdminLoginLoading skeleton with aria-busy indicator", () => {
      const html = renderToString(<AdminLoginLoading />);
      expect(html).toContain('aria-busy="true"');
      expect(html).toContain('aria-label="Loading authentication portal"');
    });
  });
});
