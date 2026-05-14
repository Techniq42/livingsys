/**
 * Hand-maintained types for tables that live in the FLS production Supabase project
 * (eyoqexibycelhsatitwt) but are NOT in the auto-generated types.ts (which is bound
 * to the unused Lovable Cloud instance).
 *
 * Source of truth: SQL schema in eyoqexibycelhsatitwt. Update when the schema changes.
 */

export type IncidentSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AutofixStatus = 'pending' | 'attempted' | 'succeeded' | 'failed' | 'skipped' | null;

export interface IncidentEvent {
  id: string;
  created_at: string;
  incident_type: string;
  severity: IncidentSeverity;
  source: string; // e.g. 'bluesky-listener', 'reddit-scanner', 'optin-intake'
  message: string;
  metadata: Record<string, unknown> | null;
  autofix_rule_id: string | null;
  autofix_status: AutofixStatus;
  resolved_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

export interface L2AutofixRule {
  id: string;
  created_at: string;
  rule_name: string;
  incident_type: string;
  description: string | null;
  action: string; // e.g. 'retry', 'rate-limit-backoff', 'notify-only'
  enabled: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
}

export interface MetricEvent {
  id: string;
  created_at: string;
  metric_name: string;
  value: number;
  source: string;
  metadata: Record<string, unknown> | null;
}

export type AppRole = 'architect' | 'administrator' | 'practitioner' | 'healer';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}
