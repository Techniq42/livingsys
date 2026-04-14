
-- =============================================================
-- 1. auto_post_config: add subreddit column, unique index, seed
-- =============================================================
ALTER TABLE public.auto_post_config
  ADD COLUMN IF NOT EXISTS subreddit text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_auto_post_config_subreddit
  ON public.auto_post_config (subreddit);

-- Clear any existing singleton row
DELETE FROM public.auto_post_config;

-- Seed 6 subreddit rows
INSERT INTO public.auto_post_config (subreddit, config) VALUES
  ('r/Veterans', '{"volume_cap_per_day":3,"thread_cap_per_thread":1,"subreddit_cooldown_minutes":120,"min_word_count":40,"max_word_count":200,"disallowed_topics":[],"voice_profile":"default"}'::jsonb),
  ('r/ADHD', '{"volume_cap_per_day":3,"thread_cap_per_thread":1,"subreddit_cooldown_minutes":120,"min_word_count":40,"max_word_count":200,"disallowed_topics":[],"voice_profile":"default"}'::jsonb),
  ('r/Permaculture', '{"volume_cap_per_day":3,"thread_cap_per_thread":1,"subreddit_cooldown_minutes":120,"min_word_count":40,"max_word_count":200,"disallowed_topics":[],"voice_profile":"default"}'::jsonb),
  ('r/Homesteading', '{"volume_cap_per_day":3,"thread_cap_per_thread":1,"subreddit_cooldown_minutes":120,"min_word_count":40,"max_word_count":200,"disallowed_topics":[],"voice_profile":"default"}'::jsonb),
  ('r/MealPrepSunday', '{"volume_cap_per_day":3,"thread_cap_per_thread":1,"subreddit_cooldown_minutes":120,"min_word_count":40,"max_word_count":200,"disallowed_topics":[],"voice_profile":"default"}'::jsonb),
  ('r/disability', '{"volume_cap_per_day":3,"thread_cap_per_thread":1,"subreddit_cooldown_minutes":120,"min_word_count":40,"max_word_count":200,"disallowed_topics":[],"voice_profile":"default"}'::jsonb);

-- =============================================================
-- 2. response_drafts: add target_door + check constraints
-- =============================================================
ALTER TABLE public.response_drafts
  ADD COLUMN IF NOT EXISTS target_door text DEFAULT 'unknown';

ALTER TABLE public.response_drafts
  ADD CONSTRAINT chk_classifier_tier CHECK (classifier_tier IN (1, 2, 3));

ALTER TABLE public.response_drafts
  ADD CONSTRAINT chk_target_door CHECK (target_door IN ('veterans', 'fire', 'loading_dock', 'adhd_ai', 'unknown'));

-- =============================================================
-- 3. RPC check_auto_post_eligible
-- =============================================================
CREATE OR REPLACE FUNCTION public.check_auto_post_eligible(_draft_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _kill_switch jsonb;
  _draft response_drafts%ROWTYPE;
  _thread community_threads%ROWTYPE;
  _sub text;
  _apc auto_post_config%ROWTYPE;
  _daily_count int;
  _thread_count int;
  _last_posted timestamptz;
BEGIN
  -- Step 1: Check kill switch
  SELECT value INTO _kill_switch
    FROM operator_config WHERE key = 'auto_post_enabled';
  IF _kill_switch IS NULL OR (_kill_switch->>'enabled')::boolean IS NOT TRUE THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'kill_switch_off');
  END IF;

  -- Load draft
  SELECT * INTO _draft FROM response_drafts WHERE id = _draft_id;
  IF _draft IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'draft_not_found');
  END IF;

  -- Step 2: Load subreddit from linked thread
  SELECT * INTO _thread FROM community_threads WHERE id = _draft.thread_id;
  IF _thread IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'thread_not_found');
  END IF;
  _sub := _thread.subreddit;

  -- Step 3: Load matching auto_post_config
  SELECT * INTO _apc FROM auto_post_config WHERE subreddit = _sub;
  IF _apc IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'no_config_for_subreddit');
  END IF;

  -- Step 4: Daily volume cap
  SELECT count(*) INTO _daily_count
    FROM response_drafts rd
    JOIN community_threads ct ON ct.id = rd.thread_id
    WHERE rd.auto_posted = true
      AND rd.auto_posted_at >= now() - interval '24 hours'
      AND ct.subreddit = _sub;
  IF _daily_count >= (_apc.config->>'volume_cap_per_day')::int THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'daily_volume_cap_reached',
      'current', _daily_count, 'cap', (_apc.config->>'volume_cap_per_day')::int);
  END IF;

  -- Step 5: Per-thread cap
  SELECT count(*) INTO _thread_count
    FROM response_drafts
    WHERE auto_posted = true
      AND thread_id = _draft.thread_id;
  IF _thread_count >= (_apc.config->>'thread_cap_per_thread')::int THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'thread_cap_reached',
      'current', _thread_count, 'cap', (_apc.config->>'thread_cap_per_thread')::int);
  END IF;

  -- Step 6: Subreddit cooldown
  SELECT max(rd.auto_posted_at) INTO _last_posted
    FROM response_drafts rd
    JOIN community_threads ct ON ct.id = rd.thread_id
    WHERE rd.auto_posted = true
      AND ct.subreddit = _sub;
  IF _last_posted IS NOT NULL
     AND _last_posted > now() - ((_apc.config->>'subreddit_cooldown_minutes')::int || ' minutes')::interval THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'subreddit_cooldown_active',
      'last_posted', _last_posted,
      'cooldown_minutes', (_apc.config->>'subreddit_cooldown_minutes')::int);
  END IF;

  -- Step 7: All gates passed
  RETURN jsonb_build_object('eligible', true, 'reason', 'all_gates_passed');
END;
$$;

-- =============================================================
-- 4. conversations table
-- =============================================================
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  external_id text,
  participant_handle text,
  thread_id uuid REFERENCES public.community_threads(id),
  source_draft_id uuid REFERENCES public.response_drafts(id),
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "architects_manage_conversations"
  ON public.conversations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "authenticated_read_conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "service_role_manage_conversations"
  ON public.conversations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- updated_at triggers on response_drafts and community_threads if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_response_drafts_updated_at') THEN
    CREATE TRIGGER update_response_drafts_updated_at
      BEFORE UPDATE ON public.response_drafts
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_community_threads_updated_at') THEN
    CREATE TRIGGER update_community_threads_updated_at
      BEFORE UPDATE ON public.community_threads
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;
