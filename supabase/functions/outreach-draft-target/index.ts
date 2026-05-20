// Drafts a reply for a single already-surfaced outreach_target.
// Operator-confirm step: scout surfaces → operator clicks Draft → this runs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
  const targetId: string = body?.target_id;
  const canonSlug: string | undefined = body?.canon_slug;
  const approachHint: string | undefined = body?.approach_hint;
  if (!targetId) return new Response(JSON.stringify({ error: "target_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { data: target, error: tErr } = await supabase.from("outreach_targets").select("*").eq("id", targetId).maybeSingle();
  if (tErr || !target) return new Response(JSON.stringify({ error: "target not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const slug = canonSlug || target.canon_slug;
  const { data: canon } = await supabase.from("canon_pages").select("*").eq("slug", slug).maybeSingle();
  if (!canon) return new Response(JSON.stringify({ error: "canon page not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const channel = target.channel;
  const kindMap: Record<string, string> = { bluesky: "reply", reddit: "reply", web: "comment" };
  const draftKind = kindMap[channel] || "reply";
  const lengthHint = channel === "bluesky" ? "≤ 280 chars total" : "≤ 600 chars";

  const sys = `You are Gemma, drafting outreach for an operator running a "reverse-Coca-Cola" strategy: lead with substantive value, no pitch, never link-dump. Voice: seasoned NCO, plain-spoken, slightly dry. Goal: signal-flare a relevant canon page to one specific person who is likely ADHD/nerdy/pattern-paying-attention, so they nerd out and find the operator on their own. RULES: (1) Acknowledge what they said specifically. (2) Add ONE substantive observation. (3) Link the canon page ONCE, framed as "you might dig this" not as a pitch. (4) Never use marketing language. (5) ${lengthHint}.`;
  const usr = `CANON PAGE:\n- title: ${canon.title}\n- url: ${canon.url}\n- audience: ${canon.audience ?? "—"}\n- summary: ${canon.summary ?? "—"}\n- nav notes: ${canon.navigation_notes ?? "—"}\n\nTARGET:\n- channel: ${channel}\n- handle: ${target.target_handle ?? "—"}\n- snippet they posted: "${target.snippet ?? ""}"\n- url: ${target.target_url}\n${approachHint ? `\nOPERATOR APPROACH HINT: ${approachHint}` : ""}\n\nReturn ONLY JSON: {"body": string, "rationale": string}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    return new Response(JSON.stringify({ error: `AI draft failed: ${errText.slice(0, 200)}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const data = await res.json();
  let parsed: any;
  try { parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}"); }
  catch { return new Response(JSON.stringify({ error: "draft parse failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

  const { data: draft, error: dErr } = await supabase.from("outreach_drafts").insert({
    target_id: target.id,
    draft_kind: draftKind,
    body: parsed.body,
    rationale: parsed.rationale,
    canon_slug: slug,
    status: "pending",
  }).select().single();
  if (dErr) return new Response(JSON.stringify({ error: dErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  await supabase.from("outreach_targets").update({ status: "drafted" }).eq("id", target.id);
  return new Response(JSON.stringify({ draft }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
