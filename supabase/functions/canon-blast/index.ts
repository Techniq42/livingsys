// Canon Blast — Prong A.
// Takes a canon_slug, fans its audience_cohorts.stems out through Firecrawl,
// scores results, upserts outreach_targets, and (optionally) drafts replies
// through Lovable AI Gateway.
//
// Body: { canon_slug: string, generate_drafts?: boolean, limit_per_stem?: number }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-n8n-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";

async function firecrawlSearch(query: string, limit: number) {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY missing");
  const res = await fetch(`${FIRECRAWL_V2}/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit, country: "us", lang: "en" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Firecrawl ${res.status}`);
  return data;
}

// Restrict a query to a specific surface
function siteScoped(stem: string, channel: string): string {
  if (channel === "bluesky") return `${stem} site:bsky.app`;
  if (channel === "reddit") return `${stem} site:reddit.com`;
  return stem;
}

// Crude signal score: keyword density, recency hint, "nerd voice" heuristics
function scoreResult(item: any, stem: string): { score: number; reason: any } {
  const text = `${item.title ?? ""} ${item.description ?? item.snippet ?? ""}`.toLowerCase();
  const terms = stem.toLowerCase().split(/\s+/).filter(t => t.length > 3);
  const hits = terms.filter(t => text.includes(t)).length;
  const nerdMarkers = ["thread", "longform", "wrote", "essay", "deep dive", "i've been", "i'm working on", "anyone else"];
  const nerdHits = nerdMarkers.filter(m => text.includes(m)).length;
  const score = Math.min(10, 3 + hits * 2 + nerdHits);
  return { score, reason: { keyword_hits: hits, nerd_markers: nerdHits, stem } };
}

