/**
 * Hand-maintained types for tables in the FLS production Supabase project
 * (eyoqexibycelhsatitwt). Source of truth: information_schema in that project.
 */

export type IncidentClassification =
  | 'credential_error'
  | 'rate_limit'
  | 'data_conflict'
  | 'transient'
  | 'unknown'
  | string;

export interface IncidentEvent {
  id: string;
  workflow_id: string | null;
  workflow_name: string | null;
  node_name: string | null;
  node_type: string | null;
  execution_id: string | null;
  error_name: string | null;
  error_message: string | null;
  error_stack: string | null;
  classification: IncidentClassification | null;
  confidence: number | null;
  diagnosis: string | null; // TEXT, not jsonb
  suggested_fix: string | null;
  auto_resolved: boolean | null;
  auto_retry_safe: boolean | null;
  resolution_action: string | null;
  context_payload: Record<string, unknown> | null;
  summary: string | null;
  likely_root_cause: string | null;
  recommended_action: string | null;
  affected_surfaces: unknown | null;
  constellation_state: unknown | null;
  constellation_state_notes: string | null;
  raw_execution: unknown | null;
  raw_diagnosis: unknown | null;
  raw_response: string | null;
  handler_version: string | null;
  trust_level: string | null;
  diagnosed_by: string | null;
  created_at: string;
  occurred_at: string | null;
  inserted_at: string | null;
  resolved_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

export interface L2AutofixRule {
  id: string;
  classification: string;
  match_pattern: string | null; // regex tested against error_message
  action: string | null;
  requires_human: boolean;
  notes: string | null;
  enabled: boolean;
  trigger_count: number;
  last_triggered_at: string | null;
  created_at: string;
  // legacy/optional
  rule_name?: string | null;
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

/** Map classification → semantic severity bucket for UI dots/borders. */
export function classificationSeverity(
  c: string | null | undefined,
): 'red' | 'amber' | 'green' | 'muted' {
  switch (c) {
    case 'credential_error':
      return 'red';
    case 'rate_limit':
    case 'data_conflict':
      return 'amber';
    case 'transient':
      return 'green';
    default:
      return 'muted';
  }
}
