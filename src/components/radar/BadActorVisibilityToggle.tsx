import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  isArchitect: boolean;
}

/**
 * Architect-only control for whether operators see the bad-actor / immune-system
 * pattern substrate in their own room. Default OFF — operators see routing outcomes
 * only (greenlight / hold / decline), not the underlying pattern observations.
 *
 * Layer: orchestration. Reads/writes operator_config.bad_actor_scans_visible_to_operators.
 */
export function BadActorVisibilityToggle({ isArchitect }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any)
        .from('operator_config')
        .select('value')
        .eq('key', 'bad_actor_scans_visible_to_operators')
        .single();
      if (!error && data?.value) {
        setEnabled(Boolean(data.value.enabled));
      }
      setLoading(false);
    })();
  }, []);

  if (!isArchitect) return null;

  async function handleToggle(next: boolean) {
    setSaving(true);
    const { error } = await (supabase as any)
      .from('operator_config')
      .update({
        value: {
          enabled: next,
          description:
            'When enabled, operators see bad-actor pattern observations on contact cards in their own room. When disabled (default), only architects see the immune-system substrate; operators see only routing outcomes.',
          updated_at: new Date().toISOString(),
        },
      })
      .eq('key', 'bad_actor_scans_visible_to_operators');

    setSaving(false);
    if (error) {
      toast.error('Could not update visibility', { description: error.message });
      return;
    }
    setEnabled(next);
    toast.success(
      next
        ? 'Operators will now see bad-actor pattern substrate in their rooms'
        : 'Bad-actor substrate is now architect-only',
    );
  }

  if (loading) return null;

  return (
    <div className="rounded-sm border border-border/60 bg-card/40 p-4 space-y-3">
      <div className="flex items-start gap-3">
        {enabled ? (
          <ShieldAlert className="h-4 w-4 mt-0.5 text-amber-400 flex-shrink-0" />
        ) : (
          <Shield className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <Label
              htmlFor="bad-actor-visibility"
              className="text-xs font-display tracking-wider uppercase cursor-pointer"
            >
              Bad-Actor Scan Visibility
            </Label>
            <Switch
              id="bad-actor-visibility"
              checked={enabled}
              disabled={saving}
              onCheckedChange={handleToggle}
            />
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {enabled
              ? 'Operators see pattern observations on contact cards with a "why this flagged" explainer.'
              : 'Architect-only. Operators see routing outcomes (greenlight / hold / decline) without the underlying immune-system substrate.'}
          </p>
        </div>
      </div>
    </div>
  );
}
