/**
 * Thin data-access layer for the self-healing tables that live in the FLS
 * production Supabase project but aren't reflected in the auto-generated
 * types.ts. All `as any` casts are contained here so component code stays typed.
 */
import { supabase } from '@/integrations/supabase/client';
import type {
  IncidentEvent,
  L2AutofixRule,
} from '@/integrations/supabase/external-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export async function fetchIncidents(limit = 50): Promise<IncidentEvent[]> {
  const { data, error } = await db
    .from('incident_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as IncidentEvent[];
}

export async function fetchAutofixRules(): Promise<L2AutofixRule[]> {
  const { data, error } = await db
    .from('l2_autofix_rules')
    .select('*')
    .order('rule_name');
  if (error) throw error;
  return (data ?? []) as L2AutofixRule[];
}

export async function acknowledgeIncident(
  incidentId: string,
  userId: string,
): Promise<void> {
  const { error } = await db
    .from('incident_events')
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: userId,
    })
    .eq('id', incidentId);
  if (error) throw error;
}

export function subscribeToIncidents(onInsert: (incident: IncidentEvent) => void) {
  const channel = supabase
    .channel('incident_events_realtime')
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'postgres_changes' as any,
      { event: 'INSERT', schema: 'public', table: 'incident_events' },
      (payload: { new: IncidentEvent }) => onInsert(payload.new),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
