// Funder Scout — Prong B.
// Queries Apollo.io for HNW/family-office/foundation people matching a canon page's thesis,
// upserts funder_targets, and generates per-target briefs through Lovable AI Gateway.
//
// Body: { canon_slug?: string, org_kinds?: string[], keywords?: string[], titles?: string[], limit?: number, generate_briefs?: boolean }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-n8n-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const APOLLO_BASE = "https://api.apollo.io/api/v1";

// Per-canon default search profiles (titles + keywords + org_kinds Apollo can resolve)
const CANON_PROFILES: Record<string, any> = {
  "watershed-thesis": {
    person_titles: ["principal", "managing director", "investment director", "program officer", "chief investment officer", "family office", "head of impact"],
    keywords: ["regenerative", "water", "climate finance", "blended finance", "catastrophe", "impact"],
    org_kinds: ["family_office", "foundation", "fund"],
  },
  "below-the-radar": {
    person_titles: ["program officer", "trustee", "director of grants", "philanthropic advisor", "executive director"],
    keywords: ["place-based", "community foundation", "grassroots", "mutual aid", "regenerative", "philanthropy"],
    org_kinds: ["foundation", "donor_advised"],
  },
  "regenerative-gem": {
    person_titles: ["partner", "principal", "research director", "systems lead"],
    keywords: ["systems thinking", "regenerative", "complexity", "ADHD", "biotech", "edtech"],
    org_kinds: ["fund", "angel", "family_office"],
  },
};

