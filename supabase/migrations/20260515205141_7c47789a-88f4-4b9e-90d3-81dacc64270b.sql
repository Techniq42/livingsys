
-- =========================================================================
-- SLICE 1: Radar substrate-meaning loop
-- =========================================================================

-- Extend community_threads with source differentiation + match explainer
ALTER TABLE public.community_threads
  ADD COLUMN IF NOT EXISTS source_platform text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_handle text,
  ADD COLUMN IF NOT EXISTS source_feed_id text,
  ADD COLUMN IF NOT EXISTS ingested_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS match_reason jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS card_type text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS substrate_filter_active boolean DEFAULT true;

-- Card type constraint
DO $$ BEGIN
  ALTER TABLE public.community_threads
    ADD CONSTRAINT community_threads_card_type_chk
    CHECK (card_type IN ('standard', 'reframe_opportunity'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill source_platform from existing platform + handle pattern
UPDATE public.community_threads
SET source_platform = CASE
  WHEN author ILIKE '%.bsky.social' OR author ILIKE '%.bsky.app' THEN 'bluesky'
  WHEN platform = 'reddit' THEN 'reddit'
  WHEN platform = 'discord' THEN 'discord'
  WHEN platform = 'forum' THEN 'forum'
  ELSE COALESCE(platform, 'other')
END
WHERE source_platform IS NULL;

UPDATE public.community_threads
SET source_handle = author
WHERE source_handle IS NULL AND author IS NOT NULL;

-- Feedback signals — relevance tuning input layer
CREATE TABLE IF NOT EXISTS public.feedback_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  operator_id uuid NOT NULL,
  signal_type text NOT NULL CHECK (signal_type IN ('up','down','reframe_flag','off_topic')),
  substrate_topic text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feedback_signals_thread ON public.feedback_signals(thread_id);
CREATE INDEX IF NOT EXISTS idx_feedback_signals_operator ON public.feedback_signals(operator_id);

ALTER TABLE public.feedback_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY feedback_signals_insert_own ON public.feedback_signals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = operator_id);
CREATE POLICY feedback_signals_read_own ON public.feedback_signals
  FOR SELECT TO authenticated USING (auth.uid() = operator_id);
CREATE POLICY feedback_signals_architect_all ON public.feedback_signals
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role));
CREATE POLICY feedback_signals_service_role ON public.feedback_signals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Source kill switches — per-platform on/off
CREATE TABLE IF NOT EXISTS public.source_kill_switches (
  source_platform text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  disabled_by uuid,
  disabled_at timestamptz,
  reason text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.source_kill_switches ENABLE ROW LEVEL SECURITY;

CREATE POLICY source_kill_switches_read ON public.source_kill_switches
  FOR SELECT TO authenticated USING (true);
CREATE POLICY source_kill_switches_architect_write ON public.source_kill_switches
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role));
CREATE POLICY source_kill_switches_service_role ON public.source_kill_switches
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed source kill switches for known platforms
INSERT INTO public.source_kill_switches (source_platform, enabled)
VALUES ('reddit', true), ('bluesky', true), ('discord', true), ('forum', true)
ON CONFLICT (source_platform) DO NOTHING;

-- =========================================================================
-- SLICE 4: Empty schema for next-build surfaces
-- =========================================================================

-- Voice memos (Whisper)
CREATE TABLE IF NOT EXISTS public.voice_memos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL,
  audio_url text,
  transcript text,
  routing_decision jsonb DEFAULT '{}'::jsonb,
  source_channel text,
  status text NOT NULL DEFAULT 'pending',
  captured_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
ALTER TABLE public.voice_memos ENABLE ROW LEVEL SECURITY;
CREATE POLICY voice_memos_own ON public.voice_memos FOR ALL TO authenticated
  USING (auth.uid() = operator_id) WITH CHECK (auth.uid() = operator_id);
