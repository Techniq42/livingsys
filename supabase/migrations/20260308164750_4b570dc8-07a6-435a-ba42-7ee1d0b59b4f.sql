
-- webhook_errors: only service role should write, no public access needed
-- Add a deny-all policy so the linter is satisfied
CREATE POLICY "no_public_access" ON public.webhook_errors FOR SELECT USING (false);
