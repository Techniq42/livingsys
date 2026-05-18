-- ============================================================
-- GEMMA MODES: focus presets for the universal drawer
-- ============================================================
CREATE TABLE public.gemma_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  icon text,                              -- lucide icon name
  tagline text,
  system_prompt_addendum text NOT NULL,
  allowed_tools text[] NOT NULL DEFAULT '{}',
  default_lens text,                      -- fls | healing | null
  voice_register text DEFAULT 'campaign', -- campaign | operator | clinical
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gemma_modes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read enabled modes"
  ON public.gemma_modes FOR SELECT TO authenticated
  USING (is_enabled = true OR public.has_role(auth.uid(), 'architect'::app_role));

CREATE POLICY "Architects manage modes"
  ON public.gemma_modes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'architect'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'architect'::app_role));

CREATE TRIGGER trg_gemma_modes_updated_at
  BEFORE UPDATE ON public.gemma_modes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TOOL REGISTRY: every capability Gemma can route to
-- ============================================================
CREATE TABLE public.tool_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  kind text NOT NULL,                     -- crm | scraper | search | automation | handoff | publisher
  surface text NOT NULL DEFAULT 'server', -- server | client | external
  description text,
  skill_summary text,                     -- one-liner Gemma sees
  confidence_threshold numeric NOT NULL DEFAULT 0.75,
  is_enabled boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tool_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read enabled tools"
  ON public.tool_registry FOR SELECT TO authenticated
  USING (is_enabled = true OR public.has_role(auth.uid(), 'architect'::app_role));

CREATE POLICY "Architects manage tool registry"
  ON public.tool_registry FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'architect'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'architect'::app_role));

CREATE TRIGGER trg_tool_registry_updated_at
  BEFORE UPDATE ON public.tool_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- SKILL FILES: markdown proficiencies Gemma loads per mode
-- ============================================================
CREATE TABLE public.skill_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text,
  body_markdown text NOT NULL,
  applies_to_modes text[] NOT NULL DEFAULT '{}',
  applies_to_tools text[] NOT NULL DEFAULT '{}',
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.skill_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read enabled skills"
  ON public.skill_files FOR SELECT TO authenticated
  USING (is_enabled = true OR public.has_role(auth.uid(), 'architect'::app_role));

CREATE POLICY "Architects manage skill files"
  ON public.skill_files FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'architect'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'architect'::app_role));

CREATE TRIGGER trg_skill_files_updated_at
  BEFORE UPDATE ON public.skill_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- SWITCHBOARD DECISIONS: routing decision log
-- ============================================================
CREATE TABLE public.switchboard_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mode_slug text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  tools_considered text[] NOT NULL DEFAULT '{}',
  tool_chosen text,
  reasoning text,
  confidence numeric,
  outcome text,                           -- pending | acted_on | dismissed | failed
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.switchboard_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators insert own decisions"
  ON public.switchboard_decisions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Operators read own decisions"
  ON public.switchboard_decisions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'architect'::app_role));

CREATE POLICY "Architects manage decisions"
  ON public.switchboard_decisions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'architect'::app_role));

CREATE INDEX idx_switchboard_decisions_user ON public.switchboard_decisions(user_id, created_at DESC);
CREATE INDEX idx_switchboard_decisions_mode ON public.switchboard_decisions(mode_slug, created_at DESC);

-- ============================================================
-- GEMMA FEEDBACK: per-message signals from the drawer
-- ============================================================
CREATE TABLE public.gemma_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  decision_id uuid REFERENCES public.switchboard_decisions(id) ON DELETE SET NULL,
  mode_slug text,
  message_excerpt text,
  signal text NOT NULL,                   -- thumbs_up | thumbs_down | wrong_category | use_this
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gemma_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators insert own feedback"
  ON public.gemma_feedback FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Operators read own feedback"
  ON public.gemma_feedback FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'architect'::app_role));

CREATE INDEX idx_gemma_feedback_user ON public.gemma_feedback(user_id, created_at DESC);
CREATE INDEX idx_gemma_feedback_signal ON public.gemma_feedback(signal, created_at DESC);

