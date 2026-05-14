import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Wrench, Inbox, Clock, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  fetchIncidents,
  fetchAutofixRules,
  acknowledgeIncident,
  subscribeToIncidents,
} from '@/lib/selfHealing';
import {
  classificationSeverity,
  type IncidentEvent,
  type L2AutofixRule,
} from '@/integrations/supabase/external-types';

function timeAgo(ts: string | null): string {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function truncate(s: string | null, n = 80): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function severityClass(c: string | null): string {
  const sev = classificationSeverity(c);
  if (sev === 'red') return 'text-destructive border-destructive/40 bg-destructive/10';
  if (sev === 'amber') return 'text-warning border-warning/40 bg-warning/10';
  if (sev === 'green') return 'text-primary border-primary/30 bg-primary/5';
  return 'text-muted-foreground border-border bg-muted/30';
}

function severityDot(c: string | null): string {
  const sev = classificationSeverity(c);
  if (sev === 'red') return 'bg-destructive';
  if (sev === 'amber') return 'bg-warning';
  if (sev === 'green') return 'bg-primary';
  return 'bg-muted-foreground';
}

/** Find the autofix rule that would match a given incident. */
function matchRule(
  incident: IncidentEvent,
  rules: L2AutofixRule[],
): L2AutofixRule | null {
  const candidates = rules.filter(
    (r) => r.enabled && r.classification === incident.classification,
  );
  for (const r of candidates) {
    if (!r.match_pattern) return r;
    try {
      if (new RegExp(r.match_pattern, 'i').test(incident.error_message ?? '')) {
        return r;
      }
    } catch {
      // ignore bad regex
    }
  }
  return candidates[0] ?? null;
}

function IncidentRow({
  incident,
  rule,
  showAck,
  onAck,
}: {
  incident: IncidentEvent;
  rule?: L2AutofixRule | null;
  showAck?: boolean;
  onAck?: (id: string) => void;
}) {
  return (
    <Collapsible>
      <div className={`rounded-lg border p-3 space-y-2 ${severityClass(incident.classification)}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${severityDot(incident.classification)}`} />
            <span className="text-xs font-mono uppercase tracking-wider truncate">
              {incident.classification ?? 'unknown'}
            </span>
          </div>
          <span className="text-xs flex items-center gap-1 opacity-70 shrink-0">
            <Clock className="w-3 h-3" /> {timeAgo(incident.created_at)}
          </span>
        </div>
        <p className="text-sm text-foreground">
          {truncate(incident.error_message, 80)}
        </p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-wider opacity-60 truncate">
            {incident.workflow_name ?? incident.workflow_id ?? 'unknown workflow'}
          </p>
          <CollapsibleTrigger className="text-[10px] uppercase tracking-wider opacity-70 hover:opacity-100 flex items-center gap-1">
            details <ChevronDown className="w-3 h-3" />
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="space-y-2 pt-2 border-t border-border/40">
          {incident.summary && (
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-60">Summary</p>
              <p className="text-xs text-foreground">{incident.summary}</p>
            </div>
          )}
          {incident.likely_root_cause && (
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-60">Likely cause</p>
              <p className="text-xs text-foreground">{incident.likely_root_cause}</p>
            </div>
          )}
          {incident.recommended_action && (
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-60">Recommended</p>
              <p className="text-xs text-foreground">{incident.recommended_action}</p>
            </div>
          )}
          {incident.diagnosis && (
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-60">Diagnosis</p>
              <p className="text-xs text-foreground whitespace-pre-wrap font-mono">
                {incident.diagnosis}
              </p>
            </div>
          )}
          {rule && (
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-60">Matched playbook</p>
              <p className="text-xs text-foreground">
                {rule.rule_name ?? rule.classification}
                {rule.notes ? ` — ${rule.notes}` : ''}
              </p>
            </div>
          )}
        </CollapsibleContent>
        {showAck && onAck && (
          <button
            onClick={() => onAck(incident.id)}
            className="w-full text-xs font-display tracking-wider uppercase bg-foreground text-background rounded-md py-2 hover:bg-foreground/90 transition min-h-[44px]"
          >
            Got it
          </button>
        )}
      </div>
    </Collapsible>
  );
}

export function CoordinationHealth() {
  const [incidents, setIncidents] = useState<IncidentEvent[]>([]);
  const [rules, setRules] = useState<L2AutofixRule[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));

    Promise.all([fetchIncidents(50), fetchAutofixRules()])
      .then(([inc, r]) => {
        setIncidents(inc);
        setRules(r);
      })
      .catch((e) => console.error('[CoordinationHealth] load failed', e))
      .finally(() => setLoading(false));

    const unsub = subscribeToIncidents((incident) => {
      setIncidents((prev) => [incident, ...prev].slice(0, 50));
    });
    return unsub;
  }, []);

  // Panel 1: What broke — last 10 by created_at
  const broke = useMemo(() => incidents.slice(0, 10), [incidents]);

  // Panel 2: What we did — auto_retry_safe in last 24h
  const fixed = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return incidents.filter(
      (i) => i.auto_retry_safe === true && new Date(i.created_at).getTime() > cutoff,
    );
  }, [incidents]);

  // Panel 3: What needs you — matching rule.requires_human OR classification='credential_error', not yet acked
  const needsYou = useMemo(
    () =>
      incidents.filter((i) => {
        if (i.acknowledged_at) return false;
        if (i.classification === 'credential_error') return true;
        const rule = matchRule(i, rules);
        return rule?.requires_human === true;
      }),
    [incidents, rules],
  );

  const handleAck = async (id: string) => {
    if (!userId) return;
    try {
      await acknowledgeIncident(id, userId);
      setIncidents((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, acknowledged_at: new Date().toISOString(), acknowledged_by: userId }
            : i,
        ),
      );
    } catch (e) {
      console.error('[CoordinationHealth] ack failed', e);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground italic">Loading the room…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel 1: What broke */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display tracking-wider uppercase text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              What broke
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {broke.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No fires. Nice.</p>
            ) : (
              broke.map((i) => (
                <IncidentRow key={i.id} incident={i} rule={matchRule(i, rules)} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Panel 2: What we did */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display tracking-wider uppercase text-muted-foreground flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              What we did
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fixed.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Nothing to clean up in the last 24h.</p>
            ) : (
              fixed.map((i) => {
                const rule = matchRule(i, rules);
                return (
                  <div
                    key={i.id}
                    className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-primary truncate">
                        {i.classification ?? 'auto-fixed'}
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    </div>
                    <p className="text-sm text-foreground">{truncate(i.error_message, 80)}</p>
                    {rule?.notes && (
                      <p className="text-xs text-muted-foreground italic">{rule.notes}</p>
                    )}
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span className="truncate">{i.workflow_name ?? '—'}</span>
                      <span className="shrink-0">auto-fixed {timeAgo(i.created_at)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Panel 3: What needs you */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display tracking-wider uppercase text-muted-foreground flex items-center gap-2">
              <Inbox className="w-4 h-4 text-warning" />
              What needs you
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {needsYou.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">All quiet. Nothing for you right now.</p>
            ) : (
              needsYou.map((i) => (
                <IncidentRow
                  key={i.id}
                  incident={i}
                  rule={matchRule(i, rules)}
                  showAck
                  onAck={handleAck}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Autofix rules — small reference strip */}
      {rules.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-display tracking-wider uppercase text-muted-foreground">
              Ria's playbook ({rules.filter((r) => r.enabled).length} active)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {rules.map((r) => (
                <Badge
                  key={r.id}
                  variant={r.enabled ? 'default' : 'outline'}
                  className="text-[10px] font-mono"
                >
                  {r.rule_name ?? r.classification}
                  {r.trigger_count > 0 && (
                    <span className="ml-1 opacity-70">×{r.trigger_count}</span>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