async function generateDraft(canon: any, target: any) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return null;
  const channel = target.channel;
  const kindMap: Record<string, string> = { bluesky: "reply", reddit: "reply", web: "comment" };
  const draftKind = kindMap[channel] || "reply";
  const lengthHint = channel === "bluesky" ? "≤ 280 chars total" : "≤ 600 chars";

  const sys = `You are Gemma, drafting outreach for an operator running a "reverse-Coca-Cola" strategy: lead with substantive value, no pitch, never link-dump. Voice: seasoned NCO, plain-spoken, slightly dry. Goal: signal-flare a relevant canon page to one specific person who is likely ADHD/nerdy/pattern-paying-attention, so they nerd out and find the operator on their own. RULES: (1) Acknowledge what they said specifically. (2) Add ONE substantive observation. (3) Link the canon page ONCE, framed as "you might dig this" not as a pitch. (4) Never use marketing language. (5) ${lengthHint}.`;
  const usr = `CANON PAGE:\n- title: ${canon.title}\n- url: ${canon.url}\n- audience: ${canon.audience ?? "—"}\n- summary: ${canon.summary ?? "—"}\n- nav notes: ${canon.navigation_notes ?? "—"}\n\nTARGET:\n- channel: ${channel}\n- handle: ${target.target_handle ?? "—"}\n- snippet they posted: "${target.snippet ?? ""}"\n- url: ${target.target_url}\n\nReturn ONLY JSON: {"body": string, "rationale": string}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  try {
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    return { body: parsed.body, rationale: parsed.rationale, draftKind };
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Auth: architect JWT or n8n secret
  const secret = req.headers.get("x-n8n-secret");
  const expected = Deno.env.get("N8N_WEBHOOK_SECRET");
  const authHeader = req.headers.get("Authorization");
  const isN8n = expected && secret === expected;
  if (!isN8n) {
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await anon.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    if (!roles?.some((r: any) => r.role === "architect" || r.role === "administrator")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  const body = await req.json().catch(() => ({}));
  const canonSlug: string = body?.canon_slug;
  const generateDrafts: boolean = body?.generate_drafts ?? true;
  const limitPerStem: number = Math.min(Math.max(body?.limit_per_stem ?? 5, 1), 10);
  if (!canonSlug) {
    return new Response(JSON.stringify({ error: "canon_slug required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const { data: canon } = await supabase.from("canon_pages").select("*").eq("slug", canonSlug).maybeSingle();
  if (!canon) return new Response(JSON.stringify({ error: "canon not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const cohorts: Array<{ cohort: string; channel: string; stems: string[] }> = canon.audience_cohorts ?? [];
  if (cohorts.length === 0) {
    return new Response(JSON.stringify({ error: "no audience_cohorts seeded for this canon page" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Create a run record
  const { data: run } = await supabase.from("canon_search_runs").insert({
    canon_slug: canonSlug,
    query: `BLAST: ${cohorts.map(c => c.cohort).join("+")}`,
    region_count: cohorts.length,
    results_summary: {},
  }).select().single();

  const surfaced: any[] = [];
  const runSummary: any = {};

  for (const cohort of cohorts) {
    runSummary[cohort.cohort] = { channel: cohort.channel, stems: {} };
    for (const stem of cohort.stems) {
      const q = siteScoped(stem, cohort.channel);
      try {
        const r = await firecrawlSearch(q, limitPerStem);
        const items = (r?.data ?? r?.web ?? []).slice(0, limitPerStem);
        runSummary[cohort.cohort].stems[stem] = items.length;
        for (const it of items) {
          if (!it?.url) continue;
          const { score, reason } = scoreResult(it, stem);
          if (score < 5) continue;
          // Extract handle from URL where possible
          let handle: string | null = null;
          if (cohort.channel === "bluesky") {
            const m = it.url.match(/bsky\.app\/profile\/([^\/]+)/);
            if (m) handle = m[1];
          } else if (cohort.channel === "reddit") {
            const m = it.url.match(/reddit\.com\/(user|u)\/([^\/]+)/) || it.url.match(/reddit\.com\/r\/([^\/]+)/);
            if (m) handle = m[0].includes("/user/") || m[0].includes("/u/") ? `u/${m[2]}` : `r/${m[1]}`;
          }
          // Upsert target (dedupe by target_url)
          const { data: existing } = await supabase
            .from("outreach_targets")
            .select("id")
            .eq("target_url", it.url)
            .maybeSingle();
          if (existing) continue;
          const { data: inserted } = await supabase.from("outreach_targets").insert({
            canon_slug: canonSlug,
            cohort: cohort.cohort,
            channel: cohort.channel,
            target_url: it.url,
            target_handle: handle,
            target_name: it.title ?? null,
            snippet: it.description ?? it.snippet ?? null,
            signal_score: score,
            signal_reason: reason,
            source: "firecrawl_canon_blast",
            source_run_id: run?.id ?? null,
            status: "new",
          }).select().single();
          if (inserted) surfaced.push(inserted);
        }
      } catch (err) {
        runSummary[cohort.cohort].stems[stem] = { error: String(err) };
      }
    }
  }

  // Update run summary
  if (run?.id) {
    await supabase.from("canon_search_runs").update({ results_summary: runSummary }).eq("id", run.id);
  }

  // Draft pass (best candidates only)
  const draftsCreated: any[] = [];
  if (generateDrafts && surfaced.length > 0) {
    const topTargets = surfaced.sort((a, b) => b.signal_score - a.signal_score).slice(0, 8);
    for (const t of topTargets) {
      try {
        const draft = await generateDraft(canon, t);
        if (!draft?.body) continue;
        const { data: d } = await supabase.from("outreach_drafts").insert({
          target_id: t.id,
          draft_kind: draft.draftKind,
          body: draft.body,
          rationale: draft.rationale,
          canon_slug: canonSlug,
          status: "pending",
        }).select().single();
        if (d) {
          draftsCreated.push(d);
          await supabase.from("outreach_targets").update({ status: "drafted" }).eq("id", t.id);
        }
      } catch (err) {
        console.error("draft failed", err);
      }
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    canon: canonSlug,
    cohorts: cohorts.length,
    targets_surfaced: surfaced.length,
    drafts_generated: draftsCreated.length,
    run_id: run?.id,
    summary: runSummary,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
