// Firecrawl geo-fanout search for canon pages.
// Body: { query: string, canon_slug?: string, limit_per_region?: number, tbs?: string }
// If canon_slug provided, uses canon_pages.primary_regions + secondary_regions to fan out
// per-state searches and tag each result with its region + tier.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-n8n-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const US_STATE_NAMES: Record<string, string> = {
  CO: "Colorado", NM: "New Mexico", UT: "Utah", AZ: "Arizona", NV: "Nevada",
  CA: "California", TX: "Texas", NE: "Nebraska", ND: "North Dakota",
  SD: "South Dakota", OR: "Oregon", WA: "Washington", ID: "Idaho",
  MT: "Montana", WY: "Wyoming", OK: "Oklahoma", KS: "Kansas",
};

async function firecrawlSearch(query: string, limit: number, tbs?: string) {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY missing");
  const res = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      limit,
      country: "us",
      lang: "en",
      ...(tbs ? { tbs } : {}),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Firecrawl ${res.status}`);
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Auth: n8n secret OR architect JWT
  const secret = req.headers.get("x-n8n-secret");
  const expected = Deno.env.get("N8N_WEBHOOK_SECRET");
  const authHeader = req.headers.get("Authorization");
  const isN8n = expected && secret === expected;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (!isN8n) {
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await anon.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const ok = roles?.some((r: any) => r.role === "architect" || r.role === "administrator");
    if (!ok) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const body = await req.json().catch(() => ({}));
  const baseQuery: string | undefined = body?.query;
  const canonSlug: string | undefined = body?.canon_slug;
  const limitPerRegion: number = Math.min(Math.max(body?.limit_per_region ?? 5, 1), 20);
  const tbs: string | undefined = body?.tbs;

  if (!baseQuery && !canonSlug) {
    return new Response(JSON.stringify({ error: "query or canon_slug required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Resolve regions from canon page
  let primary: string[] = [];
  let secondary: string[] = [];
  let canonTitle = "";
  let canonSummary = "";
  if (canonSlug) {
    const { data: canon } = await supabase
      .from("canon_pages")
      .select("title,summary,primary_regions,secondary_regions")
      .eq("slug", canonSlug)
      .maybeSingle();
    if (!canon) {
      return new Response(JSON.stringify({ error: `canon_slug not found: ${canonSlug}` }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    primary = canon.primary_regions ?? [];
    secondary = canon.secondary_regions ?? [];
    canonTitle = canon.title;
    canonSummary = canon.summary ?? "";
  }

  const queryStem = baseQuery || canonTitle;
  const regions = [
    ...primary.map((r) => ({ code: r, tier: "primary" as const })),
    ...secondary.map((r) => ({ code: r, tier: "secondary" as const })),
  ];

  // If no regions, run one ungrounded search
  if (regions.length === 0) {
    try {
      const r = await firecrawlSearch(queryStem, limitPerRegion, tbs);
      return new Response(JSON.stringify({ ok: true, canon: canonSlug, regions: [], results: { _global: r } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: String(err) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Fan out — sequential to respect rate limits
  const results: Record<string, unknown> = {};
  for (const { code, tier } of regions) {
    const stateName = US_STATE_NAMES[code] ?? code;
    const q = `${queryStem} ${stateName}`;
    try {
      const r = await firecrawlSearch(q, limitPerRegion, tbs);
      const items = (r?.data ?? r?.web ?? []).slice(0, limitPerRegion);
      results[code] = {
        tier,
        state: stateName,
        query: q,
        count: items.length,
        items: items.map((it: any) => ({
          url: it.url,
          title: it.title,
          description: it.description ?? it.snippet ?? null,
        })),
      };
    } catch (err) {
      results[code] = { tier, state: stateName, error: String(err) };
    }
  }

  // Log to canon_search_runs for paper trail
  await supabase.from("canon_search_runs").insert({
    canon_slug: canonSlug ?? null,
    query: queryStem,
    tbs: tbs ?? null,
    region_count: regions.length,
    results_summary: results,
  }).then(() => {}).catch(() => {});

  return new Response(JSON.stringify({
    ok: true,
    canon: canonSlug,
    canon_title: canonTitle,
    canon_summary: canonSummary,
    primary_regions: primary,
    secondary_regions: secondary,
    results,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
