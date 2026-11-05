import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { CareerApplyService } from "@/lib/services/career-apply.service";
import { careerInquirySchema } from "@/lib/validations/careers";
import { AppError, STATUS_BY_CODE } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { logger } from "@/lib/logger";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";

export async function POST(req: Request) {
  try {
    // 1. IP identification & rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    try {
      await enforceRateLimit({ key: "career-inquiry", limit: 5, windowSec: 60 }, ip);
    } catch (rlErr: unknown) {
      if (rlErr instanceof AppError) {
        return NextResponse.json(
          { ok: false, error: rlErr.message },
          { status: STATUS_BY_CODE[rlErr.code] || 429 },
        );
      }
      throw rlErr;
    }

    // 2. Parse payload (supports multipart/form-data or application/json)
    const contentType = req.headers.get("content-type") || "";
    let parsedFields: Record<string, unknown> = {};
    let resumeFile: File | null = null;

    if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await req.formData();

      // Bot honeypot check
      const honeypot =
        formData.get("website_url") || formData.get("_hp") || formData.get("botCheck");
      if (honeypot && String(honeypot).trim().length > 0) {
        return NextResponse.json({ ok: true, message: CAREER_ERRORS.INQUIRY_RECEIVED_SUCCESS });
      }

      parsedFields = {
        fullName: formData.get("fullName") || undefined,
        email: formData.get("email") || undefined,
        role: formData.get("role") || undefined,
        message: formData.get("message") || undefined,
        website_url: formData.get("website_url") || undefined,
        _hp: formData.get("_hp") || undefined,
        botCheck: formData.get("botCheck") || undefined,
      };

      const file = formData.get("resume") || formData.get("resumeFile");
      if (file && typeof file === "object" && "size" in file && (file as File).size > 0) {
        resumeFile = file as File;
      }
    } else {
      const body = await req.json();

      // Bot honeypot check
      if (body.website_url || body._hp || body.botCheck) {
        return NextResponse.json({ ok: true, message: CAREER_ERRORS.INQUIRY_RECEIVED_SUCCESS });
      }

      parsedFields = body;
    }

    // 3. Schema validation
    const validationResult = careerInquirySchema.safeParse(parsedFields);
    if (!validationResult.success) {
      const firstError =
        validationResult.error.issues[0]?.message || CAREER_ERRORS.VALIDATION_FAILED;
      return NextResponse.json({ ok: false, error: firstError }, { status: 400 });
    }

    const { fullName, email, role, message } = validationResult.data;

    // 4. Delegate to CareerApplyService
    const container = getContainer();
    const service = container.get(CareerApplyService);

    const result = await service.submitCareerInquiry({
      fullName,
      email,
      role,
      message,
      resumeFile,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      logger.warn(`[API Careers Inquiry] Rejected (${error.code}): ${error.message}`);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: STATUS_BY_CODE[error.code] || 400 },
      );
    }
    logger.error(`[API Careers Inquiry] Unhandled error: ${String(error)}`);
    return NextResponse.json(
      { ok: false, error: CAREER_ERRORS.UNEXPECTED_APPLICATION_ERROR },
      { status: 500 },
    );
  }
}
