import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { AUTH_ERRORS } from "@/lib/constants/auth.constants";

const loginSchema = z.object({
  email: z.email(AUTH_ERRORS.EMAIL_REQUIRED),
  password: z.string().min(6, AUTH_ERRORS.PASSWORD_REQUIRED),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: AUTH_ERRORS.VALIDATION_FAILED, details: result.error.format() },
        { status: 400 },
      );
    }

    const { email, password } = result.data;
    const container = getContainer();
    const authService = container.get(AdminAuthService);

    const user = await authService.authenticate(email, password);

    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      const status =
        error.code === "UNAUTHENTICATED"
          ? 401
          : error.code === "FORBIDDEN"
            ? 403
            : error.code === "BAD_REQUEST" || error.code === "VALIDATION"
              ? 400
              : 500;

      return NextResponse.json({ error: error.message }, { status });
    }

    logger.error("Admin login unhandled error", { error: String(error) });
    return NextResponse.json(
      { error: "An unexpected error occurred during login" },
      { status: 500 },
    );
  }
}
