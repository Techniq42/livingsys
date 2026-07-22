// @ts-nocheck
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Target, Radar, FileText, ExternalLink, Check, X, Sparkles } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

type OutreachTarget = {
  id: string;
  canon_slug: string | null;
  cohort: string | null;
  channel: string;
  target_url: string | null;
  target_handle: string | null;
  target_name: string | null;
  snippet: string | null;
  signal_score: number;
  status: string;
  discovered_at: string;
};

type OutreachDraft = {
  id: string;
  target_id: string;
  draft_kind: string;
  body: string;
  rationale: string | null;
  canon_slug: string | null;
  status: string;
  created_at: string;
};

type FunderTarget = {
  id: string;
  person_name: string | null;
  org_name: string | null;
  title: string | null;
  org_kind: string | null;
  thesis_match: any;
  canon_slugs_matched: string[];
  geo: string | null;
  brief_markdown: string | null;
  socials: any;
  status: string;
};

export default function DashboardOutreach() {
  const { userRole } = useOutletContext<{ user: User; userRole: string }>();
  const isArchitect = userRole === 'architect' || userRole === 'administrator';
  const { toast } = useToast();
  const [tab, setTab] = useState<'targets' | 'drafts' | 'funders'>('drafts');
  const [targets, setTargets] = useState<OutreachTarget[]>([]);
  const [drafts, setDrafts] = useState<OutreachDraft[]>([]);
  const [funders, setFunders] = useState<FunderTarget[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    const [tRes, dRes, fRes] = await Promise.all([
      (supabase as any).from('outreach_targets').select('*').order('signal_score', { ascending: false }).limit(100),
      (supabase as any).from('outreach_drafts').select('*').order('created_at', { ascending: false }).limit(50),
      (supabase as any).from('funder_targets').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    setTargets(tRes.data || []);
    setDrafts(dRes.data || []);
    setFunders(fRes.data || []);
  }

  async function setDraftStatus(id: string, status: string) {
    const { error } = await (supabase as any).from('outreach_drafts').update({ status }).eq('id', id);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      return;
    }
    refresh();
  }

  async function runScoutEdges(slug: string) {
    setBusy(`blast-${slug}`);
    const { data, error } = await (supabase as any).functions.invoke('canon-blast', {
      body: { canon_slug: slug, generate_drafts: false, limit_per_stem: 5 },
    });
    setBusy(null);
    if (error) { toast({ title: 'Scout failed', description: error.message, variant: 'destructive' }); return; }
    const surfaced = data?.targets_surfaced ?? 0;
    toast({
      title: surfaced > 0 ? 'Edge scout complete' : 'Edge scout — no matches',
      description: surfaced > 0
        ? `${surfaced} targets surfaced. Confirm in Surfaced targets tab to draft.`
        : `Run id: ${data?.run_id ?? '—'}`,
    });
    refresh();
  }

  async function runScout(slug: string) {
    setBusy(`scout-${slug}`);
    const { data, error } = await (supabase as any).functions.invoke('funder-scout', {
      body: { canon_slug: slug, limit: 25, generate_briefs: true },
    });
    setBusy(null);
    if (error) { toast({ title: 'Scout failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Funder scout complete', description: `${data?.funders_surfaced ?? 0} funders, ${data?.briefs_generated ?? 0} briefs` });
    refresh();
  }

  async function draftForTarget(targetId: string, canonSlug?: string) {
    setBusy(`draft-${targetId}`);
    const { data, error } = await (supabase as any).functions.invoke('outreach-draft-target', {
      body: { target_id: targetId, canon_slug: canonSlug },
    });
    setBusy(null);
    if (error) { toast({ title: 'Draft failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Draft ready', description: 'Review in Drafts tab.' });
    setTab('drafts');
    refresh();
  }

  async function runDailySweep() {
    setBusy('daily-sweep');
    const { data, error } = await (supabase as any).functions.invoke('outreach-daily-sweep', { body: {} });
    setBusy(null);
    if (error) { toast({ title: 'Sweep failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Daily sweep complete', description: `Scanned ${data?.canon_pages ?? 0} canon pages.` });
    refresh();
  }

  if (!isArchitect) {
    return <div className="p-8 text-sm text-muted-foreground">Architect access required.</div>;
  }

  return (
    <div className="p-6 md:p-8 pb-16 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">Outreach</h1>
        </div>
        <p className="text-sm text-muted-foreground italic font-body max-w-3xl">
          Needle-in-haystack scouting on the edges (Bluesky, Reddit) plus quiet funder intelligence (Apollo).
          Surface people who already think like you, then approve drafts before anything goes out.
        </p>
      </div>

      {/* Run actions */}
      <div className="mb-8 border border-border bg-card rounded-sm p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-display uppercase tracking-wider">Sweep workflow</h2>
          </div>
          <Button size="sm" variant="default" disabled={busy === 'daily-sweep'} onClick={runDailySweep}>
            {busy === 'daily-sweep' ? 'Sweeping…' : 'Run daily sweep now'}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground/70 italic mb-3">
          Daily sweep also runs automatically every morning. It surfaces targets + funders across every active canon page,
          but does NOT draft replies. Confirm targets below, then click Draft per row.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {['watershed-thesis','below-the-radar','fire-defense-guide','regenerative-gem'].map(slug => (
            <div key={slug} className="border border-border/60 rounded-sm p-3">
              <p className="text-xs font-mono text-muted-foreground mb-2">{slug}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={busy === `blast-${slug}`}
                  onClick={() => runScoutEdges(slug)} className="flex-1">
                  <Radar className="h-3 w-3 mr-1.5" />
                  {busy === `blast-${slug}` ? 'Scouting…' : 'Scout edges'}
                </Button>
                <Button size="sm" variant="outline" disabled={busy === `scout-${slug}`}
                  onClick={() => runScout(slug)} className="flex-1">
                  <Target className="h-3 w-3 mr-1.5" />
                  {busy === `scout-${slug}` ? 'Running…' : 'Scout funders'}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground/70 italic">
          Scout edges = Firecrawl sweep across Bluesky + Reddit, surfaces targets only.
          Scout funders = Apollo search for funders/family offices with per-target briefs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border">
        {[
          { id: 'drafts', label: `Drafts (${drafts.filter(d => d.status === 'pending').length})` },
          { id: 'targets', label: `Surfaced targets (${targets.length})` },
          { id: 'funders', label: `Funders (${funders.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 text-sm font-display border-b-2 transition-colors ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'drafts' && (
        <div className="space-y-3">
          {drafts.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No drafts yet. Run a Blast.</p>}
          {drafts.map(d => {
            const target = targets.find(t => t.id === d.target_id);
            return (
              <div key={d.id} className="border border-border bg-card rounded-sm p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="text-xs text-muted-foreground space-x-2">
                    <span className="font-mono uppercase">{d.draft_kind}</span>
                    <span>→</span>
                    <span className="font-mono">{target?.channel ?? '?'}</span>
                    {target?.target_handle && <span>· {target.target_handle}</span>}
                    {d.canon_slug && <span>· canon: {d.canon_slug}</span>}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      d.status === 'pending' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' :
                      d.status === 'approved' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' :
                      d.status === 'rejected' ? 'bg-destructive/10 text-destructive border border-destructive/30' :
                      'bg-muted text-muted-foreground border border-border'
                    }`}>{d.status}</span>
                  </div>
                  {target?.target_url && (
                    <a href={target.target_url} target="_blank" rel="noopener" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                      source <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                {target?.snippet && (
                  <p className="text-xs text-muted-foreground italic mb-2 border-l-2 border-border pl-3">"{target.snippet}"</p>
                )}
                <p className="text-sm text-foreground whitespace-pre-wrap mb-2">{d.body}</p>
                {d.rationale && (
                  <p className="text-[11px] text-muted-foreground/70 italic mb-3">
                    <span className="uppercase tracking-wider text-[10px] mr-1">Why:</span>{d.rationale}
                  </p>
                )}
                {d.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setDraftStatus(d.id, 'approved')}>
                      <Check className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDraftStatus(d.id, 'rejected')}>
                      <X className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'targets' && (
        <div className="space-y-2">
          {targets.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No targets surfaced yet.</p>}
          {targets.map(t => (
            <div key={t.id} className="border border-border bg-card rounded-sm p-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t.channel}</span>
                  {t.cohort && <span className="text-[10px] font-mono text-muted-foreground">{t.cohort}</span>}
                  <span className="text-[10px] font-mono text-primary">score {t.signal_score}</span>
                  {t.status && <span className="text-[10px] font-mono text-muted-foreground/70">· {t.status}</span>}
                </div>
                <p className="text-sm text-foreground truncate">{t.target_name || t.target_handle || '(unnamed)'}</p>
                {t.snippet && <p className="text-xs text-muted-foreground truncate">{t.snippet}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {t.target_url && (
                  <a href={t.target_url} target="_blank" rel="noopener" className="text-xs text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <Button size="sm" variant="outline" disabled={busy === `draft-${t.id}`}
                  onClick={() => draftForTarget(t.id, t.canon_slug)}>
                  {busy === `draft-${t.id}` ? 'Drafting…' : (t.status === 'drafted' ? 'Re-draft' : 'Draft')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'funders' && (
        <div className="space-y-4">
          {funders.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No funders scouted yet. Run a Scout.</p>}
          {funders.map(f => (
            <div key={f.id} className="border border-border bg-card rounded-sm p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-display font-bold text-foreground">{f.person_name}</h3>
                  <p className="text-xs text-muted-foreground">{f.title} · {f.org_name} <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted">{f.org_kind}</span></p>
                  {f.geo && <p className="text-[11px] text-muted-foreground/70">{f.geo}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {f.socials?.linkedin && <a href={f.socials.linkedin} target="_blank" rel="noopener" className="text-xs text-primary hover:underline">LI</a>}
                  {f.socials?.personal_site && <a href={f.socials.personal_site} target="_blank" rel="noopener" className="text-xs text-primary hover:underline">site</a>}
                </div>
              </div>
              {f.thesis_match?.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {f.thesis_match.tags.map((t: string) => (
                    <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-primary/30 bg-primary/5 text-primary">{t}</span>
                  ))}
                  <span className="text-[10px] font-mono text-muted-foreground ml-2">fit {f.thesis_match.score}/10</span>
                </div>
              )}
              {f.brief_markdown && (
                <details className="mt-3">
                  <summary className="text-xs uppercase tracking-wider font-display text-primary cursor-pointer flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Brief
                  </summary>
                  <div className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap border-l-2 border-primary/40 pl-3 bg-muted/20 py-2 rounded-r">
                    {f.brief_markdown}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