-- ============================================================
-- SEED: gemma_modes
-- ============================================================
INSERT INTO public.gemma_modes (slug, label, icon, tagline, system_prompt_addendum, allowed_tools, default_lens, sort_order) VALUES
('free_chat', 'Free chat', 'MessageCircle',
 'Talk it through. I''ll suggest a focus mode when an action shape appears.',
 'You are Gemma in free-chat mode. Listen for action shapes (a grant lead, a post to repurpose, an outreach idea, a funder match). When you detect one, name it and offer to switch into the matching focus mode (grant_fit, repurpose_post, vanity_onramp). Never let free-chat dead-end — every meaningful exchange should leave the user with at least one concrete next move or an offer to switch modes.',
 ARRAY['canon_lookup','substrate_query'], NULL, 10),

('grant_fit', 'Grant fit + funder sniff', 'Coins',
 'Sniff out funder buckets and draft proposals aligned to their interests without mission creep.',
 'You are Gemma in grant-fit mode. Apply the four-move funding workflow: (1) sniff funder buckets matching FLS/RIA mission — especially private family offices, regenerative-aligned foundations, watershed/soil/regional capital; (2) draft proposal language aligned to the specific funder''s stated interests and language; (3) gauge our org capacity to actually commit (reference operator availability, current campaign_arc loads); (4) flag mission-creep risk explicitly — if the fit requires us to bend our core mission, say so out loud. Pull from the Watershed Thesis canon page for institutional-capital framing. Always end with a concrete next move (specific funder to research, draft paragraph, or capacity check).',
 ARRAY['firecrawl_search','firecrawl_scrape','canon_lookup','substrate_query'], 'fls', 20),

('repurpose_post', 'Repurpose post', 'Repeat',
 'Take a LinkedIn (or any) post and reformat it for Bluesky, Reddit, newsletter, Telegram.',
 'You are Gemma in repurpose mode. The user will paste a source post (usually from LinkedIn). Reformat it for the requested target channels with channel-native voice: Bluesky (≤300 chars, no hashtag spam, conversational), Reddit (community-appropriate, no marketing speak, lead with substance), newsletter (longer-form, story-first), Telegram (short, action-oriented). Preserve the source''s voice and key claims. If the source post contains a CTA, soften it on channels where promotion reads poorly. Apply the 80/20 rule: most repurposes should be value, not ask.',
 ARRAY['canon_lookup'], NULL, 30),

('vanity_onramp', 'Vanity on-ramp', 'Sparkle',
 'Frame an ask to a celebrity/athlete/rapper as a community-benefit on-ramp — their idea, their community.',
 'You are Gemma in vanity-on-ramp mode. The target is someone with platform but no advocacy background (retired athletes, musicians, celebrities, family-office heirs). The frame is NEVER "support our cause" — it is ALWAYS "here is a way to do the thing you already want to do (give back to your community, use your platform, leave a legacy) that we can quietly make easy for you." Make their community-of-origin the protagonist. Position FLS/RIA as the invisible infrastructure that makes their vision real. Pull from the Below the Radar canon page for back-channel framing. Draft outreach that reads as if the idea originated with them. Flag any framing that risks sounding like a solicitation.',
 ARRAY['firecrawl_search','canon_lookup','substrate_query'], NULL, 40);

-- ============================================================
-- SEED: tool_registry
-- ============================================================
INSERT INTO public.tool_registry (slug, label, kind, surface, description, skill_summary, confidence_threshold) VALUES
('firecrawl_scrape', 'Firecrawl Scrape', 'scraper', 'server',
 'Extract markdown/branding/screenshots from a specific URL.',
 'Use for: scraping a known funder''s About page, extracting branding for a constellation site, pulling a single article. Public web only — does NOT work on LinkedIn/Instagram/Facebook (auth-walled).', 0.7),

('firecrawl_search', 'Firecrawl Search', 'search', 'server',
 'Web search with optional content scraping and geo/time filters.',
 'Use for: funder sniffing (foundation directories, recent grant announcements), regional event discovery, current-events tracking for remix. Geo + time filters (qdr:d/w/m) are key for "what happened this week in Loveland/Boulder".', 0.7),

