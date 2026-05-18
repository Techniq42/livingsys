-- Lenses
CREATE TABLE public.lenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  tagline text,
  skin_token text NOT NULL DEFAULT 'default',
  posture text NOT NULL DEFAULT 'movement', -- 'movement' | 'street_team' | 'co_marketing'
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY lenses_read ON public.lenses FOR SELECT TO authenticated USING (is_active);
CREATE POLICY lenses_architect_write ON public.lenses FOR ALL TO authenticated
  USING (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY lenses_service ON public.lenses FOR ALL TO service_role USING (true) WITH CHECK (true);

-- People (street-team substrate)
CREATE TABLE public.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lens_slug text NOT NULL REFERENCES public.lenses(slug) ON UPDATE CASCADE,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'practitioner', -- practitioner | venue_host | connector | scrounger | herbalist | vendor | organizer
  capacity text, -- 'high' | 'medium' | 'low' | 'occasional'
  opt_in_level text NOT NULL DEFAULT 'soft', -- 'none' | 'soft' | 'amplify' | 'co_market'
  handles jsonb NOT NULL DEFAULT '{}'::jsonb, -- {ig, bsky, email, phone, web}
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
CREATE POLICY people_read ON public.people FOR SELECT TO authenticated USING (true);
CREATE POLICY people_architect_write ON public.people FOR ALL TO authenticated
  USING (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY people_service ON public.people FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Venues
CREATE TABLE public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lens_slug text NOT NULL REFERENCES public.lenses(slug) ON UPDATE CASCADE,
  name text NOT NULL,
  city text,
  region text,
  address text,
  calendar_url text,
  website text,
  host_person_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY venues_read ON public.venues FOR SELECT TO authenticated USING (is_active);
CREATE POLICY venues_architect_write ON public.venues FOR ALL TO authenticated
  USING (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY venues_service ON public.venues FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Local events
CREATE TABLE public.local_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lens_slug text NOT NULL REFERENCES public.lenses(slug) ON UPDATE CASCADE,
  title text NOT NULL,
  description text,
  venue_id uuid REFERENCES public.venues(id) ON DELETE SET NULL,
  host_person_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  source_url text,
  event_type text DEFAULT 'class', -- class | fusion | fundraiser | barn_raising | workshop | private_session | other
  status text NOT NULL DEFAULT 'upcoming', -- upcoming | past | cancelled | draft
  amplify boolean NOT NULL DEFAULT true,
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX local_events_lens_starts_idx ON public.local_events(lens_slug, starts_at);
ALTER TABLE public.local_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY local_events_read ON public.local_events FOR SELECT TO authenticated USING (true);
CREATE POLICY local_events_architect_write ON public.local_events FOR ALL TO authenticated
  USING (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(),'architect'::app_role) OR has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY local_events_service ON public.local_events FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER trg_people_updated BEFORE UPDATE ON public.people FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_local_events_updated BEFORE UPDATE ON public.local_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add lens to briefings
ALTER TABLE public.daily_briefings ADD COLUMN lens_slug text REFERENCES public.lenses(slug) ON UPDATE CASCADE;
CREATE INDEX daily_briefings_lens_mode_idx ON public.daily_briefings(lens_slug, mode, created_at DESC);

-- Seed lenses
INSERT INTO public.lenses (slug, label, tagline, skin_token, posture, sort_order) VALUES
  ('fls', 'Movement', 'Mutual aid, food systems, place-story work', 'default', 'movement', 0),
  ('healing', 'Healing Community', 'Aligned Entrance — sound, yoga, reiki, herbs, rocks', 'healing', 'co_marketing', 1);

-- Seed people (Healing)
INSERT INTO public.people (lens_slug, display_name, role, capacity, opt_in_level, handles, notes) VALUES
  ('healing', 'Melissa', 'practitioner', 'medium', 'co_market', '{"web":"https://blossominglotussound.net"}'::jsonb, 'Sound bath, yoga, Reiki. Partner. Runs own calendar. Dislikes marketing.'),
  ('healing', 'Leanne Holitsa', 'venue_host', 'low', 'amplify', '{"web":"https://insightfulInspirations.com"}'::jsonb, 'Owns The Healing Studio. Occasional social reposts. Fusion events w/ Melissa.');

-- Seed venues (Healing)
INSERT INTO public.venues (lens_slug, name, calendar_url, website, host_person_id, notes) VALUES
  ('healing', 'The Healing Studio', 'https://insightfulInspirations.com', 'https://insightfulInspirations.com',
    (SELECT id FROM public.people WHERE display_name='Leanne Holitsa' LIMIT 1),
    'Leanne''s studio. Runs the master calendar of events at her location.'),
  ('healing', 'Blossoming Lotus Sound', 'https://blossominglotussound.net', 'https://blossominglotussound.net',
    (SELECT id FROM public.people WHERE display_name='Melissa' LIMIT 1),
    'Melissa''s practice. Public + private session availability.');