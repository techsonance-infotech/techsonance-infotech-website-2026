-- Migration: 20261104120000_agency_admin_phase1.sql
-- Description: Phase 1 database schema for TechSonance Agency Admin & Content Control Platform
-- Multi-site tenancy, memberships, blog taxonomies, careers, applications, versioning, audit logging, storage & RLS.

-- 1. Helper function for automated updated_at timestamp management
CREATE OR REPLACE FUNCTION public.ts_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Multi-Site & Tenancy Table
CREATE TABLE IF NOT EXISTS public.ts_admin_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  domain text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER ts_admin_sites_set_updated_at
BEFORE UPDATE ON public.ts_admin_sites
FOR EACH ROW EXECUTE FUNCTION public.ts_set_updated_at();

-- Seed Default Agency Site
INSERT INTO public.ts_admin_sites (name, slug, domain)
VALUES ('TechSonance Infotech', 'techsonance', 'techsonance.com')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  domain = EXCLUDED.domain;

-- 3. RBAC & Memberships Table
CREATE TABLE IF NOT EXISTS public.ts_admin_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES public.ts_admin_sites(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'author', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ts_admin_memberships_user_site_key UNIQUE (user_id, site_id)
);

CREATE TRIGGER ts_admin_memberships_set_updated_at
BEFORE UPDATE ON public.ts_admin_memberships
FOR EACH ROW EXECUTE FUNCTION public.ts_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_ts_admin_memberships_user_id ON public.ts_admin_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_ts_admin_memberships_site_id ON public.ts_admin_memberships(site_id);

-- 4. Blog Taxonomies & Entities: Authors
CREATE TABLE IF NOT EXISTS public.ts_content_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.ts_admin_sites(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  avatar text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER ts_content_authors_set_updated_at
BEFORE UPDATE ON public.ts_content_authors
FOR EACH ROW EXECUTE FUNCTION public.ts_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_ts_content_authors_site_id ON public.ts_content_authors(site_id);

-- 5. Blog Taxonomies & Entities: Categories
CREATE TABLE IF NOT EXISTS public.ts_content_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.ts_admin_sites(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ts_content_categories_site_slug_key UNIQUE (site_id, slug)
);

CREATE TRIGGER ts_content_categories_set_updated_at
BEFORE UPDATE ON public.ts_content_categories
FOR EACH ROW EXECUTE FUNCTION public.ts_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_ts_content_categories_site_id ON public.ts_content_categories(site_id);

-- 6. Blog Taxonomies & Entities: Posts
CREATE TABLE IF NOT EXISTS public.ts_content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.ts_admin_sites(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  excerpt text,
  content text NOT NULL,
  category_id uuid REFERENCES public.ts_content_categories(id) ON DELETE SET NULL,
  hero_image text,
  tags text[] NOT NULL DEFAULT '{}',
  author_ids uuid[] NOT NULL DEFAULT '{}',
  read_time text,
  faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED')),
  version_id integer NOT NULL DEFAULT 1,
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ts_content_posts_site_slug_key UNIQUE (site_id, slug)
);

CREATE TRIGGER ts_content_posts_set_updated_at
BEFORE UPDATE ON public.ts_content_posts
FOR EACH ROW EXECUTE FUNCTION public.ts_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_ts_content_posts_site_id ON public.ts_content_posts(site_id);
CREATE INDEX IF NOT EXISTS idx_ts_content_posts_site_status ON public.ts_content_posts(site_id, status);
CREATE INDEX IF NOT EXISTS idx_ts_content_posts_category_id ON public.ts_content_posts(category_id);

-- 7. Careers Entities: Jobs
CREATE TABLE IF NOT EXISTS public.ts_content_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.ts_admin_sites(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  department text NOT NULL,
  location text NOT NULL,
  type text NOT NULL,
  experience_level text,
  description text NOT NULL,
  responsibilities text[] NOT NULL DEFAULT '{}',
  requirements text[] NOT NULL DEFAULT '{}',
  benefits text[] NOT NULL DEFAULT '{}',
  closes_at timestamptz,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED')),
  version_id integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ts_content_jobs_site_slug_key UNIQUE (site_id, slug)
);

CREATE TRIGGER ts_content_jobs_set_updated_at
BEFORE UPDATE ON public.ts_content_jobs
FOR EACH ROW EXECUTE FUNCTION public.ts_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_ts_content_jobs_site_id ON public.ts_content_jobs(site_id);
CREATE INDEX IF NOT EXISTS idx_ts_content_jobs_site_status ON public.ts_content_jobs(site_id, status);

-- 8. Careers Entities: Applications
CREATE TABLE IF NOT EXISTS public.ts_content_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.ts_admin_sites(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.ts_content_jobs(id) ON DELETE CASCADE,
  candidate_name text NOT NULL,
  email text NOT NULL,
  phone text,
  portfolio_url text,
  github_url text,
  resume_url text,
  cover_letter text,
  status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'REJECTED')),
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER ts_content_applications_set_updated_at
BEFORE UPDATE ON public.ts_content_applications
FOR EACH ROW EXECUTE FUNCTION public.ts_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_ts_content_applications_site_id ON public.ts_content_applications(site_id);
CREATE INDEX IF NOT EXISTS idx_ts_content_applications_job_id ON public.ts_content_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_ts_content_applications_status ON public.ts_content_applications(status);

