
-- =========================================
-- GHL Sub-Account Architecture
-- =========================================

CREATE TABLE public.ghl_sub_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  agency_role text NOT NULL DEFAULT 'owned' CHECK (agency_role IN ('owned','external')),
  ghl_location_id text,
  voice_register text NOT NULL DEFAULT 'operator',
  lens_binding text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ghl_sub_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Architects manage sub-accounts"
  ON public.ghl_sub_accounts FOR ALL
  USING (public.has_role(auth.uid(), 'architect'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'architect'::app_role));

CREATE POLICY "Authenticated read active sub-accounts"
  ON public.ghl_sub_accounts FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE TRIGGER trg_ghl_sub_accounts_updated
  BEFORE UPDATE ON public.ghl_sub_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.ghl_sub_accounts (slug, label, agency_role, voice_register, lens_binding, notes, sort_order) VALUES
  ('empty', 'Empty (Scratch / Sandbox)', 'owned', 'operator', null, 'Empty agency slot — use as a sandbox for testing workflows before promoting to FLS or BLS.', 10),
  ('fls', 'Fellowship of Living Systems', 'owned', 'campaign', 'fls', 'Movement-building / regenerative coordination. Watershed Thesis canon door.', 20),
  ('blossoming_lotus_sound', 'Blossoming Lotus Sound', 'owned', 'operator', 'healing', 'Melissa & Leanne''s yoga + sound healing practice. Northern Denver / Loveland / Boulder.', 30);

-- =========================================
-- Practitioner ↔ Sub-Account bindings
-- =========================================

CREATE TABLE public.practitioner_sub_account_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sub_account_slug text NOT NULL REFERENCES public.ghl_sub_accounts(slug) ON DELETE CASCADE,
  can_propose boolean NOT NULL DEFAULT true,
  can_approve boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, sub_account_slug)
);

ALTER TABLE public.practitioner_sub_account_bindings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Architects manage bindings"
  ON public.practitioner_sub_account_bindings FOR ALL
  USING (public.has_role(auth.uid(), 'architect'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'architect'::app_role));

CREATE POLICY "Users read own bindings"
  ON public.practitioner_sub_account_bindings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- =========================================
-- GHL Inventory snapshot
-- =========================================

CREATE TABLE public.ghl_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_account_slug text NOT NULL REFERENCES public.ghl_sub_accounts(slug) ON DELETE CASCADE,
  object_kind text NOT NULL CHECK (object_kind IN ('funnel','workflow','pipeline','custom_field','course','offer','calendar','tag','form','survey','snapshot')),
  ghl_object_id text NOT NULL,
  name text NOT NULL,
  status text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sub_account_slug, object_kind, ghl_object_id)
);

CREATE INDEX idx_ghl_inventory_lookup ON public.ghl_inventory (sub_account_slug, object_kind);

ALTER TABLE public.ghl_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Architects manage inventory"
  ON public.ghl_inventory FOR ALL
  USING (public.has_role(auth.uid(), 'architect'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'architect'::app_role));

CREATE POLICY "Practitioners read bound sub-account inventory"
  ON public.ghl_inventory FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'architect'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.practitioner_sub_account_bindings b
      WHERE b.user_id = auth.uid() AND b.sub_account_slug = ghl_inventory.sub_account_slug
    )
  );

CREATE TRIGGER trg_ghl_inventory_updated
  BEFORE UPDATE ON public.ghl_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- GHL Action Log (proposals, approvals, browser-action escalations)
-- =========================================

CREATE TABLE public.ghl_action_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_account_slug text NOT NULL REFERENCES public.ghl_sub_accounts(slug) ON DELETE CASCADE,
  proposed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  via text NOT NULL DEFAULT 'api' CHECK (via IN ('api','browser_fallback','manual')),
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','approved','executing','completed','failed','rejected')),
  result jsonb,
  error_message text,
  decision_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ghl_action_log_sub ON public.ghl_action_log (sub_account_slug, created_at DESC);

ALTER TABLE public.ghl_action_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Architects manage action log"
  ON public.ghl_action_log FOR ALL
  USING (public.has_role(auth.uid(), 'architect'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'architect'::app_role));

CREATE TRIGGER trg_ghl_action_log_updated
  BEFORE UPDATE ON public.ghl_action_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- Extend skill_files + switchboard_decisions for sub-account scoping
-- =========================================

ALTER TABLE public.skill_files
  ADD COLUMN IF NOT EXISTS scoped_to_sub_account text REFERENCES public.ghl_sub_accounts(slug) ON DELETE SET NULL;