('ghl_workflow', 'GoHighLevel Workflow', 'crm', 'external',
 'Trigger pre-configured GHL workflows (funnel A/B tests, email sequences, membership tiers).',
 'Use when: an action needs CRM-grade follow-up (lead capture, nurture, segmentation). Gemma proposes the workflow name and required payload; n8n executes. Do not invent workflows — only reference ones already configured in GHL.', 0.8),

('n8n_dispatch', 'n8n Dispatch', 'automation', 'external',
 'Send a structured action to n8n for cross-system execution.',
 'Use for: anything that crosses system boundaries (post to Bluesky, append to Airtable, fire a Slack ping, schedule a GHL action). n8n is the executor — Gemma just hands off the intent.', 0.75),

('notebook_lm_handoff', 'NotebookLM Hand-off', 'handoff', 'client',
 'Bundle source URLs + a regenerative-prompt context for the user to paste into NotebookLM.',
 'Use when: the user needs deep strategic synthesis across multiple sources. Gemma outputs a clean URL list + a tailored prompt for the user to drop into NotebookLM. We do not call NotebookLM directly.', 0.6),

('canon_lookup', 'Canon Lookup', 'search', 'server',
 'Resolve a topic to the matching canonical page (Watershed, Below the Radar, Regenerative Gem, Fire Defense).',
 'Use to: recommend the right "door" for a given audience. Watershed = institutional capital. Below the Radar = back-channel/practitioner. Regenerative Gem = systems-thinking orientation. Fire Defense = operational doctrine.', 0.85);

-- ============================================================
-- SEED: skill_files
-- ============================================================
INSERT INTO public.skill_files (slug, title, summary, body_markdown, applies_to_modes, sort_order) VALUES
('eighty_twenty_authority', '80/20 Authority Rule',
 'Reverse-Coca-Cola: 80% value upfront, 20% ask. Long-game brand building.',
 E'## 80/20 Authority Rule (Reverse-Coca-Cola)\n\nEvery outbound communication should default to 80% value, 20% ask.\n\n**Why:** FLS/RIA is playing the long game. Coca-Cola spent decades building brand before extracting; we are doing the reverse — deliver immediate, well-considered upfront value (no AI slop, no generic outreach) and let the brand compound on the backend.\n\n**How to apply:**\n- Draft a post → 4 of 5 paragraphs should be insight/utility/story, 1 should be the ask (and "ask" can be as soft as "if this resonates, here is where to read more")\n- Draft outreach → lead with what we observed about THEIR work, what we can offer, then the ask\n- Draft a funder pitch → grant fit mode still applies the rule: the proposal opens with the funder''s stated interests being well-served, not our needs\n\n**Anti-pattern:** Cold "we need X to do Y" openers. Anything that reads like a fundraising email. Anything that name-drops without substance.',
 ARRAY['grant_fit','repurpose_post','vanity_onramp','free_chat'], 10),

('grant_proposal_anatomy', 'Grant Proposal Anatomy',
 'Four-move workflow: funder bucket → aligned language → capacity check → mission-creep flag.',
 E'## Grant Proposal Anatomy\n\n**Move 1 — Sniff the bucket.** Where is this funder actually putting money right now? Look at their last 12 months of grants, not their stated focus areas. Family offices especially: behavior beats brochure.\n\n**Move 2 — Mirror their language.** Use the funder''s own framing words back to them. If they say "ecosystem restoration," do not switch to "regenerative agriculture" — they''re cousins, not synonyms, and the gatekeeper reads the difference.\n\n**Move 3 — Capacity check.** Before drafting, ask: do we actually have the operator-hours to deliver this if we win it? Check current campaign_arc loads. A grant we cannot deliver costs more than one we do not pursue.\n\n**Move 4 — Mission-creep flag.** If winning requires us to bend the core mission (FLS coordination infrastructure, RIA 501c3 regenerative-systems work), say it out loud BEFORE drafting. Some mission stretch is fine; mission distortion is not.\n\n**For private family offices specifically:** the gatekeeper problem is real. Watershed Thesis is the institutional-capital door. Below the Radar is the back-channel framing. Vanity on-ramp framing often works better than a traditional proposal.',
 ARRAY['grant_fit'], 20),

