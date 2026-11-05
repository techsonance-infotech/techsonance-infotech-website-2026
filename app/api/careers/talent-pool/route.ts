import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { CareerApplyService } from "@/lib/services/career-apply.service";
import { AppError, STATUS_BY_CODE } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { logger } from "@/lib/logger";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";

export async function POST(req: Request) {
  try {
    // 1. Rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    try {
      await enforceRateLimit({ key: "talent-pool", limit: 10, windowSec: 60 }, ip);
    } catch (rlErr: unknown) {
      if (rlErr instanceof AppError) {
        return NextResponse.json(
          { ok: false, error: rlErr.message },
          { status: STATUS_BY_CODE[rlErr.code] || 429 },
        );
      }
      throw rlErr;
    }

    const contentType = req.headers.get("content-type") || "";

    let name = "";
    let email = "";
    let phone: string | undefined;
    let skills: string[] = [];
    let preferredRole: string | undefined;
    let experienceLevel: string | undefined;
    let portfolioUrl: string | undefined;
    let notes: string | undefined;
    let resumeFile: File | undefined;
    let siteId: string | undefined;

    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();

      // Honeypot check
      const honeypot = formData.get("website_url") || formData.get("_hp");
      if (honeypot && String(honeypot).trim().length > 0) {
        return NextResponse.json({ ok: true, id: "simulated-id" });
      }

      siteId = formData.get("siteId") ? String(formData.get("siteId")).trim() : undefined;
      name = String(formData.get("name") || "").trim();
      email = String(formData.get("email") || "").trim();
      phone = formData.get("phone") ? String(formData.get("phone")).trim() : undefined;
      preferredRole = formData.get("preferredRole")
        ? String(formData.get("preferredRole")).trim()
        : undefined;
      experienceLevel = formData.get("experienceLevel")
        ? String(formData.get("experienceLevel")).trim()
        : undefined;
      portfolioUrl = formData.get("portfolioUrl")
        ? String(formData.get("portfolioUrl")).trim()
        : undefined;
      notes = formData.get("notes") ? String(formData.get("notes")).trim() : undefined;

      const rawSkills = formData.get("skills");
      if (rawSkills) {
        if (typeof rawSkills === "string") {
          try {
            const parsed = JSON.parse(rawSkills);
            if (Array.isArray(parsed)) skills = parsed.map(String);
            else skills = rawSkills.split(",").map((s) => s.trim()).filter(Boolean);
          } catch {
            skills = rawSkills.split(",").map((s) => s.trim()).filter(Boolean);
          }
        }
      }

      const file = formData.get("resume") || formData.get("resumeFile");
      if (file && typeof file === "object" && "size" in file && (file as File).size > 0) {
        resumeFile = file as File;
      }
    } else {
      const body = await req.json();

      // Honeypot check
      if (body.website_url || body._hp) {
        return NextResponse.json({ ok: true, id: "simulated-id" });
      }

      siteId = body.siteId ? String(body.siteId).trim() : undefined;
      name = String(body.name || "").trim();
      email = String(body.email || "").trim();
      phone = body.phone ? String(body.phone).trim() : undefined;
      preferredRole = body.preferredRole ? String(body.preferredRole).trim() : undefined;
      experienceLevel = body.experienceLevel ? String(body.experienceLevel).trim() : undefined;
      portfolioUrl = body.portfolioUrl ? String(body.portfolioUrl).trim() : undefined;
      notes = body.notes ? String(body.notes).trim() : undefined;

      if (Array.isArray(body.skills)) {
        skills = body.skills.map(String);
      } else if (typeof body.skills === "string") {
        skills = body.skills.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
    }

    if (!name) {
      return NextResponse.json({ ok: false, error: CAREER_ERRORS.FULL_NAME_REQUIRED }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ ok: false, error: CAREER_ERRORS.EMAIL_REQUIRED }, { status: 400 });
    }

    const container = getContainer();
    const applyService = container.get(CareerApplyService);

    const result = await applyService.submitTalentPool({
      siteId,
      name,
      email,
      phone,
      skills,
      preferredRole,
      experienceLevel,
      portfolioUrl,
      resumeFile,
      notes,
    });

    return NextResponse.json({
      ok: true,
      id: result.id,
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    logger.error(`Talent pool submission error: ${String(error)}`);
    return NextResponse.json(
      { ok: false, error: CAREER_ERRORS.UNEXPECTED_TALENT_POOL_ERROR },
      { status: 500 },
    );
  }
}