ALTER TABLE public.switchboard_decisions
  ADD COLUMN IF NOT EXISTS sub_account_slug text REFERENCES public.ghl_sub_accounts(slug) ON DELETE SET NULL;

-- =========================================
-- Seed: ghl_pilot mode + ghl tools + sub-account-aware skills
-- =========================================

INSERT INTO public.gemma_modes (slug, label, tagline, system_prompt_addendum, allowed_tools, default_lens, voice_register, is_enabled, sort_order)
VALUES (
  'ghl_pilot',
  'GHL Pilot',
  'Drive GoHighLevel for the active sub-account. API-first, browser-action as fallback.',
  E'You are piloting GoHighLevel for ONE sub-account at a time. The active sub-account is supplied in the context block — never operate across sub-accounts in a single turn. Empty is a sandbox, FLS is movement-building (campaign voice), Blossoming Lotus Sound is healing/yoga (warm operator voice).\n\nALWAYS:\n1. State the sub-account by name before describing any action.\n2. Prefer ghl_bridge (API via n8n) over ghl_browser_fallback. Only recommend browser_fallback when the API cannot reach the surface (funnel visual editor, lesson rich content, drag-drop builders).\n3. Chunk multi-step plans into approvable units. Low-spoon operator — one decision at a time.\n4. Reference ghl_inventory before proposing creates. If an object already exists, surface it instead of duplicating.\n5. Every recommendation must be loggable to ghl_action_log: name the action_kind, the payload shape, and whether it is api or browser_fallback.',
  ARRAY['ghl_bridge','ghl_browser_fallback','firecrawl','canon_lookup','n8n_webhook'],
  null,
  'operator',
  true,
  50
)
ON CONFLICT (slug) DO UPDATE SET
  tagline = EXCLUDED.tagline,
  system_prompt_addendum = EXCLUDED.system_prompt_addendum,
  allowed_tools = EXCLUDED.allowed_tools,
  voice_register = EXCLUDED.voice_register;

INSERT INTO public.tool_registry (slug, label, kind, skill_summary, confidence_threshold, is_enabled)
VALUES
  ('ghl_bridge', 'GHL Bridge (API via n8n)', 'api', 'Calls GoHighLevel v2 API through n8n for the active sub-account. Use for contacts, workflows, conversations, pipelines, custom fields, courses (Memberships), offers, calendars, reports. Always specify sub_account_slug in payload.', 0.75, true),
  ('ghl_browser_fallback', 'GHL Browser Action Fallback', 'browser', 'Escalation channel for GHL surfaces the API cannot reach: funnel/website visual editor, course lesson rich content, drag-drop builders. Sends a structured task to the browser-action runner (Claude Code or attached browser extension). Always logs to ghl_action_log with via=browser_fallback and waits for human approval before executing.', 0.85, true)
ON CONFLICT (slug) DO UPDATE SET
  label = EXCLUDED.label,
  kind = EXCLUDED.kind,
  skill_summary = EXCLUDED.skill_summary,
  confidence_threshold = EXCLUDED.confidence_threshold,
  is_enabled = EXCLUDED.is_enabled;

