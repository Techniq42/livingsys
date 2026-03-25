
-- Jobs table
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  input_type text NOT NULL,
  input_url text,
  input_file text,
  selected_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  template_id uuid,
  status text NOT NULL DEFAULT 'queued',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  outputs jsonb DEFAULT '[]'::jsonb,
  error_message text,
  distribution_status jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_crud_own_jobs" ON public.jobs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User templates table
CREATE TABLE public.user_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  input_type text NOT NULL,
  selected_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_crud_own_templates" ON public.user_templates
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Alerts table
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  created_at timestamptz DEFAULT now(),
  acknowledged boolean DEFAULT false
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_alerts" ON public.alerts
  FOR SELECT TO authenticated
  USING (true);

-- Site status table
CREATE TABLE public.site_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  status text NOT NULL DEFAULT 'up',
  last_checked timestamptz DEFAULT now(),
  ssl_expiry timestamptz,
  last_error text
);

ALTER TABLE public.site_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_site_status" ON public.site_status
  FOR SELECT TO authenticated
  USING (true);

-- Pipeline status table
CREATE TABLE public.pipeline_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name text NOT NULL,
  track text NOT NULL,
  contact_count integer DEFAULT 0,
  stuck_count integer DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

ALTER TABLE public.pipeline_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_pipeline_status" ON public.pipeline_status
  FOR SELECT TO authenticated
  USING (true);
