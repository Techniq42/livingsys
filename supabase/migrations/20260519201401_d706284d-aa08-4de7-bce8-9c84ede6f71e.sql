CREATE TABLE IF NOT EXISTS public.canon_search_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canon_slug text,
  query text NOT NULL,
  tbs text,
  region_count integer NOT NULL DEFAULT 0,
  results_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.canon_search_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "canon_search_runs_architect_all"
  ON public.canon_search_runs
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "canon_search_runs_service"
  ON public.canon_search_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS canon_search_runs_canon_slug_idx ON public.canon_search_runs(canon_slug, created_at DESC);