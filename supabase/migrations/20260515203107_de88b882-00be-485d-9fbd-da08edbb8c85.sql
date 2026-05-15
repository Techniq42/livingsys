
-- Privilege helper: architect sees everything, operator sees operator+node, node sees node only
CREATE OR REPLACE FUNCTION public.has_min_privilege(_user_id uuid, _min text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _min = 'node' THEN true
    WHEN _min = 'operator' THEN
      public.has_role(_user_id, 'architect'::app_role)
      OR public.has_role(_user_id, 'administrator'::app_role)
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id) -- any authenticated role
    WHEN _min = 'architect' THEN
      public.has_role(_user_id, 'architect'::app_role)
      OR public.has_role(_user_id, 'administrator'::app_role)
    ELSE false
  END
$$;

-- ============ topic_verticals ============
CREATE TABLE public.topic_verticals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','retired')),
  min_privilege text NOT NULL DEFAULT 'operator' CHECK (min_privilege IN ('architect','operator','node')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.topic_verticals ENABLE ROW LEVEL SECURITY;
CREATE POLICY topic_verticals_read ON public.topic_verticals FOR SELECT TO authenticated
  USING (public.has_min_privilege(auth.uid(), min_privilege));
CREATE POLICY topic_verticals_architect_write ON public.topic_verticals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'architect'::app_role) OR public.has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'architect'::app_role) OR public.has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY topic_verticals_service_role ON public.topic_verticals FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============ voice_templates ============
CREATE TABLE public.voice_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  venue text NOT NULL,
  topic_slug text REFERENCES public.topic_verticals(slug) ON DELETE SET NULL,
  register_notes text,
  system_prompt_fragment text NOT NULL,
  drift_guardrails jsonb NOT NULL DEFAULT '[]'::jsonb,
  min_privilege text NOT NULL DEFAULT 'operator' CHECK (min_privilege IN ('architect','operator','node')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.voice_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY voice_templates_read ON public.voice_templates FOR SELECT TO authenticated
  USING (public.has_min_privilege(auth.uid(), min_privilege));
CREATE POLICY voice_templates_architect_write ON public.voice_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'architect'::app_role) OR public.has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'architect'::app_role) OR public.has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY voice_templates_service_role ON public.voice_templates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER voice_templates_updated BEFORE UPDATE ON public.voice_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ redirect_targets ============
CREATE TABLE public.redirect_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  destination_url text NOT NULL,
  topic_slug text REFERENCES public.topic_verticals(slug) ON DELETE SET NULL,
  audience_frames jsonb NOT NULL DEFAULT '{}'::jsonb,
  click_count int NOT NULL DEFAULT 0,
  conversion_count int NOT NULL DEFAULT 0,
  video_url text,
  min_privilege text NOT NULL DEFAULT 'operator' CHECK (min_privilege IN ('architect','operator','node')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.redirect_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY redirect_targets_read ON public.redirect_targets FOR SELECT TO authenticated
  USING (public.has_min_privilege(auth.uid(), min_privilege));
CREATE POLICY redirect_targets_anon_read ON public.redirect_targets FOR SELECT TO anon
  USING (is_active = true);
CREATE POLICY redirect_targets_architect_write ON public.redirect_targets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'architect'::app_role) OR public.has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'architect'::app_role) OR public.has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY redirect_targets_service_role ON public.redirect_targets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER redirect_targets_updated BEFORE UPDATE ON public.redirect_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ redirect_clicks ============
CREATE TABLE public.redirect_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  redirect_target_id uuid NOT NULL REFERENCES public.redirect_targets(id) ON DELETE CASCADE,
  frame_key text,
  referrer text,
  ua text,
  ip_hash text,
  draft_id uuid,
  clicked_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.redirect_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY redirect_clicks_read ON public.redirect_clicks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'architect'::app_role) OR public.has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY redirect_clicks_service_role ON public.redirect_clicks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX redirect_clicks_target_idx ON public.redirect_clicks(redirect_target_id, clicked_at DESC);

