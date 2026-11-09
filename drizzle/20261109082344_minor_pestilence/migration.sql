CREATE TYPE "ts_ai_account_billing_mode" AS ENUM('prepaid', 'postpaid', 'free_tier');--> statement-breakpoint
CREATE TYPE "ts_ai_alert_severity" AS ENUM('info', 'warning', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "ts_ai_credential_status" AS ENUM('active', 'cooling_down', 'exhausted', 'disabled', 'compromised');--> statement-breakpoint
ALTER TYPE "ts_content_application_status" ADD VALUE 'ON_HOLD' BEFORE 'REJECTED';--> statement-breakpoint
CREATE TABLE "ts_web_consultation_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"reference" text NOT NULL CONSTRAINT "ts_web_consultation_bookings_reference_uq" UNIQUE,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company" text,
	"project_type" text NOT NULL,
	"budget_range" text NOT NULL,
	"timeline" text NOT NULL,
	"slot_iso" text NOT NULL CONSTRAINT "ts_web_consultation_bookings_slot_uq" UNIQUE,
	"visitor_timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"message" text,
	"status" text DEFAULT 'CONFIRMED' NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "ts_ai_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"provider" text NOT NULL,
	"account_email" text NOT NULL,
	"display_name" text NOT NULL,
	"billing_mode" "ts_ai_account_billing_mode" DEFAULT 'prepaid'::"ts_ai_account_billing_mode" NOT NULL,
	"monthly_budget_usd" numeric(10,2),
	"notes" text,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "ts_ai_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"account_id" uuid,
	"provider" text NOT NULL,
	"model" text,
	"label" text NOT NULL,
	"ciphertext" bytea,
	"iv" bytea,
	"auth_tag" bytea,
	"key_version" integer DEFAULT 1 NOT NULL,
	"fingerprint" text NOT NULL UNIQUE,
	"last4" text NOT NULL,
	"status" "ts_ai_credential_status" DEFAULT 'active'::"ts_ai_credential_status" NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"cooldown_until" timestamp with time zone,
	"quota_resets_at" timestamp with time zone,
	"daily_budget_usd" numeric(10,2),
	"spent_today_usd" numeric(10,2) DEFAULT '0' NOT NULL,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"last_error_kind" text,
	"last_used_at" timestamp with time zone,
	"is_canary" boolean DEFAULT false NOT NULL,
	"rotated_at" timestamp with time zone,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "ts_ai_credential_events" (
	"id" bigserial PRIMARY KEY,
	"credential_id" uuid,
	"event" text NOT NULL,
	"actor" text NOT NULL,
	"request_id" text,
	"meta" jsonb DEFAULT '{}' NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ts_ai_alerts" (
	"id" bigserial PRIMARY KEY,
	"severity" "ts_ai_alert_severity" NOT NULL,
	"type" text NOT NULL,
	"credential_id" uuid,
	"dedupe_key" text NOT NULL,
	"channel" text NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "ts_content_app_job_email_idx";--> statement-breakpoint
ALTER TABLE "ts_content_applications" ADD COLUMN "privacy_consent" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "ts_content_app_job_email_uq" ON "ts_content_applications" ("job_id","email");--> statement-breakpoint
CREATE INDEX "ts_web_consultation_bookings_email_idx" ON "ts_web_consultation_bookings" ("email");--> statement-breakpoint
CREATE INDEX "ts_web_consultation_bookings_created_at_idx" ON "ts_web_consultation_bookings" ("created_at");--> statement-breakpoint
ALTER TABLE "ts_ai_credentials" ADD CONSTRAINT "ts_ai_credentials_account_id_ts_ai_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ts_ai_accounts"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "ts_ai_credential_events" ADD CONSTRAINT "ts_ai_credential_events_credential_id_ts_ai_credentials_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "ts_ai_credentials"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "ts_ai_alerts" ADD CONSTRAINT "ts_ai_alerts_credential_id_ts_ai_credentials_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "ts_ai_credentials"("id") ON DELETE SET NULL;