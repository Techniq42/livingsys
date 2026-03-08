
DROP POLICY IF EXISTS "allow_public_lead_insert" ON public.leads;
CREATE POLICY "allow_public_lead_insert" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Also allow anon to insert webhook_errors for error logging
DROP POLICY IF EXISTS "allow_public_webhook_error_insert" ON public.webhook_errors;
CREATE POLICY "allow_public_webhook_error_insert" ON public.webhook_errors FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Also need to allow the book bump update from anon
DROP POLICY IF EXISTS "allow_public_lead_update" ON public.leads;
CREATE POLICY "allow_public_lead_update" ON public.leads FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
