import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/di/container";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { Database } from "@/lib/database/index";
import { usersTable } from "@/lib/database/schema/core/user.schema";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    const env = getEnv();
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 },
      );
    }

    const { email, password } = result.data;
    const container = getContainer();
    const db = container.get<Database>(DRIZZLE_DB_TOKEN);

    // 1. Try to find user in native database
    try {
      const user = await db.query.usersTable.findFirst({
        where: { email },
      });

      if (user) {
        if (!user.isActive) {
          return NextResponse.json({ error: "User account is disabled" }, { status: 403 });
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }

        const token = createSessionToken({
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role as "owner" | "admin" | "editor" | "author" | "viewer",
        });

        await setSessionCookie(token);

        return NextResponse.json({
          ok: true,
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
        });
      }
    } catch {
      // Users table not yet migrated or DB offline
    }

    // 2. Dev mode fallback when ALLOW_PLACEHOLDERS is true
    if (env.ALLOW_PLACEHOLDERS) {
      const token = createSessionToken({
        userId: "00000000-0000-0000-0000-000000000000",
        email,
        name: "Admin User",
        role: "owner",
      });

      await setSessionCookie(token);

      return NextResponse.json({
        ok: true,
        user: { email, role: "owner", name: "Admin User" },
      });
    }

    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error during authentication" },
      { status: 500 },
    );
  }
}
