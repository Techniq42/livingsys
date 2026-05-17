CREATE TABLE public.daily_briefings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('listen', 'engage', 'seed')),
  briefing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT NOT NULL,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_action TEXT,
  source_thread_ids UUID[] DEFAULT ARRAY[]::UUID[],
  generated_by TEXT,
  confidence NUMERIC(3,2) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_daily_briefings_mode_date ON public.daily_briefings (mode, briefing_date DESC);

ALTER TABLE public.daily_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Architects can view all briefings"
ON public.daily_briefings
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'architect'::app_role)
  OR public.has_role(auth.uid(), 'administrator'::app_role)
);