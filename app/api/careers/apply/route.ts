import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { CareerApplyService, type ScreeningAnswerInput } from "@/lib/services/career-apply.service";
import { AppError, STATUS_BY_CODE } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { logger } from "@/lib/logger";
import {
  CAREER_ERRORS,
  DEFAULT_APPLICATION_SOURCE,
} from "@/lib/constants/careers.constants";

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

    logger.info(
      `[API Careers Apply] Incoming application for jobId="${jobId}", candidate="${candidateName}" <${email}>`,
    );
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
    const source = formData.get("source") ? String(formData.get("source")).trim() : DEFAULT_APPLICATION_SOURCE;

    // Parse screening answers if provided
    let screeningAnswers: ScreeningAnswerInput[] = [];
    const rawScreening = formData.get("screeningAnswers");
    if (rawScreening && typeof rawScreening === "string") {
      try {
        screeningAnswers = JSON.parse(rawScreening);
      } catch {
        screeningAnswers = [];
      }
    }

    // Parse optional voluntary EEOC answers if provided
    let eeoc:
      | {
          gender?: string;
          ethnicity?: string;
          veteranStatus?: string;
          disabilityStatus?: string;
        }
      | undefined;
    const rawEeoc = formData.get("eeoc");
    if (rawEeoc && typeof rawEeoc === "string") {
      try {
        eeoc = JSON.parse(rawEeoc);
      } catch {
        eeoc = undefined;
      }
    } else {
      const gender = formData.get("eeocGender")
        ? String(formData.get("eeocGender")).trim()
        : undefined;
      const ethnicity = formData.get("eeocEthnicity")
        ? String(formData.get("eeocEthnicity")).trim()
        : undefined;
      const veteranStatus = formData.get("eeocVeteranStatus")
        ? String(formData.get("eeocVeteranStatus")).trim()
        : undefined;
      const disabilityStatus = formData.get("eeocDisabilityStatus")
        ? String(formData.get("eeocDisabilityStatus")).trim()
        : undefined;
      if (gender || ethnicity || veteranStatus || disabilityStatus) {
        eeoc = { gender, ethnicity, veteranStatus, disabilityStatus };
      }
    }

    const resumeFile = (formData.get("resumeFile") || formData.get("resume")) as File | null;

    if (!jobId) {
      return NextResponse.json({ ok: false, error: CAREER_ERRORS.JOB_ID_REQUIRED }, { status: 400 });
    }

    if (!candidateName) {
      return NextResponse.json({ ok: false, error: CAREER_ERRORS.CANDIDATE_NAME_REQUIRED }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ ok: false, error: CAREER_ERRORS.EMAIL_REQUIRED }, { status: 400 });
    }

    if (!resumeFile) {
      return NextResponse.json({ ok: false, error: CAREER_ERRORS.RESUME_DOCUMENT_REQUIRED }, { status: 400 });
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
      eeoc,
      source,
    });

    logger.info(
      `[API Careers Apply] Success! Created application ID="${application.id}" for jobId="${jobId}"`,
    );

    return NextResponse.json({
      ok: true,
      applicationId: application.id,
      status: application.status,
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      logger.warn(
        `[API Careers Apply] Application rejected (${error.code}): ${error.message}`,
      );
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    logger.error(`[API Careers Apply] Unhandled error: ${String(error)}`);
    return NextResponse.json(
      { ok: false, error: CAREER_ERRORS.UNEXPECTED_APPLICATION_ERROR },
      { status: 500 },
    );
  }
}
