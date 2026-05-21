
-- Threaded Gemma workspace + persistent memory ("What Gemma Knows")

CREATE TABLE public.gemma_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room TEXT NOT NULL,
  mode_slug TEXT NOT NULL DEFAULT 'free_chat',
  title TEXT NOT NULL DEFAULT 'New thread',
  summary TEXT,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX gemma_threads_user_room_idx ON public.gemma_threads(user_id, room, last_message_at DESC) WHERE archived_at IS NULL;

ALTER TABLE public.gemma_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner read threads" ON public.gemma_threads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner write threads" ON public.gemma_threads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner update threads" ON public.gemma_threads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owner delete threads" ON public.gemma_threads FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER gemma_threads_updated_at BEFORE UPDATE ON public.gemma_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.gemma_thread_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.gemma_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  decision_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX gemma_thread_messages_thread_idx ON public.gemma_thread_messages(thread_id, created_at);

ALTER TABLE public.gemma_thread_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner read msgs" ON public.gemma_thread_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner write msgs" ON public.gemma_thread_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner delete msgs" ON public.gemma_thread_messages FOR DELETE USING (auth.uid() = user_id);

-- Durable atomic facts distilled across threads. The "What Gemma Knows" memory layer.
CREATE TABLE public.gemma_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope_room TEXT,  -- NULL = global, else scoped to that room
  fact TEXT NOT NULL,
  source_thread_id UUID REFERENCES public.gemma_threads(id) ON DELETE SET NULL,
  confidence NUMERIC NOT NULL DEFAULT 0.5,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ
);
CREATE INDEX gemma_facts_user_scope_idx ON public.gemma_facts(user_id, scope_room, pinned DESC, confidence DESC) WHERE retired_at IS NULL;

ALTER TABLE public.gemma_facts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner read facts" ON public.gemma_facts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner write facts" ON public.gemma_facts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner update facts" ON public.gemma_facts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owner delete facts" ON public.gemma_facts FOR DELETE USING (auth.uid() = user_id);
