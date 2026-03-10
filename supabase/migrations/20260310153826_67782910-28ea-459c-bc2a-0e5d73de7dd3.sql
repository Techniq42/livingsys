
CREATE TABLE public.content_pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  hook text DEFAULT '',
  story text DEFAULT '',
  offer text DEFAULT '',
  cta_text text DEFAULT '',
  format_type text NOT NULL DEFAULT 'article',
  status text NOT NULL DEFAULT 'draft',
  channels jsonb DEFAULT '{}',
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_pieces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_crud_own_content" ON public.content_pieces
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
