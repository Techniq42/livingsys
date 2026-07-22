// @ts-nocheck
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Ear, MessageSquare, Sprout, Sunrise, Loader2, Sparkles, Flower2, Flame } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Mode = 'listen' | 'engage' | 'seed';

interface Lens {
  slug: string;
  label: string;
  tagline: string | null;
  skin_token: string;
  posture: string;
}

interface Briefing {
  id: string;
  mode: Mode;
  lens_slug: string;
  summary: string;
  highlights: Array<{ kind: string; text: string }>;
  recommended_action: string | null;
  confidence: number;
  created_at: string;
}

const MODE_META: Record<Mode, { label: string; icon: typeof Ear; tagline: Record<string, string> }> = {
  listen: {
    label: 'Listen',
    icon: Ear,
    tagline: {
      fls: 'What surfaced overnight on the radar',
      healing: 'What the community is doing this week',
    },
  },
  engage: {
    label: 'Engage',
    icon: MessageSquare,
    tagline: {
      fls: 'Drafts and threads waiting on your voice',
      healing: 'Conversations and amplification asks open right now',
    },
  },
  seed: {
    label: 'Seed',
    icon: Sprout,
    tagline: {
      fls: 'Where to plant new connections today',
      healing: 'Cross-promotion + street-team moves to fill rooms',
    },
  },
};

const LENS_ICON: Record<string, typeof Flame> = {
  fls: Flame,
  healing: Flower2,
};

export function HearthBriefingStrip() {
  const [lenses, setLenses] = useState<Lens[]>([]);
  const [lens, setLens] = useState<string>('fls');
  const [mode, setMode] = useState<Mode>('listen');
  const [briefings, setBriefings] = useState<Record<string, Briefing | null>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Load lenses
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from('lenses').select('*').eq('is_active', true).order('sort_order');
      setLenses((data ?? []) as Lens[]);
    })();
  }, []);

  // Fetch latest briefings for current lens, all modes
  async function fetchLatest() {
    setLoading(true);
    const out: Record<string, Briefing | null> = {};
    for (const m of ['listen', 'engage', 'seed'] as Mode[]) {
      const { data } = await (supabase as any)
        .from('daily_briefings')
        .select('*')
        .eq('mode', m)
        .eq('lens_slug', lens)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      out[`${lens}:${m}`] = (data as Briefing) ?? null;
    }
    setBriefings((prev) => ({ ...prev, ...out }));
    setLoading(false);
  }

  useEffect(() => { fetchLatest(); /* eslint-disable-next-line */ }, [lens]);

  async function generateBriefings() {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('gemma-brief', { body: { lens } });
      if (error) throw error;
      toast({ title: 'Briefings generated', description: `Gemma swept the ${lens} lens.` });
      await fetchLatest();
    } catch (err: any) {
      toast({ title: 'Briefing failed', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }

  const current = briefings[`${lens}:${mode}`];
  const meta = MODE_META[mode];
  const Icon = meta.icon;
  const currentLens = lenses.find((l) => l.slug === lens);
  const skin = currentLens?.skin_token ?? 'default';
  const tagline = meta.tagline[lens] ?? meta.tagline.fls;

  return (
    <section
      data-skin={skin}
      className="rounded-xl border border-border bg-card p-5 transition-colors"
    >
      {/* Lens selector */}
      {lenses.length > 1 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-display">Lens</span>
          {lenses.map((l) => {
            const LIcon = LENS_ICON[l.slug] ?? Sunrise;
            const active = lens === l.slug;
            return (
              <button
                key={l.slug}
                onClick={() => setLens(l.slug)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-display tracking-wider uppercase border transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-foreground/70 border-border hover:text-foreground hover:border-foreground/40'
                }`}
                title={l.tagline ?? l.label}
              >
                <LIcon className="h-3 w-3" />
                {l.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Sunrise className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-display font-semibold uppercase tracking-wider text-foreground">
            Overnight briefing
          </h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-display">
            Gemma · {currentLens?.label ?? lens} · {meta.label}
          </span>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={generateBriefings} disabled={generating}>
          {generating ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
          {generating ? 'Generating…' : 'Run briefing'}
        </Button>
      </div>

      {/* Mode battalion buttons */}
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
                  : 'bg-transparent text-foreground/70 border-border hover:text-foreground hover:border-foreground/40'
              }`}
            >
              <MIcon className="h-3 w-3" />
              {M.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <p className="text-xs text-muted-foreground italic font-body">{tagline}</p>

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
              <div className="mt-3 pt-3 border-t border-border">
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
            No briefing yet for <span className="text-foreground/70">{currentLens?.label ?? lens} · {meta.label}</span>. Hit "Run briefing" to have Gemma sweep this lens.
          </p>
        )}
      </div>
    </section>
  );
}
