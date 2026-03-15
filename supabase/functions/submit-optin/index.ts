const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const webhookUrl =
      Deno.env.get("N8N_WEBHOOK_URL") ||
      "https://living-systems.app.n8n.cloud/webhook/lovable-optin";
    const webhookSecret = Deno.env.get("N8N_WEBHOOK_SECRET") || "";

    const body = await req.json();

    // Validate required fields
    const { event } = body;
    if (!event) {
      return new Response(JSON.stringify({ error: "Missing event type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Forward to n8n with the secret header
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (webhookSecret) {
      headers["x-webhook-secret"] = webhookSecret;
    }

    const n8nRes = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    // Try to return n8n's response body (for codex_query which expects JSON back)
    let responseBody: string;
    try {
      const n8nData = await n8nRes.json();
      responseBody = JSON.stringify(n8nData);
    } catch {
      responseBody = JSON.stringify({ ok: true });
    }

    return new Response(responseBody, {
      status: n8nRes.ok ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("submit-optin error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