async function apolloPeopleSearch(payload: any) {
  const apiKey = Deno.env.get("APOLLO_API_KEY");
  if (!apiKey) throw new Error("APOLLO_API_KEY missing");
  const res = await fetch(`${APOLLO_BASE}/mixed_people/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || `Apollo ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

function scoreThesis(person: any, keywords: string[]): { score: number; tags: string[] } {
  const text = [
    person.title,
    person.organization?.name,
    person.organization?.short_description,
    (person.organization?.keywords ?? []).join(" "),
    (person.functions ?? []).join(" "),
  ].filter(Boolean).join(" ").toLowerCase();
  const matched = keywords.filter(k => text.includes(k.toLowerCase()));
  return { score: Math.min(10, 2 + matched.length * 2), tags: matched };
}

function pickOrgKind(person: any): string {
  const name = (person.organization?.name ?? "").toLowerCase();
  const desc = (person.organization?.short_description ?? "").toLowerCase();
  const blob = `${name} ${desc}`;
  if (blob.includes("family office")) return "family_office";
  if (blob.includes("foundation")) return "foundation";
  if (blob.includes("donor advised") || blob.includes("daf")) return "donor_advised";
  if (blob.includes("angel") || blob.includes("syndicate")) return "angel";
  if (blob.includes("capital") || blob.includes("ventures") || blob.includes("fund")) return "fund";
  return "hnw_individual";
}

async function generateBrief(canon: any, funder: any) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return null;
  const sys = `You are Gemma, drafting a one-pager funder brief for an operator running a "reverse-Coca-Cola" strategy. The brief must let the operator decide in 30 seconds whether to chase this funder. Voice: dry, plain-spoken NCO, no marketing language. Format STRICTLY as markdown with these sections, nothing else:

### Who they are
2 sentences. Name, role, org. What the org actually does (not what it says).

### Thesis match
3 bullets. Why this canon page fits their public thesis. Cite specific words from their org description if possible.

### Angle
1 paragraph (3-4 sentences). The hook to lead with. Not a pitch — a substantive observation that earns reading time. Frame: the data room is open source; the moat is operations.

### Next move
ONE concrete next action. Email / Bluesky DM / warm-intro request / wait-for-signal.`;
  const usr = `CANON PAGE:\n- title: ${canon.title}\n- url: ${canon.url}\n- audience: ${canon.audience ?? "—"}\n- summary: ${canon.summary ?? "—"}\n- nav notes: ${canon.navigation_notes ?? "—"}\n\nFUNDER:\n- name: ${funder.person_name}\n- title: ${funder.title}\n- org: ${funder.org_name} (${funder.org_kind})\n- thesis tags matched: ${(funder.thesis_match?.tags ?? []).join(", ")}\n- linkedin: ${funder.socials?.linkedin ?? "—"}\n- geo: ${funder.geo ?? "—"}\n\nReturn ONLY the markdown brief, no preamble.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? null;
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
  const canonSlug: string | undefined = body?.canon_slug;
  const explicitTitles: string[] | undefined = body?.titles;
  const explicitKeywords: string[] | undefined = body?.keywords;
  const limit: number = Math.min(Math.max(body?.limit ?? 25, 1), 100);
  const generateBriefs: boolean = body?.generate_briefs ?? true;

  let canon: any = null;
  let profile: any = null;
  if (canonSlug) {
    const { data } = await supabase.from("canon_pages").select("*").eq("slug", canonSlug).maybeSingle();
    canon = data;
    profile = CANON_PROFILES[canonSlug];
  }
  const personTitles = explicitTitles ?? profile?.person_titles ?? ["principal", "program officer"];
  const keywords = explicitKeywords ?? profile?.keywords ?? ["regenerative"];

  // Apollo people search
  let people: any[] = [];
  try {
    const result = await apolloPeopleSearch({
      person_titles: personTitles,
      q_keywords: keywords.join(" "),
      per_page: limit,
      page: 1,
    });
    people = result?.people ?? [];
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const surfaced: any[] = [];
  for (const p of people) {
    const orgKind = pickOrgKind(p);
    const { score, tags } = scoreThesis(p, keywords);
    if (score < 4) continue;

    // Upsert by apollo_person_id
    const payload = {
      person_name: p.name ?? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
      org_name: p.organization?.name ?? null,
      title: p.title ?? null,
      org_kind: orgKind,
      thesis_match: { score, tags, source_keywords: keywords },
      canon_slugs_matched: canonSlug ? [canonSlug] : [],
      geo: [p.city, p.state, p.country].filter(Boolean).join(", ") || null,
      apollo_person_id: p.id ?? null,
      apollo_org_id: p.organization?.id ?? null,
      emails: p.email ? [{ email: p.email, source: "apollo" }] : [],
      socials: {
        linkedin: p.linkedin_url ?? null,
        twitter: p.twitter_url ?? null,
        personal_site: p.organization?.website_url ?? null,
      },
      status: "researched",
    };

    const { data: existing } = await supabase
      .from("funder_targets")
      .select("id, canon_slugs_matched")
      .eq("apollo_person_id", p.id)
      .maybeSingle();
    let row: any;
    if (existing) {
      const merged = Array.from(new Set([...(existing.canon_slugs_matched ?? []), ...(canonSlug ? [canonSlug] : [])]));
      const { data } = await supabase.from("funder_targets")
        .update({ ...payload, canon_slugs_matched: merged })
        .eq("id", existing.id).select().single();
      row = data;
    } else {
      const { data } = await supabase.from("funder_targets").insert(payload).select().single();
      row = data;
    }
    if (row) surfaced.push(row);
  }

  // Brief pass for top candidates
  const briefsCreated: string[] = [];
  if (generateBriefs && canon && surfaced.length > 0) {
    const topFunders = surfaced
      .sort((a, b) => (b.thesis_match?.score ?? 0) - (a.thesis_match?.score ?? 0))
      .slice(0, 5);
    for (const f of topFunders) {
      try {
        const brief = await generateBrief(canon, f);
        if (!brief) continue;
        await supabase.from("funder_targets").update({
          brief_markdown: brief,
          brief_generated_at: new Date().toISOString(),
          status: "briefed",
        }).eq("id", f.id);
        briefsCreated.push(f.id);
      } catch (err) {
        console.error("brief failed", err);
      }
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    canon: canonSlug,
    apollo_results: people.length,
    funders_surfaced: surfaced.length,
    briefs_generated: briefsCreated.length,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
