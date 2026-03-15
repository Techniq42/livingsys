import { supabase } from '@/integrations/supabase/client';

// All webhook traffic is now routed through the submit-optin Edge Function
// which adds the x-webhook-secret header server-side. The n8n URL and secret
// never appear in browser-visible JavaScript.

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-optin`;

async function callProxy(payload: Record<string, unknown>) {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  return res;
}

async function logWebhookError(eventType: string, payload: unknown, errorMessage: string) {
  try {
    await supabase.from('webhook_errors').insert([{
      event_type: eventType,
      payload: JSON.parse(JSON.stringify(payload)),
      error_message: errorMessage,
    }]);
  } catch (e) {
    console.error('Failed to log webhook error:', e);
  }
}

export async function fireOptInWebhook(lead: {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  path: string;
}) {
  const payload = {
    event: 'field_guide_optin',
    timestamp: new Date().toISOString(),
    lead: {
      id: lead.id,
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      path: lead.path,
    },
    source: {
      url: window.location.href,
      referrer: document.referrer || null,
    },
  };

  try {
    await callProxy(payload);
  } catch (err) {
    await logWebhookError('field_guide_optin', payload, String(err));
  }
}

export async function fireBookBumpWebhook(leadId: string, path: string) {
  const payload = {
    event: 'book_bump_clicked',
    lead_id: leadId,
    path,
    timestamp: new Date().toISOString(),
  };

  try {
    await callProxy(payload);
  } catch (err) {
    await logWebhookError('book_bump_clicked', payload, String(err));
  }
}

export async function fireCodexQuery(payload: {
  user_id: string;
  role: string;
  session_id: string;
  message: string;
  conversation_history: Array<{ role: string; content: string }>;
}) {
  const body = {
    event: 'codex_query',
    ...payload,
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await callProxy(body);
    return await res.json();
  } catch (err) {
    await logWebhookError('codex_query', body, String(err));
    return {
      answer: 'Connection to the Codex failed. Try again shortly.',
      sources: [],
      confidence: 'low' as const,
    };
  }
}
