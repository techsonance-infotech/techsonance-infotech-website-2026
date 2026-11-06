import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/careers/talent-pool/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { CareerApplyService } from "@/lib/services/career-apply.service";
import { AppError, ErrorCode } from "@/lib/errors";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";

describe("POST /api/careers/talent-pool — End-to-End Black Box Tests", () => {
  let mockApplyService: any;

  const validTalentId = "t1111111-2222-4333-8444-555555555555";
  const validCandidate = {
    id: validTalentId,
    name: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    phone: "+919876543210",
    skills: ["React", "TypeScript", "Next.js"],
    preferredRole: "Senior Frontend Engineer",
    experienceLevel: "senior",
  };

  beforeEach(() => {
    resetRootContainer();

    mockApplyService = {
      submitTalentPool: vi.fn().mockResolvedValue(validCandidate),
    };

    const container = getContainer();
    container.bind({ provide: CareerApplyService, useValue: mockApplyService });
  });

  it("1. Rejects foreign origin with 403 FORBIDDEN", async () => {
    const req = new Request("http://localhost:3000/api/careers/talent-pool", {
      method: "POST",
      headers: {
        origin: "https://evil-spoofing-site.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Aarav Sharma",
        email: "aarav.sharma@example.com",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.ok).toBe(false);
    expect(json.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.message).toBe("Forbidden origin");
  });

  it("2. Defeats spam bots when honeypot field is triggered", async () => {
    const req = new Request("http://localhost:3000/api/careers/talent-pool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        website_url: "https://spam-bot.ru",
        name: "Spam Bot",
        email: "bot@spam.com",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.id).toBe("simulated-id");
    expect(mockApplyService.submitTalentPool).not.toHaveBeenCalled();
  });

  it("3. Rejects missing name with 400 VALIDATION", async () => {
    const req = new Request("http://localhost:3000/api/careers/talent-pool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "",
        email: "aarav@example.com",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.code).toBe(ErrorCode.VALIDATION);
    expect(json.errorPayload?.fieldErrors?.name).toBeDefined();
  });

  it("4. Rejects invalid email address with 400 VALIDATION", async () => {
    const req = new Request("http://localhost:3000/api/careers/talent-pool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Aarav Sharma",
        email: "not-an-email",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.code).toBe(ErrorCode.VALIDATION);
    expect(json.errorPayload?.fieldErrors?.email).toBeDefined();
  });

  it("5. Happy path (JSON payload): submits candidate and returns full envelope", async () => {
    const req = new Request("http://localhost:3000/api/careers/talent-pool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Aarav Sharma",
        email: "aarav.sharma@example.com",
        phone: "+919876543210",
        skills: ["React", "TypeScript", "Next.js"],
        preferredRole: "Senior Frontend Engineer",
        experienceLevel: "senior",
        notes: "Excited about engineering opportunities.",
        privacyConsent: true,
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.id).toBe(validTalentId);
    expect(json.data.name).toBe("Aarav Sharma");
    expect(json.data.email).toBe("aarav.sharma@example.com");
    expect(json.id).toBe(validTalentId); // Backward compatibility
    expect(res.headers.get("x-request-id")).toBeDefined();
    expect(res.headers.get("Cache-Control")).toBe("no-store, private");
  });

  it("6. Happy path (Multipart FormData payload with resume): extracts fields and file", async () => {
    const formData = new FormData();
    formData.append("name", "Aarav Sharma");
    formData.append("email", "aarav.sharma@example.com");
    formData.append("skills", "React, Node.js, GraphQL");
    formData.append("preferredRole", "Fullstack Architect");

    const resumeBlob = new Blob(["%PDF-1.4 test resume content"], { type: "application/pdf" });
    formData.append("resumeFile", resumeBlob, "aarav_resume.pdf");

    const req = new Request("http://localhost:3000/api/careers/talent-pool", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.id).toBe(validTalentId);
    expect(mockApplyService.submitTalentPool).toHaveBeenCalled();
  });

  it("7. Handles unexpected service crash gracefully with 500 INTERNAL", async () => {
    mockApplyService.submitTalentPool.mockRejectedValueOnce(
      new Error("Database connection pool timeout"),
    );

    const req = new Request("http://localhost:3000/api/careers/talent-pool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Aarav Sharma",
        email: "aarav.sharma@example.com",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.code).toBe(ErrorCode.INTERNAL);
    expect(json.error).toBe(CAREER_ERRORS.UNEXPECTED_TALENT_POOL_ERROR);
  });
});