-- 9. Audit & Version History: Versions
CREATE TABLE IF NOT EXISTS public.ts_content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  snapshot jsonb NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ts_content_versions_entity ON public.ts_content_versions(entity_type, entity_id);

-- 10. Audit & Version History: Audit Log
CREATE TABLE IF NOT EXISTS public.ts_content_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  before_state jsonb,
  after_state jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ts_content_audit_log_entity ON public.ts_content_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ts_content_audit_log_actor ON public.ts_content_audit_log(actor_id);

-- 11. Storage Buckets Configuration
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('ts_media', 'ts_media', true),
  ('ts_resumes', 'ts_resumes', false)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public;

-- 12. Enable Row-Level Security on All Tables
ALTER TABLE public.ts_admin_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ts_admin_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ts_content_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ts_content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ts_content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ts_content_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ts_content_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ts_content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ts_content_audit_log ENABLE ROW LEVEL SECURITY;

-- 13. RLS Policies: ts_admin_sites
CREATE POLICY ts_admin_sites_select_policy ON public.ts_admin_sites
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY ts_admin_sites_insert_policy ON public.ts_admin_sites
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_admin_sites.id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin')
  )
);

CREATE POLICY ts_admin_sites_update_policy ON public.ts_admin_sites
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_admin_sites.id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_admin_sites.id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin')
  )
);

CREATE POLICY ts_admin_sites_delete_policy ON public.ts_admin_sites
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_admin_sites.id
      AND m.user_id = (SELECT auth.uid())
      AND m.role = 'owner'
  )
);

-- 14. RLS Policies: ts_admin_memberships
CREATE POLICY ts_admin_memberships_select_policy ON public.ts_admin_memberships
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_admin_memberships.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin')
  )
);

CREATE POLICY ts_admin_memberships_insert_policy ON public.ts_admin_memberships
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_admin_memberships.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin')
  )
);

CREATE POLICY ts_admin_memberships_update_policy ON public.ts_admin_memberships
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_admin_memberships.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_admin_memberships.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin')
  )
);

CREATE POLICY ts_admin_memberships_delete_policy ON public.ts_admin_memberships
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_admin_memberships.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin')
  )
);

-- 15. RLS Policies: ts_content_authors
CREATE POLICY ts_content_authors_select_policy ON public.ts_content_authors
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY ts_content_authors_insert_policy ON public.ts_content_authors
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_authors.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY ts_content_authors_update_policy ON public.ts_content_authors
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_authors.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin', 'editor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_authors.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY ts_content_authors_delete_policy ON public.ts_content_authors
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_authors.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin')
  )
);

-- 16. RLS Policies: ts_content_categories
CREATE POLICY ts_content_categories_select_policy ON public.ts_content_categories
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY ts_content_categories_insert_policy ON public.ts_content_categories
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_categories.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY ts_content_categories_update_policy ON public.ts_content_categories
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_categories.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin', 'editor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_categories.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY ts_content_categories_delete_policy ON public.ts_content_categories
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_categories.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin')
  )
);

