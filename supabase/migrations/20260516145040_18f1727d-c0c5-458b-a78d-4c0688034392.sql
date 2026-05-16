-- layer: orchestration
-- Bad-actor scan visibility toggle: architect decides whether operators see the immune-system substrate.

INSERT INTO public.operator_config (key, value)
VALUES (
  'bad_actor_scans_visible_to_operators',
  jsonb_build_object(
    'enabled', false,
    'description', 'When enabled, operators see bad-actor pattern observations on contact cards in their own room. When disabled (default), only architects see the immune-system substrate; operators see only routing outcomes.',
    'updated_at', now()
  )
)
ON CONFLICT (key) DO NOTHING;

-- Allow any authenticated user to READ this specific config key so the UI can branch on it,
-- without exposing other architect-only config rows.
CREATE POLICY "authenticated_read_bad_actor_visibility"
ON public.operator_config
FOR SELECT
TO authenticated
USING (key = 'bad_actor_scans_visible_to_operators');
