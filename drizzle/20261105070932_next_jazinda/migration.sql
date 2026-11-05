CREATE TYPE "ts_content_application_status" AS ENUM('NEW', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "ts_content_job_application_method" AS ENUM('builtin', 'external');--> statement-breakpoint
CREATE TYPE "ts_content_job_approval_status" AS ENUM('pending', 'approved', 'returned');--> statement-breakpoint
CREATE TYPE "ts_content_job_cover_letter_requirement" AS ENUM('off', 'optional', 'required');--> statement-breakpoint
CREATE TYPE "ts_content_job_experience_level" AS ENUM('entry', 'mid', 'senior', 'lead', 'executive', 'Mid-Senior');--> statement-breakpoint
CREATE TYPE "ts_content_job_salary_period" AS ENUM('hour', 'month', 'year');--> statement-breakpoint
CREATE TYPE "ts_content_job_status" AS ENUM('DRAFT', 'IN_REVIEW', 'SCHEDULED', 'PUBLISHED', 'OPEN', 'PAUSED', 'CLOSED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "ts_content_job_type" AS ENUM('full_time', 'part_time', 'contract', 'internship', 'freelance', 'temporary', 'Full Time', 'Contract', 'Internship', 'Partner');--> statement-breakpoint
CREATE TYPE "ts_content_job_visa_support" AS ENUM('yes', 'no', 'case_by_case');--> statement-breakpoint
CREATE TYPE "ts_content_job_visibility" AS ENUM('public', 'unlisted');--> statement-breakpoint
CREATE TYPE "ts_content_job_work_mode" AS ENUM('on_site', 'hybrid', 'remote');--> statement-breakpoint
CREATE TABLE "ts_content_talent_pool" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"site_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"skills" text[] DEFAULT '{}'::text[] NOT NULL,
	"preferred_role" text,
	"experience_level" "ts_content_job_experience_level" DEFAULT 'mid'::"ts_content_job_experience_level",
	"portfolio_url" text,
	"resume_storage_path" text,
	"notes" text,
	"consent_date" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ts_content_careers_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"site_id" uuid NOT NULL,
	"require_approval_to_publish" boolean DEFAULT true NOT NULL,
	"default_close_duration_days" integer DEFAULT 30 NOT NULL,
	"document_retention_days" integer DEFAULT 90 NOT NULL,
	"admin_alert_recipients" text[] DEFAULT '{}'::text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ts_content_eeoc_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"job_id" uuid NOT NULL,
	"gender" text,
	"ethnicity" text,
	"veteran_status" text,
	"disability_status" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "reference_code" text;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "openings_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "owner_id" uuid;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "hiring_manager_id" uuid;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "summary" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "work_mode" "ts_content_job_work_mode" DEFAULT 'hybrid'::"ts_content_job_work_mode" NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "remote_eligibility" text;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "visa_support" "ts_content_job_visa_support" DEFAULT 'no'::"ts_content_job_visa_support";--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "preferred_qualifications" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "skills" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "about_team" text;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "hiring_process" jsonb DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "equal_opportunity_statement" text;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "salary_min" integer;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "salary_max" integer;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "salary_currency" text DEFAULT 'INR';--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "salary_period" "ts_content_job_salary_period" DEFAULT 'year'::"ts_content_job_salary_period";--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "show_salary_publicly" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "compensation_notes" text;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "application_method" "ts_content_job_application_method" DEFAULT 'builtin'::"ts_content_job_application_method" NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "external_apply_url" text;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "resume_required" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "cover_letter_requirement" "ts_content_job_cover_letter_requirement" DEFAULT 'optional'::"ts_content_job_cover_letter_requirement" NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "screening_questions" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "approval_status" "ts_content_job_approval_status" DEFAULT 'pending'::"ts_content_job_approval_status";--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "approval_comment" text;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "publish_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "visibility" "ts_content_job_visibility" DEFAULT 'public'::"ts_content_job_visibility" NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "seo_title" text;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "og_image" text;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "apply_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ADD COLUMN "job_version_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ADD COLUMN "current_location" text;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ADD COLUMN "resume_storage_path" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ADD COLUMN "resume_file_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ADD COLUMN "resume_mime_type" text DEFAULT 'application/pdf' NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ADD COLUMN "notice_period_weeks" integer;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ADD COLUMN "screening_answers" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ADD COLUMN "knockout_triggered" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ADD COLUMN "source" text DEFAULT 'direct';--> statement-breakpoint
ALTER TABLE "ts_content_applications" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ADD COLUMN "rating" integer;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ADD COLUMN "privacy_consent_date" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ADD COLUMN "privacy_notice_version" text DEFAULT '2026-v1' NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ADD COLUMN "talent_pool_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ALTER COLUMN "status" SET DATA TYPE "ts_content_application_status" USING "status"::"ts_content_application_status";--> statement-breakpoint
ALTER TABLE "ts_content_applications" ALTER COLUMN "status" SET DEFAULT 'NEW'::"ts_content_application_status";--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ALTER COLUMN "type" SET DATA TYPE "ts_content_job_type" USING "type"::"ts_content_job_type";--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ALTER COLUMN "type" SET DEFAULT 'full_time'::"ts_content_job_type";--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ALTER COLUMN "experience_level" SET DATA TYPE "ts_content_job_experience_level" USING "experience_level"::"ts_content_job_experience_level";--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ALTER COLUMN "experience_level" SET DEFAULT 'mid'::"ts_content_job_experience_level";--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ALTER COLUMN "status" SET DATA TYPE "ts_content_job_status" USING "status"::"ts_content_job_status";--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"ts_content_job_status";--> statement-breakpoint
CREATE INDEX "ts_content_jobs_status_idx" ON "ts_content_jobs" ("status");--> statement-breakpoint
CREATE INDEX "ts_content_jobs_dept_idx" ON "ts_content_jobs" ("department");--> statement-breakpoint
CREATE INDEX "ts_content_app_job_email_idx" ON "ts_content_applications" ("job_id","email");--> statement-breakpoint
CREATE INDEX "ts_content_app_status_idx" ON "ts_content_applications" ("status");--> statement-breakpoint
CREATE INDEX "ts_content_talent_pool_email_idx" ON "ts_content_talent_pool" ("email");--> statement-breakpoint
CREATE INDEX "ts_content_talent_pool_site_idx" ON "ts_content_talent_pool" ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ts_content_careers_settings_site_idx" ON "ts_content_careers_settings" ("site_id");--> statement-breakpoint
CREATE INDEX "ts_content_eeoc_job_idx" ON "ts_content_eeoc_responses" ("job_id");--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD CONSTRAINT "ts_content_jobs_owner_id_ts_admin_users_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "ts_admin_users"("id");--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD CONSTRAINT "ts_content_jobs_hiring_manager_id_ts_admin_users_id_fkey" FOREIGN KEY ("hiring_manager_id") REFERENCES "ts_admin_users"("id");--> statement-breakpoint
ALTER TABLE "ts_content_talent_pool" ADD CONSTRAINT "ts_content_talent_pool_site_id_ts_admin_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "ts_admin_sites"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ts_content_careers_settings" ADD CONSTRAINT "ts_content_careers_settings_site_id_ts_admin_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "ts_admin_sites"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ts_content_eeoc_responses" ADD CONSTRAINT "ts_content_eeoc_responses_job_id_ts_content_jobs_id_fkey" FOREIGN KEY ("job_id") REFERENCES "ts_content_jobs"("id") ON DELETE CASCADE;--> statement-breakpoint
DROP TYPE "application_status";--> statement-breakpoint
DROP TYPE "job_status";--> statement-breakpoint
DROP TYPE "job_type";