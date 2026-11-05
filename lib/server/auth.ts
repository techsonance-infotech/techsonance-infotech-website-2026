import "server-only";
import { AppError } from "@/lib/errors";
import {
  getSessionFromCookies,
  type SessionPayload,
  createSessionToken,
  verifySessionToken,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth/session";

export type { SessionPayload };
export { createSessionToken, verifySessionToken, setSessionCookie, clearSessionCookie };

export async function getOptionalUser(): Promise<SessionPayload | null> {
  return getSessionFromCookies();
}

export async function requireUser(): Promise<SessionPayload> {
  const user = await getOptionalUser();
  if (!user) {
    throw new AppError("UNAUTHENTICATED", "Authentication required");
  }
  return user;
}
