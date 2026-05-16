import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Check, X, Plus } from 'lucide-react';

interface AutoPostConfig {
  tier1_auto_post: boolean;
  tier2_requires_review: boolean;
  tier3_always_block: boolean;
  max_posts_per_hour: number;
  max_posts_per_day: number;
  cooldown_minutes: number;
  min_relevance_score: number;
  require_keyword_match: boolean;
  disallowed_topics: string[];
  disallowed_patterns: string[];
}

const defaultConfig: AutoPostConfig = {
  tier1_auto_post: false,
  tier2_requires_review: true,
  tier3_always_block: true,
  max_posts_per_hour: 3,
  max_posts_per_day: 15,
  cooldown_minutes: 10,
  min_relevance_score: 6,
  require_keyword_match: true,
  disallowed_topics: [],
  disallowed_patterns: [],
};

interface AutoResponseConfigEditorProps {
  isArchitect: boolean;
}

export function AutoResponseConfigEditor({ isArchitect }: AutoResponseConfigEditorProps) {
  const [config, setConfig] = useState<AutoPostConfig>(defaultConfig);
  const [configId, setConfigId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [newTopic, setNewTopic] = useState('');
  const [newPattern, setNewPattern] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    const { data } = await (supabase as any)
      .from('auto_post_config')
      .select('*')
      .limit(1)
      .single();
    if (data) {
      setConfigId(data.id);
      setConfig({ ...defaultConfig, ...(data.config as AutoPostConfig) });
    }
    setLoading(false);
  }

  const handleSave = useCallback(async () => {
    if (!isArchitect || !configId) return;
    setSaveState('saving');
    await (supabase as any)
      .from('auto_post_config')
      .update({ config, updated_at: new Date().toISOString() })
      .eq('id', configId);
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 1500);
  }, [config, configId, isArchitect]);

  function updateNum(key: keyof AutoPostConfig, val: string) {
    const num = parseInt(val, 10);
    if (!isNaN(num)) setConfig(prev => ({ ...prev, [key]: num }));
  }

  function addChip(field: 'disallowed_topics' | 'disallowed_patterns', value: string, setter: (v: string) => void) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setConfig(prev => ({
      ...prev,
      [field]: [...prev[field], trimmed],
    }));
    setter('');
  }

  function removeChip(field: 'disallowed_topics' | 'disallowed_patterns', index: number) {
    setConfig(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  }

  if (loading) return null;

  const disabled = !isArchitect;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-display">Auto-Response Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tier rules — mutually exclusive policy */}
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground font-medium">Default Tier Policy (pick one)</Label>
          <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
            Sets the baseline for how Gemma handles a new draft. Per-thread overrides still apply.
          </p>
          <div className="space-y-2">
            {([
              ['tier1_auto_post', 'T1 — Auto-post without review', 'Trust Gemma. Use only when the room is well-calibrated.'],
              ['tier2_requires_review', 'T2 — Require manual review', 'Gemma drafts, you approve. Recommended default.'],
              ['tier3_always_block', 'T3 — Always block', 'Surface drafts only; never let anything post automatically.'],
            ] as [keyof AutoPostConfig, string, string][]).map(([key, label, hint]) => (
              <label key={key} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tier_policy"
                  checked={config[key] as boolean}
                  onChange={() => setConfig(prev => ({
                    ...prev,
                    tier1_auto_post: key === 'tier1_auto_post',
                    tier2_requires_review: key === 'tier2_requires_review',
                    tier3_always_block: key === 'tier3_always_block',
                  }))}
                  disabled={disabled}
                  className="mt-0.5 accent-primary"
                />
                <div>
                  <div className="text-xs">{label}</div>
                  <div className="text-[10px] text-muted-foreground">{hint}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Rate caps */}
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground font-medium">Rate Caps & Gates</Label>
          <div className="grid grid-cols-2 gap-3">
            {([
              ['max_posts_per_hour', 'Max / hour'],
              ['max_posts_per_day', 'Max / day'],
              ['cooldown_minutes', 'Cooldown (min)'],
              ['min_relevance_score', 'Min relevance'],
            ] as [keyof AutoPostConfig, string][]).map(([key, label]) => (
              <div key={key}>
                <Label className="text-[10px] text-muted-foreground">{label}</Label>
                <Input
                  type="number"
                  value={config[key] as number}
                  onChange={(e) => updateNum(key, e.target.value)}
                  disabled={disabled}
                  className="h-8 text-xs mt-1"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="require_keyword_match"
              checked={config.require_keyword_match}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, require_keyword_match: !!checked }))}
              disabled={disabled}
            />
            <Label htmlFor="require_keyword_match" className="text-xs">Require keyword match</Label>
          </div>
        </div>

        {/* Disallowed topics */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground font-medium">Disallowed Topics</Label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {config.disallowed_topics.map((t, i) => (
              <Badge key={i} variant="outline" className="text-[10px] px-2 py-0.5 gap-1">
                {t}
                {!disabled && (
                  <button onClick={() => removeChip('disallowed_topics', i)} className="hover:text-destructive">
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
          {!disabled && (
            <div className="flex gap-1.5">
              <Input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addChip('disallowed_topics', newTopic, setNewTopic)}
                placeholder="Add topic..."
                className="h-7 text-xs flex-1"
              />
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => addChip('disallowed_topics', newTopic, setNewTopic)}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Disallowed patterns */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground font-medium">Disallowed Patterns</Label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {config.disallowed_patterns.map((p, i) => (
              <Badge key={i} variant="outline" className="text-[10px] px-2 py-0.5 font-mono gap-1">
                {p}
                {!disabled && (
                  <button onClick={() => removeChip('disallowed_patterns', i)} className="hover:text-destructive">
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
          {!disabled && (
            <div className="flex gap-1.5">
              <Input
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addChip('disallowed_patterns', newPattern, setNewPattern)}
                placeholder="Add regex pattern..."
                className="h-7 text-xs flex-1 font-mono"
              />
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => addChip('disallowed_patterns', newPattern, setNewPattern)}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Save button */}
        {!disabled && (
          <Button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className="w-full h-9 text-xs transition-all duration-300"
            variant={saveState === 'saved' ? 'outline' : 'default'}
          >
            {saveState === 'saved' ? (
              <span className="flex items-center gap-1.5 text-primary animate-fade-in">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            ) : saveState === 'saving' ? (
              'Saving...'
            ) : (
              <span className="flex items-center gap-1.5">
                <Save className="h-3.5 w-3.5" /> Save Configuration
              </span>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
