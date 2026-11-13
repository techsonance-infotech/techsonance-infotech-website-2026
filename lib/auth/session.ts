import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { AdminRole, ADMIN_ROLE_VALUES } from "@/lib/constants/enums/content.enum";

export const SESSION_COOKIE = "ts_admin_session";

function getSecret(): string {
  try {
    const env = getEnv();
    const secret = env.JWT_ACCESS_SECRET || env.BETTER_AUTH_SECRET;
    if (secret && secret.length >= 32) return secret;
    if (secret) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("JWT_ACCESS_SECRET or BETTER_AUTH_SECRET must be at least 32 characters in production");
      }
      return secret;
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_ACCESS_SECRET or BETTER_AUTH_SECRET must be configured in production");
    }
    return "techsonance-studio-admin-secret-minimum-32-chars";
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
    return "techsonance-studio-admin-secret-minimum-32-chars";
  }
}

export const sessionPayloadSchema = z.strictObject({
  userId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(ADMIN_ROLE_VALUES),
  exp: z.number().int().finite(),
});

export type SessionPayload = z.infer<typeof sessionPayloadSchema>;

export function createSessionToken(payload: Omit<SessionPayload, "exp">): string {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days
  const data: SessionPayload = { ...payload, exp };
  const encodedData = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(encodedData)
    .digest("base64url");
  return `${encodedData}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [encodedData, signature] = token.split(".");
    if (!encodedData || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", getSecret())
      .update(encodedData)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const rawJson: unknown = JSON.parse(
      Buffer.from(encodedData, "base64url").toString("utf8"),
    );

    const parsed = sessionPayloadSchema.safeParse(rawJson);
    if (!parsed.success) {
      return null;
    }

    const payload = parsed.data;
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
