import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, GitBranch, Zap, AlertTriangle, Radio, Clock, Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { riaMessages } from '@/config/primerConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SiteStatus {
  id: string;
  domain: string;
  status: string;
  last_checked: string;
  ssl_expiry: string | null;
  last_error: string | null;
}

interface PipelineStatus {
  id: string;
  account_name: string;
  track: string;
  contact_count: number;
  stuck_count: number;
  last_updated: string | null;
}

interface Alert {
  id: string;
  alert_type: string;
  message: string;
  severity: string;
  created_at: string;
  acknowledged: boolean | null;
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'up' ? 'bg-primary' : status === 'degraded' ? 'bg-warning' : 'bg-destructive';
  const glow = status === 'up' ? 'shadow-[0_0_8px_hsl(var(--primary)/0.6)]' : status === 'degraded' ? 'shadow-[0_0_8px_hsl(var(--warning)/0.6)]' : 'shadow-[0_0_8px_hsl(var(--destructive)/0.6)]';
  return <span className={`inline-block w-3 h-3 rounded-full ${color} ${glow}`} />;
}

function TimeAgo({ timestamp }: { timestamp: string | null }) {
  if (!timestamp) return <span className="text-xs text-muted-foreground">Never</span>;
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const label = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
  return <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{label}</span>;
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'error') return <XCircle className="w-4 h-4 text-destructive" />;
  if (severity === 'warning') return <AlertCircle className="w-4 h-4 text-warning" />;
  return <CheckCircle className="w-4 h-4 text-primary" />;
}

export function CoordinationHealth() {
  const [sites, setSites] = useState<SiteStatus[]>([]);
  const [pipelines, setPipelines] = useState<PipelineStatus[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const fetchAll = () => {
      Promise.all([
        supabase.from('site_status').select('*').order('domain'),
        supabase.from('pipeline_status').select('*').order('track'),
        supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(20),
      ]).then(([sitesRes, pipelinesRes, alertsRes]) => {
        setSites((sitesRes.data as SiteStatus[]) || []);
        setPipelines((pipelinesRes.data as PipelineStatus[]) || []);
        setAlerts((alertsRes.data as Alert[]) || []);
      });
    };

    fetchAll();

    // Realtime subscription on site_status
    const channel = supabase
      .channel('site_status_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_status' }, () => {
        // Refetch all sites on any change
        supabase.from('site_status').select('*').order('domain').then(({ data }) => {
          if (data) setSites(data as SiteStatus[]);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const overallHealth = activeAlerts.some(a => a.severity === 'error')
    ? 'red'
    : activeAlerts.some(a => a.severity === 'warning')
      ? 'yellow'
      : sites.some(s => s.status === 'down')
        ? 'red'
        : sites.some(s => s.status === 'degraded')
          ? 'yellow'
          : 'green';

  const healthColor = { green: 'text-primary', yellow: 'text-warning', red: 'text-destructive' }[overallHealth];

  return (
    <div className="space-y-6">
      {/* Overall Status Banner */}
      <Card className={`border-l-4 ${overallHealth === 'green' ? 'border-l-primary' : overallHealth === 'yellow' ? 'border-l-warning' : 'border-l-destructive'}`}>
        <CardContent className="py-4 flex items-center gap-4">
          <Radio className={`w-6 h-6 ${healthColor} ${overallHealth === 'green' ? 'animate-pulse' : ''}`} />
          <div>
            <h2 className="text-sm font-display font-semibold text-foreground">Coordination Health</h2>
            <p className={`text-xs italic ${healthColor}`}>
              {riaMessages.health[overallHealth as keyof typeof riaMessages.health]}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Site Uptime Cards */}
        {sites.map(s => (
          <Card key={s.id} className="hover:border-primary/30 transition-colors">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot status={s.status} />
                  <CardTitle className="text-sm font-mono">{s.domain}</CardTitle>
                </div>
                <Globe className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold uppercase tracking-wider ${s.status === 'up' ? 'text-primary' : s.status === 'degraded' ? 'text-warning' : 'text-destructive'}`}>
                  {s.status}
                </span>
                <TimeAgo timestamp={s.last_checked} />
              </div>
              {s.ssl_expiry && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  SSL expires {new Date(s.ssl_expiry).toLocaleDateString()}
                </div>
              )}
              {s.last_error && (
                <p className="text-xs text-warning bg-warning/10 rounded px-2 py-1 truncate">{s.last_error}</p>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Pipeline Status Cards */}
        {pipelines.map(p => (
          <Card key={p.id} className="hover:border-primary/30 transition-colors">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot status={p.stuck_count && p.stuck_count > 0 ? 'degraded' : 'up'} />
                  <CardTitle className="text-sm">{p.track}</CardTitle>
                </div>
                <GitBranch className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{p.contact_count ?? 0} contacts</span>
                <TimeAgo timestamp={p.last_updated} />
              </div>
              {p.stuck_count != null && p.stuck_count > 0 && (
                <p className="text-xs text-warning flex items-center gap-1 bg-warning/10 rounded px-2 py-1">
                  <AlertTriangle className="w-3 h-3" /> {p.stuck_count} stuck in pipeline
                </p>
              )}
              <p className="text-xs text-muted-foreground">{p.account_name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* n8n Workflows placeholder */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <CardTitle className="text-xs font-display tracking-wider uppercase text-primary">n8n Workflows</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground italic">Workflow monitoring coming soon. n8n will push execution status here.</p>
        </CardContent>
      </Card>

      {/* Alert Feed */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-display tracking-wider uppercase text-primary">Alert Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map(a => (
                <div key={a.id} className={`flex items-start gap-3 text-sm p-2 rounded-lg ${a.severity === 'error' ? 'bg-destructive/10' : a.severity === 'warning' ? 'bg-warning/10' : 'bg-muted/30'} ${a.acknowledged ? 'opacity-50' : ''}`}>
                  <SeverityIcon severity={a.severity} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">{a.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{a.alert_type}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(a.created_at || '').toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {sites.length === 0 && pipelines.length === 0 && alerts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Radio className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground italic">No health data yet. n8n will start pushing status here once workflows are active.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
