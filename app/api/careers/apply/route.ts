import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { CareerApplyService, type ScreeningAnswerInput } from "@/lib/services/career-apply.service";
import { careerApplyFormSchema } from "@/lib/validations/careers";
import { AppError, STATUS_BY_CODE, toFieldErrors } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/server/requestContext";
import { isAllowedOrigin } from "@/lib/utils/text";
import { CAREER_ERRORS, DEFAULT_APPLICATION_SOURCE } from "@/lib/constants/careers.constants";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const requestId = await getRequestId();
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("x-request-id", requestId);

  try {
    // 1. Origin check
    const origin = req.headers.get("origin");
    if (origin && !isAllowedOrigin(origin)) {
      logger.warn(`[API Careers Apply] Origin rejected: ${origin}`, { requestId });
      return NextResponse.json(
        {
          ok: false,
          error: "Forbidden origin",
          errorPayload: {
            code: "FORBIDDEN",
            message: "Forbidden origin",
            requestId,
          },
        },
        { status: 403, headers },
      );
    }

    // 2. IP identification & rate limiting (5 reqs / minute)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip")?.trim() ||
      "127.0.0.1";
    try {
      await enforceRateLimit({ key: "career-apply", limit: 5, windowSec: 60 }, ip);
    } catch (rlErr: unknown) {
      if (rlErr instanceof AppError) {
        return NextResponse.json(
          {
            ok: false,
            error: rlErr.message,
            errorPayload: {
              code: rlErr.code,
              message: rlErr.message,
              requestId,
              retryAfterSec: rlErr.retryAfterSec,
            },
          },
          { status: STATUS_BY_CODE[rlErr.code] || 429, headers },
        );
      }
      throw rlErr;
    }

    // 3. Parse FormData
    const formData = await req.formData();

    // 4. Bot Honeypot Check (hidden fields "website_url", "_hp", or "botCheck")
    const honeypot = formData.get("website_url") || formData.get("_hp") || formData.get("botCheck");
    if (honeypot && String(honeypot).trim().length > 0) {
      logger.info(
        `[API Careers Apply] Honeypot triggered for IP ${ip}. Defeating bot retry loop.`,
        { requestId },
      );
      // Silently succeed to defeat spam bot retry loops
      return NextResponse.json(
        {
          ok: true,
          data: {
            applicationId: "simulated-id",
            status: "NEW",
          },
          applicationId: "simulated-id",
          status: "NEW",
        },
        { status: 200, headers },
      );
    }

    // 5. Validate payload with Zod DTO schema
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
      return NextResponse.json(
        {
          ok: false,
          error: firstIssue,
          errorPayload: {
            code: "VALIDATION",
            message: firstIssue,
            fieldErrors: toFieldErrors(validationResult.error),
            requestId,
          },
        },
        { status: 400, headers },
      );
    }

    const validated = validationResult.data;

    // 6. Resume document check
    const resumeFile = (formData.get("resumeFile") || formData.get("resume")) as File | null;
    if (
      !resumeFile ||
      (typeof resumeFile === "object" && "size" in resumeFile && resumeFile.size === 0)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: CAREER_ERRORS.RESUME_DOCUMENT_REQUIRED,
          errorPayload: {
            code: "BAD_REQUEST",
            message: CAREER_ERRORS.RESUME_DOCUMENT_REQUIRED,
            requestId,
          },
        },
        { status: 400, headers },
      );
    }

    // 7. Parse optional voluntary EEOC answers
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
      { requestId },
    );

    // 8. Execute CareerApplyService
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
      { requestId, applicationId: application.id },
    );

    return NextResponse.json(
      {
        ok: true,
        data: {
          applicationId: application.id,
          status: application.status,
        },
        applicationId: application.id,
        status: application.status,
      },
      { status: 200, headers },
    );
  } catch (error: unknown) {
    if (error instanceof AppError) {
      logger.warn(`[API Careers Apply] Application rejected (${error.code}): ${error.message}`, {
        requestId,
      });
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          errorPayload: {
            code: error.code,
            message: error.message,
            requestId,
            ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
            ...(error.retryAfterSec !== undefined ? { retryAfterSec: error.retryAfterSec } : {}),
          },
        },
        { status: STATUS_BY_CODE[error.code] || 400, headers },
      );
    }
    logger.error(`[API Careers Apply] Unhandled error: ${String(error)}`, {
      requestId,
      cause: error,
    });
    return NextResponse.json(
      {
        ok: false,
        error: CAREER_ERRORS.UNEXPECTED_APPLICATION_ERROR,
        errorPayload: {
          code: "INTERNAL",
          message: CAREER_ERRORS.UNEXPECTED_APPLICATION_ERROR,
          requestId,
        },
      },
      { status: 500, headers },
    );
  }
}