-- 17. RLS Policies: ts_content_posts
-- Public read for published posts; members can read all status posts within their site
CREATE POLICY ts_content_posts_select_anon_policy ON public.ts_content_posts
FOR SELECT TO anon
USING (status = 'PUBLISHED');

CREATE POLICY ts_content_posts_select_auth_policy ON public.ts_content_posts
FOR SELECT TO authenticated
USING (
  status = 'PUBLISHED'
  OR EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_posts.site_id
      AND m.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY ts_content_posts_insert_policy ON public.ts_content_posts
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_posts.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin', 'editor', 'author')
  )
);

CREATE POLICY ts_content_posts_update_policy ON public.ts_content_posts
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_posts.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin', 'editor', 'author')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_posts.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin', 'editor', 'author')
  )
);

CREATE POLICY ts_content_posts_delete_policy ON public.ts_content_posts
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_posts.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin')
  )
);

-- 18. RLS Policies: ts_content_jobs
-- Public read for open jobs; members can view all status jobs within their site
CREATE POLICY ts_content_jobs_select_anon_policy ON public.ts_content_jobs
FOR SELECT TO anon
USING (status = 'OPEN');

CREATE POLICY ts_content_jobs_select_auth_policy ON public.ts_content_jobs
FOR SELECT TO authenticated
USING (
  status = 'OPEN'
  OR EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_jobs.site_id
      AND m.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY ts_content_jobs_insert_policy ON public.ts_content_jobs
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_jobs.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY ts_content_jobs_update_policy ON public.ts_content_jobs
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_jobs.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin', 'editor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_jobs.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY ts_content_jobs_delete_policy ON public.ts_content_jobs
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_jobs.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin')
  )
);

-- 19. RLS Policies: ts_content_applications
-- Public candidates can submit applications
CREATE POLICY ts_content_applications_insert_public_policy ON public.ts_content_applications
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Internal members can read, review, and manage applications
CREATE POLICY ts_content_applications_select_policy ON public.ts_content_applications
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_applications.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY ts_content_applications_update_policy ON public.ts_content_applications
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_applications.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin', 'editor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_applications.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY ts_content_applications_delete_policy ON public.ts_content_applications
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.site_id = ts_content_applications.site_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin')
  )
);

-- 20. RLS Policies: ts_content_versions
CREATE POLICY ts_content_versions_select_policy ON public.ts_content_versions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY ts_content_versions_insert_policy ON public.ts_content_versions
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin', 'editor', 'author')
  )
);

-- 21. RLS Policies: ts_content_audit_log
CREATE POLICY ts_content_audit_log_select_policy ON public.ts_content_audit_log
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ts_admin_memberships m
    WHERE m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin')
  )
);

CREATE POLICY ts_content_audit_log_insert_policy ON public.ts_content_audit_log
FOR INSERT TO authenticated
WITH CHECK (true);

-- 22. Storage Policies for ts_media & ts_resumes
CREATE POLICY ts_media_public_read ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'ts_media');

CREATE POLICY ts_media_admin_write ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'ts_media'
  AND EXISTS (
    SELECT 1 FROM public.ts_admin_memberships
    WHERE user_id = (SELECT auth.uid())
      AND role IN ('owner', 'admin', 'editor', 'author')
  )
);

CREATE POLICY ts_media_admin_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'ts_media'
  AND EXISTS (
    SELECT 1 FROM public.ts_admin_memberships
    WHERE user_id = (SELECT auth.uid())
      AND role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY ts_media_admin_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'ts_media'
  AND EXISTS (
    SELECT 1 FROM public.ts_admin_memberships
    WHERE user_id = (SELECT auth.uid())
      AND role IN ('owner', 'admin')
  )
);

CREATE POLICY ts_resumes_public_insert ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'ts_resumes');

CREATE POLICY ts_resumes_admin_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'ts_resumes'
  AND EXISTS (
    SELECT 1 FROM public.ts_admin_memberships
    WHERE user_id = (SELECT auth.uid())
      AND role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY ts_resumes_admin_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'ts_resumes'
  AND EXISTS (
    SELECT 1 FROM public.ts_admin_memberships
    WHERE user_id = (SELECT auth.uid())
      AND role IN ('owner', 'admin')
  )
);
