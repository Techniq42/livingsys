
CREATE OR REPLACE FUNCTION public.enforce_approved_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.approved_emails
    WHERE email = LOWER(NEW.email)
    AND revoked_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Signup rejected: email not on approved list' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.enforce_approved_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_min_privilege(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.user_can_read_skill(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_min_privilege(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_read_skill(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.check_auto_post_eligible(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.select_redirect_for_draft(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_auto_post_eligible(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.select_redirect_for_draft(text, text) TO service_role;

REVOKE ALL ON FUNCTION public.is_email_approved(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_email_approved(text) TO anon, authenticated;

DROP POLICY IF EXISTS service_role_full_access ON public.approved_emails;
DROP POLICY IF EXISTS "Allow service role full access" ON public.webhook_errors;
DROP POLICY IF EXISTS "Allow service role full access" ON public.leads;
DROP POLICY IF EXISTS service_role_full_access ON public.user_roles;
DROP POLICY IF EXISTS service_role_manage_community_threads ON public.community_threads;
DROP POLICY IF EXISTS service_role_manage_reply_templates ON public.reply_templates;
DROP POLICY IF EXISTS service_role_manage_response_drafts ON public.response_drafts;
DROP POLICY IF EXISTS topic_verticals_service_role ON public.topic_verticals;
DROP POLICY IF EXISTS service_role_manage_auto_post_config ON public.auto_post_config;
DROP POLICY IF EXISTS service_role_manage_conversations ON public.conversations;
DROP POLICY IF EXISTS voice_templates_service_role ON public.voice_templates;
DROP POLICY IF EXISTS redirect_targets_service_role ON public.redirect_targets;
DROP POLICY IF EXISTS redirect_clicks_service_role ON public.redirect_clicks;
DROP POLICY IF EXISTS source_kill_switches_service_role ON public.source_kill_switches;
DROP POLICY IF EXISTS skills_service_role ON public.skills;
DROP POLICY IF EXISTS feedback_signals_service_role ON public.feedback_signals;
DROP POLICY IF EXISTS voice_memos_service ON public.voice_memos;
DROP POLICY IF EXISTS email_triage_service ON public.email_triage_items;
DROP POLICY IF EXISTS email_whitelist_service ON public.email_triage_whitelist;
DROP POLICY IF EXISTS sender_patterns_service ON public.sender_patterns;
DROP POLICY IF EXISTS predator_service ON public.predator_pattern_observations;
DROP POLICY IF EXISTS telegram_channels_service ON public.telegram_channels;
DROP POLICY IF EXISTS federation_service ON public.federation_operators;
DROP POLICY IF EXISTS guild_members_service ON public.guild_members;
DROP POLICY IF EXISTS compliance_service ON public.compliance_evidence;
DROP POLICY IF EXISTS canon_pages_service ON public.canon_pages;
DROP POLICY IF EXISTS lenses_service ON public.lenses;
DROP POLICY IF EXISTS people_service ON public.people;
DROP POLICY IF EXISTS venues_service ON public.venues;
DROP POLICY IF EXISTS local_events_service ON public.local_events;
DROP POLICY IF EXISTS canon_search_runs_service ON public.canon_search_runs;
DROP POLICY IF EXISTS outreach_targets_service ON public.outreach_targets;
DROP POLICY IF EXISTS outreach_drafts_service ON public.outreach_drafts;
DROP POLICY IF EXISTS funder_targets_service ON public.funder_targets;
