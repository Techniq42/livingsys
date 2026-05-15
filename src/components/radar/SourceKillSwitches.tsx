import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

type SourceSwitch = {
  source_platform: string;
  enabled: boolean;
  disabled_at: string | null;
  reason: string | null;
};

const SOURCE_LABELS: Record<string, string> = {
  reddit: 'Reddit',
  bluesky: 'Bluesky',
  discord: 'Discord',
  forum: 'Forums',
};

export function SourceKillSwitches({ isArchitect }: { isArchitect: boolean }) {
  const [switches, setSwitches] = useState<SourceSwitch[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('source_kill_switches')
        .select('*')
        .order('source_platform');
      if (data) setSwitches(data);
    })();
  }, []);

  async function toggle(platform: string, enabled: boolean) {
    setSwitches((prev) => prev.map((s) =>
      s.source_platform === platform ? { ...s, enabled, disabled_at: enabled ? null : new Date().toISOString() } : s,
    ));
    await (supabase as any)
      .from('source_kill_switches')
      .update({
        enabled,
        disabled_at: enabled ? null : new Date().toISOString(),
        reason: enabled ? null : 'Operator-disabled from Radar',
      })
      .eq('source_platform', platform);
  }

  if (!isArchitect) return null;

  return (
    <Card className="bg-card/40 border-border/50">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-display">
          Per-source kill switches
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {switches.map((s) => (
          <div key={s.source_platform} className="flex items-center justify-between gap-3 py-1">
            <div>
              <p className="text-xs font-display">{SOURCE_LABELS[s.source_platform] || s.source_platform}</p>
              {!s.enabled && s.disabled_at && (
                <p className="text-[10px] text-rose-300/70">disabled {new Date(s.disabled_at).toLocaleString()}</p>
              )}
            </div>
            <Switch checked={s.enabled} onCheckedChange={(v) => toggle(s.source_platform, v)} />
          </div>
        ))}
        {switches.length === 0 && <p className="text-xs text-muted-foreground">No source switches configured.</p>}
      </CardContent>
    </Card>
  );
}
