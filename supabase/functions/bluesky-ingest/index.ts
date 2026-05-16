// Bluesky → community_threads bridge.
// Accepts shaped Bluesky payloads from n8n and normalizes them into the
// community_threads schema. Authenticated via x-n8n-secret header (same
// secret used by n8n-webhook). Uses service_role to bypass RLS.
//
// Expected POST body shape (single thread or array):
// {
//   uri: "at://did:plc:.../app.bsky.feed.post/abc",  // canonical at-uri
//   cid?: string,
//   url?: "https://bsky.app/profile/handle/post/abc",
//   author_handle: "name.bsky.social",
//   author_did?: "did:plc:...",
//   text: "post body text",
//   created_at?: "2026-05-16T12:00:00Z",
//   reply_count?: number,
//   like_count?: number,
//   matched_keywords?: string[],
//   relevance_score?: number,            // 1..10, default 5
//   match_reason?: object,
//   feed_id?: string,                    // which search/feed surfaced it
// }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-n8n-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type BlueskyPost = {
  uri?: string;
  cid?: string;
  url?: string;
  author_handle?: string;
  author_did?: string;
  text?: string;
  created_at?: string;
  reply_count?: number;
  like_count?: number;
  matched_keywords?: string[];
  relevance_score?: number;
  match_reason?: Record<string, unknown>;
  feed_id?: string;
};

function postUrl(p: BlueskyPost): string {
  if (p.url) return p.url;
  if (p.uri && p.author_handle) {
    const rkey = p.uri.split("/").pop();
    return `https://bsky.app/profile/${p.author_handle}/post/${rkey}`;
  }
  return p.uri || "";
}

function snippet(text: string | undefined, max = 280): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

function normalize(p: BlueskyPost) {
  const post_id = p.uri || p.cid || "";
  const url = postUrl(p);
  // title: first line or first 80 chars
  const firstLine = (p.text || "").split("\n")[0] || "";
  const title = firstLine.length > 80 ? firstLine.slice(0, 79) + "…" : firstLine || "(no text)";
  return {
    platform: "bluesky",
    source_platform: "bluesky",
    source_handle: p.author_handle || null,
    source_url: url || null,
    source_feed_id: p.feed_id || null,
    post_id,
    post_url: url,
    post_title: title,
    snippet: snippet(p.text),
    author: p.author_handle || p.author_did || null,
    response_count: p.reply_count ?? 0,
    relevance_score: p.relevance_score ?? 5,
    matched_keywords: p.matched_keywords ?? [],
    match_reason: p.match_reason ?? {},
    status: "new",
    card_type: "standard",
    ingested_at: new Date().toISOString(),
    created_at: p.created_at || new Date().toISOString(),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const secret = req.headers.get("x-n8n-secret") || req.headers.get("X-N8N-Secret");
  const expected = Deno.env.get("N8N_WEBHOOK_SECRET");
  if (!expected || secret !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const items: BlueskyPost[] = Array.isArray(body)
    ? (body as BlueskyPost[])
    : Array.isArray((body as { posts?: BlueskyPost[] }).posts)
    ? (body as { posts: BlueskyPost[] }).posts
    : [body as BlueskyPost];

  // Validate: require post_id (uri or cid) and text or url
  const rows = [];
  const skipped: { reason: string; item: BlueskyPost }[] = [];
  for (const p of items) {
    if (!p || typeof p !== "object") {
      skipped.push({ reason: "not_object", item: p });
      continue;
    }
    if (!p.uri && !p.cid) {
      skipped.push({ reason: "missing_uri_or_cid", item: p });
      continue;
    }
    rows.push(normalize(p));
  }

  if (rows.length === 0) {
    return new Response(JSON.stringify({ inserted: 0, skipped }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Upsert on post_id to dedupe re-ingests of the same Bluesky post.
  const { data, error } = await supabase
    .from("community_threads")
    .upsert(rows, { onConflict: "post_id" })
    .select("id, post_id");

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message, details: error }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ inserted: data?.length ?? 0, skipped }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
