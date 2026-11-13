import "server-only";
import { unstable_rethrow } from "next/navigation";
import { inject } from "@needle-di/core";
import { AdminUsersRepository } from "@/lib/repositories/admin-users.repository";
import { getSessionFromCookies } from "../auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { AppError, ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getEnv } from "../env";
import { AUTH_ERRORS, AUTH_DEFAULT_ROLES } from "@/lib/constants/auth.constants";
import { AdminRole } from "@/lib/constants/enums/content.enum";
import type { Site, Membership } from "../database/schema/core/site.schema";

export interface AdminSession {
  userId: string;
  email: string;
  role: AdminRole;
  site?: Site | null;
  membership?: Membership | null;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export class AdminAuthService {
  constructor(private usersRepo: AdminUsersRepository = inject(AdminUsersRepository)) {}

  /**
   * Authenticates user via email and password.
   * Updates last login timestamp on success.
   */
  async authenticate(email: string, password: string): Promise<AuthenticatedUser> {
    const env = getEnv();
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Look up user in database via repository
    const user = await this.usersRepo.findByEmail(normalizedEmail);

    if (user) {
      if (!user.isActive) {
        throw new AppError(ErrorCode.FORBIDDEN, AUTH_ERRORS.ACCOUNT_DISABLED);
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        throw new AppError(ErrorCode.UNAUTHENTICATED, AUTH_ERRORS.INVALID_CREDENTIALS);
      }

      // Record last login timestamp non-blockingly
      try {
        await this.usersRepo.updateLastLogin(user.id);
      } catch (err) {
        logger.warn("AdminAuthService.authenticate: updateLastLogin failed", {
          userId: user.id,
          error: String(err),
        });
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as AuthenticatedUser["role"],
      };
    }

    // 2. Dev mode fallback when ALLOW_PLACEHOLDERS is true (Strictly disabled in production)
    if (env.ALLOW_PLACEHOLDERS && process.env.NODE_ENV !== "production") {
      return {
        id: "00000000-0000-0000-0000-000000000000",
        email: normalizedEmail,
        name: "Admin User",
        role: AUTH_DEFAULT_ROLES.OWNER,
      };
    }

    throw new AppError(ErrorCode.UNAUTHENTICATED, AUTH_ERRORS.INVALID_CREDENTIALS);
  }

  /**
   * Retrieves the current authenticated admin session.
   * Checks signed HTTP-only cookie and verifies against main Postgres DB.
   */
  async getCurrentSession(): Promise<AdminSession | null> {
    try {
      const env = getEnv();

      // 1. Read session from secure cookie first (avoids DB query for unauthenticated requests)
      const cookieSession = await getSessionFromCookies();

      if (!cookieSession) {
        // Dev mode fallback if enabled in env (strictly prohibited in production)
        if (env.ALLOW_PLACEHOLDERS && process.env.NODE_ENV !== "production") {
          const devSite: Site = {
            id: "00000000-0000-0000-0000-000000000001",
            name: "TechSonance Main Site",
            slug: "techsonance-main",
            domain: "techsonance.co.in",
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return {
            userId: "00000000-0000-0000-0000-000000000000",
            email: "admin@techsonance.co.in",
            role: AUTH_DEFAULT_ROLES.OWNER,
            site: devSite,
          };
        }
        return null;
      }

      // 2. Validate user identity and active state against database
      try {
        const userPromise = this.usersRepo.findById(cookieSession.userId);
        const userTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
        const user = await Promise.race([userPromise, userTimeout]);

        if (!user || !user.isActive) {
          return null;
        }

        const fallbackSite: Site = {
          id: "00000000-0000-0000-0000-000000000001",
          name: "TechSonance Main Site",
          slug: "techsonance-main",
          domain: "techsonance.co.in",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Resolve real site from DB if accessible (bounded by 1500ms to avoid freezing SSR)
        const sitePromise = this.usersRepo.getDefaultSite().catch(() => null);
        const siteTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
        const defaultSite = await Promise.race([sitePromise, siteTimeout]);
        const site: Site = defaultSite ?? fallbackSite;

        return {
          userId: user.id,
          email: user.email,
          role: user.role as AdminSession["role"],
          site,
        };
      } catch (userErr) {
        logger.warn("AdminAuthService.getCurrentSession: user verification failed", {
          userId: cookieSession.userId,
          error: String(userErr),
        });
        return null;
      }
    } catch (err) {
      unstable_rethrow(err);
      logger.error("AdminAuthService.getCurrentSession error", { error: String(err) });
      return null;
    }
  }

  hasPermission(currentRole: AdminSession["role"] | string, requiredRole: AdminSession["role"] | string): boolean {
    const hierarchy: Record<string, number> = {
      [AdminRole.VIEWER]: 1,
      [AdminRole.AUTHOR]: 2,
      [AdminRole.EDITOR]: 3,
      [AdminRole.ADMIN]: 4,
      [AdminRole.OWNER]: 5,
    };
    return (hierarchy[currentRole] ?? 0) >= (hierarchy[requiredRole] ?? 0);
  }
}
