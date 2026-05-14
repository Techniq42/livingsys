-- Run manually in eyoqexibycelhsatitwt SQL Editor — Lovable Cloud is unbound from this project.
-- Adds acknowledgement tracking to incident_events + RLS for architect/administrator roles.

ALTER TABLE public.incident_events
  ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz;

ALTER TABLE public.incident_events
  ADD COLUMN IF NOT EXISTS acknowledged_by uuid REFERENCES auth.users(id);

ALTER TABLE public.incident_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "architects_read_incident_events" ON public.incident_events;
CREATE POLICY "architects_read_incident_events"
  ON public.incident_events
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'architect')
    OR public.has_role(auth.uid(), 'administrator')
  );

CREATE OR REPLACE FUNCTION public.incident_events_only_ack_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.incident_type IS DISTINCT FROM OLD.incident_type
     OR NEW.severity IS DISTINCT FROM OLD.severity
     OR NEW.source IS DISTINCT FROM OLD.source
     OR NEW.message IS DISTINCT FROM OLD.message
     OR NEW.metadata IS DISTINCT FROM OLD.metadata
     OR NEW.autofix_rule_id IS DISTINCT FROM OLD.autofix_rule_id
     OR NEW.autofix_status IS DISTINCT FROM OLD.autofix_status
     OR NEW.resolved_at IS DISTINCT FROM OLD.resolved_at
  THEN
    RAISE EXCEPTION 'Only acknowledged_at and acknowledged_by may be updated on incident_events';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS incident_events_immutable_guard ON public.incident_events;
CREATE TRIGGER incident_events_immutable_guard
  BEFORE UPDATE ON public.incident_events
  FOR EACH ROW
  EXECUTE FUNCTION public.incident_events_only_ack_changed();

DROP POLICY IF EXISTS "architects_ack_incident_events" ON public.incident_events;
CREATE POLICY "architects_ack_incident_events"
  ON public.incident_events
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'architect')
    OR public.has_role(auth.uid(), 'administrator')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'architect')
    OR public.has_role(auth.uid(), 'administrator')
  );
