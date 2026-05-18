// ghl-bridge — single proxy from app → n8n → GoHighLevel, scoped per sub-account.
//
// Why this exists:
//   - GHL OAuth lives in n8n (agency-level), never in the browser.
//   - Every call MUST name a sub_account_slug; n8n routes to the correct GHL location_id.
//   - Every call writes a ghl_action_log row so Architects have a paper trail.
//   - Browser-action fallback uses the same function with via='browser_fallback';
//     n8n hands the structured task to the browser runner (Claude Code or extension).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BridgeRequest {
  sub_account_slug: "empty" | "fls" | "blossoming_lotus_sound" | string;
  action_kind: string;            // e.g. "contacts.create", "course.create_category", "funnel.edit_variant"
  payload: Record<string, unknown>;
  via?: "api" | "browser_fallback";
  decision_id?: string | null;
  auto_execute?: boolean;          // architect-only convenience for Empty sandbox
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const N8N_WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL");
    const N8N_WEBHOOK_SECRET = Deno.env.get("N8N_WEBHOOK_SECRET");
    if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "Server not configured" }, 500);

    const body = (await req.json()) as BridgeRequest;
    if (!body?.sub_account_slug || !body?.action_kind) {
      return json({ error: "sub_account_slug and action_kind are required" }, 400);
    }

    // --- Resolve user from JWT ---
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, Authorization: authHeader },
    });
    if (!userRes.ok) return json({ error: "Invalid session" }, 401);
    const user = await userRes.json();
    const userId = user?.id as string | undefined;
    if (!userId) return json({ error: "Invalid session" }, 401);

    // --- Architect gate (only architects can propose GHL actions for now) ---
    const roleRes = await fetch(
      `${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&select=role`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
    );
    const roles: Array<{ role: string }> = roleRes.ok ? await roleRes.json() : [];
    const isArchitect = roles.some((r) => r.role === "architect" || r.role === "administrator");
    if (!isArchitect) return json({ error: "Architect role required" }, 403);

    // --- Confirm sub-account exists and is active ---
    const subRes = await fetch(
      `${SUPABASE_URL}/rest/v1/ghl_sub_accounts?slug=eq.${encodeURIComponent(body.sub_account_slug)}&is_active=eq.true&select=slug,label,ghl_location_id&limit=1`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
    );
    const subs = subRes.ok ? await subRes.json() : [];
    if (!subs.length) return json({ error: `Sub-account '${body.sub_account_slug}' not found or inactive` }, 404);
    const sub = subs[0];

    const via = body.via ?? "api";
    // Sandbox auto-execute rule: only Empty sub-account, architect-authored, via=api
    const autoExec = !!body.auto_execute && body.sub_account_slug === "empty" && via === "api";
    const initialStatus = autoExec ? "executing" : "proposed";

    // --- Log to ghl_action_log ---
    const logRes = await fetch(`${SUPABASE_URL}/rest/v1/ghl_action_log`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        sub_account_slug: body.sub_account_slug,
        proposed_by: userId,
        action_kind: body.action_kind,
        payload: body.payload ?? {},
        via,
        status: initialStatus,
        decision_id: body.decision_id ?? null,
      }),
    });
    const logRows = logRes.ok ? await logRes.json() : [];
    const actionId: string | null = logRows?.[0]?.id ?? null;

    // --- If not auto-executing, return the action_id for human approval ---
    if (!autoExec) {
      return json({
        status: "proposed",
        action_id: actionId,
        sub_account: sub,
        message: `Action queued for approval in ${sub.label}.`,
      });
    }

    // --- Auto-execute path: forward to n8n ---
    if (!N8N_WEBHOOK_URL) {
      await markFailed(SUPABASE_URL, SERVICE_KEY, actionId, "N8N_WEBHOOK_URL not configured");
      return json({ error: "n8n bridge not configured" }, 500);
    }

    const n8nRes = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(N8N_WEBHOOK_SECRET ? { "x-webhook-secret": N8N_WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify({
        kind: "ghl_action",
        sub_account_slug: body.sub_account_slug,
        ghl_location_id: sub.ghl_location_id,
        action_kind: body.action_kind,
        payload: body.payload,
        via,
        action_id: actionId,
      }),
    });

    if (!n8nRes.ok) {
      const t = await n8nRes.text();
      await markFailed(SUPABASE_URL, SERVICE_KEY, actionId, `n8n ${n8nRes.status}: ${t.slice(0, 500)}`);
      return json({ error: "n8n bridge call failed", status: n8nRes.status }, 502);
    }

    // n8n is expected to PATCH ghl_action_log via the n8n-webhook function when done.
    return json({
      status: "executing",
      action_id: actionId,
      sub_account: sub,
      message: `Dispatched to n8n for ${sub.label}.`,
    });
  } catch (e) {
    console.error("ghl-bridge error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

async function markFailed(url: string, key: string, actionId: string | null, error: string) {
  if (!actionId) return;
  await fetch(`${url}/rest/v1/ghl_action_log?id=eq.${actionId}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "failed", error_message: error }),
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
