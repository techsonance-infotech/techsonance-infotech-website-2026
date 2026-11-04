-- ============================================================================
-- Phase 3: Autonomous AI Blog Generation & Image Automation Tables
-- ============================================================================

-- 1. Extend ts_content_posts with AI and thumbnail columns
ALTER TABLE IF EXISTS public.ts_content_posts
  ADD COLUMN IF NOT EXISTS thumbnail_missing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS thumbnail_provider text,
  ADD COLUMN IF NOT EXISTS thumbnail_prompt text,
  ADD COLUMN IF NOT EXISTS thumbnail_alt text,
  ADD COLUMN IF NOT EXISTS ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_job_id uuid;

-- 2. ts_ai_topics
CREATE TABLE IF NOT EXISTS public.ts_ai_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.ts_admin_sites(id) ON DELETE CASCADE,
  title text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  category text DEFAULT 'Engineering',
  target_audience text DEFAULT 'Tech Leads & Engineers',
  difficulty text DEFAULT 'intermediate',
  status text NOT NULL DEFAULT 'SUGGESTED' CHECK (status IN ('SUGGESTED', 'ACCEPTED', 'QUEUED', 'GENERATED', 'REJECTED')),
  priority integer NOT NULL DEFAULT 0,
  suggested_by text DEFAULT 'ai',
  notes text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ONLY public.ts_ai_topics ENABLE ROW LEVEL SECURITY;

-- 3. ts_ai_generation_jobs
CREATE TABLE IF NOT EXISTS public.ts_ai_generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.ts_admin_sites(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES public.ts_ai_topics(id) ON DELETE SET NULL,
  topic_text text NOT NULL,
  category text DEFAULT 'Engineering',
  status text NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'WAITING_QUOTA', 'NEEDS_REVIEW', 'FAILED')),
  current_step text DEFAULT 'outline',
  attempt integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  priority integer NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  worker_id text,
  lease_expires_at timestamptz,
  resume_at timestamptz,
  result_post_id uuid,
  error_details jsonb,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ONLY public.ts_ai_generation_jobs ENABLE ROW LEVEL SECURITY;

-- 4. ts_ai_job_steps
CREATE TABLE IF NOT EXISTS public.ts_ai_job_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.ts_ai_generation_jobs(id) ON DELETE CASCADE,
  step_name text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'DONE', 'FAILED')),
  idempotency_key text NOT NULL UNIQUE,
  input_data jsonb,
  output_data jsonb,
  provider text,
  model text,
  tokens_used integer DEFAULT 0,
  duration_ms integer DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ONLY public.ts_ai_job_steps ENABLE ROW LEVEL SECURITY;

-- 5. ts_ai_approval_requests
CREATE TABLE IF NOT EXISTS public.ts_ai_approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.ts_content_posts(id) ON DELETE CASCADE,
  post_version integer NOT NULL DEFAULT 1,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'IMPROVE', 'EXPIRED')),
  decision text CHECK (decision IN ('approve', 'reject', 'improve')),
  feedback text,
  decided_by text,
  decided_at timestamptz,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  email_message_id text,
  email_status text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ONLY public.ts_ai_approval_requests ENABLE ROW LEVEL SECURITY;

-- 6. ts_ai_prompt_templates
CREATE TABLE IF NOT EXISTS public.ts_ai_prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.ts_admin_sites(id) ON DELETE CASCADE,
  step_name text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  system_prompt text NOT NULL,
  user_prompt_template text NOT NULL,
  model_preference text DEFAULT 'gemini-2.5-flash',
  temperature integer DEFAULT 70,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ONLY public.ts_ai_prompt_templates ENABLE ROW LEVEL SECURITY;

-- 7. ts_ai_usage_events
CREATE TABLE IF NOT EXISTS public.ts_ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid,
  step_name text,
  provider text NOT NULL,
  model text NOT NULL,
  prompt_tokens integer DEFAULT 0,
  completion_tokens integer DEFAULT 0,
  total_tokens integer DEFAULT 0,
  duration_ms integer DEFAULT 0,
  status text NOT NULL,
  error_message text,
  timestamp timestamptz DEFAULT CURRENT_TIMESTAMP,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ONLY public.ts_ai_usage_events ENABLE ROW LEVEL SECURITY;

-- 8. ts_ai_provider_accounts
CREATE TABLE IF NOT EXISTS public.ts_ai_provider_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  label text NOT NULL,
  capabilities text[] NOT NULL DEFAULT '{}',
  models text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXHAUSTED', 'DISABLED', 'COOLDOWN')),
  priority integer NOT NULL DEFAULT 1,
  daily_quota_limit integer,
  daily_quota_used integer DEFAULT 0,
  quota_reset_at timestamptz,
  cooldown_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ONLY public.ts_ai_provider_accounts ENABLE ROW LEVEL SECURITY;
