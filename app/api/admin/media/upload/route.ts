import "server-only";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { MediaService } from "@/lib/services/media.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { logger } from "@/lib/logger";
import { AppError, ErrorCode, STATUS_BY_CODE } from "@/lib/errors";
import {
  MEDIA_ERRORS,
  MEDIA_LIMITS,
  MEDIA_AUTHOR_ROLES,
  ALLOWED_IMAGE_MIME_TYPES,
} from "@/lib/constants/media.constants";
import { validateImageMagicBytes, isAllowedImageMimeType } from "@/lib/utils/imageValidation";
import { getRequestId } from "@/lib/server/requestContext";
import { isAllowedOrigin } from "@/lib/utils/text";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const requestId = await getRequestId();
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("x-request-id", requestId);
  headers.set("Cache-Control", "private, no-store");

  try {
    // 1. Origin check
    const origin = req.headers.get("origin");
    if (origin && !isAllowedOrigin(origin)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: MEDIA_ERRORS.FORBIDDEN_ORIGIN,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
        },
        { status: 403, headers },
      );
    }

    // 2. Auth check
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.UNAUTHENTICATED,
            message: MEDIA_ERRORS.UNAUTHORIZED,
            requestId,
          },
          code: ErrorCode.UNAUTHENTICATED,
        },
        { status: 401, headers },
      );
    }

    // 3. RBAC check (Author, Editor, Admin, Owner permitted)
    if (!MEDIA_AUTHOR_ROLES.includes(session.role as (typeof MEDIA_AUTHOR_ROLES)[number])) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: MEDIA_ERRORS.FORBIDDEN_ROLE,
            requestId,
          },
          code: ErrorCode.FORBIDDEN,
        },
        { status: 403, headers },
      );
    }

    // 4. Multipart FormData parsing
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.BAD_REQUEST,
            message: "Malformed multipart form data in request body",
            requestId,
          },
          code: ErrorCode.BAD_REQUEST,
        },
        { status: 400, headers },
      );
    }

    const file = formData.get("file") as File | null;
    if (!file || (typeof file === "object" && "size" in file && file.size === 0)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.BAD_REQUEST,
            message: MEDIA_ERRORS.NO_FILE_PROVIDED,
            requestId,
          },
          code: ErrorCode.BAD_REQUEST,
        },
        { status: 400, headers },
      );
    }

    // 5. Size bounding (10MB limit)
    if (file.size > MEDIA_LIMITS.MAX_FILE_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.PAYLOAD_TOO_LARGE,
            message: MEDIA_ERRORS.FILE_TOO_LARGE,
            requestId,
          },
          code: ErrorCode.PAYLOAD_TOO_LARGE,
        },
        { status: 413, headers },
      );
    }

    // 6. MIME type validation
    const fileType = file.type || "application/octet-stream";
    if (!isAllowedImageMimeType(fileType)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.UNSUPPORTED_MEDIA,
            message: MEDIA_ERRORS.UNSUPPORTED_MEDIA_TYPE,
            requestId,
          },
          code: ErrorCode.UNSUPPORTED_MEDIA,
        },
        { status: 415, headers },
      );
    }

    // 7. Binary magic byte inspection
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const magicCheck = validateImageMagicBytes(buffer, fileType);

    if (!magicCheck.isValid) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.UNSUPPORTED_MEDIA,
            message: MEDIA_ERRORS.MAGIC_BYTE_MISMATCH,
            requestId,
          },
          code: ErrorCode.UNSUPPORTED_MEDIA,
        },
        { status: 415, headers },
      );
    }

    // 8. Folder sanitization & metadata
    const rawFolder = (formData.get("folder") as string) || MEDIA_LIMITS.DEFAULT_FOLDER;
    const sanitizedFolder = rawFolder
      .trim()
      .slice(0, MEDIA_LIMITS.FOLDER_MAX_LENGTH)
      .replace(/[^a-zA-Z0-9_\/-]/g, "");

    // 9. Execution via MediaService
    const mediaService = container.get(MediaService);
    const result = await mediaService.uploadImage(buffer, {
      folder: sanitizedFolder,
      tags: ["admin-upload", session.userId, magicCheck.detectedFormat || "image"],
    });

    return NextResponse.json(
      {
        ok: true,
        data: result,
        secureUrl: result.secureUrl,
        publicId: result.publicId,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        message: MEDIA_ERRORS.UPLOAD_SUCCESS,
      },
      { status: 201, headers },
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
            fieldErrors: error.fieldErrors,
            requestId,
          },
          code: error.code,
        },
        { status: STATUS_BY_CODE[error.code] || 400, headers },
      );
    }

    logger.error("Media upload error", { error: String(error), requestId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.INTERNAL,
          message: MEDIA_ERRORS.FAILED_UPLOAD_MEDIA,
          requestId,
        },
        code: ErrorCode.INTERNAL,
      },
      { status: 500, headers },
    );
  }
}
