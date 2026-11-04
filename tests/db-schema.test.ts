import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Database Schema & Migration Verification", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20261104120000_agency_admin_phase1.sql",
  );

  it("should have the phase 1 migration file present", () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  const getSql = () => {
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at ${migrationPath}`);
    }
    return fs.readFileSync(migrationPath, "utf-8");
  };

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

  it("should create all 9 core tables with CREATE TABLE IF NOT EXISTS", () => {
    const sql = getSql();
    for (const table of expectedTables) {
      const regex = new RegExp(
        `CREATE\\s+TABLE\\s+(IF\\s+NOT\\s+EXISTS\\s+)?(public\\.)?${table}\\b`,
        "i",
      );
      expect(sql).toMatch(regex);
    }
  });

  it("should enable Row Level Security on all created tables", () => {
    const sql = getSql();
    for (const table of expectedTables) {
      const regex = new RegExp(
        `ALTER\\s+TABLE\\s+(ONLY\\s+)?(public\\.)?${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
        "i",
      );
      expect(sql).toMatch(regex);
    }
  });

  it("should define required constraints and check clauses", () => {
    const sql = getSql();

    // Check membership roles
    expect(sql).toMatch(
      /check\s*\(\s*role\s+in\s*\(\s*'owner',\s*'admin',\s*'editor',\s*'author',\s*'viewer'\s*\)\s*\)/i,
    );

    // Check post status
    expect(sql).toMatch(
      /check\s*\(\s*status\s+in\s*\(\s*'DRAFT',\s*'IN_REVIEW',\s*'PUBLISHED',\s*'ARCHIVED'\s*\)\s*\)/i,
    );

    // Check job status
    expect(sql).toMatch(
      /check\s*\(\s*status\s+in\s*\(\s*'DRAFT',\s*'OPEN',\s*'CLOSED',\s*'ARCHIVED'\s*\)\s*\)/i,
    );

    // Check application status
    expect(sql).toMatch(
      /check\s*\(\s*status\s+in\s*\(\s*'NEW',\s*'REVIEWING',\s*'SHORTLISTED',\s*'INTERVIEW',\s*'OFFERED',\s*'REJECTED'\s*\)\s*\)/i,
    );

    // Unique constraints
    expect(sql).toMatch(/UNIQUE\s*\(\s*user_id\s*,\s*site_id\s*\)/i);
    expect(sql).toMatch(/UNIQUE\s*\(\s*site_id\s*,\s*slug\s*\)/i);
  });

  it("should configure storage buckets for ts_media and ts_resumes", () => {
    const sql = getSql();
    expect(sql).toContain("'ts_media'");
    expect(sql).toContain("'ts_resumes'");
    expect(sql).toMatch(/storage\.buckets/i);
  });

  it("should define public read RLS policies for posts, categories, authors, jobs, and application inserts", () => {
    const sql = getSql();
    // Public read for posts (status = 'PUBLISHED')
    expect(sql).toMatch(/ts_content_posts/i);
    expect(sql).toMatch(/status\s*=\s*'PUBLISHED'/i);

    // Public read for categories and authors
    expect(sql).toMatch(/ts_content_categories/i);
    expect(sql).toMatch(/ts_content_authors/i);

    // Public read for jobs (status = 'OPEN')
    expect(sql).toMatch(/ts_content_jobs/i);
    expect(sql).toMatch(/status\s*=\s*'OPEN'/i);

    // Public insert for applications
    expect(sql).toMatch(/ts_content_applications/i);
    expect(sql).toMatch(/FOR\s+INSERT/i);
  });

  it("should seed the default TechSonance site", () => {
    const sql = getSql();
    expect(sql).toContain("TechSonance Infotech");
    expect(sql).toContain("techsonance");
  });

  describe("Phase 3 AI Blog & Image Automation Schemas", () => {
    const aiMigrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20261104160000_ai_automation_phase3.sql",
    );

    it("should have the phase 3 migration file present", () => {
      expect(fs.existsSync(aiMigrationPath)).toBe(true);
    });

    const getAiSql = () => fs.readFileSync(aiMigrationPath, "utf-8");

    const expectedAiTables = [
      "ts_ai_topics",
      "ts_ai_generation_jobs",
      "ts_ai_job_steps",
      "ts_ai_approval_requests",
      "ts_ai_prompt_templates",
      "ts_ai_usage_events",
      "ts_ai_provider_accounts",
    ];

    it("should create all 7 AI automation tables with RLS enabled", () => {
      const sql = getAiSql();
      for (const table of expectedAiTables) {
        const createRegex = new RegExp(
          `CREATE\\s+TABLE\\s+(IF\\s+NOT\\s+EXISTS\\s+)?(public\\.)?${table}\\b`,
          "i",
        );
        expect(sql).toMatch(createRegex);

        const rlsRegex = new RegExp(
          `ALTER\\s+TABLE\\s+(ONLY\\s+)?(public\\.)?${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
          "i",
        );
        expect(sql).toMatch(rlsRegex);
      }
    });

    it("should add AI and thumbnail columns to ts_content_posts", () => {
      const sql = getAiSql();
      expect(sql).toMatch(/ALTER\s+TABLE\s+(IF\s+EXISTS\s+)?(public\.)?ts_content_posts/i);
      expect(sql).toContain("thumbnail_missing");
      expect(sql).toContain("thumbnail_provider");
      expect(sql).toContain("thumbnail_prompt");
      expect(sql).toContain("thumbnail_alt");
      expect(sql).toContain("ai_generated");
      expect(sql).toContain("ai_job_id");
    });
  });
});
