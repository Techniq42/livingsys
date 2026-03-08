
DROP POLICY IF EXISTS "public_insert_leads" ON public.leads;
CREATE POLICY "allow_public_lead_insert" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
