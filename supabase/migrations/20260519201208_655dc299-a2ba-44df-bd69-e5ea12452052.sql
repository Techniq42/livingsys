ALTER TABLE public.canon_pages
  ADD COLUMN IF NOT EXISTS primary_regions text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS secondary_regions text[] NOT NULL DEFAULT '{}'::text[];

UPDATE public.canon_pages
SET primary_regions = ARRAY['CO','NM','UT','AZ','NV','CA'],
    secondary_regions = ARRAY['TX','NE','ND','SD']
WHERE slug = 'fire-defense';