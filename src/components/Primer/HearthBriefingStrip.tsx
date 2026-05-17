import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Ear, MessageSquare, Sprout, Sunrise, Loader2, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Mode = 'listen' | 'engage' | 'seed';

interface Briefing {
  id: string;
  mode: Mode;
  summary: string;
  highlights: Array<{ kind: string; text: string }>;
  recommended_action: string | null;
  confidence: number;
  created_at: string;
}

const MODE_META: Record<Mode, { label: string; icon: typeof Ear; tagline: string; accent: string }> = {
  listen: {
    label: 'Listen',
    icon: Ear,
    tagline: 'What surfaced overnight on the radar',
    accent: 'border-emerald-500/30 bg-emerald-500/5',
  },
  engage: {
    label: 'Engage',
    icon: MessageSquare,
    tagline: 'Drafts and threads waiting on your voice',
    accent: 'border-amber-500/30 bg-amber-500/5',
  },
  seed: {
    label: 'Seed',
    icon: Sprout,
    tagline: 'Where to plant new connections today',
    accent: 'border-violet-500/30 bg-violet-500/5',
  },
};

export function HearthBriefingStrip() {
  const [mode, setMode] = useState<Mode>('listen');
  const [briefings, setBriefings] = useState<Record<Mode, Briefing | null>>({
    listen: null, engage: null, seed: null,
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function fetchLatest() {
    setLoading(true);
    const modes: Mode[] = ['listen', 'engage', 'seed'];
    const out: Record<Mode, Briefing | null> = { listen: null, engage: null, seed: null };
    for (const m of modes) {
      const { data } = await (supabase as any)
        .from('daily_briefings')
        .select('*')
        .eq('mode', m)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) out[m] = data as Briefing;
    }
    setBriefings(out);
    setLoading(false);
  }

  useEffect(() => { fetchLatest(); }, []);

  async function generateBriefings() {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('gemma-brief', { body: {} });
      if (error) throw error;
      toast({ title: 'Briefings generated', description: 'Gemma surfaced new patterns.' });
      await fetchLatest();
    } catch (err: any) {
      toast({ title: 'Briefing failed', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }

  const current = briefings[mode];
  const meta = MODE_META[mode];
  const Icon = meta.icon;

  return (
    <section className={`rounded-xl border ${meta.accent} p-5 transition-colors`}>
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Sunrise className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-display font-semibold uppercase tracking-wider text-foreground">
            Overnight briefing
          </h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-display">
            Gemma · {meta.label}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={generateBriefings}
          disabled={generating}
        >
          {generating ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
          {generating ? 'Generating…' : 'Run briefing'}
        </Button>
      </div>

      {/* Mode battalion buttons — Listen / Engage / Seed */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(Object.keys(MODE_META) as Mode[]).map((m) => {
          const M = MODE_META[m];
          const MIcon = M.icon;
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-display tracking-wider uppercase border transition-all ${
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent text-white/70 border-white/15 hover:text-white hover:border-white/30'
              }`}
            >
              <MIcon className="h-3 w-3" />
              {M.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <p className="text-xs text-muted-foreground italic font-body">{meta.tagline}</p>

        {loading ? (
          <p className="text-xs text-muted-foreground/60">Loading…</p>
        ) : current ? (
          <>
            <p className="text-sm text-foreground/90 font-body leading-relaxed">{current.summary}</p>

            {current.highlights?.length > 0 && (
              <ul className="space-y-1.5 mt-3">
                {current.highlights.map((h, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-display ${
                      h.kind === 'promising' ? 'bg-emerald-500/20 text-emerald-300' :
                      h.kind === 'petered' ? 'bg-zinc-500/20 text-zinc-400' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>{h.kind}</span>
                    <span className="flex-1">{h.text}</span>
                  </li>
                ))}
              </ul>
            )}

            {current.recommended_action && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-display mb-1">
                  Recommended next move
                </p>
                <p className="text-sm text-foreground font-body">{current.recommended_action}</p>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground/40 mt-2">
              {new Date(current.created_at).toLocaleString()} · confidence {Math.round(current.confidence * 100)}%
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground/60">
            No briefing yet. Hit "Run briefing" to have Gemma sweep the last 24 hours.
          </p>
        )}
      </div>
    </section>
  );
}
