CREATE TABLE public.canon_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  url text NOT NULL,
  summary text,
  audience text,
  methodology_tags text[] DEFAULT '{}',
  substrate_topics text[] DEFAULT '{}',
  navigation_notes text,
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.canon_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY canon_pages_read ON public.canon_pages
  FOR SELECT TO authenticated
  USING (status = 'active' OR has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY canon_pages_architect_write ON public.canon_pages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY canon_pages_service ON public.canon_pages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER canon_pages_updated_at
  BEFORE UPDATE ON public.canon_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.canon_pages (slug, title, url, audience, methodology_tags, substrate_topics, summary, navigation_notes, sort_order) VALUES
('watershed-thesis', 'Watershed Thesis',
  'https://shannondobbs.com/watershed-thesis',
  'Institutional capital, global bank layer, insurance underwriters',
  ARRAY['climate-risk','underwriting','systems-finance'],
  ARRAY['climate_exposure','insurance_floor','institutional_capital'],
  'Argues there is no floor of exposure for climate-fueled damage; aimed at the global bank/insurance layer.',
  'Recommend this door when the thread/contact signals institutional capital, reinsurance, climate underwriting, or pension/sovereign fund exposure. Do NOT recommend for operator-layer fluency conversations — they will bounce. Pair with a one-line frame about "no floor of exposure."',
  10),
('fire-defense-guide', 'Fire Defense Guide',
  'https://shannondobbs.com/fire-defense',
  'Operator layer — practitioners needing fluency on fire/landscape defense outside their domain',
  ARRAY['fire-defense','landscape','operator-fluency'],
  ARRAY['fire','land_management','community_defense'],
  'Operator-layer fluency piece: surfaces fire-defense practice that has applicability outside the fire domain.',
  'Recommend when an operator is grappling with landscape, community-defense, or resilience questions and would benefit from cross-domain fluency. Frame as "here is the pattern, here is how it travels." Not for institutional/funder audiences.',
  20),
('below-the-radar', 'Below the Radar',
  'https://shannondobbs.com/belowtheradar',
  'UN Association, association-strength or UN-focused audiences',
  ARRAY['un-association','multilateral','association-strength'],
  ARRAY['un_perspective','multilateral_strategy'],
  'Perspective piece specifically aimed at the UN Association and any association-strength or UN-focused audience.',
  'Recommend ONLY when the audience signal is UN Association, multilateral, or association-of-associations. Wrong door for operators or institutional capital. Use when a contact mentions UN bodies, association leadership, or multilateral coordination.',
  30),
('regenerative-gem', 'The Regenerative Gem',
  'https://shannondobbs.com/regenerative-gem',
  'Systems thinkers seeking an orientation framework',
  ARRAY['regenesis','tetrad','military-intelligence','edge-runner'],
  ARRAY['systems_thinking','methodology_orientation'],
  'Orientation guide for systems thinking across three methodologies: Regenesis, Tetrad Training, and Mind/Military Intelligence + Special Ops Training — synthesized with thirty years of Edge Runner field education.',
  'Recommend as the orientation door for anyone trying to understand HOW Shannon thinks across methodologies. Use when a contact asks "what is your framework" or shows readiness for systems-thinking onboarding. Not a conversion door — a comprehension door.',
  40),
('blast-chiller', 'Blast Chiller (forthcoming)',
  'https://shannondobbs.com/blast-chiller',
  'Operator layer — cross-domain fluency',
  ARRAY['cold-chain','food-systems','operator-fluency'],
  ARRAY['food_systems','cold_chain'],
  'Forthcoming operator-fluency canon page on blast chilling and its cross-domain applicability.',
  'Page is in draft — surface as "coming soon" until URL goes live. Same audience-shape as Fire Defense: operator fluency, cross-domain pattern.',
  50),
('humisoil', 'Humisoil (forthcoming)',
  'https://shannondobbs.com/humisoil',
  'Operator layer — soil/regenerative practitioners',
  ARRAY['soil','regenerative-ag','operator-fluency'],
  ARRAY['soil_health','regenerative_agriculture'],
  'Forthcoming operator-fluency canon page on humisoil.',
  'Page is in draft. Same shape as Fire Defense — operator fluency door, not institutional.',
  60),
('grocery-retail', 'Grocery Retail (forthcoming)',
  'https://shannondobbs.com/grocery-retail',
  'Operator layer — food/retail systems practitioners',
  ARRAY['grocery','retail','food-systems','operator-fluency'],
  ARRAY['food_retail','distribution'],
  'Forthcoming operator-fluency canon page on grocery retail systems.',
  'Page is in draft. Operator-fluency door — surfaces retail-layer patterns relevant to food-systems work.',
  70);

UPDATE public.canon_pages SET status = 'draft' WHERE slug IN ('blast-chiller','humisoil','grocery-retail');