CREATE TABLE "ts_admin_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ts_admin_sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"domain" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ts_content_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"site_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"candidate_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"portfolio_url" text,
	"github_url" text,
	"resume_url" text,
	"cover_letter" text,
	"status" text DEFAULT 'NEW' NOT NULL,
	"internal_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ts_content_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"before_state" jsonb,
	"after_state" jsonb,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ts_content_authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"site_id" uuid NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"avatar" text,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ts_content_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"site_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ts_content_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"site_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"department" text NOT NULL,
	"location" text NOT NULL,
	"type" text NOT NULL,
	"experience_level" text,
	"description" text NOT NULL,
	"responsibilities" text[] DEFAULT '{}'::text[] NOT NULL,
	"requirements" text[] DEFAULT '{}'::text[] NOT NULL,
	"benefits" text[] DEFAULT '{}'::text[] NOT NULL,
	"closes_at" timestamp with time zone,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"version_id" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ts_content_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"site_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"category_id" uuid,
	"hero_image" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"author_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"read_time" text,
	"faqs" jsonb DEFAULT '[]' NOT NULL,
	"seo" jsonb DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"version_id" integer DEFAULT 1 NOT NULL,
	"published_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ts_content_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"changed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ts_admin_memberships_user_site_idx" ON "ts_admin_memberships" ("user_id","site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ts_content_categories_site_slug_idx" ON "ts_content_categories" ("site_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "ts_content_jobs_site_slug_idx" ON "ts_content_jobs" ("site_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "ts_content_posts_site_slug_idx" ON "ts_content_posts" ("site_id","slug");--> statement-breakpoint
ALTER TABLE "ts_admin_memberships" ADD CONSTRAINT "ts_admin_memberships_site_id_ts_admin_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "ts_admin_sites"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ADD CONSTRAINT "ts_content_applications_site_id_ts_admin_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "ts_admin_sites"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ts_content_applications" ADD CONSTRAINT "ts_content_applications_job_id_ts_content_jobs_id_fkey" FOREIGN KEY ("job_id") REFERENCES "ts_content_jobs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ts_content_authors" ADD CONSTRAINT "ts_content_authors_site_id_ts_admin_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "ts_admin_sites"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ts_content_categories" ADD CONSTRAINT "ts_content_categories_site_id_ts_admin_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "ts_admin_sites"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ts_content_jobs" ADD CONSTRAINT "ts_content_jobs_site_id_ts_admin_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "ts_admin_sites"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ts_content_posts" ADD CONSTRAINT "ts_content_posts_site_id_ts_admin_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "ts_admin_sites"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ts_content_posts" ADD CONSTRAINT "ts_content_posts_category_id_ts_content_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ts_content_categories"("id") ON DELETE SET NULL;