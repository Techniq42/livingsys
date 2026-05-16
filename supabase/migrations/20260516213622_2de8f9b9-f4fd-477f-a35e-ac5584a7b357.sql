CREATE POLICY "canon_pages_anon_read_active"
ON public.canon_pages
FOR SELECT
TO anon
USING (status = 'active');