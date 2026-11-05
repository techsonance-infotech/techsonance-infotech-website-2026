CREATE TYPE "admin_role" AS ENUM('owner', 'admin', 'editor', 'author', 'viewer');--> statement-breakpoint
CREATE TYPE "ts_ai_approval_decision" AS ENUM('approve', 'reject', 'improve');--> statement-breakpoint
CREATE TYPE "ts_ai_approval_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'IMPROVE', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "ts_ai_job_status" AS ENUM('QUEUED', 'RUNNING', 'COMPLETED', 'WAITING_QUOTA', 'NEEDS_REVIEW', 'FAILED');--> statement-breakpoint
CREATE TYPE "ts_ai_job_step" AS ENUM('outline', 'sections', 'meta', 'image', 'validate', 'save-pending', 'completed');--> statement-breakpoint
CREATE TYPE "ts_ai_provider_status" AS ENUM('ACTIVE', 'EXHAUSTED', 'DISABLED', 'COOLDOWN');--> statement-breakpoint
CREATE TYPE "ts_ai_step_status" AS ENUM('PENDING', 'RUNNING', 'DONE', 'FAILED');--> statement-breakpoint
CREATE TYPE "ts_ai_topic_status" AS ENUM('SUGGESTED', 'ACCEPTED', 'QUEUED', 'GENERATED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "application_status" AS ENUM('NEW', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "job_status" AS ENUM('DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "job_type" AS ENUM('Full Time', 'Internship', 'Contract', 'Partner');--> statement-breakpoint
CREATE TYPE "post_status" AS ENUM('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "ts_admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"email" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ts_ai_generation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"site_id" uuid NOT NULL,
	"topic_id" uuid,
	"topic_text" text NOT NULL,
	"category" text DEFAULT 'Engineering',
	"status" "ts_ai_job_status" DEFAULT 'QUEUED'::"ts_ai_job_status" NOT NULL,
	"current_step" "ts_ai_job_step" DEFAULT 'outline'::"ts_ai_job_step",
	"attempt" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"worker_id" text,
	"lease_expires_at" timestamp with time zone,
	"resume_at" timestamp with time zone,
	"result_post_id" uuid,
	"error_details" jsonb
);
--> statement-breakpoint
CREATE TABLE "ts_ai_job_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"job_id" uuid NOT NULL,
	"step_name" text NOT NULL,
	"status" "ts_ai_step_status" DEFAULT 'PENDING'::"ts_ai_step_status" NOT NULL,
	"idempotency_key" text NOT NULL,
	"input_data" jsonb,
	"output_data" jsonb,
	"provider" text,
	"model" text,
	"tokens_used" integer DEFAULT 0,
	"duration_ms" integer DEFAULT 0,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "ts_ai_approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"post_id" uuid NOT NULL,
	"post_version" integer DEFAULT 1 NOT NULL,
	"token_hash" text NOT NULL,
	"status" "ts_ai_approval_status" DEFAULT 'PENDING'::"ts_ai_approval_status" NOT NULL,
	"decision" "ts_ai_approval_decision",
	"feedback" text,
	"decided_by" text,
	"decided_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"email_message_id" text,
	"email_status" text
);
--> statement-breakpoint
CREATE TABLE "ts_ai_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"site_id" uuid NOT NULL,
	"title" text NOT NULL,
	"keywords" text[] DEFAULT '{}'::text[] NOT NULL,
	"category" text DEFAULT 'Engineering',
	"target_audience" text DEFAULT 'Tech Leads & Engineers',
	"difficulty" text DEFAULT 'intermediate',
	"status" "ts_ai_topic_status" DEFAULT 'SUGGESTED'::"ts_ai_topic_status" NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"suggested_by" text DEFAULT 'ai',
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "ts_ai_prompt_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"site_id" uuid NOT NULL,
	"step_name" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"system_prompt" text NOT NULL,
	"user_prompt_template" text NOT NULL,
	"model_preference" text DEFAULT 'gemini-2.5-flash',
	"temperature" integer DEFAULT 70,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ts_ai_usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"job_id" uuid,
	"step_name" text,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"prompt_tokens" integer DEFAULT 0,
	"completion_tokens" integer DEFAULT 0,
	"total_tokens" integer DEFAULT 0,
	"duration_ms" integer DEFAULT 0,
	"status" text NOT NULL,
	"error_message" text,
	"timestamp" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ts_ai_provider_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"provider" text NOT NULL,
	"label" text NOT NULL,
	"capabilities" text[] DEFAULT '{}'::text[] NOT NULL,
	"models" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "ts_ai_provider_status" DEFAULT 'ACTIVE'::"ts_ai_provider_status" NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	"daily_quota_limit" integer,
	"daily_quota_used" integer DEFAULT 0,
	"quota_reset_at" timestamp with time zone,
	"cooldown_until" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "ts_content_posts" ADD COLUMN "thumbnail_missing" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_posts" ADD COLUMN "thumbnail_provider" text;--> statement-breakpoint
ALTER TABLE "ts_content_posts" ADD COLUMN "thumbnail_prompt" text;--> statement-breakpoint
ALTER TABLE "ts_content_posts" ADD COLUMN "thumbnail_alt" text;--> statement-breakpoint
ALTER TABLE "ts_content_posts" ADD COLUMN "ai_generated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ts_content_posts" ADD COLUMN "ai_job_id" uuid;--> statement-breakpoint
ALTER TABLE "ts_admin_memberships" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "ts_admin_memberships" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "ts_admin_sites" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "ts_admin_sites" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "ts_content_authors" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "ts_content_authors" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "ts_content_categories" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "ts_content_categories" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "ts_content_posts" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "ts_content_posts" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
CREATE UNIQUE INDEX "ts_ai_job_steps_idempotency_idx" ON "ts_ai_job_steps" ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "ts_ai_approval_requests_token_hash_idx" ON "ts_ai_approval_requests" ("token_hash");--> statement-breakpoint
ALTER TABLE "ts_ai_generation_jobs" ADD CONSTRAINT "ts_ai_generation_jobs_site_id_ts_admin_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "ts_admin_sites"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ts_ai_job_steps" ADD CONSTRAINT "ts_ai_job_steps_job_id_ts_ai_generation_jobs_id_fkey" FOREIGN KEY ("job_id") REFERENCES "ts_ai_generation_jobs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ts_ai_approval_requests" ADD CONSTRAINT "ts_ai_approval_requests_post_id_ts_content_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "ts_content_posts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ts_ai_topics" ADD CONSTRAINT "ts_ai_topics_site_id_ts_admin_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "ts_admin_sites"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ts_ai_prompt_templates" ADD CONSTRAINT "ts_ai_prompt_templates_site_id_ts_admin_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "ts_admin_sites"("id") ON DELETE CASCADE;