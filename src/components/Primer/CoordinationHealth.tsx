import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Globe, GitBranch, Zap, AlertTriangle, Radio } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { riaMessages } from '@/config/primerConfig';

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
}

interface Alert {
  id: string;
  alert_type: string;
  message: string;
  severity: string;
  created_at: string;
}

export function CoordinationHealth() {
  const [open, setOpen] = useState(false);
  const [sites, setSites] = useState<SiteStatus[]>([]);
  const [pipelines, setPipelines] = useState<PipelineStatus[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from('site_status').select('*').order('domain'),
      supabase.from('pipeline_status').select('*').order('track'),
      supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(10),
    ]).then(([sitesRes, pipelinesRes, alertsRes]) => {
      setSites((sitesRes.data as SiteStatus[]) || []);
      setPipelines((pipelinesRes.data as PipelineStatus[]) || []);
      setAlerts((alertsRes.data as Alert[]) || []);
    });
  }, []);

  const overallHealth = alerts.some((a) => a.severity === 'error')
    ? 'red'
    : alerts.some((a) => a.severity === 'warning')
      ? 'yellow'
      : 'green';

  const healthColor = { green: 'text-primary', yellow: 'text-warning', red: 'text-destructive' }[overallHealth];
  const healthGlow = { green: 'glow-green', yellow: 'glow-gold', red: '' }[overallHealth];

  const siteStatusColor = (s: string) => {
    if (s === 'up') return 'bg-primary';
    if (s === 'degraded') return 'bg-warning';
    return 'bg-destructive';
  };

  const severityColor = (s: string) => {
    if (s === 'error') return 'text-destructive';
    if (s === 'warning') return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <section className="space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all cursor-pointer min-h-[44px] ${healthGlow}`}
      >
        <div className="flex items-center gap-3">
          <Radio className={`w-5 h-5 ${healthColor}`} />
          <div className="text-left">
            <h2 className="text-sm font-display font-semibold text-foreground">Coordination Health</h2>
            <p className={`text-xs italic ${healthColor}`}>
              {riaMessages.health[overallHealth as keyof typeof riaMessages.health]}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Sites */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-display tracking-wider uppercase text-primary">Sites</h3>
              </div>
              <div className="space-y-2">
                {sites.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${siteStatusColor(s.status)}`} />
                      <span className="text-foreground font-mono text-xs">{s.domain}</span>
                    </div>
                    {s.last_error && (
                      <span className="text-xs text-warning truncate max-w-[200px]">{s.last_error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pipelines */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 mb-3">
                <GitBranch className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-display tracking-wider uppercase text-primary">GHL Pipelines</h3>
              </div>
              <div className="space-y-2">
                {pipelines.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground text-xs">{p.track}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{p.contact_count} contacts</span>
                      {p.stuck_count > 0 && (
                        <span className="text-xs text-warning flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {p.stuck_count} stuck
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* n8n placeholder */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-display tracking-wider uppercase text-primary">n8n Workflows</h3>
              </div>
              <p className="text-xs text-muted-foreground italic">Workflow monitoring coming soon.</p>
            </div>

            {/* Alert feed */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <h3 className="text-xs font-display tracking-wider uppercase text-primary mb-3">Alert Feed</h3>
              <div className="space-y-2">
                {alerts.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-xs">
                    <span className={`mt-0.5 ${severityColor(a.severity)}`}>●</span>
                    <span className="text-foreground flex-1">{a.message}</span>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
