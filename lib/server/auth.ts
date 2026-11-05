import "server-only";
import { AppError, ErrorCode } from "@/lib/errors";
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
    throw new AppError(ErrorCode.UNAUTHENTICATED, "Authentication required");
  }
  return user;
}
