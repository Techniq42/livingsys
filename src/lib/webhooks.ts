import { supabase } from '@/integrations/supabase/client';

// N8N ROUTING MAP
// 
// field_guide_optin WHERE path = 'architect':
//   → Tag: fls-field-guide, path-architect
//   → Enroll: Edge Runner Open Source Track
//   → Send: Field Guide PDF + GitHub repo link
//
// field_guide_optin WHERE path = 'operator':  
//   → Tag: fls-field-guide, path-operator
//   → Enroll: Edge Runner GHL Setup Track
//   → Send: Field Guide PDF + GHL snapshot instructions
//
// book_bump_clicked:
//   → Tag: book-bump-interest
//   → Enroll: Book Fulfillment Sequence
//
// GHL Location ID: VOj3Nh4W02ZhyAtuG9pD
// GHL existing tags to apply: fls-field-guide

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
  const webhookUrl = import.meta.env.VITE_N8N_OPTIN_WEBHOOK_URL;
  if (!webhookUrl) return;

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
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    await logWebhookError('field_guide_optin', payload, String(err));
  }
}

export async function fireBookBumpWebhook(leadId: string, path: string) {
  const webhookUrl = import.meta.env.VITE_N8N_OPTIN_WEBHOOK_URL;
  if (!webhookUrl) return;

  const payload = {
    event: 'book_bump_clicked',
    lead_id: leadId,
    path,
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
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
  const webhookUrl = import.meta.env.VITE_N8N_CODEX_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      answer: 'The Codex webhook is not configured. Set VITE_N8N_CODEX_WEBHOOK_URL to connect.',
      sources: [],
      confidence: 'low' as const,
    };
  }

  const body = {
    event: 'codex_query',
    ...payload,
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
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
