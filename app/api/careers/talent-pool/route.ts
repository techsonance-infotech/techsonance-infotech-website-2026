import "server-only";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { CareerApplyService } from "@/lib/services/career-apply.service";
import { talentPoolSubmissionSchema } from "@/lib/validations/careers";
import { AppError, ErrorCode, STATUS_BY_CODE, toFieldErrors } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { logger } from "@/lib/logger";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";
import { getRequestId } from "@/lib/server/requestContext";
import { isAllowedOrigin } from "@/lib/utils/text";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const requestId = await getRequestId();

  // 1. Origin verification
  const origin = req.headers.get("origin");
  if (origin && !isAllowedOrigin(origin)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Forbidden origin",
        errorPayload: {
          code: ErrorCode.FORBIDDEN,
          message: "Forbidden origin",
          requestId,
        },
        code: ErrorCode.FORBIDDEN,
        message: "Forbidden origin",
      },
      {
        status: 403,
        headers: { "x-request-id": requestId },
      },
    );
  }

  // 2. Rate limiting (10 submissions per minute per IP)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  try {
    await enforceRateLimit({ key: "talent-pool", limit: 10, windowSec: 60 }, ip);
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
          },
          code: rlErr.code,
          message: rlErr.message,
        },
        {
          status: STATUS_BY_CODE[rlErr.code] || 429,
          headers: { "x-request-id": requestId },
        },
      );
    }
    throw rlErr;
  }

  const contentType = req.headers.get("content-type") || "";

  let rawPayload: Record<string, unknown> = {};
  let resumeFile: File | undefined;

  // 3. Extract payload based on Content-Type
  try {
    if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await req.formData();

      // Honeypot check for bots
      const honeypot = formData.get("website_url") || formData.get("_hp");
      if (honeypot && String(honeypot).trim().length > 0) {
        return NextResponse.json(
          {
            ok: true,
            data: { id: "simulated-id" },
            id: "simulated-id",
          },
          {
            status: 200,
            headers: { "x-request-id": requestId },
          },
        );
      }

      rawPayload = {
        siteId: formData.get("siteId") || undefined,
        name: formData.get("name") || "",
        email: formData.get("email") || "",
        phone: formData.get("phone") || undefined,
        preferredRole: formData.get("preferredRole") || undefined,
        experienceLevel: formData.get("experienceLevel") || undefined,
        portfolioUrl: formData.get("portfolioUrl") || undefined,
        notes: formData.get("notes") || undefined,
        skills: formData.get("skills") || undefined,
        privacyConsent: formData.get("privacyConsent") !== "false",
      };

      const file = formData.get("resume") || formData.get("resumeFile");
      if (file && typeof file === "object" && "size" in file && (file as File).size > 0) {
        resumeFile = file as File;
      }
    } else {
      const body = await req.json().catch(() => ({}));

      // Honeypot check for bots
      if (body.website_url || body._hp) {
        return NextResponse.json(
          {
            ok: true,
            data: { id: "simulated-id" },
            id: "simulated-id",
          },
          {
            status: 200,
            headers: { "x-request-id": requestId },
          },
        );
      }

      rawPayload = body;
    }
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Malformed request payload",
        errorPayload: {
          code: ErrorCode.BAD_REQUEST,
          message: "Malformed request payload",
          requestId,
        },
        code: ErrorCode.BAD_REQUEST,
        message: "Malformed request payload",
      },
      {
        status: 400,
        headers: { "x-request-id": requestId },
      },
    );
  }

  // 4. Strict Zod schema validation
  const validationResult = talentPoolSubmissionSchema.safeParse(rawPayload);
  if (!validationResult.success) {
    const fieldErrors = toFieldErrors(validationResult.error);
    const firstIssue =
      validationResult.error.issues[0]?.message || CAREER_ERRORS.FULL_NAME_REQUIRED;
    return NextResponse.json(
      {
        ok: false,
        error: firstIssue,
        errorPayload: {
          code: ErrorCode.VALIDATION,
          message: firstIssue,
          fieldErrors,
          requestId,
        },
        code: ErrorCode.VALIDATION,
        message: firstIssue,
      },
      {
        status: 400,
        headers: { "x-request-id": requestId },
      },
    );
  }

  const validData = validationResult.data;

  // 5. Submit candidate profile to talent pool service
  try {
    const container = getContainer();
    const applyService = container.get(CareerApplyService);

    const result = await applyService.submitTalentPool({
      siteId: validData.siteId,
      name: validData.name,
      email: validData.email,
      phone: validData.phone,
      skills: validData.skills,
      preferredRole: validData.preferredRole,
      experienceLevel: validData.experienceLevel,
      portfolioUrl: validData.portfolioUrl,
      notes: validData.notes,
      resumeFile,
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          id: result.id,
          name: result.name,
          email: result.email,
        },
        id: result.id,
      },
      {
        status: 200,
        headers: {
          "x-request-id": requestId,
          "Cache-Control": "no-store, private",
        },
      },
    );
  } catch (error: unknown) {
    if (error instanceof AppError) {
      const httpStatus = STATUS_BY_CODE[error.code] || 400;
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          errorPayload: {
            code: error.code,
            message: error.message,
            requestId,
          },
          code: error.code,
          message: error.message,
        },
        {
          status: httpStatus,
          headers: { "x-request-id": requestId },
        },
      );
    }

    logger.error("Talent pool submission error", { error: String(error), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: CAREER_ERRORS.UNEXPECTED_TALENT_POOL_ERROR,
        errorPayload: {
          code: ErrorCode.INTERNAL,
          message: CAREER_ERRORS.UNEXPECTED_TALENT_POOL_ERROR,
          requestId,
        },
        code: ErrorCode.INTERNAL,
        message: CAREER_ERRORS.UNEXPECTED_TALENT_POOL_ERROR,
      },
      {
        status: 500,
        headers: { "x-request-id": requestId },
      },
    );
  }
}
