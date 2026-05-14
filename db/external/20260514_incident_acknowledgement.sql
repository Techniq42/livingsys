-- Run manually in eyoqexibycelhsatitwt SQL Editor — Lovable Cloud is unbound from this project.
-- Adds acknowledgement tracking to incident_events + RLS for architect/administrator roles.
-- This is the version that ACTUALLY ran in FLS prod (corrections from review):
--   * trigger WHEN can't contain subqueries → auth.uid() check moved inline into function body
--   * column enumeration replaced with schema-agnostic to_jsonb diff (incident_events has 34 cols)
--   * auth.uid() IS NULL short-circuit exempts service-role / n8n writes from the guard

ALTER TABLE public.incident_events ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz;
ALTER TABLE public.incident_events ADD COLUMN IF NOT EXISTS acknowledged_by uuid REFERENCES auth.users(id);

ALTER TABLE public.incident_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "architects_read_incident_events" ON public.incident_events;
CREATE POLICY "architects_read_incident_events"
  ON public.incident_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(),'architect') OR public.has_role(auth.uid(),'administrator'));

DROP POLICY IF EXISTS "architects_ack_incident_events" ON public.incident_events;
CREATE POLICY "architects_ack_incident_events"
  ON public.incident_events
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(),'architect') OR public.has_role(auth.uid(),'administrator'))
  WITH CHECK (public.has_role(auth.uid(),'architect') OR public.has_role(auth.uid(),'administrator'));

CREATE OR REPLACE FUNCTION public.incident_events_only_ack_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- service-role / n8n writes bypass the guard
  END IF;
  IF (to_jsonb(NEW) - 'acknowledged_at' - 'acknowledged_by')
     IS DISTINCT FROM
     (to_jsonb(OLD) - 'acknowledged_at' - 'acknowledged_by') THEN
    RAISE EXCEPTION 'Only acknowledged_at and acknowledged_by may be updated on incident_events by app users';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS incident_events_immutable_guard ON public.incident_events;
CREATE TRIGGER incident_events_immutable_guard
  BEFORE UPDATE ON public.incident_events
  FOR EACH ROW
  EXECUTE FUNCTION public.incident_events_only_ack_changed();
