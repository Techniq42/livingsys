
CREATE OR REPLACE FUNCTION public.user_can_read_skill(_user_id uuid, _scope text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.has_role(_user_id, 'architect'::app_role) THEN true
    WHEN _scope IS NULL THEN true
    ELSE EXISTS (
      SELECT 1 FROM public.practitioner_sub_account_bindings b
      WHERE b.user_id = _user_id AND b.sub_account_slug = _scope
    )
  END
$$;

REVOKE EXECUTE ON FUNCTION public.user_can_read_skill(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.user_can_read_skill(uuid, text) TO authenticated;

DROP POLICY IF EXISTS "Authenticated read enabled skills" ON public.skill_files;
DROP POLICY IF EXISTS "Skill files read scoped" ON public.skill_files;

CREATE POLICY "Skill files read scoped"
  ON public.skill_files FOR SELECT
  TO authenticated
  USING (
    is_enabled = true
    AND public.user_can_read_skill(auth.uid(), scoped_to_sub_account)
  );
