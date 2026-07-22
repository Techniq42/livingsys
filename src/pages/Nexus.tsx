// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthPage } from '@/components/Auth/AuthPage';
import { CodexFloatingWidget } from '@/components/ArchitectDashboard/CodexFloatingWidget';
import { ReduceMotionProvider } from '@/hooks/use-reduce-motion';
import { Shield, Wrench, Link2, ExternalLink, LogOut } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import '@/styles/skins.css';

type Lane = { id: string; slug: string; label: string; skin_token: string; status: string; sort_order: number };
type Mode = { id: string; slug: string; label: string; status: string; sort_order: number };
type Skill = { id: string; slug: string; name: string; category: string; description: string | null; always_loaded: boolean; sort_order: number };
type Redirect = { id: string; slug: string; destination_url: string; topic_slug: string | null; audience_frames: Record<string, { copy?: string; cta_label?: string; cta_url?: string }>; click_count: number; conversion_count: number };
type Thread = {
  id: string;
  post_title: string;
  snippet: string | null;
  subreddit: string | null;
  post_url: string;
  status: string;
  created_at: string;
};
type Draft = {
  id: string;
  thread_id: string | null;
  draft_body: string;
  status: string;
  selected_redirect_id: string | null;
  selected_frame_key: string | null;
};

function NexusInner({ user, role }: { user: User; role: string }) {
  const navigate = useNavigate();
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [modes, setModes] = useState<Mode[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const [activeLane, setActiveLane] = useState<string>(() => localStorage.getItem('nexus.activeLane') || 'fire_defense');
  const [activeMode, setActiveMode] = useState<string>('outreach');
  const [activeTopic] = useState<string>('fire_defense');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [skinOverride, setSkinOverride] = useState<string | null>(() => localStorage.getItem('nexus.skinOverride'));

  useEffect(() => { localStorage.setItem('nexus.activeLane', activeLane); }, [activeLane]);
  useEffect(() => {
    if (skinOverride) localStorage.setItem('nexus.skinOverride', skinOverride);
    else localStorage.removeItem('nexus.skinOverride');
  }, [skinOverride]);

  useEffect(() => {
    (async () => {
      const [lanesRes, modesRes, skillsRes, redirectsRes] = await Promise.all([
        (supabase as any).from('nexus_lanes').select('*').order('sort_order'),
        (supabase as any).from('nexus_modes').select('*').order('sort_order'),
        (supabase as any).from('skills').select('*').eq('is_active', true).order('sort_order'),
        (supabase as any).from('redirect_targets').select('*').eq('is_active', true).order('conversion_count', { ascending: false }),
      ]);
      if (lanesRes.data) setLanes(lanesRes.data);
      if (modesRes.data) setModes(modesRes.data);
      if (skillsRes.data) setSkills(skillsRes.data);
      if (redirectsRes.data) setRedirects(redirectsRes.data);
    })();
  }, []);

  useEffect(() => {
    const lane = lanes.find((l) => l.slug === activeLane);
    if (!lane || lane.status !== 'live' || activeMode !== 'outreach') {
      setThreads([]);
      setDrafts([]);
      setSelectedThreadId(null);
      return;
    }
    (async () => {
      // Topic-style lanes (e.g. fire_defense) filter by substrate_topic in match_reason.
      // Venue-style lanes (reddit/bluesky/telegram) filter by source_platform.
      const isTopic = lane.slug === activeTopic;
      let query = (supabase as any).from('community_threads').select('*');
      if (isTopic) {
        query = query.eq('match_reason->>substrate_topic', activeTopic);
      } else {
        query = query.eq('source_platform', lane.slug);
      }
      const { data: t } = await query.order('created_at', { ascending: false }).limit(40);
      setThreads(t || []);
      const { data: d } = await (supabase as any)
        .from('response_drafts')
        .select('id,thread_id,draft_body,status,selected_redirect_id,selected_frame_key')
        .order('created_at', { ascending: false })
        .limit(60);
      setDrafts(d || []);
    })();
  }, [activeLane, activeMode, activeTopic, lanes]);

  const currentLane = lanes.find((l) => l.slug === activeLane);
  const skin = skinOverride || currentLane?.skin_token || 'reddit';
  const SKIN_OPTIONS: Array<{ token: string; label: string }> = [
    { token: 'reddit', label: 'Reddit' },
    { token: 'telegram', label: 'Telegram' },
    { token: 'bluesky', label: 'Bluesky' },
  ];

  const guardrails = skills.filter((s) => s.always_loaded);
  const optionalSkills = skills.filter((s) => !s.always_loaded);

  const draftByThread = useMemo(() => {
    const map: Record<string, Draft> = {};
    drafts.forEach((d) => {
      if (d.thread_id && !map[d.thread_id]) map[d.thread_id] = d;
    });
    return map;
  }, [drafts]);

  const selectedThread = threads.find((t) => t.id === selectedThreadId) || null;
  const selectedDraft = selectedThread ? draftByThread[selectedThread.id] : null;
  const selectedRedirect = selectedDraft?.selected_redirect_id
    ? redirects.find((r) => r.id === selectedDraft.selected_redirect_id) || null
    : null;
  const selectedFrame = selectedRedirect && selectedDraft?.selected_frame_key
    ? selectedRedirect.audience_frames?.[selectedDraft.selected_frame_key] || null
    : null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/architect-login');
  };

  return (
    <div data-skin={skin} className="h-screen flex flex-col bg-background text-foreground" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Top: brand + mode switcher + identity */}
      <header className="border-b border-border px-6 py-3 flex items-center gap-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            Nexus
          </p>
          <p className="text-sm" style={{ fontFamily: 'var(--font-display)' }}>
            {currentLane?.label || 'Reddit'} · {modes.find((m) => m.slug === activeMode)?.label || 'Outreach'} · Fire Defense
          </p>
        </div>
        <nav className="flex items-center gap-1 ml-4 overflow-x-auto">
          {modes.map((m) => {
            const live = m.status === 'live';
            const active = m.slug === activeMode;
            return (
              <button
                key={m.slug}
                disabled={!live}
                onClick={() => live && setActiveMode(m.slug)}
                className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded-[var(--radius)] border transition-colors ${
                  active
                    ? 'bg-primary/15 border-primary/40 text-primary'
                    : live
                    ? 'border-border text-muted-foreground hover:text-foreground'
                    : 'border-border/40 text-muted-foreground/40 cursor-not-allowed'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {m.label}
                {!live && <span className="ml-1 opacity-60">·stub</span>}
              </button>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          {/* Skin switcher — venue register override */}
          <div className="hidden md:flex items-center gap-1 pr-3 border-r border-border">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mr-1">Skin</span>
            {SKIN_OPTIONS.map((opt) => {
              const active = skin === opt.token;
              return (
                <button
                  key={opt.token}
                  onClick={() => setSkinOverride(opt.token === currentLane?.skin_token ? null : opt.token)}
                  className={`px-2 py-0.5 text-[10px] uppercase tracking-wider rounded border transition-colors ${
                    active
                      ? 'bg-primary/15 border-primary/40 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {opt.label}
                </button>
              );
            })}
            {skinOverride && (
              <button
                onClick={() => setSkinOverride(null)}
                className="text-[10px] text-muted-foreground hover:text-foreground ml-1"
                title="Reset to lane default"
              >
                ×
              </button>
            )}
          </div>
          <span className="hidden md:inline">{user.email}</span>
          <span className="px-2 py-0.5 rounded border border-coral/40 text-coral text-[10px] uppercase tracking-wider">{role}</span>
          <button
            onClick={() => navigate('/dashboard')}
            className="hover:text-foreground inline-flex items-center gap-1 px-2 py-0.5 border border-border rounded text-[10px] uppercase tracking-wider"
            title="Back to The Hearth"
          >
            ← Hearth
          </button>
          <button onClick={handleSignOut} className="hover:text-foreground inline-flex items-center gap-1">
            <LogOut className="w-3 h-3" /> Sign out
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: lanes */}
        <aside className="w-56 border-r border-border bg-card overflow-y-auto">
          <div className="px-4 py-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            Lanes
          </div>
          <div className="px-2 space-y-1">
            {lanes.map((l) => {
              const live = l.status === 'live';
              const active = l.slug === activeLane;
              return (
                <button
                  key={l.slug}
                  disabled={!live}
                  onClick={() => live && setActiveLane(l.slug)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-[var(--radius)] transition-colors flex items-center justify-between ${
                    active
                      ? 'bg-accent text-primary'
                      : live
                      ? 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      : 'text-muted-foreground/40 cursor-not-allowed'
                  }`}
                >
                  <span style={{ fontFamily: 'var(--font-display)' }}>{l.label}</span>
                  {!live && <span className="text-[9px] uppercase opacity-60">stub</span>}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center: workspace */}
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          {currentLane?.status === 'live' && activeMode === 'outreach' ? (
            <>
              <div className="text-xs text-muted-foreground">
                {threads.length} thread{threads.length === 1 ? '' : 's'} · {Object.keys(draftByThread).length} draft{Object.keys(draftByThread).length === 1 ? '' : 's'}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="space-y-2">
                  {threads.length === 0 && (
                    <p className="text-sm text-muted-foreground p-4 border border-dashed border-border rounded-[var(--radius)]">
                      No threads yet. The Radar pipeline will surface fire-defense candidates here as n8n captures them.
                    </p>
                  )}
                  {threads.map((t) => {
                    const draft = draftByThread[t.id];
                    const active = t.id === selectedThreadId;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedThreadId(t.id)}
                        className={`w-full text-left p-3 rounded-[var(--radius)] border transition-colors ${
                          active ? 'border-primary bg-accent' : 'border-border bg-card hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            r/{t.subreddit || '—'} · {t.status}
                          </span>
                          {draft && <span className="text-[10px] uppercase text-primary">draft</span>}
                        </div>
                        <p className="text-sm line-clamp-2" style={{ fontFamily: 'var(--font-display)' }}>{t.post_title}</p>
                        {t.snippet && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.snippet}</p>}
                      </button>
                    );
                  })}
                </div>
                <div>
                  {selectedThread ? (
                    <div className="p-4 border border-border rounded-[var(--radius)] bg-card space-y-3 sticky top-0">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Selected thread</p>
                        <p className="text-sm" style={{ fontFamily: 'var(--font-display)' }}>{selectedThread.post_title}</p>
                        <a href={selectedThread.post_url} target="_blank" rel="noreferrer" className="text-[11px] text-primary inline-flex items-center gap-1 mt-1">
                          open on reddit <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {selectedDraft ? (
                        <>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Draft body</p>
                            <p className="text-xs whitespace-pre-wrap text-foreground/90 max-h-48 overflow-y-auto">{selectedDraft.draft_body}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Selected redirect</p>
                            {selectedRedirect ? (
                              <div className="text-xs space-y-1">
                                <p className="text-foreground/90">{selectedRedirect.slug} · frame: <span className="text-primary">{selectedDraft.selected_frame_key || 'default'}</span></p>
                                {selectedFrame?.copy && <p className="text-muted-foreground italic">"{selectedFrame.copy}"</p>}
                                <a href={selectedFrame?.cta_url || selectedRedirect.destination_url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1">
                                  {selectedFrame?.cta_label || 'open destination'} <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">No redirect attached. n8n will pick one on next draft pass, or attach manually.</p>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No draft yet for this thread.</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground p-4 border border-dashed border-border rounded-[var(--radius)]">
                      Select a thread on the left.
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 border border-dashed border-border rounded-[var(--radius)] text-sm text-muted-foreground">
              <p className="mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                {currentLane?.label} · {modes.find((m) => m.slug === activeMode)?.label}
              </p>
              <p>This lane/mode pair is stubbed. The skin is live so you can see the visual register; the workspace wiring lands in a later slice.</p>
            </div>
          )}
        </main>

        {/* Right: action panel */}
        <aside className="w-72 border-l border-border bg-card overflow-y-auto p-4 space-y-5">
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-3.5 h-3.5 text-primary" />
              <h3 className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                Skills rack
              </h3>
            </div>
            <div className="space-y-1">
              {optionalSkills.map((s) => (
                <div key={s.id} className="p-2 rounded-[var(--radius)] border border-border bg-background/40">
                  <p className="text-xs" style={{ fontFamily: 'var(--font-display)' }}>{s.name}</p>
                  {s.description && <p className="text-[10px] text-muted-foreground mt-0.5">{s.description}</p>}
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-3.5 h-3.5 text-coral" />
              <h3 className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                Guardrails · always on
              </h3>
            </div>
            <div className="space-y-1">
              {guardrails.map((g) => (
                <div key={g.id} className="p-2 rounded-[var(--radius)] border border-coral/30 bg-coral/5">
                  <p className="text-xs text-coral" style={{ fontFamily: 'var(--font-display)' }}>{g.name}</p>
                  {g.description && <p className="text-[10px] text-muted-foreground mt-0.5">{g.description}</p>}
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground/70 italic mt-2">
                Service-dog layer. Loaded into every prompt. Not toggleable.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-3.5 h-3.5 text-primary" />
              <h3 className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                Redirect candidates
              </h3>
            </div>
            <div className="space-y-1">
              {redirects.length === 0 && <p className="text-[10px] text-muted-foreground">No redirects configured.</p>}
              {redirects.map((r) => (
                <div key={r.id} className="p-2 rounded-[var(--radius)] border border-border bg-background/40">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs truncate" style={{ fontFamily: 'var(--font-display)' }}>/{r.slug}</p>
                    <span className="text-[10px] text-muted-foreground">{r.click_count} clicks · {r.conversion_count} conv</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{r.destination_url}</p>
                  <p className="text-[10px] text-primary mt-0.5">{Object.keys(r.audience_frames || {}).length} frame{Object.keys(r.audience_frames || {}).length === 1 ? '' : 's'}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <CodexFloatingWidget />
    </div>
  );
}

export default function Nexus() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>('practitioner');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const priority = ['administrator', 'architect', 'practitioner'];
    const pickRole = (rows: Array<{ role: string }> | null) => {
      const roles = (rows ?? []).map((r) => r.role);
      return priority.find((p) => roles.includes(p)) ?? roles[0] ?? null;
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        supabase.from('user_roles').select('role').eq('user_id', session.user.id)
          .then(({ data }) => { const r = pickRole(data as any); if (r) setRole(r); });
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        supabase.from('user_roles').select('role').eq('user_id', session.user.id)
          .then(({ data }) => { const r = pickRole(data as any); if (r) setRole(r); });
      }
    });
    return () => subscription.unsubscribe();
  }, []);


  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><span className="w-3 h-3 rounded-full bg-primary animate-pulse-dot" /></div>;
  if (!user) return <AuthPage />;
  return <ReduceMotionProvider><NexusInner user={user} role={role} /></ReduceMotionProvider>;
}
