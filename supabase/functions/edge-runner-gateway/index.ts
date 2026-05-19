import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const REDDIT_DRAFT_URL = "https://living-systems.app.n8n.cloud/webhook/reddit-draft";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const isHealth =
    req.method === "GET" ||
    url.pathname.endsWith("/health") ||
    url.searchParams.get("health") === "1";

  const secret = Deno.env.get("N8N_REDDIT_SECRET");
  if (!secret) {
    return new Response(
      JSON.stringify({ ok: false, error: "N8N_REDDIT_SECRET not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Health check: POST a minimal probe with the header and confirm 200.
  if (isHealth) {
    try {
      const probe = await fetch(REDDIT_DRAFT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-n8n-secret": secret,
        },
        body: JSON.stringify({ event: "health_check", timestamp: new Date().toISOString() }),
      });
      const text = await probe.text();
      const ok = probe.status === 200;
      return new Response(
        JSON.stringify({
          ok,
          status: probe.status,
          header_sent: "x-n8n-secret",
          target: REDDIT_DRAFT_URL,
          response_preview: text.slice(0, 200),
        }),
        {
          status: ok ? 200 : 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ ok: false, error: String(err) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  // Dispatch: forward the request body to the reddit-draft webhook.
  let payload: unknown = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  try {
    const upstream = await fetch(REDDIT_DRAFT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-n8n-secret": secret,
      },
      body: JSON.stringify(payload),
    });
    const text = await upstream.text();
    return new Response(
      JSON.stringify({
        ok: upstream.status === 200,
        status: upstream.status,
        upstream_body: text,
      }),
      {
        status: upstream.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
