import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

const ALLOWED_TABLES = [
  'site_status',
  'alerts',
  'pipeline_status',
  'community_threads',
  'jobs',
  'funnel_events',
  'routing_log',
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Authenticate via secret header
  const secret = req.headers.get('x-n8n-secret') || req.headers.get('X-N8N-Secret');
  const expectedSecret = Deno.env.get('N8N_WEBHOOK_SECRET');

  if (!expectedSecret || secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: { table: string; action: string; payload: Record<string, unknown> | Record<string, unknown>[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { table, action, payload } = body;

  // Validate table
  if (!table || !ALLOWED_TABLES.includes(table)) {
    return new Response(JSON.stringify({ error: `Table "${table}" is not allowed. Allowed: ${ALLOWED_TABLES.join(', ')}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate action
  if (!['insert', 'update', 'upsert'].includes(action)) {
    return new Response(JSON.stringify({ error: 'Action must be insert, update, or upsert' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!payload || (typeof payload !== 'object')) {
    return new Response(JSON.stringify({ error: 'Payload must be an object or array of objects' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Use service_role to bypass RLS
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  let result;
  try {
    if (action === 'insert') {
      result = await supabase.from(table).insert(payload).select();
    } else if (action === 'update') {
      // Update requires an id in the payload
      const items = Array.isArray(payload) ? payload : [payload];
      const results = [];
      for (const item of items) {
        if (!item.id) {
          return new Response(JSON.stringify({ error: 'Update requires "id" in payload' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const id = item.id;
        const { id: _, ...updates } = item;
        const r = await supabase.from(table).update(updates).eq('id', id).select();
        results.push(r);
      }
      result = { data: results.flatMap(r => r.data || []), error: results.find(r => r.error)?.error || null };
    } else if (action === 'upsert') {
      result = await supabase.from(table).upsert(payload).select();
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Database operation failed', details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (result?.error) {
    return new Response(JSON.stringify({ error: result.error.message, details: result.error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, data: result?.data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