-- ============ skills (composition skills + always-on guardrails) ============
CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('composition','guardrail','redirect','voice')),
  description text,
  prompt_fragment text,
  always_loaded boolean NOT NULL DEFAULT false,
  min_privilege text NOT NULL DEFAULT 'operator' CHECK (min_privilege IN ('architect','operator','node')),
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY skills_read ON public.skills FOR SELECT TO authenticated
  USING (is_active = true AND public.has_min_privilege(auth.uid(), min_privilege));
CREATE POLICY skills_architect_write ON public.skills FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'architect'::app_role) OR public.has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'architect'::app_role) OR public.has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY skills_service_role ON public.skills FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============ nexus_modes ============
CREATE TABLE public.nexus_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  status text NOT NULL DEFAULT 'stub' CHECK (status IN ('live','stub','retired')),
  min_privilege text NOT NULL DEFAULT 'operator' CHECK (min_privilege IN ('architect','operator','node')),
  sort_order int NOT NULL DEFAULT 0
);
ALTER TABLE public.nexus_modes ENABLE ROW LEVEL SECURITY;
CREATE POLICY nexus_modes_read ON public.nexus_modes FOR SELECT TO authenticated
  USING (public.has_min_privilege(auth.uid(), min_privilege));
CREATE POLICY nexus_modes_architect_write ON public.nexus_modes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'architect'::app_role) OR public.has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'architect'::app_role) OR public.has_role(auth.uid(),'administrator'::app_role));

-- ============ nexus_lanes ============
CREATE TABLE public.nexus_lanes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  skin_token text NOT NULL DEFAULT 'reddit',
  status text NOT NULL DEFAULT 'stub' CHECK (status IN ('live','stub','retired')),
  min_privilege text NOT NULL DEFAULT 'operator' CHECK (min_privilege IN ('architect','operator','node')),
  sort_order int NOT NULL DEFAULT 0
);
ALTER TABLE public.nexus_lanes ENABLE ROW LEVEL SECURITY;
CREATE POLICY nexus_lanes_read ON public.nexus_lanes FOR SELECT TO authenticated
  USING (public.has_min_privilege(auth.uid(), min_privilege));
CREATE POLICY nexus_lanes_architect_write ON public.nexus_lanes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'architect'::app_role) OR public.has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'architect'::app_role) OR public.has_role(auth.uid(),'administrator'::app_role));

-- ============ response_drafts: persist redirect selection ============
ALTER TABLE public.response_drafts
  ADD COLUMN IF NOT EXISTS selected_redirect_id uuid REFERENCES public.redirect_targets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS selected_frame_key text;

