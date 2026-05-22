
-- approved_emails: drop anon read; add SECURITY DEFINER check
DROP POLICY IF EXISTS anon_can_check_email ON public.approved_emails;

CREATE OR REPLACE FUNCTION public.is_email_approved(_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.approved_emails
    WHERE email = lower(_email) AND revoked_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_email_approved(text) FROM public;
GRANT EXECUTE ON FUNCTION public.is_email_approved(text) TO anon, authenticated;

-- leads: remove unrestricted public read/update
DROP POLICY IF EXISTS allow_public_lead_select ON public.leads;
DROP POLICY IF EXISTS allow_public_lead_update ON public.leads;

CREATE POLICY architects_read_leads ON public.leads
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY architects_update_leads ON public.leads
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role));

-- federation_operators: restrict reads
DROP POLICY IF EXISTS federation_read ON public.federation_operators;
CREATE POLICY federation_read_restricted ON public.federation_operators
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'architect'::app_role)
    OR has_role(auth.uid(), 'administrator'::app_role)
    OR auth.uid() = user_id
  );

-- conversations: restrict reads to architects
DROP POLICY IF EXISTS authenticated_read_conversations ON public.conversations;

-- outreach_conversations: restrict reads
DROP POLICY IF EXISTS "Authed read outreach_conversations" ON public.outreach_conversations;
CREATE POLICY architects_read_outreach_conversations ON public.outreach_conversations
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role));

-- outreach_messages: restrict reads
DROP POLICY IF EXISTS "Authed read outreach_messages" ON public.outreach_messages;
CREATE POLICY architects_read_outreach_messages ON public.outreach_messages
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role));

-- people: restrict reads
DROP POLICY IF EXISTS people_read ON public.people;
CREATE POLICY people_read_architects ON public.people
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'architect'::app_role) OR has_role(auth.uid(), 'administrator'::app_role));
