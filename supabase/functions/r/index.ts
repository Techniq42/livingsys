// Multi-frame referrer-aware redirect handler.
// GET /r/:slug?d=<draft_id>
// Reads Referer, picks a frame, logs a click, 302s to the destination URL for that frame.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Ordered frame matchers — first match wins, "default" is fallback.
const FRAME_MATCHERS: Array<{ key: string; pattern: RegExp }> = [
  { key: "institutional", pattern: /(worldbank|wbg|imf\.org|un\.org|untreaty|fao\.org|gov\.|\.gov\b|linkedin\.com|reuters|ft\.com)/i },
  { key: "practitioner", pattern: /(reddit\.com|forum|stackexchange|hackernews|news\.ycombinator|substack)/i },
];

function pickFrame(referrer: string | null, frames: Record<string, unknown>): string {
  if (!referrer) return frames["default"] ? "default" : Object.keys(frames)[0];
  for (const m of FRAME_MATCHERS) {
    if (m.pattern.test(referrer) && frames[m.key]) return m.key;
  }
  return frames["default"] ? "default" : Object.keys(frames)[0];
}

async function hashIp(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  const data = new TextEncoder().encode(ip + ":nexus-salt-v1");
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  // Path can be /r/:slug or /:slug depending on routing
  const parts = url.pathname.split("/").filter(Boolean);
  const slug = parts[parts.length - 1];

  if (!slug) {
    return new Response("missing slug", { status: 400 });
  }

  const draftId = url.searchParams.get("d");
  const referrer = req.headers.get("referer") || req.headers.get("referrer");
  const ua = req.headers.get("user-agent");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: target, error } = await supabase
    .from("redirect_targets")
    .select("id, destination_url, audience_frames, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !target || !target.is_active) {
    return new Response("not found", { status: 404 });
  }

  const frames = (target.audience_frames as Record<string, { cta_url?: string }>) || {};
  const frameKey = pickFrame(referrer, frames);
  const frame = frames[frameKey] || {};
  const destination = frame.cta_url || target.destination_url;

  // Fire-and-forget click logging + counter bump
  const ipHash = await hashIp(ip);
  await supabase.from("redirect_clicks").insert({
    redirect_target_id: target.id,
    frame_key: frameKey,
    referrer,
    ua,
    ip_hash: ipHash,
    draft_id: draftId,
  });
  // Increment click_count atomically via raw update
  await supabase.rpc("increment_redirect_click", { _id: target.id }).then(() => {}).catch(() => {
    // RPC optional — fall back to read-modify-write if missing
    supabase.from("redirect_targets").select("click_count").eq("id", target.id).single().then(({ data }) => {
      if (data) {
        supabase.from("redirect_targets").update({ click_count: (data.click_count ?? 0) + 1 }).eq("id", target.id);
      }
    });
  });

  return new Response(null, {
    status: 302,
    headers: { Location: destination, "Cache-Control": "no-store" },
  });
});
