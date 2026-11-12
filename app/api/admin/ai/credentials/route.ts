import "server-only";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminAiCredentialsService } from "@/lib/services/ai/admin-ai-credentials.service";
import {
  addCredentialSchema,
  deleteCredentialSchema,
} from "@/lib/validations/ai-credential.schema";
import { AppError, ErrorCode, STATUS_BY_CODE, toFieldErrors } from "@/lib/errors";
import { getRequestId } from "@/lib/server/requestContext";
import { isAllowedOrigin } from "@/lib/utils/text";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

function buildHeaders(requestId: string): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("x-request-id", requestId);
  headers.set("Cache-Control", "private, no-store");
  return headers;
}

async function requireAdminSession(
  req: Request,
  requestId: string,
  headers: Headers,
): Promise<{ userId?: string } | NextResponse> {
  const origin = req.headers.get("origin");
  if (origin && !isAllowedOrigin(origin)) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: ErrorCode.FORBIDDEN, message: "Cross-origin request not allowed", requestId },
      },
      { status: 403, headers },
    );
  }

  const session = await getContainer().get(AdminAuthService).getCurrentSession();
  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: ErrorCode.UNAUTHENTICATED, message: "Authentication required", requestId },
      },
      { status: 401, headers },
    );
  }
  return session;
}

function handleError(
  err: unknown,
  requestId: string,
  headers: Headers,
  method: "GET" | "POST" | "DELETE",
): NextResponse {
  logger.error(`Admin AI credentials ${method} failed`, { requestId, error: err });
  if (err instanceof AppError) {
    return NextResponse.json(
      { ok: false, error: { code: err.code, message: err.message, requestId } },
      { status: STATUS_BY_CODE[err.code] || 500, headers },
    );
  }
  return NextResponse.json(
    { ok: false, error: { code: ErrorCode.INTERNAL, message: "Internal server error occurred", requestId } },
    { status: 500, headers },
  );
}

export async function GET(req: Request): Promise<NextResponse> {
  const requestId = await getRequestId();
  const headers = buildHeaders(requestId);
  try {
    const authResult = await requireAdminSession(req, requestId, headers);
    if (authResult instanceof NextResponse) return authResult;

    const url = new URL(req.url);
    const provider = url.searchParams.get("provider") || undefined;
    const credentials = await getContainer().get(AdminAiCredentialsService).listCredentials(provider);

    return NextResponse.json(
      { ok: true, data: { credentials, count: credentials.length } },
      { status: 200, headers },
    );
  } catch (err) {
    return handleError(err, requestId, headers, "GET");
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  const requestId = await getRequestId();
  const headers = buildHeaders(requestId);
  try {
    const authResult = await requireAdminSession(req, requestId, headers);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json().catch(() => ({}));
    const parseResult = addCredentialSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: "Validation failed",
            fieldErrors: toFieldErrors(parseResult.error),
            requestId,
          },
        },
        { status: 422, headers },
      );
    }

    const created = await getContainer()
      .get(AdminAiCredentialsService)
      .addCredential(parseResult.data, authResult.userId || "admin", requestId);

    return NextResponse.json(
      {
        ok: true,
        data: {
          success: true,
          credential: created,
          message: "Credential securely encrypted and registered in vault.",
        },
      },
      { status: 201, headers },
    );
  } catch (err) {
    return handleError(err, requestId, headers, "POST");
  }
}

export async function DELETE(req: Request): Promise<NextResponse> {
  const requestId = await getRequestId();
  const headers = buildHeaders(requestId);
  try {
    const authResult = await requireAdminSession(req, requestId, headers);
    if (authResult instanceof NextResponse) return authResult;

    const url = new URL(req.url);
    const queryCredentialId = url.searchParams.get("credentialId");
    const rawBody = queryCredentialId ? { credentialId: queryCredentialId } : await req.json().catch(() => ({}));
    const parseResult = deleteCredentialSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION,
            message: "Validation failed",
            fieldErrors: toFieldErrors(parseResult.error),
            requestId,
          },
        },
        { status: 422, headers },
      );
    }

    await getContainer()
      .get(AdminAiCredentialsService)
      .deleteCredential(parseResult.data.credentialId, authResult.userId || "admin", requestId);

    return NextResponse.json(
      {
        ok: true,
        data: {
          success: true,
          message: "Credential permanently deleted from vault.",
        },
      },
      { status: 200, headers },
    );
  } catch (err) {
    return handleError(err, requestId, headers, "DELETE");
  }
}
