// Gemma overnight brief generator.
// Produces one daily_briefings row per mode (listen | engage | seed).
// Called by pg_cron or manually via authenticated UI button.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-n8n-secret",
};

type Mode = "listen" | "engage" | "seed";
const MODES: Mode[] = ["listen", "engage", "seed"];

const SYSTEM_PROMPT = `You are Gemma, the cognitive scaffolding for a movement-building operator with limited spoons.
Produce concise daily briefings in three distinct modes — each one short, scannable, and ending with a single recommended action.

LISTEN mode = community radar pattern-reads ("promising / petered out / worth a look").
ENGAGE mode = pending response drafts and conversations needing the operator's voice.
SEED mode = outbound opportunities to plant new seeds into communities where you're now welcome.

Tone: seasoned NCO, plain-spoken, no marketing fluff. One human-readable summary paragraph plus a recommended_action.`;

async function generateBrief(mode: Mode, context: string): Promise<{
  summary: string;
  highlights: Array<{ kind: string; text: string }>;
  recommended_action: string;
  confidence: number;
}> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Mode: ${mode.toUpperCase()}\n\nContext:\n${context}\n\nReturn ONLY JSON: {"summary": string, "highlights": [{"kind": "promising"|"petered"|"watch", "text": string}], "recommended_action": string, "confidence": number}` },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI gateway ${res.status}: ${txt}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Allow either n8n secret OR an authenticated architect via JWT
  const secret = req.headers.get("x-n8n-secret");
  const expected = Deno.env.get("N8N_WEBHOOK_SECRET");
  const authHeader = req.headers.get("Authorization");
  const isN8n = expected && secret === expected;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (!isN8n) {
    // Verify the user is an architect/admin
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const allowed = roles?.some((r: any) => r.role === "architect" || r.role === "administrator");
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Pull recent context (last 24h)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [{ data: threads }, { data: drafts }, { data: signals }] = await Promise.all([
    supabase.from("community_threads").select("id,post_title,source_platform,status,relevance_score,created_at").gte("created_at", since).limit(50),
    supabase.from("response_drafts").select("id,thread_id,status,classifier_tier,created_at").gte("created_at", since).limit(50),
    supabase.from("feedback_signals").select("signal_type,note,created_at").gte("created_at", since).limit(50),
  ]);

  const contexts: Record<Mode, string> = {
    listen: `Recent threads (${threads?.length ?? 0}):\n${(threads ?? []).map((t: any) => `- [${t.source_platform}] ${t.post_title} (status:${t.status}, score:${t.relevance_score})`).join("\n")}\n\nOperator feedback signals:\n${(signals ?? []).map((s: any) => `- ${s.signal_type}: ${s.note ?? ""}`).join("\n")}`,
    engage: `Pending response drafts (${drafts?.length ?? 0}):\n${(drafts ?? []).map((d: any) => `- draft ${d.id} status:${d.status} tier:${d.classifier_tier ?? "n/a"}`).join("\n")}`,
    seed: `Recent thread surface for outbound seeding opportunities:\n${(threads ?? []).slice(0, 20).map((t: any) => `- [${t.source_platform}] ${t.post_title}`).join("\n")}`,
  };

  const results: Record<string, unknown> = {};
  for (const mode of MODES) {
    try {
      const brief = await generateBrief(mode, contexts[mode]);
      const { data, error } = await supabase.from("daily_briefings").insert({
        mode,
        summary: brief.summary,
        highlights: brief.highlights ?? [],
        recommended_action: brief.recommended_action ?? null,
        source_thread_ids: (threads ?? []).map((t: any) => t.id),
        generated_by: "google/gemini-2.5-flash",
        confidence: brief.confidence ?? 0.5,
      }).select().single();
      if (error) throw error;
      results[mode] = data;
    } catch (err) {
      results[mode] = { error: String(err) };
    }
  }

  return new Response(JSON.stringify({ ok: true, briefings: results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