-- ============ select_redirect_for_draft RPC ============
CREATE OR REPLACE FUNCTION public.select_redirect_for_draft(_topic_slug text, _venue text)
RETURNS TABLE (
  id uuid,
  slug text,
  destination_url text,
  audience_frames jsonb,
  video_url text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, slug, destination_url, audience_frames, video_url
  FROM public.redirect_targets
  WHERE is_active = true
    AND (topic_slug = _topic_slug OR topic_slug IS NULL)
  ORDER BY (topic_slug = _topic_slug) DESC, conversion_count DESC, click_count DESC
  LIMIT 1;
$$;

-- ============ SEED DATA ============
INSERT INTO public.topic_verticals (slug, name, status, min_privilege) VALUES
  ('fire_defense','Fire Defense','active','operator');

INSERT INTO public.voice_templates (slug, venue, topic_slug, register_notes, system_prompt_fragment, drift_guardrails, min_privilege) VALUES
  ('voice.fire_defense.reddit','reddit','fire_defense',
   'Peer-to-peer, receipts-not-claims, no advocacy register, no pleading. Practitioner-to-practitioner.',
   'Voice: Reddit fire-defense practitioner. Short paragraphs. Receipts before claims. No advocacy framing. No pleading. Drop the redirect as a peer pointing to where the substrate lives, not as a sales handoff.',
   '["no_advocacy_register","no_pleading","no_sales_energy","receipts_before_claims"]'::jsonb,
   'operator'),
  ('voice.fire_defense.bluesky','bluesky','fire_defense',
   'Gentler open, holds space before landing receipts. Receipts framed as gift, not challenge.',
   'Voice: Bluesky fire-defense. Open with care, land receipts gently. Lower velocity, more breath. Receipts framed as offering. No challenge energy.',
   '["trauma_aware","receipts_as_gift","no_challenge_energy"]'::jsonb,
   'operator'),
  ('voice.fire_defense.telegram','telegram','fire_defense',
   'Operator-direct, loading-dock peer-to-peer, full operator register.',
   'Voice: Telegram operator-direct. Loading-dock register. Tight, declarative, peer-to-peer. Full operator vocabulary, private channel.',
   '["operator_register","no_public_voice_discipline_needed"]'::jsonb,
   'operator');

INSERT INTO public.redirect_targets (slug, destination_url, topic_slug, audience_frames, min_privilege) VALUES
  ('fd-guide','https://livingsys.org/fire-defense/guide/','fire_defense',
   '{
      "default": {
        "copy": "There''s a field guide we put together that walks through this end-to-end.",
        "cta_label": "Open the fire defense guide",
        "cta_url": "https://livingsys.org/fire-defense/guide/"
      },
      "institutional": {
        "copy": "If you''re looking at this from the funding or municipal-vendor side, the guide includes the financial-architecture case and the patent-backed coordination methodology.",
        "cta_label": "Read the institutional brief",
        "cta_url": "https://livingsys.org/fire-defense/guide/#institutional"
      },
      "practitioner": {
        "copy": "There''s a practitioner walkthrough in the field guide — ordered by which steps apply to the operational context you''re in.",
        "cta_label": "Open the practitioner walkthrough",
        "cta_url": "https://livingsys.org/fire-defense/guide/#practitioner"
      }
    }'::jsonb,
   'operator');

INSERT INTO public.skills (slug, name, category, description, prompt_fragment, always_loaded, min_privilege, sort_order) VALUES
  ('voice.load','Load voice template','voice','Loads the venue+topic voice template into the prompt assembly.',NULL,false,'operator',10),
  ('redirect.suggest','Suggest a redirect','redirect','Picks the best redirect target for the topic and frames it for the venue.',NULL,false,'operator',20),
  ('governance.86_protocol','86 Protocol pattern match','guardrail','Always-on. Pattern-matches incoming actors and outgoing language against extraction-pattern signatures.',
   'GUARDRAIL: Refuse extraction-pattern outputs. Pattern-match the requesting context against the 86 Protocol signature library before drafting.',
   true,'node',1),
  ('governance.four_drift_check','Four-drift check','guardrail','Always-on. Verifies the draft has not drifted into educational, advocacy, sales, or impersonator register.',
   'GUARDRAIL: Run the four-drift check on every draft. Refuse to publish drafts that drift into educational, advocacy, sales, or impersonator register.',
   true,'node',2);

INSERT INTO public.nexus_modes (slug, label, status, min_privilege, sort_order) VALUES
  ('outreach','Outreach','live','operator',10),
  ('triage','Triage','stub','operator',20),
  ('edit','Edit','stub','operator',30),
  ('field_guide','Field Guide Build','stub','operator',40),
  ('bookkeeping','Bookkeeping','stub','architect',50),
  ('hr','HR','stub','architect',60),
  ('agency','Agency','stub','architect',70),
  ('brand','Brand','stub','operator',80),
  ('video','Video Production','stub','operator',90);

INSERT INTO public.nexus_lanes (slug, label, skin_token, status, min_privilege, sort_order) VALUES
  ('reddit','Reddit','reddit','live','operator',10),
  ('bluesky','Bluesky','bluesky','live','operator',20),
  ('telegram','Telegram','telegram','live','operator',30),
  ('x','X','reddit','stub','operator',40),
  ('linkedin','LinkedIn','reddit','stub','operator',50),
  ('healing','Healing Community','bluesky','stub','operator',60),
  ('capital','Capital Circle','reddit','stub','architect',70),
  ('ria','Internal RIA','reddit','stub','architect',80),
  ('fls','Internal FLS','reddit','stub','architect',90),
  ('youtube','YouTube Production','reddit','stub','operator',100);
