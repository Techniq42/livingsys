// Subreddit Discovery — surface adjacent subs for a seed topic via Firecrawl.
// Body: { seed_topic: string, limit?: number }
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

function extractSubreddits(items: any[]): Map<string, { url: string; title: string; description: string; hits: number }> {
  const subs = new Map<string, { url: string; title: string; description: string; hits: number }>();
  for (const it of items) {
    const url: string = it?.url ?? "";
    const m = url.match(/reddit\.com\/r\/([A-Za-z0-9_]+)/i);
    if (!m) continue;
    const name = m[1].toLowerCase();
    const existing = subs.get(name);
    if (existing) {
      existing.hits += 1;
    } else {
      subs.set(name, {
        url: `https://reddit.com/r/${m[1]}`,
        title: it.title ?? "",
        description: it.description ?? it.snippet ?? "",
        hits: 1,
      });
    }
  }
  return subs;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await anon.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (!roles?.some((r: any) => r.role === "architect" || r.role === "administrator")) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const body = await req.json().catch(() => ({}));
  const seed: string = (body?.seed_topic ?? "").trim();
  const limit: number = Math.min(Math.max(body?.limit ?? 20, 5), 50);
  if (!seed) return new Response(JSON.stringify({ error: "seed_topic required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  // Two passes: broad reddit search + scoped to community-page URLs
  const queries = [
    `${seed} site:reddit.com`,
    `${seed} community site:reddit.com/r/`,
  ];
  const allItems: any[] = [];
  for (const q of queries) {
    try {
      const r = await firecrawlSearch(q, limit);
      const raw = Array.isArray(r?.data) ? r.data : (r?.data?.web ?? r?.web ?? []);
      if (Array.isArray(raw)) allItems.push(...raw);
    } catch (err) {
      console.error("subreddit-discovery search failed", err);
    }
  }

  const subs = extractSubreddits(allItems);
  const inserted: any[] = [];
  for (const [name, info] of subs.entries()) {
    const score = Math.min(10, 2 + info.hits * 2);
    const { data, error } = await supabase
      .from("subreddit_discoveries")
      .upsert({
        seed_topic: seed,
        subreddit: `r/${name}`,
        url: info.url,
        description: info.description?.slice(0, 500) ?? null,
        relevance_score: score,
        relevance_reason: { hits: info.hits, sample_title: info.title },
        status: "discovered",
      }, { onConflict: "seed_topic,subreddit", ignoreDuplicates: false })
      .select()
      .single();
    if (!error && data) inserted.push(data);
  }

  return new Response(JSON.stringify({
    ok: true,
    seed_topic: seed,
    subreddits_found: subs.size,
    upserted: inserted.length,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
