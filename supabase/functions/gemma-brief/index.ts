// Gemma brief generator. Lens × Mode matrix.
// Body: { lens?: 'fls'|'healing'|..., mode?: 'listen'|'engage'|'seed' }
// If lens omitted -> runs all active lenses. If mode omitted -> runs all three modes for that lens.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-n8n-secret",
};

type Mode = "listen" | "engage" | "seed";
const ALL_MODES: Mode[] = ["listen", "engage", "seed"];

const SYSTEM_PROMPT = `You are Gemma, cognitive scaffolding for a movement-building operator with limited spoons.
You produce concise daily briefings scoped to a LENS (a neighborhood / community context) and a MODE.

LENS sets the vocabulary, posture, and audience:
- "fls" (Movement): mutual aid, food systems, place-story, FLS constellation. Tone: seasoned NCO, plain-spoken.
- "healing" (Healing Community / Aligned Entrance): sound, yoga, reiki, herbs, local fusion events. Tone: warm, supportive, co-marketing street-team — help fill classes, surface fusion sessions, amplify private availability, spotlight fundraisers (e.g. blast chillers, barn raisings). NOT spammy — surgical, mutual-recognition signals.

MODE sets the action posture:
- LISTEN = pattern-reads from radar / community / local events ("promising / petered / worth a look").
- ENGAGE = drafts and conversations waiting on the operator's voice.
- SEED = outbound opportunities to plant new seeds / cross-promote / scrounger-layer outreach.

Output ONLY JSON: {"summary": string, "highlights": [{"kind": "promising"|"petered"|"watch", "text": string}], "recommended_action": string, "confidence": number(0-1)}`;

async function generateBrief(lens: string, mode: Mode, context: string) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `LENS: ${lens}\nMODE: ${mode.toUpperCase()}\n\nContext:\n${context}\n\nReturn ONLY JSON.` },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`AI gateway ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
}

async function buildContext(supabase: any, lens: string, mode: Mode): Promise<string> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const horizon = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();

  // Lens-scoped substrate
  const [{ data: people }, { data: venues }, { data: events }, { data: canon }] = await Promise.all([
    supabase.from("people").select("display_name,role,capacity,opt_in_level,notes").eq("lens_slug", lens).limit(50),
    supabase.from("venues").select("name,city,calendar_url,website,notes").eq("lens_slug", lens).eq("is_active", true).limit(50),
    supabase.from("local_events").select("title,event_type,status,starts_at,source_url,amplify").eq("lens_slug", lens).gte("starts_at", since).lte("starts_at", horizon).order("starts_at").limit(50),
    supabase.from("canon_pages").select("slug,title,audience,primary_regions,secondary_regions").eq("status", "active"),
  ]);

  const canonGeo = (canon ?? [])
    .filter((c: any) => (c.primary_regions?.length ?? 0) + (c.secondary_regions?.length ?? 0) > 0)
    .map((c: any) => `- ${c.slug} (${c.title}) → primary: [${(c.primary_regions ?? []).join(",")}] secondary: [${(c.secondary_regions ?? []).join(",")}] audience: ${c.audience ?? "—"}`)
    .join("\n");

  const substrate = [
    `People (${people?.length ?? 0}):`,
    ...(people ?? []).map((p: any) => `- ${p.display_name} [${p.role}/${p.capacity ?? "?"}/opt:${p.opt_in_level}] ${p.notes ?? ""}`),
    `\nVenues (${venues?.length ?? 0}):`,
    ...(venues ?? []).map((v: any) => `- ${v.name} ${v.city ?? ""} cal:${v.calendar_url ?? "n/a"} — ${v.notes ?? ""}`),
    `\nUpcoming local events (${events?.length ?? 0}):`,
    ...(events ?? []).map((e: any) => `- [${e.event_type}] ${e.title} @ ${e.starts_at ?? "TBD"} ${e.amplify ? "(AMPLIFY)" : ""} ${e.source_url ?? ""}`),
    canonGeo ? `\nGeo-prioritized canon pages:\n${canonGeo}\n(When MODE=engage/seed, prefer outreach grounded in these regions for the matching canon.)` : "",
  ].join("\n");

  // FLS-only: also sweep community radar tables (those don't have a lens column yet)
  if (lens === "fls") {
    const [{ data: threads }, { data: drafts }, { data: signals }] = await Promise.all([
      supabase.from("community_threads").select("post_title,source_platform,status,relevance_score").gte("created_at", since).limit(30),
      supabase.from("response_drafts").select("id,status,classifier_tier").gte("created_at", since).limit(30),
      supabase.from("feedback_signals").select("signal_type,note").gte("created_at", since).limit(30),
    ]);
    return `${substrate}\n\nRadar threads (${threads?.length ?? 0}):\n${(threads ?? []).map((t: any) => `- [${t.source_platform}] ${t.post_title} (${t.status}, score:${t.relevance_score})`).join("\n")}\n\nPending drafts (${drafts?.length ?? 0}):\n${(drafts ?? []).map((d: any) => `- ${d.id} ${d.status} t${d.classifier_tier}`).join("\n")}\n\nFeedback:\n${(signals ?? []).map((s: any) => `- ${s.signal_type}: ${s.note ?? ""}`).join("\n")}`;
  }
  return substrate;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const secret = req.headers.get("x-n8n-secret");
  const expected = Deno.env.get("N8N_WEBHOOK_SECRET");
  const authHeader = req.headers.get("Authorization");
  const isN8n = expected && secret === expected;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (!isN8n) {
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const allowed = roles?.some((r: any) => r.role === "architect" || r.role === "administrator");
    if (!allowed) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const body = await req.json().catch(() => ({}));
  const requestedLens: string | undefined = body?.lens;
  const requestedMode: Mode | undefined = body?.mode;

  // Determine lenses
  let lenses: string[];
  if (requestedLens) {
    lenses = [requestedLens];
  } else {
    const { data } = await supabase.from("lenses").select("slug").eq("is_active", true);
    lenses = (data ?? []).map((l: any) => l.slug);
  }
  const modes: Mode[] = requestedMode ? [requestedMode] : ALL_MODES;

  const results: Record<string, unknown> = {};
  for (const lens of lenses) {
    const context = await buildContext(supabase, lens, "listen"); // same substrate context, mode-flavored in prompt
    for (const mode of modes) {
      const key = `${lens}:${mode}`;
      try {
        const brief = await generateBrief(lens, mode, context);
        const { data, error } = await supabase.from("daily_briefings").insert({
          mode,
          lens_slug: lens,
          summary: brief.summary,
          highlights: brief.highlights ?? [],
          recommended_action: brief.recommended_action ?? null,
          generated_by: "google/gemini-2.5-flash",
          confidence: brief.confidence ?? 0.5,
        }).select().single();
        if (error) throw error;
        results[key] = data;
      } catch (err) {
        results[key] = { error: String(err) };
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, briefings: results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
