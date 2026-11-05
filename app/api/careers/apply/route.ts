import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { CareerApplyService, type ScreeningAnswerInput } from "@/lib/services/career-apply.service";
import { careerApplyFormSchema } from "@/lib/validations/careers";
import { AppError, STATUS_BY_CODE } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { logger } from "@/lib/logger";
import { CAREER_ERRORS, DEFAULT_APPLICATION_SOURCE } from "@/lib/constants/careers.constants";

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
    const honeypot = formData.get("website_url") || formData.get("_hp") || formData.get("botCheck");
    if (honeypot && String(honeypot).trim().length > 0) {
      // Silently succeed to defeat spam bot retry loops
      return NextResponse.json({ ok: true, applicationId: "simulated-id" });
    }

    // 4. Validate payload with Zod DTO schema
    const rawPayload = {
      jobId: formData.get("jobId"),
      candidateName: formData.get("candidateName"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
      currentLocation: formData.get("currentLocation") || undefined,
      portfolioUrl: formData.get("portfolioUrl") || undefined,
      githubUrl: formData.get("githubUrl") || undefined,
      linkedinUrl: formData.get("linkedinUrl") || undefined,
      coverLetter: formData.get("coverLetter") || undefined,
      noticePeriodWeeks: formData.get("noticePeriodWeeks") || undefined,
      privacyConsent: formData.get("privacyConsent"),
      talentPoolConsent: formData.get("talentPoolConsent"),
      source: formData.get("source") || DEFAULT_APPLICATION_SOURCE,
      screeningAnswers: formData.get("screeningAnswers"),
      website_url: formData.get("website_url") || undefined,
      _hp: formData.get("_hp") || undefined,
      botCheck: formData.get("botCheck") || undefined,
    };

    const validationResult = careerApplyFormSchema.safeParse(rawPayload);
    if (!validationResult.success) {
      const firstIssue =
        validationResult.error.issues[0]?.message || CAREER_ERRORS.VALIDATION_FAILED;
      return NextResponse.json({ ok: false, error: firstIssue }, { status: 400 });
    }

    const validated = validationResult.data;

    // 5. Resume document check
    const resumeFile = (formData.get("resumeFile") || formData.get("resume")) as File | null;
    if (
      !resumeFile ||
      (typeof resumeFile === "object" && "size" in resumeFile && resumeFile.size === 0)
    ) {
      return NextResponse.json(
        { ok: false, error: CAREER_ERRORS.RESUME_DOCUMENT_REQUIRED },
        { status: 400 },
      );
    }

    // 6. Parse optional voluntary EEOC answers
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

    logger.info(
      `[API Careers Apply] Incoming application for jobId="${validated.jobId}", candidate="${validated.candidateName}" <${validated.email}>`,
    );

    // 7. Execute CareerApplyService
    const container = getContainer();
    const applyService = container.get(CareerApplyService);

    const application = await applyService.submitApplication({
      jobId: validated.jobId,
      candidateName: validated.candidateName,
      email: validated.email,
      phone: validated.phone,
      currentLocation: validated.currentLocation,
      portfolioUrl: validated.portfolioUrl,
      githubUrl: validated.githubUrl,
      linkedinUrl: validated.linkedinUrl,
      resumeFile,
      coverLetter: validated.coverLetter,
      noticePeriodWeeks: validated.noticePeriodWeeks,
      screeningAnswers: validated.screeningAnswers as ScreeningAnswerInput[],
      privacyConsent: validated.privacyConsent,
      talentPoolConsent: validated.talentPoolConsent,
      eeoc,
      source: validated.source,
    });

    logger.info(
      `[API Careers Apply] Success! Created application ID="${application.id}" for jobId="${validated.jobId}"`,
    );

    return NextResponse.json({
      ok: true,
      applicationId: application.id,
      status: application.status,
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      logger.warn(`[API Careers Apply] Application rejected (${error.code}): ${error.message}`);
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
