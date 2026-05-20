
-- 1) Subreddit discoveries
CREATE TABLE public.subreddit_discoveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seed_topic TEXT NOT NULL,
  subreddit TEXT NOT NULL,
  url TEXT,
  description TEXT,
  member_count_hint TEXT,
  relevance_score INT DEFAULT 0,
  relevance_reason JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'discovered', -- discovered | approved | rejected | watching
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (seed_topic, subreddit)
);
ALTER TABLE public.subreddit_discoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Architects manage subreddit_discoveries"
ON public.subreddit_discoveries FOR ALL
USING (public.has_role(auth.uid(), 'architect'::app_role) OR public.has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'architect'::app_role) OR public.has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Practitioners read subreddit_discoveries"
ON public.subreddit_discoveries FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE TRIGGER trg_subreddit_discoveries_updated
BEFORE UPDATE ON public.subreddit_discoveries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Conversation routes catalog
CREATE TABLE public.conversation_routes (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  handoff_notes TEXT,
  sub_account_slug TEXT, -- ghl_sub_accounts.slug when applicable
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conversation_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authed reads conversation_routes"
ON public.conversation_routes FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Architects manage conversation_routes"
ON public.conversation_routes FOR ALL
USING (public.has_role(auth.uid(), 'architect'::app_role) OR public.has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'architect'::app_role) OR public.has_role(auth.uid(), 'administrator'::app_role));

INSERT INTO public.conversation_routes (slug, label, description, handoff_notes, sub_account_slug, sort_order) VALUES
  ('ria_volunteer',     'RIA — Volunteer',           'Wants to help with on-the-ground regenerative impact work.', 'Hand off to RIA volunteer intake; share volunteer doc.', 'ria', 10),
  ('ria_donate',        'RIA — Donor',               'Wants to fund mission work or contribute capacity.',       'Send RIA giving page + project briefs.',                  'ria', 20),
  ('fls_investor',      'FLS — Investor / Capital',  'Has or routes institutional capital; Watershed Thesis fit.', 'Move to FLS investor flow; offer Watershed Thesis call.',  'fls', 30),
  ('fls_architect',     'FLS — Architect Onboarding','Builder / coordinator who wants to help run the OS itself.','Send architect onboarding doc; invite to dashboard.',      'fls', 40),
  ('bls_healer',        'BLS — Healer / Practitioner','Healing-arts practitioner; regional network.',             'Loop into BLS healer dispatch and Loveland/Boulder events.','blossoming_lotus_sound', 50),
  ('ngo_educator',      'NGO — Educator / Org Lead', 'Runs or works inside an NGO; wants strategic fluency.',     'Share NotebookLM hand-off recipe + canon pack.',           null, 60),
  ('funder_intro',      'Funder Intro',              'HNW/family office/foundation contact ripe for warm intro.', 'Pass to funder-scout pipeline + draft brief.',             null, 70),
  ('mutual_aid',        'Mutual Aid Connect',        'Community organizer / mutual aid practitioner.',            'Connect to local pod; share Below the Radar.',             null, 80),
  ('vanity_onramp',     'Vanity On-Ramp',            'High-profile person who needs the idea framed as their own.','Use vanity_onramp Gemma mode.',                            null, 90),
  ('parked',            'Parked',                    'Not ready / not now / wrong-fit.',                          'Note why; let it cool.',                                   null, 999);

-- 3) Outreach conversations
CREATE TABLE public.outreach_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_id UUID REFERENCES public.outreach_targets(id) ON DELETE SET NULL,
  canon_slug TEXT,
  channel TEXT NOT NULL,           -- bluesky | reddit | email | web | dm
  external_thread_url TEXT,
  counterpart_handle TEXT,
  counterpart_display_name TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- open | awaiting_reply | routed | parked | closed
  route_slug TEXT REFERENCES public.conversation_routes(slug),
  routed_at TIMESTAMPTZ,
  assigned_to UUID,                 -- user id of operator handling it
  last_inbound_at TIMESTAMPTZ,
  last_outbound_at TIMESTAMPTZ,
  message_count INT NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.outreach_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Architects manage outreach_conversations"
ON public.outreach_conversations FOR ALL
USING (public.has_role(auth.uid(), 'architect'::app_role) OR public.has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'architect'::app_role) OR public.has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Authed read outreach_conversations"
ON public.outreach_conversations FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Assigned practitioner can update own"
ON public.outreach_conversations FOR UPDATE
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());

CREATE INDEX idx_outreach_conv_status ON public.outreach_conversations(status);
CREATE INDEX idx_outreach_conv_route ON public.outreach_conversations(route_slug);
CREATE INDEX idx_outreach_conv_last_inbound ON public.outreach_conversations(last_inbound_at DESC);

CREATE TRIGGER trg_outreach_conv_updated
BEFORE UPDATE ON public.outreach_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Outreach messages
CREATE TABLE public.outreach_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.outreach_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,          -- inbound | outbound
  author_handle TEXT,
  body TEXT NOT NULL,
  external_message_url TEXT,
  external_message_id TEXT,
  draft_id UUID REFERENCES public.outreach_drafts(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.outreach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Architects manage outreach_messages"
ON public.outreach_messages FOR ALL
USING (public.has_role(auth.uid(), 'architect'::app_role) OR public.has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'architect'::app_role) OR public.has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Authed read outreach_messages"
ON public.outreach_messages FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_outreach_msg_conv ON public.outreach_messages(conversation_id, created_at);

-- 5) Extend adjacent-community cohorts on existing canon pages
UPDATE public.canon_pages SET audience_cohorts = COALESCE(audience_cohorts, '[]'::jsonb) || '[
  {"cohort":"homestead_sovereignty","channel":"reddit","stems":["site:reddit.com/r/homestead regenerative","site:reddit.com/r/IntentionalCommunity land trust","site:reddit.com/r/Permaculture watershed"]},
  {"cohort":"mutual_aid","channel":"reddit","stems":["site:reddit.com/r/MutualAid coordination","site:reddit.com/r/SolarPunk community infrastructure"]},
  {"cohort":"veterans_regen","channel":"reddit","stems":["site:reddit.com/r/Veterans regenerative agriculture","site:reddit.com/r/Veterans land project"]},
  {"cohort":"healing_adjacent","channel":"bluesky","stems":["site:bsky.app sound bath community","site:bsky.app trauma-informed organizing"]}
]'::jsonb
WHERE slug IN ('fire-defense-guide','below-the-radar','watershed-thesis','regenerative-gem');
