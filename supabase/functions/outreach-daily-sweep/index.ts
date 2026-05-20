// Daily auto-sweep: surfaces targets and funders across all active canon pages,
// WITHOUT generating reply drafts. Operator confirms targets in the UI, then
// triggers per-target drafts via `outreach-draft-target`.
// Triggered by pg_cron. Auth: x-n8n-secret OR architect JWT.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-n8n-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Auth: cron secret OR architect JWT
  const secret = req.headers.get("x-n8n-secret");
  const expected = Deno.env.get("N8N_WEBHOOK_SECRET");
  const isCron = expected && secret === expected;
  if (!isCron) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await anon.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    if (!roles?.some((r: any) => r.role === "architect" || r.role === "administrator")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // Check kill switch
  const { data: killSwitch } = await supabase.from("operator_config").select("value").eq("key", "outreach_daily_sweep_enabled").maybeSingle();
  if (killSwitch && (killSwitch as any).value?.enabled === false) {
    return new Response(JSON.stringify({ skipped: true, reason: "kill_switch_off" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const { data: canons } = await supabase.from("canon_pages").select("slug").eq("is_active", true);
  const slugs = (canons || []).map((c: any) => c.slug);

  const base = Deno.env.get("SUPABASE_URL")!;
  const cronHeaders = { "Content-Type": "application/json", "x-n8n-secret": expected || "", "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` };

  const results: any = { canon_pages: slugs.length, blast: {}, scout: {} };

  for (const slug of slugs) {
    try {
      const r = await fetch(`${base}/functions/v1/canon-blast`, {
        method: "POST",
        headers: cronHeaders,
        body: JSON.stringify({ canon_slug: slug, generate_drafts: false, limit_per_stem: 5 }),
      });
      const j = await r.json().catch(() => ({}));
      results.blast[slug] = { ok: r.ok, targets_surfaced: j?.targets_surfaced ?? 0, error: r.ok ? null : (j?.error ?? `HTTP ${r.status}`) };
    } catch (e: any) {
      results.blast[slug] = { ok: false, error: e?.message };
    }
    try {
      const r = await fetch(`${base}/functions/v1/funder-scout`, {
        method: "POST",
        headers: cronHeaders,
        body: JSON.stringify({ canon_slug: slug, limit: 25, generate_briefs: true }),
      });
      const j = await r.json().catch(() => ({}));
      results.scout[slug] = { ok: r.ok, funders_surfaced: j?.funders_surfaced ?? 0, error: r.ok ? null : (j?.error ?? `HTTP ${r.status}`) };
    } catch (e: any) {
      results.scout[slug] = { ok: false, error: e?.message };
    }
  }

  await supabase.from("operator_config").upsert({
    key: "outreach_daily_sweep_last_run",
    value: { at: new Date().toISOString(), results },
  }, { onConflict: "key" });

  return new Response(JSON.stringify(results), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
