import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { CareerApplyService } from "@/lib/services/career-apply.service";
import { AppError, STATUS_BY_CODE } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    // 1. IP identification & rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    try {
      await enforceRateLimit({ key: "career-apply", limit: 5, windowSec: 60 }, ip);
    } catch (rlErr: unknown) {
      if (rlErr instanceof AppError) {
        return NextResponse.json(
          { ok: false, error: rlErr.message },
          { status: STATUS_BY_CODE[rlErr.code] || 429 },
        );
      }
      throw rlErr;
    }

    // 2. Parse FormData
    const formData = await req.formData();

    // 3. Bot Honeypot Check (hidden fields "website_url", "_hp", or "botCheck")
    const honeypot =
      formData.get("website_url") || formData.get("_hp") || formData.get("botCheck");
    if (honeypot && String(honeypot).trim().length > 0) {
      // Silently succeed to defeat spam bot retry loops
      return NextResponse.json({ ok: true, applicationId: "simulated-id" });
    }

    const jobId = String(formData.get("jobId") || "").trim();
    const candidateName = String(formData.get("candidateName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = formData.get("phone") ? String(formData.get("phone")).trim() : undefined;
    const currentLocation = formData.get("currentLocation")
      ? String(formData.get("currentLocation")).trim()
      : undefined;
    const portfolioUrl = formData.get("portfolioUrl")
      ? String(formData.get("portfolioUrl")).trim()
      : undefined;
    const githubUrl = formData.get("githubUrl")
      ? String(formData.get("githubUrl")).trim()
      : undefined;
    const linkedinUrl = formData.get("linkedinUrl")
      ? String(formData.get("linkedinUrl")).trim()
      : undefined;
    const coverLetter = formData.get("coverLetter")
      ? String(formData.get("coverLetter")).trim()
      : undefined;
    const noticePeriodWeeks = formData.get("noticePeriodWeeks")
      ? Number(formData.get("noticePeriodWeeks"))
      : undefined;
    const privacyConsent =
      formData.get("privacyConsent") === "true" || formData.get("privacyConsent") === "on";
    const talentPoolConsent =
      formData.get("talentPoolConsent") === "true" || formData.get("talentPoolConsent") === "on";
    const source = formData.get("source") ? String(formData.get("source")).trim() : "direct";

    // Parse screening answers if provided
    let screeningAnswers: any[] = [];
    const rawScreening = formData.get("screeningAnswers");
    if (rawScreening && typeof rawScreening === "string") {
      try {
        screeningAnswers = JSON.parse(rawScreening);
      } catch {
        screeningAnswers = [];
      }
    }

    const resumeFile = (formData.get("resumeFile") || formData.get("resume")) as File | null;

    if (!jobId) {
      return NextResponse.json({ ok: false, error: "Job ID is required" }, { status: 400 });
    }

    if (!candidateName) {
      return NextResponse.json({ ok: false, error: "Candidate name is required" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email address is required" }, { status: 400 });
    }

    if (!resumeFile) {
      return NextResponse.json({ ok: false, error: "Resume document is required" }, { status: 400 });
    }

    // 4. Execute CareerApplyService
    const container = getContainer();
    const applyService = container.get(CareerApplyService);

    const application = await applyService.submitApplication({
      jobId,
      candidateName,
      email,
      phone,
      currentLocation,
      portfolioUrl,
      githubUrl,
      linkedinUrl,
      resumeFile,
      coverLetter,
      noticePeriodWeeks,
      screeningAnswers,
      privacyConsent,
      talentPoolConsent,
      source,
    });

    return NextResponse.json({
      ok: true,
      applicationId: application.id,
      status: application.status,
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    logger.error(`Career application submission error: ${String(error)}`);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred while processing your application." },
      { status: 500 },
    );
  }
}
