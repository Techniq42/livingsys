-- 0. Reusable updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1. community_threads table
CREATE TABLE public.community_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL DEFAULT 'reddit',
  subreddit text,
  post_id text NOT NULL DEFAULT '',
  post_title text NOT NULL DEFAULT '',
  post_url text NOT NULL DEFAULT '',
  author text,
  snippet text,
  matched_keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  relevance_score integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'new',
  notes text,
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_community_threads"
  ON public.community_threads FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "service_role_manage_community_threads"
  ON public.community_threads FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "architects_manage_community_threads"
  ON public.community_threads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'architect') OR public.has_role(auth.uid(), 'administrator'))
  WITH CHECK (public.has_role(auth.uid(), 'architect') OR public.has_role(auth.uid(), 'administrator'));

CREATE TRIGGER update_community_threads_updated_at
  BEFORE UPDATE ON public.community_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. reply_templates table
CREATE TABLE public.reply_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'general',
  title text NOT NULL DEFAULT '',
  scaffold text NOT NULL DEFAULT '',
  keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  funnel_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reply_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_reply_templates"
  ON public.reply_templates FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "service_role_manage_reply_templates"
  ON public.reply_templates FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "architects_manage_reply_templates"
  ON public.reply_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'architect') OR public.has_role(auth.uid(), 'administrator'))
  WITH CHECK (public.has_role(auth.uid(), 'architect') OR public.has_role(auth.uid(), 'administrator'));

-- 3. response_drafts table
CREATE TABLE public.response_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES public.community_threads(id) ON DELETE SET NULL,
  draft_body text NOT NULL DEFAULT '',
  classifier_tier smallint NOT NULL DEFAULT 2,
  classifier_reasoning text,
  safety_flags jsonb DEFAULT '[]'::jsonb,
  auto_posted boolean NOT NULL DEFAULT false,
  auto_posted_at timestamptz,
  reddit_comment_id text,
  reddit_comment_url text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.response_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_response_drafts"
  ON public.response_drafts FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "architects_manage_response_drafts"
  ON public.response_drafts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'architect') OR public.has_role(auth.uid(), 'administrator'))
  WITH CHECK (public.has_role(auth.uid(), 'architect') OR public.has_role(auth.uid(), 'administrator'));

CREATE POLICY "service_role_manage_response_drafts"
  ON public.response_drafts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_response_drafts_updated_at
  BEFORE UPDATE ON public.response_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. auto_post_config singleton table
CREATE TABLE public.auto_post_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config jsonb NOT NULL DEFAULT '{
    "tier1_auto_post": false,
    "tier2_requires_review": true,
    "tier3_always_block": true,
    "max_posts_per_hour": 3,
    "max_posts_per_day": 15,
    "cooldown_minutes": 10,
    "min_relevance_score": 6,
    "require_keyword_match": true,
    "disallowed_topics": [],
    "disallowed_patterns": []
  }'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.auto_post_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "architects_read_auto_post_config"
  ON public.auto_post_config FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'architect') OR public.has_role(auth.uid(), 'administrator'));

CREATE POLICY "architects_update_auto_post_config"
  ON public.auto_post_config FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'architect') OR public.has_role(auth.uid(), 'administrator'))
  WITH CHECK (public.has_role(auth.uid(), 'architect') OR public.has_role(auth.uid(), 'administrator'));

CREATE POLICY "service_role_manage_auto_post_config"
  ON public.auto_post_config FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 5. shadow_log view
CREATE OR REPLACE VIEW public.shadow_log AS
SELECT
  rd.id,
  rd.thread_id,
  rd.draft_body,
  rd.classifier_tier,
  rd.classifier_reasoning,
  rd.safety_flags,
  rd.auto_posted,
  rd.auto_posted_at,
  rd.reddit_comment_id,
  rd.reddit_comment_url,
  rd.status,
  rd.reviewed_by,
  rd.reviewed_at,
  rd.created_at,
  rd.updated_at,
  ct.post_title,
  ct.post_url,
  ct.subreddit,
  ct.author,
  CASE
    WHEN rd.auto_posted = true THEN 'auto'
    WHEN rd.status = 'blocked' THEN 'blocked'
    WHEN rd.status = 'pending' THEN 'pending'
    ELSE 'manual'
  END AS log_category
FROM public.response_drafts rd
LEFT JOIN public.community_threads ct ON ct.id = rd.thread_id
ORDER BY rd.created_at DESC;

-- 6. Enable realtime on response_drafts
ALTER PUBLICATION supabase_realtime ADD TABLE public.response_drafts;