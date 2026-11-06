import "server-only";
import { inject } from "@needle-di/core";
import { eq } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { Database } from "@/lib/database/index";
import {
  usersTable,
  type AdminUser,
  type InsertAdminUser,
} from "@/lib/database/schema/core/user.schema";
import { sitesTable, type Site } from "@/lib/database/schema/core/site.schema";
import { mapDbError } from "@/lib/dbErrors";

export class AdminUsersRepository {
  constructor(private db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  async getDefaultSite(): Promise<Site> {
    try {
      const existing = await this.db.query.sitesTable.findFirst();
      if (existing) return existing;

      const [created] = await this.db
        .insert(sitesTable)
        .values({
          name: "TechSonance Infotech",
          slug: "techsonance-main",
          domain: "techsonance.co.in",
        })
        .returning();

      return created;
    } catch (err) {
      throw mapDbError(err, { context: "AdminUsersRepository.getDefaultSite" });
    }
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    if (!email || !email.trim()) return null;
    const normalized = email.trim().toLowerCase();

    try {
      const [user] = await this.db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, normalized))
        .limit(1);

      return user ?? null;
    } catch (err) {
      throw mapDbError(err, { context: "AdminUsersRepository.findByEmail" });
    }
  }

  async findById(id: string): Promise<AdminUser | null> {
    if (!id || !id.trim()) return null;

    try {
      const [user] = await this.db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
      return user ?? null;
    } catch (err) {
      throw mapDbError(err, { context: "AdminUsersRepository.findById", id });
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    if (!id || !id.trim()) return;

    try {
      await this.db
        .update(usersTable)
        .set({ lastLoginAt: new Date(), updatedAt: new Date() })
        .where(eq(usersTable.id, id));
    } catch (err) {
      throw mapDbError(err, { context: "AdminUsersRepository.updateLastLogin", id });
    }
  }

  async create(data: InsertAdminUser): Promise<AdminUser> {
    try {
      const [created] = await this.db
        .insert(usersTable)
        .values({
          ...data,
          email: data.email.trim().toLowerCase(),
        })
        .returning();

      return created;
    } catch (err) {
      throw mapDbError(err, { context: "AdminUsersRepository.create" });
    }
  }
}