CREATE POLICY voice_memos_architect ON public.voice_memos FOR ALL TO authenticated
  USING (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY voice_memos_service ON public.voice_memos FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Email triage
CREATE TABLE IF NOT EXISTS public.email_triage_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender text NOT NULL,
  subject text,
  snippet text,
  tier smallint NOT NULL DEFAULT 2 CHECK (tier IN (1,2,3)),
  suggested_action text,
  draft_body text,
  status text NOT NULL DEFAULT 'pending',
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
ALTER TABLE public.email_triage_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY email_triage_architect ON public.email_triage_items FOR ALL TO authenticated
  USING (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY email_triage_service ON public.email_triage_items FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.email_triage_whitelist (
  email text PRIMARY KEY,
  contact_name text,
  notes text,
  added_by uuid,
  added_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_triage_whitelist ENABLE ROW LEVEL SECURITY;
CREATE POLICY email_whitelist_architect ON public.email_triage_whitelist FOR ALL TO authenticated
  USING (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY email_whitelist_service ON public.email_triage_whitelist FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.sender_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type text NOT NULL,
  pattern_value text NOT NULL,
  signal jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sender_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY sender_patterns_architect ON public.sender_patterns FOR ALL TO authenticated
  USING (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY sender_patterns_service ON public.sender_patterns FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Predator pattern observations — names forbidden at schema level
CREATE TABLE IF NOT EXISTS public.predator_pattern_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  typology text NOT NULL,
  vector_type text,
  lure_language_pattern text,
  payload_mechanism text,
  red_flags_caught text[],
  where_caught text,
  connector_diligence_score smallint,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Schema-level enforcement: refuse any future column ending in _name
CREATE OR REPLACE FUNCTION public.predator_no_names_check()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM pg_event_trigger_ddl_commands() WHERE object_identity LIKE 'public.predator_pattern_observations%' LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='predator_pattern_observations'
        AND (column_name ILIKE '%_name' OR column_name IN ('sender_name','mark_name','connector_name','victim_name'))
    ) THEN
      RAISE EXCEPTION 'predator_pattern_observations: name columns are forbidden by contract. Patterns only.';
    END IF;
  END LOOP;
END;
$$;
DROP EVENT TRIGGER IF EXISTS predator_no_names_trigger;
CREATE EVENT TRIGGER predator_no_names_trigger
  ON ddl_command_end
  WHEN TAG IN ('ALTER TABLE', 'CREATE TABLE')
  EXECUTE FUNCTION public.predator_no_names_check();

ALTER TABLE public.predator_pattern_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY predator_architect ON public.predator_pattern_observations FOR ALL TO authenticated
  USING (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY predator_service ON public.predator_pattern_observations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Telegram channels
CREATE TABLE IF NOT EXISTS public.telegram_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  label text NOT NULL,
  host_user_id uuid,
  host_display_name text,
  scope_config jsonb NOT NULL DEFAULT '{"default_capabilities":[],"requires_host_approval":[],"never_allowed":[],"logged":[],"handoff":[]}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.telegram_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY telegram_channels_read ON public.telegram_channels FOR SELECT TO authenticated USING (true);
CREATE POLICY telegram_channels_architect ON public.telegram_channels FOR ALL TO authenticated
  USING (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY telegram_channels_service ON public.telegram_channels FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Federation operators
CREATE TABLE IF NOT EXISTS public.federation_operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  email text,
  location text,
  role text NOT NULL DEFAULT 'operator' CHECK (role IN ('architect','operator','node')),
  status text NOT NULL DEFAULT 'dormant' CHECK (status IN ('active','dormant','revoked')),
  recognition_token text,
  notes text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.federation_operators ENABLE ROW LEVEL SECURITY;
CREATE POLICY federation_read ON public.federation_operators FOR SELECT TO authenticated USING (true);
CREATE POLICY federation_architect ON public.federation_operators FOR ALL TO authenticated
  USING (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY federation_service ON public.federation_operators FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Guild
CREATE TABLE IF NOT EXISTS public.guild_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  label text NOT NULL,
  obligations jsonb NOT NULL DEFAULT '{}'::jsonb,
  benefits jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.guild_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY guild_tiers_read ON public.guild_tiers FOR SELECT TO authenticated USING (true);
CREATE POLICY guild_tiers_architect ON public.guild_tiers FOR ALL TO authenticated
  USING (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role));

CREATE TABLE IF NOT EXISTS public.guild_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tier_id uuid NOT NULL REFERENCES public.guild_tiers(id),
  status text NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY guild_members_own ON public.guild_members FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY guild_members_architect ON public.guild_members FOR ALL TO authenticated
  USING (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY guild_members_service ON public.guild_members FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.tool_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  tier_required text,
  url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tool_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY tool_library_read ON public.tool_library FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY tool_library_architect ON public.tool_library FOR ALL TO authenticated
  USING (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role));

CREATE TABLE IF NOT EXISTS public.member_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  contribution_type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.member_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY member_contrib_own ON public.member_contributions FOR ALL TO authenticated
  USING (auth.uid() = member_id) WITH CHECK (auth.uid() = member_id);
CREATE POLICY member_contrib_architect ON public.member_contributions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role));

-- Compliance evidence (display, not middleware)
CREATE TABLE IF NOT EXISTS public.compliance_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  badge_state text NOT NULL CHECK (badge_state IN ('green','red','amber')),
  evidence_url text,
  audit_trail jsonb DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY compliance_read ON public.compliance_evidence FOR SELECT TO authenticated USING (true);
CREATE POLICY compliance_architect ON public.compliance_evidence FOR ALL TO authenticated
  USING (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY compliance_service ON public.compliance_evidence FOR ALL TO service_role USING (true) WITH CHECK (true);
