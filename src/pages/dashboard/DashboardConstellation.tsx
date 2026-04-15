import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Dot = ({ on }: { on: boolean }) => (
  <span className={`inline-block w-2.5 h-2.5 rounded-full ${on ? 'bg-primary shadow-[0_0_6px_hsl(142,52%,42%)]' : 'bg-destructive/60'}`} />
);

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-lg border border-border bg-card p-5">
    <h2 className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-4">{title}</h2>
    {children}
  </section>
);

interface KillSwitches { scanner: boolean; responder: boolean; auto_post: boolean }
interface TierCounts { 1: number; 2: number; 3: number }
interface DoorCount { door: string; count: number }
interface SubredditRow { subreddit: string; volume_cap: number; voice: string }

export default function DashboardConstellation() {
  const [switches, setSwitches] = useState<KillSwitches>({ scanner: false, responder: false, auto_post: false });
  const [tiers, setTiers] = useState<TierCounts>({ 1: 0, 2: 0, 3: 0 });
  const [doors, setDoors] = useState<DoorCount[]>([]);
  const [subs, setSubs] = useState<SubredditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: configs } = await supabase
        .from('operator_config')
        .select('key, value')
        .in('key', ['scanner_enabled', 'responder_enabled', 'auto_post_enabled']);
      if (configs) {
        const m: Record<string, boolean> = {};
        configs.forEach((r) => { m[r.key] = !!(r.value as any)?.enabled; });
        setSwitches({
          scanner: m['scanner_enabled'] ?? false,
          responder: m['responder_enabled'] ?? false,
          auto_post: m['auto_post_enabled'] ?? false,
        });
      }

      const { data: drafts } = await supabase.from('response_drafts').select('classifier_tier');
      if (drafts) {
        const tc: TierCounts = { 1: 0, 2: 0, 3: 0 };
        drafts.forEach((d) => { const t = d.classifier_tier as 1 | 2 | 3; if (tc[t] !== undefined) tc[t]++; });
        setTiers(tc);
      }

      const { data: doorRows } = await supabase.from('response_drafts').select('target_door');
      if (doorRows) {
        const dm: Record<string, number> = {};
        doorRows.forEach((d) => { const k = d.target_door || 'unknown'; dm[k] = (dm[k] || 0) + 1; });
        setDoors(Object.entries(dm).map(([door, count]) => ({ door, count })).sort((a, b) => b.count - a.count));
      }

      const { data: apc } = await supabase.from('auto_post_config').select('subreddit, config');
      if (apc) {
        setSubs(
          apc.filter((r) => r.subreddit).map((r) => ({
            subreddit: r.subreddit!,
            volume_cap: (r.config as any)?.volume_cap_per_day ?? 0,
            voice: (r.config as any)?.voice_profile ?? '—',
          }))
        );
      }

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
      </div>
    );
  }

  const maxDoor = Math.max(1, ...doors.map((d) => d.count));

  return (
    <div className="p-6 md:p-8 pb-16">
      <div className="mb-6">
        <h1 className="text-xl font-display font-bold text-foreground tracking-tight">Constellation Map</h1>
        <p className="text-xs text-muted-foreground font-mono mt-1">Read-only system state · live counts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Panel title="Kill Switches">
            <div className="space-y-3">
              {(['scanner', 'responder', 'auto_post'] as const).map((k) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-sm font-mono text-foreground">{k}</span>
                  <div className="flex items-center gap-2">
                    <Dot on={switches[k]} />
                    <span className="text-xs text-muted-foreground">{switches[k] ? 'ON' : 'OFF'}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Drafts by Tier">
            <div className="space-y-3">
              {([1, 2, 3] as const).map((t) => (
                <div key={t} className="flex items-center justify-between">
                  <span className="text-sm font-mono text-foreground">Tier {t}</span>
                  <span className="text-sm font-mono text-primary tabular-nums">{tiers[t]}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Drafts by Door">
            {doors.length === 0 ? (
              <p className="text-xs text-muted-foreground">No drafts yet</p>
            ) : (
              <div className="space-y-2">
                {doors.map((d) => (
                  <div key={d.door}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-foreground">{d.door}</span>
                      <span className="text-xs font-mono text-muted-foreground tabular-nums">{d.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${(d.count / maxDoor) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Auto-Post Config">
            {subs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No subreddit configs</p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  <span>Subreddit</span>
                  <span className="text-center">Cap/day</span>
                  <span className="text-right">Voice</span>
                </div>
                {subs.map((s) => (
                  <div key={s.subreddit} className="grid grid-cols-3 text-xs font-mono text-foreground">
                    <span className="truncate">{s.subreddit}</span>
                    <span className="text-center tabular-nums">{s.volume_cap}</span>
                    <span className="text-right text-muted-foreground">{s.voice}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <aside className="hidden lg:flex flex-col gap-4">
          <div className="rounded-lg border border-dashed border-border/50 p-5 flex-1 flex items-center justify-center">
            <p className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest text-center">
              T2 Review Queue<br />— reserved —
            </p>
          </div>
          <div className="rounded-lg border border-dashed border-border/50 p-5 flex-1 flex items-center justify-center">
            <p className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest text-center">
              Shadow Log<br />— reserved —
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
