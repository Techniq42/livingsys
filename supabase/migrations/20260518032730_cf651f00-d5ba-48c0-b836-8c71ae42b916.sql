-- Schema additions
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS service_radius_miles integer DEFAULT 30;

ALTER TABLE public.local_events
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS amplify_to jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS audience_hint text;

-- Seed Insightful Inspirations venue (idempotent on name+lens)
INSERT INTO public.venues (lens_slug, name, city, region, website, calendar_url, latitude, longitude, service_radius_miles, is_active, notes)
SELECT 'healing', 'Insightful Inspirations', 'Loveland, CO', 'Northern Colorado (Loveland / Boulder / N. Denver)',
       'https://www.insightfulinspirations.com',
       'https://www.insightfulinspirations.com/events-original',
       40.3978, -105.0749, 40, true,
       'Leanne Holitsa''s healing studio. Hosts soundbaths, fusion sessions, energy work. Primary venue for Healing lens.'
WHERE NOT EXISTS (SELECT 1 FROM public.venues WHERE name = 'Insightful Inspirations' AND lens_slug = 'healing');

-- Seed Melissa as a person if not present
INSERT INTO public.people (lens_slug, display_name, role, capacity, opt_in_level, handles, notes)
SELECT 'healing', 'Melissa DeRenzo', 'practitioner', 'sound bath / yoga / reiki', 'enthusiastic',
       '{"business":"Blossoming Lotus Sound","website":"https://blossominglotussound.net"}'::jsonb,
       'Partner. Sound bath practitioner, yoga instructor, Reiki healer. Co-leads fusion sessions with Leanne at Insightful Inspirations.'
WHERE NOT EXISTS (SELECT 1 FROM public.people WHERE display_name = 'Melissa DeRenzo' AND lens_slug = 'healing');

-- Seed 3 events
WITH v AS (SELECT id FROM public.venues WHERE name = 'Insightful Inspirations' AND lens_slug = 'healing' LIMIT 1),
     m AS (SELECT id FROM public.people WHERE display_name = 'Melissa DeRenzo' AND lens_slug = 'healing' LIMIT 1)
INSERT INTO public.local_events (lens_slug, title, description, event_type, status, starts_at, source_url, venue_id, host_person_id, region, amplify, amplify_to, audience_hint, tags)
SELECT * FROM (VALUES
  ('healing', 'Soundbath at Insightful Inspirations', 'Restorative sound bath session — bring a mat and blanket.',
   'soundbath', 'upcoming', '2026-06-07 18:00:00-06'::timestamptz,
   'https://www.insightfulinspirations.com/events-original/soundbath3',
   (SELECT id FROM v), NULL, 'Northern Colorado', true,
   '["leanne_ig","insightful_inspirations_fb","boulder_wellness_groups"]'::jsonb,
   'Local healing seekers within ~40 miles of Loveland', ARRAY['soundbath','loveland','leanne']),
  ('healing', 'Fusion Sound Healing — Melissa & Leanne', 'Co-led session combining energy healing (Leanne) with sound vibration (Melissa). Flagship fusion offering.',
   'fusion', 'upcoming', '2026-06-14 18:00:00-06'::timestamptz,
   'https://www.insightfulinspirations.com/events-original/fusionsoundhealing-39sb2',
   (SELECT id FROM v), (SELECT id FROM m), 'Northern Colorado', true,
   '["melissa_ig","melissa_fb","blossoming_lotus_email","leanne_ig","insightful_inspirations_fb","northern_co_sound_healing_fb","boulder_wellness_groups","aligned_entrance_list"]'::jsonb,
   'Flagship co-marketing event — push hardest to Melissa''s + Leanne''s overlapping audiences and N. Colorado sound/energy healing groups',
   ARRAY['fusion','soundbath','energy-healing','melissa','leanne','flagship']),
  ('healing', 'Soundbath at Insightful Inspirations', 'Another soundbath session in the ongoing series.',
   'soundbath', 'upcoming', '2026-06-21 18:00:00-06'::timestamptz,
   'https://www.insightfulinspirations.com/events-original/soundbath4',
   (SELECT id FROM v), NULL, 'Northern Colorado', true,
   '["leanne_ig","insightful_inspirations_fb","boulder_wellness_groups"]'::jsonb,
   'Local healing seekers within ~40 miles of Loveland', ARRAY['soundbath','loveland','leanne'])
) AS t(lens_slug, title, description, event_type, status, starts_at, source_url, venue_id, host_person_id, region, amplify, amplify_to, audience_hint, tags)
WHERE NOT EXISTS (SELECT 1 FROM public.local_events le WHERE le.source_url = t.source_url);