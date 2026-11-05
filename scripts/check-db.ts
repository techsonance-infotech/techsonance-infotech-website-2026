import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import {
  db,
  resolveDatabaseUrl,
  checkDatabaseConnection,
  closeDatabaseConnections,
} from "../lib/database/index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("══════════════════════════════════════════════════════════");
  console.log("       TechSonance App Database Connectivity Check        ");
  console.log("══════════════════════════════════════════════════════════\n");

  const connectionString = resolveDatabaseUrl();
  let maskedUri = connectionString;
  try {
    const parsed = new URL(connectionString);
    if (parsed.password) parsed.password = "******";
    maskedUri = parsed.toString();
  } catch {
    maskedUri = connectionString.slice(0, 15) + "******";
  }

  console.log(`📡 Target URI: ${maskedUri}\n`);

  const start = Date.now();
  try {
    // 1. Check basic connection
    const connected = await checkDatabaseConnection();
    if (!connected) {
      throw new Error("Initial database ping failed");
    }

    // 2. Query engine details
    const pingResult = await db.execute<{
      db_name: string;
      version: string;
      current_time: string;
    }>(sql`SELECT current_database() as db_name, version() as version, now() as current_time`);

    const latency = Date.now() - start;
    const row = pingResult[0];

    console.log("✅ SUCCESS: Connected to Database using in-app database module!");
    console.log(`⏱️  Latency: ${latency}ms`);
    console.log(`🗄️  Database: ${row?.db_name}`);
    console.log(
      `📦 Engine: ${String(row?.version).split(" ")[0]} ${String(row?.version).split(" ")[1]}`,
    );
    console.log(`🕒 Server Time: ${row?.current_time}\n`);

    // 3. Verify Phase 1 Tables
    console.log("📋 Phase 1 Tables Status:");
    const expectedTables = [
      "ts_admin_sites",
      "ts_admin_memberships",
      "ts_content_authors",
      "ts_content_categories",
      "ts_content_posts",
      "ts_content_jobs",
      "ts_content_applications",
      "ts_content_versions",
      "ts_content_audit_log",
    ];

    const existingTablesRes = await db.execute<{ table_name: string }>(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const existingTableNames = new Set(existingTablesRes.map((r) => r.table_name));

    for (const tbl of expectedTables) {
      if (existingTableNames.has(tbl)) {
        try {
          const countRes = await db.execute<{ cnt: number }>(
            sql.raw(`SELECT count(*)::int as cnt FROM "${tbl}"`),
          );
          const count = countRes[0]?.cnt ?? 0;
          console.log(`   🟢 ${tbl.padEnd(25)} (found, ${count} rows)`);

          if (tbl === "ts_admin_sites" && count === 0) {
            await db.execute(sql`
              INSERT INTO "ts_admin_sites" (name, slug, domain)
              VALUES ('TechSonance Agency', 'techsonance-agency', 'techsonance.co.in')
              ON CONFLICT (slug) DO NOTHING
            `);
            console.log(`   ✨ Seeded default site into ts_admin_sites`);
          }
        } catch {
          console.log(`   🟢 ${tbl.padEnd(25)} (found)`);
        }
      } else {
        console.log(`   🟡 ${tbl.padEnd(25)} (NOT migrated yet)`);
      }
    }

    if (existingTableNames.size === expectedTables.length) {
      console.log("\n🎉 All 9 Phase 1 tables are present and ready!");
    } else {
      console.log(
        `\n⚠️  ${existingTableNames.size}/${expectedTables.length} tables found in public schema:`,
      );
      console.log([...existingTableNames].sort().map((t) => `   - ${t}`).join("\n"));
    }
  } catch (err: unknown) {
    const error = err as {
      message?: string;
      code?: string;
      cause?: { message?: string; code?: string; errors?: Array<{ message?: string; code?: string }> };
    };
    console.error("❌ Database connection failed with in-app database client!");
    console.error(`💥 Error: ${error.message || String(err)}`);
    if (error.cause) {
      console.error(`🔍 Cause: ${error.cause.message || String(error.cause)}`);
      if (error.cause.errors) {
        for (const e of error.cause.errors) {
          console.error(`   - ${e.message || String(e)} (${e.code || ""})`);
        }
      }
    }
    if (error.code || error.cause?.code) console.error(`🏷️  Code: ${error.code || error.cause?.code}`);
  } finally {
    await closeDatabaseConnections();
    console.log("\n══════════════════════════════════════════════════════════\n");
  }
}

main();
