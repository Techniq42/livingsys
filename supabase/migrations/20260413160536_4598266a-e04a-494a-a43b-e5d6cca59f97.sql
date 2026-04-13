CREATE OR REPLACE VIEW public.shadow_log
WITH (security_invoker = on) AS
SELECT
  rd.id,
  rd.thread_id,
  rd.draft_body,
  rd.classifier_tier,
  rd.classifier_reasoning,
  rd.safety_flags,
  rd.auto_posted,
  rd.auto_posted_at,
  rd.reddit_comment_id,
  rd.reddit_comment_url,
  rd.status,
  rd.reviewed_by,
  rd.reviewed_at,
  rd.created_at,
  rd.updated_at,
  ct.post_title,
  ct.post_url,
  ct.subreddit,
  ct.author,
  CASE
    WHEN rd.auto_posted = true THEN 'auto'
    WHEN rd.status = 'blocked' THEN 'blocked'
    WHEN rd.status = 'pending' THEN 'pending'
    ELSE 'manual'
  END AS log_category
FROM public.response_drafts rd
LEFT JOIN public.community_threads ct ON ct.id = rd.thread_id
ORDER BY rd.created_at DESC;