INSERT INTO public.skill_files (slug, title, summary, body_markdown, applies_to_modes, scoped_to_sub_account, is_enabled, sort_order)
VALUES
  ('ghl-anatomy',
   'GHL Anatomy: Which Function Lives Where',
   'Map of GoHighLevel sub-account surfaces, where each capability lives in the UI vs API, and common gotchas. Sub-account-agnostic.',
   E'# GHL Anatomy\n\n## Top-level surfaces (per sub-account)\n- **Contacts** — `/contacts/`. Smart Lists are saved filters; Bulk Actions are batch operations. API: `/contacts` v2.\n- **Conversations** — `/conversations/`. Unified inbox: SMS, email, FB/IG DM, GMB chat, webchat. API: `/conversations` v2.\n- **Opportunities** — `/opportunities/`. Lives inside Pipelines. API: `/opportunities` v2.\n- **Calendars** — `/calendars/`. Round-robin, class, service calendars. API: `/calendars` v2.\n- **Marketing → Emails / Social Planner / Ad Manager**\n- **Automation → Workflows** — the engine. Triggers + actions. API: `/workflows` v2 (enroll/list only — building still UI).\n- **Sites → Funnels / Websites / Forms / Surveys / Chat Widgets** — visual builders, mostly UI-only.\n- **Memberships → Courses / Communities** — where ALL course content lives. API partial.\n- **Reputation → Reviews**\n- **Reporting** — agency + sub-account dashboards.\n- **Payments → Products / Orders / Subscriptions / Invoices**\n- **Settings → Custom Fields / Custom Values / Tags / Pipelines / Phone Numbers / Integrations**\n\n## API vs UI ceiling (the honest map)\n| Surface | API can | API cannot |\n|---|---|---|\n| Contacts | full CRUD, tags, custom fields | n/a |\n| Workflows | enroll, list, pause | build/edit |\n| Funnels (visual) | list, publish | edit pages |\n| Memberships | create product, category, post, offer, drip | rich lesson body, video transcoding |\n| Conversations | read, send | edit canned snippets UI |\n\n## Gotchas Curtis hits repeatedly\n- "Workflow" vs "Trigger Link" vs "Trigger" — three different things. Trigger Links are short URLs that fire a workflow on click.\n- Custom Fields are sub-account-scoped; they do NOT migrate across sub-accounts unless snapshotted.\n- "Tags" and "Custom Values" look similar but: Tags are per-contact booleans; Custom Values are sub-account-wide constants (like merge fields).\n- The "Sites" tab and "Marketing → Email Templates" both have builders — Email Builder is separate from Funnel Builder.\n- A "Snapshot" is the full export blob used to clone sub-accounts. Agency-level only.\n',
   ARRAY['ghl_pilot'],
   null,
   true,
   10),
  ('ghl-course-build',
   'GHL Course Build Sequence (Memberships)',
   'Step-by-step build path for a Membership course in GHL with API payload templates and UI-only escalation points.',
   E'# GHL Course Build (Memberships)\n\n## Object hierarchy\nMembership Site → Category → Product → Offer → Posts (lessons). Drip rules live on the Category.\n\n## Build sequence\n1. **Create the Membership Site** (one per sub-account is usually enough). UI-only. Skip if it exists.\n2. **Create Category** = course shell. API: `POST /products/categories` (partial). Fields: name, description, slug.\n3. **Create Product** = the course offering. API: `POST /products`. Bind to category.\n4. **Create Offer** = pricing/access. API: `POST /offers`. Free, one-time, recurring, or installment.\n5. **Create Posts** = lessons. API exists for shell + ordering. **Rich lesson body (video embed, quizzes, downloads) is UI-only → escalate to ghl_browser_fallback.**\n6. **Drip schedule** on Category. UI-only currently → ghl_browser_fallback.\n7. **Publish + assign Offer to Funnel** (for sales page).\n\n## API payload templates (call via ghl_bridge → n8n)\n```json\n// Create category\n{ "name": "Place-Story Foundations", "description": "...", "membershipSiteId": "<site_id>" }\n\n// Create product\n{ "name": "Place-Story Foundations: 5-Lesson Course", "categoryId": "<category_id>", "type": "DIGITAL", "available": true }\n\n// Create offer\n{ "productId": "<product_id>", "name": "Free Access", "type": "FREE" }\n```\n\n## Browser-fallback escalation triggers\n- Adding video to a lesson (Wistia/Vimeo/native upload)\n- Drip schedule UI\n- Lesson reordering via drag-handle\n- Funnel page design for the sales page\n\n## Always do\n- Log every create to `ghl_action_log` with sub_account_slug and via.\n- Cross-check `ghl_inventory` first — if a course with this name already exists, surface it.\n',
   ARRAY['ghl_pilot','course_build'],
   null,
   true,
   20),
  ('ghl-funnel-iteration',
   'GHL Funnel Iteration & A/B',
   'How GHL handles funnel A/B variants, stats, and when to clone vs edit a funnel.',
   E'# GHL Funnel Iteration\n\n## A/B mechanics in GHL\n- Funnel steps support multiple "Variants" per step. GHL splits traffic.\n- Stats live on Funnel → Stats tab: visits, opt-ins, conversions per variant.\n- Winner is picked manually (no auto-promote yet).\n\n## API access\n- List funnels, list steps, list variants: yes (read).\n- Edit variant body / design: NO. UI-only → ghl_browser_fallback.\n- Pull stats: yes via reporting endpoints.\n\n## Decision tree\n- Need to test a headline / CTA copy → create variant via browser_fallback, monitor via ghl_bridge stats pull.\n- Need to test pricing → use Offer A/B at the Product level instead (cleaner).\n- Funnel underperforming AND you''ve already iterated 3 variants → clone the funnel, rebuild from scratch. Do not endlessly variant-stack.\n\n## Reporting cadence (what Gemma should pull on the morning cockpit)\n- 24h: visits, opt-ins, conversions per active funnel.\n- 7d: trendline + variant comparison.\n- Flag any funnel with >30% drop vs prior period.\n',
   ARRAY['ghl_pilot','grant_fit'],
   null,
   true,
   30),
  ('ghl-blossoming-lotus-voice',
   'BLS Voice & Audience',
   'Tone, audience, and content guardrails specific to Blossoming Lotus Sound. Healing-community register, regional to N. Denver / Loveland / Boulder.',
   E'# Blossoming Lotus Sound — Voice Guardrails\n\n## Audience\n- Healing-curious adults, primarily 30-65, Northern Denver / Loveland / Boulder.\n- Soundbath, Reiki, Fusion session attendees and people considering their first session.\n- ADHD / chronic-pain / nervous-system-regulation overlap is significant.\n\n## Voice\n- Warm, grounded, sensory. Avoid hype / urgency / scarcity.\n- Lead with embodiment: "how it feels" before "what it is."\n- Never claim cures. Use language like "support," "invitation," "softening."\n- First-person plural ("we hold space") rather than first-person singular.\n\n## Do not\n- Cross-pollinate FLS movement language (watershed, regenerative finance, etc.) into BLS copy.\n- Use the campaign / DM voice register. Operator voice only here.\n- Auto-post anything political.\n\n## Channels in play\n- Instagram (primary), Facebook events, GHL email list, occasional Reddit (r/Denver, r/FortCollins, r/Loveland for events).\n\n## Canon doors\n- None yet. Future: a BLS landing page on SiteGround.\n',
   ARRAY['ghl_pilot','seed','engage'],
   'blossoming_lotus_sound',
   true,
   40),
  ('ghl-fls-voice',
   'FLS Voice & Audience',
   'Tone, audience, and guardrails for Fellowship of Living Systems. Movement-building / regenerative coordination.',
   E'# Fellowship of Living Systems — Voice Guardrails\n\n## Audience\n- Practitioners, organizers, funders in the regenerative / systems-thinking space.\n- Watershed Thesis is aimed UP: institutional capital and global bank layer.\n- Below the Radar is aimed LATERAL: on-the-ground organizers.\n- The Regenerative Gem is aimed at systems-thinkers learning Regenesis / Tetrad / Mind-Mil-Intel-Special-Ops.\n\n## Voice\n- Campaign register. Confident, precise, lightly literary.\n- Reference canon doors by name when relevant. Always pick the door that matches the audience layer.\n- DM-of-the-campaign tone: hold the world, invite the player in.\n\n## Do not\n- Soften into healing-community language (that''s BLS).\n- Conflate FLS with RIA. RIA is a separate 501c3 and a separate sub-account inside someone else''s agency — out of scope here.\n\n## Canon doors\n- Watershed Thesis → institutional / capital audiences.\n- Below the Radar → organizer audiences.\n- Fire Defense → practical / preparedness audiences.\n- The Regenerative Gem → systems-thinking orientation.\n',
   ARRAY['ghl_pilot','seed','engage','grant_fit'],
   'fls',
   true,
   50),
  ('ghl-empty-sandbox',
   'Empty Sub-Account = Sandbox Rules',
   'Operating rules for the Empty sub-account: anything destructive or experimental lands here first before promoting to FLS or BLS.',
   E'# Empty Sub-Account — Sandbox Rules\n\n## Purpose\nEmpty is the staging ground. Test workflows, funnel structures, course shells, snapshot configurations here before promoting to FLS or BLS.\n\n## Rules\n1. Any new workflow / funnel template gets built in Empty first.\n2. Validate with at least one dry-run before snapshot-cloning into FLS or BLS.\n3. Voice register here is "operator" — strictly internal / mechanical. No public-facing copy lives in Empty long-term.\n4. Empty is the only sub-account where Gemma may propose API calls without explicit human approval at confidence ≥ 0.85. FLS and BLS always require approval.\n\n## Promotion path\nEmpty → Snapshot → restore into FLS or BLS → final tuning → publish.\n',
   ARRAY['ghl_pilot'],
   'empty',
   true,
   60)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  body_markdown = EXCLUDED.body_markdown,
  applies_to_modes = EXCLUDED.applies_to_modes,
  scoped_to_sub_account = EXCLUDED.scoped_to_sub_account,
  is_enabled = EXCLUDED.is_enabled;
