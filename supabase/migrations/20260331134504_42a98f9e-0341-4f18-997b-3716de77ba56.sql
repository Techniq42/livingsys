
-- operator_config: key-value store for forkable instance configuration
CREATE TABLE public.operator_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.operator_config ENABLE ROW LEVEL SECURITY;

-- Only architects can read config
CREATE POLICY "architects_read_config"
  ON public.operator_config FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'architect'));

-- Only architects can manage config
CREATE POLICY "architects_manage_config"
  ON public.operator_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'architect'))
  WITH CHECK (public.has_role(auth.uid(), 'architect'));
