// Conversation Ingest — n8n posts inbound replies here from Reddit/Bluesky/etc.
// Creates or updates an outreach_conversations row and appends a message.
// Body: {
//   channel: 'reddit'|'bluesky'|'email'|'web'|'dm',
//   external_thread_url?: string,
//   external_message_url?: string,
//   external_message_id?: string,
//   counterpart_handle?: string,
//   counterpart_display_name?: string,
//   body: string,
//   target_id?: string,        // link back to outreach_targets if known
//   canon_slug?: string,
//   received_at?: string,
//   direction?: 'inbound'|'outbound'  // default inbound
// }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-n8n-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function classifyRouteHint(text: string): string | null {
  const t = text.toLowerCase();
  if (/(invest|capital|family office|fund|deploy|allocation|portfolio)/.test(t)) return "fls_investor";
  if (/(volunteer|help out|pitch in|i can help)/.test(t)) return "ria_volunteer";
  if (/(donat|give|contribut)/.test(t)) return "ria_donate";
  if (/(reiki|sound bath|healer|practitioner|wellness|trauma)/.test(t)) return "bls_healer";
  if (/(grant|foundation|funder|philanthrop)/.test(t)) return "funder_intro";
  if (/(nonprofit|ngo|teach|curriculum|educator|university|school)/.test(t)) return "ngo_educator";
  if (/(mutual aid|organizer|local pod|community fridge)/.test(t)) return "mutual_aid";
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Auth: architect JWT OR n8n secret
  const secret = req.headers.get("x-n8n-secret");
  const expected = Deno.env.get("N8N_WEBHOOK_SECRET");
  const isN8n = expected && secret === expected;

  if (!isN8n) {
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

  const body = await req.json().catch(() => ({}));
  const channel: string = body?.channel;
  const msgBody: string = body?.body;
  const direction: "inbound" | "outbound" = body?.direction === "outbound" ? "outbound" : "inbound";
  if (!channel || !msgBody) {
    return new Response(JSON.stringify({ error: "channel and body required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const now = new Date().toISOString();
  const receivedAt: string = body?.received_at ?? now;

  // Dedupe by external_message_id when provided
  if (body?.external_message_id) {
    const { data: existing } = await supabase
      .from("outreach_messages")
      .select("id, conversation_id")
      .eq("external_message_id", body.external_message_id)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ ok: true, deduped: true, message_id: existing.id, conversation_id: existing.conversation_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // Find or create conversation: prefer target_id, then external_thread_url, then handle+channel
  let conversation: any = null;
  if (body?.target_id) {
    const { data } = await supabase.from("outreach_conversations").select("*").eq("target_id", body.target_id).maybeSingle();
    conversation = data;
  }
  if (!conversation && body?.external_thread_url) {
    const { data } = await supabase.from("outreach_conversations").select("*").eq("external_thread_url", body.external_thread_url).maybeSingle();
    conversation = data;
  }
  if (!conversation && body?.counterpart_handle) {
    const { data } = await supabase
      .from("outreach_conversations")
      .select("*")
      .eq("channel", channel)
      .eq("counterpart_handle", body.counterpart_handle)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    conversation = data;
  }

  if (!conversation) {
    const { data, error } = await supabase.from("outreach_conversations").insert({
      target_id: body?.target_id ?? null,
      canon_slug: body?.canon_slug ?? null,
      channel,
      external_thread_url: body?.external_thread_url ?? null,
      counterpart_handle: body?.counterpart_handle ?? null,
      counterpart_display_name: body?.counterpart_display_name ?? null,
      status: "open",
      last_inbound_at: direction === "inbound" ? receivedAt : null,
      last_outbound_at: direction === "outbound" ? receivedAt : null,
      message_count: 0,
    }).select().single();
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    conversation = data;
  }

  // Insert message
  const { data: message, error: msgErr } = await supabase.from("outreach_messages").insert({
    conversation_id: conversation.id,
    direction,
    author_handle: body?.counterpart_handle ?? null,
    body: msgBody,
    external_message_url: body?.external_message_url ?? null,
    external_message_id: body?.external_message_id ?? null,
    received_at: direction === "inbound" ? receivedAt : null,
    sent_at: direction === "outbound" ? receivedAt : null,
    metadata: body?.metadata ?? {},
  }).select().single();

  if (msgErr) {
    return new Response(JSON.stringify({ error: msgErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Update conversation rollups + route hint
  const routeHint = direction === "inbound" ? classifyRouteHint(msgBody) : null;
  const updates: any = {
    message_count: (conversation.message_count ?? 0) + 1,
    status: direction === "inbound" ? "open" : "awaiting_reply",
  };
  if (direction === "inbound") updates.last_inbound_at = receivedAt;
  if (direction === "outbound") updates.last_outbound_at = receivedAt;
  if (routeHint && !conversation.route_slug) {
    updates.metadata = { ...(conversation.metadata ?? {}), route_hint: routeHint };
  }

  await supabase.from("outreach_conversations").update(updates).eq("id", conversation.id);

  return new Response(JSON.stringify({
    ok: true,
    conversation_id: conversation.id,
    message_id: message.id,
    route_hint: routeHint,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
