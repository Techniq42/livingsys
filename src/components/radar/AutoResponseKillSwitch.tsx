import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface KillSwitchState {
  auto_post_enabled: boolean;
  responder_enabled: boolean;
  scanner_enabled: boolean;
}

interface AutoResponseKillSwitchProps {
  isArchitect: boolean;
}

const switchMeta: { key: keyof KillSwitchState; label: string; description: string }[] = [
  { key: 'scanner_enabled', label: 'Scanner', description: 'n8n thread scanner' },
  { key: 'responder_enabled', label: 'Responder', description: 'AI draft generator' },
  { key: 'auto_post_enabled', label: 'Auto-Post', description: 'Tier 1 auto-posting' },
];

export function AutoResponseKillSwitch({ isArchitect }: AutoResponseKillSwitchProps) {
  const [state, setState] = useState<KillSwitchState>({
    auto_post_enabled: false,
    responder_enabled: false,
    scanner_enabled: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchState();
  }, []);

  async function fetchState() {
    const { data } = await (supabase as any)
      .from('operator_config')
      .select('key, value')
      .in('key', ['auto_post_enabled', 'responder_enabled', 'scanner_enabled']);
    if (data) {
      const newState = { ...state };
      for (const row of data as { key: string; value: boolean }[]) {
        if (row.key in newState) {
          (newState as any)[row.key] = row.value === true;
        }
      }
      setState(newState);
    }
    setLoading(false);
  }

  async function handleToggle(key: keyof KillSwitchState) {
    if (!isArchitect) return;
    const newValue = !state[key];
    setState(prev => ({ ...prev, [key]: newValue }));
    await (supabase as any)
      .from('operator_config')
      .update({ value: newValue })
      .eq('key', key);
  }

  if (loading) return null;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
            <ShieldOff className="h-3.5 w-3.5" />
            <span className="font-medium">Kill Switches</span>
          </div>
          {switchMeta.map(({ key, label, description }) => (
            <TooltipProvider key={key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={state[key]}
                      onCheckedChange={() => handleToggle(key)}
                      disabled={!isArchitect}
                      className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-destructive/40 transition-colors duration-300"
                    />
                    <span className={`text-xs font-medium transition-colors duration-300 ${state[key] ? 'text-primary' : 'text-destructive/70'}`}>
                      {label}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{description}</p>
                  {!isArchitect && <p className="text-[10px] text-muted-foreground">Architect role required to toggle</p>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
