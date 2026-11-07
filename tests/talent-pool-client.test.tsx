import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { submitTalentPool } from "@/lib/api/careers.api";
import { TalentPoolCaptureModal } from "@/components/careers/TalentPoolCaptureModal";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

describe("Talent Pool Client API & Modal Integration", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("submitTalentPool", () => {
    it("submits JSON payload when no resume is attached", async () => {
      const mockResponse = {
        ok: true,
        data: {
          id: "tp-12345",
          name: "Alex Morgan",
          email: "alex@example.com",
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      const result = await submitTalentPool({
        name: "Alex Morgan",
        email: "alex@example.com",
        preferredRole: "Full Stack Engineer",
        skills: "React, Node.js",
        privacyConsent: true,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.CAREERS.TALENT_POOL,
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );

      expect(result.id).toBe("tp-12345");
      expect(result.name).toBe("Alex Morgan");
    });

    it("submits FormData payload when resumeFile is provided", async () => {
      const mockFile = new File(["%PDF-1.4 dummy"], "resume.pdf", { type: "application/pdf" });
      const mockResponse = {
        ok: true,
        data: {
          id: "tp-67890",
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      const result = await submitTalentPool({
        name: "Alex Morgan",
        email: "alex@example.com",
        privacyConsent: true,
        resumeFile: mockFile,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.CAREERS.TALENT_POOL,
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        }),
      );

      expect(result.id).toBe("tp-67890");
    });

    it("throws on error response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({
          ok: false,
          error: "Invalid email address",
        }),
      } as unknown as Response);

      await expect(
        submitTalentPool({
          name: "A",
          email: "bad-email",
          privacyConsent: true,
        }),
      ).rejects.toThrow("Invalid email address");
    });
  });

  describe("TalentPoolCaptureModal Component", () => {
    it("renders form when isOpen is true", () => {
      const html = renderToString(<TalentPoolCaptureModal isOpen={true} onClose={() => {}} />);

      expect(html).toContain("Join our Global Talent Pool");
      expect(html).toContain("Full Name *");
      expect(html).toContain("Email *");
      expect(html).toContain("Desired Role");
      expect(html).toContain("Experience Level");
      expect(html).toContain("Join Talent Pool");
    });

    it("returns null when isOpen is false", () => {
      const html = renderToString(<TalentPoolCaptureModal isOpen={false} onClose={() => {}} />);

      expect(html).toBe("");
    });
  });
});