('linkedin_repurpose_recipe', 'LinkedIn Repurpose Recipe',
 'Source post → channel-native rewrites for Bluesky, Reddit, newsletter, Telegram.',
 E'## LinkedIn Repurpose Recipe\n\nFirecrawl does NOT reliably scrape LinkedIn (auth-walled). Instead: the user posts to LinkedIn AND drops the source text into the drawer. Gemma repurposes from there.\n\n**Per-channel rules:**\n\n**Bluesky** — ≤300 chars. Conversational, not promotional. No hashtag stuffing. Lead with the insight, not the credential. Link to long-form only if there''s a real destination.\n\n**Reddit** — Community-specific. NEVER paste the LinkedIn post directly — it screams marketing. Rewrite from scratch in the voice of someone who belongs in that sub. Lead with substance, bury the affiliation. Match the sub''s norms (r/regenerative tolerates more advocacy than r/Colorado).\n\n**Newsletter** — Longer-form. Story-first. The LinkedIn post is usually the kernel — expand the context, add the "why this matters now," close with an invitation (not a CTA).\n\n**Telegram** — Short, action-oriented, often image+caption. Best for: in-network amplification asks, event reminders, time-sensitive shares.\n\n**Always preserve:** the core claim, the credit/attribution, the voice. Strip: corporate-speak, hashtag dumps, "thoughts?" closers.',
 ARRAY['repurpose_post'], 30),

('vanity_onramp_framing', 'Vanity On-Ramp Framing',
 'Position the ask as the target''s own idea benefiting their community — invisible infrastructure.',
 E'## Vanity On-Ramp Framing\n\n**Targets:** retired athletes, musicians, celebrities, family-office heirs, anyone with platform + zero advocacy fluency who has expressed wanting to "give back" or "do something meaningful."\n\n**Core move:** their community-of-origin is the protagonist. FLS/RIA is the invisible infrastructure. The ask is framed as a way to do the thing they already want to do — easier, with more impact, with us handling the part they do not know how to do.\n\n**Never say:**\n- "support our cause"\n- "we''re raising money for X"\n- "would you consider donating/endorsing/joining"\n\n**Do say:**\n- "Here''s what your community in [hometown] is dealing with right now"\n- "Here''s a path where you''re the one bringing X home"\n- "We can handle the [permitting / logistics / coordination] part — your job is just [the part they''re uniquely positioned to do]"\n\n**Examples:**\n- Rapper from Compton wants to do good → community soundbath/benefit show in Compton with proceeds to local soil/water work. They''re the headliner; we''re the coordination.\n- Retired NFL player from rural Texas → drought-resilience demo on his family''s land that becomes a regional template. He''s the host; we''re the technical backbone.\n- Family office heir → "regenerative legacy fund" in their family name, deployed through RIA''s vetted practitioner network. Their name on the door; our network doing the work.\n\n**Pull from canon:** Below the Radar (back-channel framing), Regenerative Gem (orientation for systems-thinking novices).',
 ARRAY['vanity_onramp'], 40),

('notebook_lm_handoff_recipe', 'NotebookLM Hand-off Recipe',
 'Bundle URLs + tailored prompt for the user to paste into NotebookLM for deep synthesis.',
 E'## NotebookLM Hand-off Recipe\n\nWhen the user needs deep strategic synthesis across multiple sources (5+ URLs, cross-document reasoning, "help me see the pattern"), do NOT try to do it in-drawer. Hand off to NotebookLM.\n\n**Output format:**\n\n```\n## NotebookLM Bundle: [topic]\n\n**Sources to add:**\n1. [URL] — [why this source]\n2. [URL] — [why this source]\n...\n\n**Prompt to paste:**\n[Tailored regenerative-prompt that asks NotebookLM the specific strategic question, with framing context]\n```\n\n**Why this works:** NotebookLM is purpose-built for grounded multi-source synthesis with citations. We are not trying to replace it — we are teaching the operator to wield it. The drawer''s job is to assemble the right sources and frame the right question.\n\n**Use cases:**\n- "Should we pursue this funder?" → bundle their last 5 grant announcements + our mission docs + Watershed Thesis\n- "How do we frame this to [celebrity]?" → bundle their public interviews + Below the Radar + Regenerative Gem\n- "What''s the regional landscape for healing studios?" → bundle competitor sites + local press + Melissa/Leanne''s context',
 ARRAY['grant_fit','vanity_onramp','free_chat'], 50);