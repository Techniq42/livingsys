// Conversation Draft — given a conversation, draft the next outbound message.
// Uses Lovable AI Gateway with canon context + route intent + conversation history.
// Body: { conversation_id: string, route_slug?: string, instructions?: string }
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

  const body = await req.json().catch(() => ({}));
  const conversationId: string = body?.conversation_id;
  if (!conversationId) return new Response(JSON.stringify({ error: "conversation_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { data: conv } = await supabase.from("outreach_conversations").select("*").eq("id", conversationId).maybeSingle();
  if (!conv) return new Response(JSON.stringify({ error: "conversation not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { data: messages } = await supabase
    .from("outreach_messages")
    .select("direction, author_handle, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(40);

  const routeSlug: string | null = body?.route_slug ?? conv.route_slug ?? (conv.metadata?.route_hint ?? null);
  let routeRow: any = null;
  if (routeSlug) {
    const { data } = await supabase.from("conversation_routes").select("*").eq("slug", routeSlug).maybeSingle();
    routeRow = data;
  }

  let canonRow: any = null;
  if (conv.canon_slug) {
    const { data } = await supabase.from("canon_pages").select("title, url, audience, navigation_notes, summary").eq("slug", conv.canon_slug).maybeSingle();
    canonRow = data;
  }

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const lengthHint = conv.channel === "bluesky" ? "≤ 280 chars" : conv.channel === "reddit" ? "≤ 600 chars" : "≤ 900 chars";
  const sys = `You are Gemma, drafting the NEXT reply in an ongoing discussion that started from canon outreach. Voice: seasoned NCO, plain-spoken, slightly dry; reverse-Coca-Cola (value upfront, no pitch). Goal: keep the conversation grounded in the other person's expertise, add ONE substantive observation, and — only if it actually serves them — point toward the appropriate next step. Never marketing-speak. ${lengthHint}.

If a route is set, gently steer toward it (without naming it as a 'route'). The route describes who they are likely to become to us, not where we're shoving them.`;

  const canonCtx = canonRow ? `CANON PAGE IN PLAY:\n- ${canonRow.title} — ${canonRow.url}\n- audience: ${canonRow.audience ?? "—"}\n- summary: ${canonRow.summary ?? "—"}\n- nav notes: ${canonRow.navigation_notes ?? "—"}\n` : "CANON PAGE: (none linked)";
  const routeCtx = routeRow ? `ROUTE INTENT: ${routeRow.label}\n- ${routeRow.description ?? ""}\n- handoff notes: ${routeRow.handoff_notes ?? ""}` : "ROUTE INTENT: (unset — keep it open)";
  const history = (messages ?? []).map(m => `[${m.direction.toUpperCase()} ${m.author_handle ?? "?"}] ${m.body}`).join("\n\n");
  const usr = `CONVERSATION CHANNEL: ${conv.channel}\nCOUNTERPART: ${conv.counterpart_handle ?? "—"} (${conv.counterpart_display_name ?? "—"})\n\n${canonCtx}\n\n${routeCtx}\n\nTHREAD HISTORY (oldest → newest):\n${history || "(no prior messages)"}\n\nADDITIONAL INSTRUCTIONS:\n${body?.instructions ?? "(none)"}\n\nReturn ONLY JSON: {"body": string, "rationale": string, "suggested_route": string | null}`;

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
      response_format: { type: "json_object" },
    }),
  });

  if (!aiRes.ok) {
    const txt = await aiRes.text();
    return new Response(JSON.stringify({ error: "AI draft failed", detail: txt }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const data = await aiRes.json();
  let parsed: any = {};
  try { parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}"); } catch { parsed = {}; }

  return new Response(JSON.stringify({
    ok: true,
    draft: parsed.body ?? "",
    rationale: parsed.rationale ?? "",
    suggested_route: parsed.suggested_route ?? null,
    route_in_play: routeSlug,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
