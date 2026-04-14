
-- =============================================================
-- A. Performance indexes on response_drafts
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_response_drafts_status
  ON public.response_drafts (status);

CREATE INDEX IF NOT EXISTS idx_response_drafts_classifier_tier
  ON public.response_drafts (classifier_tier);

CREATE INDEX IF NOT EXISTS idx_response_drafts_thread_id
  ON public.response_drafts (thread_id);

CREATE INDEX IF NOT EXISTS idx_response_drafts_created_at
  ON public.response_drafts (created_at DESC);

-- =============================================================
-- B. Performance indexes on community_threads
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_community_threads_status
  ON public.community_threads (status);

CREATE INDEX IF NOT EXISTS idx_community_threads_post_id
  ON public.community_threads (post_id);

CREATE INDEX IF NOT EXISTS idx_community_threads_relevance_score
  ON public.community_threads (relevance_score DESC);

CREATE INDEX IF NOT EXISTS idx_community_threads_created_at
  ON public.community_threads (created_at DESC);

-- =============================================================
-- C. Unique constraint on community_threads.post_id
--    (prevents duplicate thread imports from n8n scanner)
-- =============================================================
ALTER TABLE public.community_threads
  ADD CONSTRAINT community_threads_post_id_unique UNIQUE (post_id);

-- =============================================================
-- D. Enable realtime on community_threads
-- =============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_threads;

-- =============================================================
-- E. Index on operator_config.key for fast kill-switch lookups
--    (unique index already exists, skipping)
-- =============================================================

-- =============================================================
-- F. Composite index on response_drafts for dashboard filter queries
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_response_drafts_status_tier
  ON public.response_drafts (status, classifier_tier);

-- =============================================================
-- G. Ensure auto_post_config realtime (for live config reload)
-- =============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.auto_post_config;

-- =============================================================
-- H. Ensure operator_config realtime (for live kill-switch sync)
-- =============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.operator_config;
