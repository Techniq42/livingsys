import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Wrench, Inbox, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  fetchIncidents,
  fetchAutofixRules,
  acknowledgeIncident,
  subscribeToIncidents,
} from '@/lib/selfHealing';
import type { IncidentEvent, L2AutofixRule } from '@/integrations/supabase/external-types';

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

function severityClass(sev: string): string {
  if (sev === 'critical' || sev === 'error') return 'text-destructive border-destructive/40 bg-destructive/10';
  if (sev === 'warning') return 'text-warning border-warning/40 bg-warning/10';
  return 'text-muted-foreground border-border bg-muted/30';
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

  // Panel 1: What broke — unresolved incidents (no resolved_at)
  const broke = useMemo(
    () => incidents.filter((i) => !i.resolved_at && i.autofix_status !== 'succeeded'),
    [incidents],
  );

  // Panel 2: What we did — auto-resolved incidents in last 24h
  const fixed = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return incidents.filter(
      (i) =>
        i.autofix_status === 'succeeded' &&
        new Date(i.created_at).getTime() > cutoff,
    );
  }, [incidents]);

  // Panel 3: What needs you — resolved but not yet acknowledged, or autofix failed
  const needsYou = useMemo(
    () =>
      incidents.filter(
        (i) =>
          (i.autofix_status === 'failed' || i.autofix_status === 'skipped') &&
          !i.acknowledged_at,
      ),
    [incidents],
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
                <div
                  key={i.id}
                  className={`rounded-lg border p-3 space-y-1 ${severityClass(i.severity)}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider">{i.incident_type}</span>
                    <span className="text-xs flex items-center gap-1 opacity-70">
                      <Clock className="w-3 h-3" /> {timeAgo(i.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{i.message}</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-60">{i.source}</p>
                </div>
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
              fixed.map((i) => (
                <div
                  key={i.id}
                  className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-primary">
                      {i.incident_type}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">{i.message}</p>
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span>{i.source}</span>
                    <span>auto-fixed {timeAgo(i.created_at)}</span>
                  </div>
                </div>
              ))
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
                <div
                  key={i.id}
                  className="rounded-lg border border-warning/40 bg-warning/10 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-warning">
                      {i.incident_type}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeAgo(i.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{i.message}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{i.source}</p>
                  <button
                    onClick={() => handleAck(i.id)}
                    className="w-full text-xs font-display tracking-wider uppercase bg-foreground text-background rounded-md py-2 hover:bg-foreground/90 transition min-h-[44px]"
                  >
                    Got it
                  </button>
                </div>
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
                  {r.rule_name}
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
