
-- Polymorphic outreach surface: any "person worth reaching" surfaced by canon blast OR funder scout
CREATE TABLE public.outreach_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canon_slug text,                    -- which canon page this target was surfaced for (nullable for org-level)
  cohort text,                        -- 'bluesky_signal' | 'reddit_signal' | 'family_office' | 'hnw_angel' | 'foundation' | 'press' | 'podcast'
  channel text NOT NULL,              -- 'bluesky' | 'reddit' | 'email' | 'web' | 'apollo' | 'linkedin_research'
  target_url text,
  target_handle text,                 -- @handle on the channel, or apollo person id
  target_name text,
  org_name text,
  snippet text,                       -- what they said / their bio / press quote
  signal_score integer NOT NULL DEFAULT 5, -- 1-10 fit score
  signal_reason jsonb NOT NULL DEFAULT '{}'::jsonb, -- {keywords:[], heuristics:[], recency_days:n}
  source text NOT NULL,               -- 'firecrawl_canon_blast' | 'apollo_funder_scout' | 'manual'
  source_run_id uuid,                 -- links to canon_search_runs or future apollo_search_runs
  status text NOT NULL DEFAULT 'new', -- 'new' | 'queued' | 'drafted' | 'approved' | 'sent' | 'replied' | 'won' | 'dead'
  notes text,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  last_touched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_outreach_targets_canon ON public.outreach_targets(canon_slug);
CREATE INDEX idx_outreach_targets_status ON public.outreach_targets(status);
CREATE INDEX idx_outreach_targets_channel ON public.outreach_targets(channel);
CREATE INDEX idx_outreach_targets_cohort ON public.outreach_targets(cohort);
ALTER TABLE public.outreach_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY outreach_targets_architect ON public.outreach_targets
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role));
CREATE POLICY outreach_targets_service ON public.outreach_targets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Gemma-generated drafts awaiting approval
CREATE TABLE public.outreach_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid NOT NULL REFERENCES public.outreach_targets(id) ON DELETE CASCADE,
  draft_kind text NOT NULL,           -- 'reply' | 'quote_post' | 'dm' | 'email' | 'comment'
  body text NOT NULL,
  voice_register text DEFAULT 'campaign',
  canon_slug text,                    -- which canon page this draft is steering toward
  rationale text,                     -- Gemma's why-this-target-this-frame note
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'sent' | 'failed'
  approved_by uuid,
  approved_at timestamptz,
  sent_at timestamptz,
  send_result jsonb,
  generated_by text DEFAULT 'google/gemini-2.5-flash',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_outreach_drafts_target ON public.outreach_drafts(target_id);
CREATE INDEX idx_outreach_drafts_status ON public.outreach_drafts(status);
ALTER TABLE public.outreach_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY outreach_drafts_architect ON public.outreach_drafts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role));
CREATE POLICY outreach_drafts_service ON public.outreach_drafts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Funder scout (HNW + family offices + foundations)
CREATE TABLE public.funder_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name text,
  org_name text,
  title text,
  org_kind text,                      -- 'family_office' | 'foundation' | 'angel' | 'hnw_individual' | 'fund' | 'donor_advised'
  thesis_match jsonb NOT NULL DEFAULT '{}'::jsonb, -- {tags:['regenerative','adhd','biotech'], score:8, evidence:[urls]}
  canon_slugs_matched text[] DEFAULT '{}'::text[], -- which canon doors this funder fits
  geo text,
  estimated_check_range text,         -- '10k-50k' | '50k-250k' | '250k-1M' | '1M+'
  last_public_move text,              -- press quote, grant, podcast, investment
  last_public_move_url text,
  last_public_move_at date,
  apollo_person_id text UNIQUE,
  apollo_org_id text,
  emails jsonb DEFAULT '[]'::jsonb,
  socials jsonb DEFAULT '{}'::jsonb,  -- {linkedin, twitter, bluesky, personal_site}
  brief_markdown text,                -- Gemma-generated per-target brief
  brief_generated_at timestamptz,
  status text NOT NULL DEFAULT 'new', -- 'new' | 'researched' | 'briefed' | 'queued' | 'sent' | 'replied' | 'committed' | 'dead'
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_funder_targets_org_kind ON public.funder_targets(org_kind);
CREATE INDEX idx_funder_targets_status ON public.funder_targets(status);
ALTER TABLE public.funder_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY funder_targets_architect ON public.funder_targets
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role));
CREATE POLICY funder_targets_service ON public.funder_targets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Add audience cohorts column to canon_pages for blast search stems
ALTER TABLE public.canon_pages
  ADD COLUMN IF NOT EXISTS audience_cohorts jsonb NOT NULL DEFAULT '[]'::jsonb;
-- Shape: [{cohort:'bluesky_signal', channel:'bluesky', stems:['ADHD operations regenerative', ...]}, ...]

-- Triggers for updated_at
CREATE TRIGGER trg_outreach_targets_updated BEFORE UPDATE ON public.outreach_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_outreach_drafts_updated BEFORE UPDATE ON public.outreach_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_funder_targets_updated BEFORE UPDATE ON public.funder_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
