import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Compass, Search, Check, X, Eye, ExternalLink, Sparkles, MessageSquare } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

type Discovery = {
  id: string;
  seed_topic: string;
  subreddit: string;
  url: string | null;
  description: string | null;
  relevance_score: number;
  relevance_reason: any;
  status: 'discovered' | 'approved' | 'rejected' | 'watching';
  notes: string | null;
  created_at: string;
};

type ChatMsg = { role: 'user' | 'assistant'; content: string };

const STATUSES: Discovery['status'][] = ['discovered', 'approved', 'watching', 'rejected'];

export default function DashboardDiscovery() {
  const { userRole } = useOutletContext<{ user: User; userRole: string }>();
  const isArchitect = userRole === 'architect' || userRole === 'administrator';
  const { toast } = useToast();

  const [seed, setSeed] = useState('');
  const [running, setRunning] = useState(false);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('discovered');
  const [topicFilter, setTopicFilter] = useState<string>('all');

  const [chatOpen, setChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    const { data } = await (supabase as any)
      .from('subreddit_discoveries')
      .select('*')
      .order('relevance_score', { ascending: false })
      .order('created_at', { ascending: false });
    setDiscoveries((data ?? []) as Discovery[]);
  }

  async function runDiscovery() {
    if (!seed.trim()) return;
    setRunning(true);
    try {
      const { data, error } = await (supabase.functions as any).invoke('subreddit-discovery', {
        body: { seed_topic: seed.trim(), limit: 20 },
      });
      if (error) throw error;
      toast({
        title: `Found ${data?.subreddits_found ?? 0} subs`,
        description: `${data?.upserted ?? 0} written to the queue.`,
      });
      await refresh();
    } catch (e: any) {
      toast({ title: 'Discovery failed', description: e.message ?? String(e), variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  }

  async function setStatus(id: string, status: Discovery['status']) {
    const patch: any = { status };
    if (status === 'approved') patch.approved_at = new Date().toISOString();
    const { error } = await (supabase as any).from('subreddit_discoveries').update(patch).eq('id', id);
    if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); return; }
    setDiscoveries(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  }

  async function saveNotes(id: string, notes: string) {
    const { error } = await (supabase as any).from('subreddit_discoveries').update({ notes }).eq('id', id);
    if (!error) setDiscoveries(prev => prev.map(d => d.id === id ? { ...d, notes } : d));
  }

  const topics = Array.from(new Set(discoveries.map(d => d.seed_topic)));
  const filtered = discoveries.filter(d =>
    (statusFilter === 'all' || d.status === statusFilter) &&
    (topicFilter === 'all' || d.seed_topic === topicFilter)
  );

  async function sendChat() {
    if (!chatInput.trim() || chatBusy) return;
    const nextHistory: ChatMsg[] = [...chatHistory, { role: 'user', content: chatInput.trim() }];
    setChatHistory(nextHistory);
    setChatInput('');
    setChatBusy(true);
    try {
      // Snapshot the current filtered view so Gemma can reason about what's in front of you
      const snapshot = filtered.slice(0, 30).map(d => ({
        sub: d.subreddit,
        score: d.relevance_score,
        status: d.status,
        seed: d.seed_topic,
        desc: d.description?.slice(0, 200) ?? null,
        notes: d.notes ?? null,
      }));
      const contextNote = `CURRENT DISCOVERY VIEW (filter=${statusFilter}, topic=${topicFilter}):\n${JSON.stringify(snapshot, null, 2)}\n\nHelp the operator decide which subs to approve/park, suggest stems for promising subs, and flag noise.`;
      const { data, error } = await (supabase.functions as any).invoke('gemma-switchboard', {
        body: {
          mode_slug: 'free_chat',
          context: { room: 'discovery', selection: contextNote },
          messages: nextHistory,
        },
      });
      if (error) throw error;
      const reply = data?.text ?? '(no reply)';
      setChatHistory(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e: any) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${e.message ?? String(e)}` }]);
    } finally {
      setChatBusy(false);
    }
  }

  if (!isArchitect) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Subreddit Discovery is an Architect-only room.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display text-foreground flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" /> Subreddit Discovery
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lateral-hop into adjacent communities. Seed a topic, approve the ones worth visiting, talk it through with Gemma.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setChatOpen(o => !o)}>
          <MessageSquare className="h-4 w-4 mr-1" /> {chatOpen ? 'Hide Gemma' : 'Open Gemma'}
        </Button>
      </div>

      {/* Seed bar */}
      <div className="border border-border rounded-lg bg-card p-4 mb-4">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Seed topic</label>
        <div className="flex gap-2 mt-2">
          <Input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="e.g. mycelium diapers, watershed governance, regenerative tourism, humus oil…"
            onKeyDown={(e) => { if (e.key === 'Enter') runDiscovery(); }}
          />
          <Button onClick={runDiscovery} disabled={running || !seed.trim()}>
            <Search className="h-4 w-4 mr-1" /> {running ? 'Searching…' : 'Discover'}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Two Firecrawl passes: a broad reddit sweep + a community-scoped sweep. Results scored by hit-count.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        {/* Discovery list */}
        <div>
          <div className="flex gap-2 mb-3 flex-wrap items-center">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Status:</span>
            {(['all', ...STATUSES] as const).map(s => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? 'default' : 'outline'}
                className="h-7 text-xs"
                onClick={() => setStatusFilter(s)}
              >
                {s} {s !== 'all' ? `(${discoveries.filter(d => d.status === s).length})` : `(${discoveries.length})`}
              </Button>
            ))}
            {topics.length > 0 && (
              <>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground ml-3">Topic:</span>
                <select
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                  className="text-xs bg-background border border-border rounded px-2 py-1"
                >
                  <option value="all">all</option>
                  {topics.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </>
            )}
          </div>

          {filtered.length === 0 && (
            <div className="border border-border rounded-lg bg-card p-8 text-center">
              <Compass className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No discoveries match this filter.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Run a seed topic above to start.</p>
            </div>
          )}

          <div className="grid gap-3">
            {filtered.map(d => (
              <div key={d.id} className="border border-border rounded-lg bg-card p-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-display text-foreground">{d.subreddit}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/40 text-primary">
                        score {d.relevance_score}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        d.status === 'approved' ? 'border-emerald-500/40 text-emerald-400' :
                        d.status === 'rejected' ? 'border-destructive/40 text-destructive' :
                        d.status === 'watching' ? 'border-coral/40 text-coral' :
                        'border-border text-muted-foreground'
                      }`}>{d.status}</span>
                      <span className="text-[10px] text-muted-foreground">seed: {d.seed_topic}</span>
                    </div>
                    {d.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.description}</p>
                    )}
                  </div>
                  {d.url && (
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 shrink-0">
                      visit <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <Textarea
                  defaultValue={d.notes ?? ''}
                  placeholder="Why this matters / who's there / what to say…"
                  rows={1}
                  onBlur={(e) => { if (e.target.value !== (d.notes ?? '')) saveNotes(d.id, e.target.value); }}
                  className="text-xs mb-2"
                />

                <div className="flex gap-1 flex-wrap">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStatus(d.id, 'approved')} disabled={d.status === 'approved'}>
                    <Check className="h-3 w-3 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStatus(d.id, 'watching')} disabled={d.status === 'watching'}>
                    <Eye className="h-3 w-3 mr-1" /> Watch
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStatus(d.id, 'rejected')} disabled={d.status === 'rejected'}>
                    <X className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gemma chat panel */}
        {chatOpen && (
          <div className="border border-border rounded-lg bg-card p-3 flex flex-col h-[calc(100vh-260px)] sticky top-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-display text-foreground">Gemma · Discovery</span>
              <span className="ml-auto text-[10px] text-muted-foreground">sees current filter</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {chatHistory.length === 0 && (
                <div className="text-xs text-muted-foreground italic p-2">
                  Ask Gemma to triage the list, suggest stems for a sub, or compare two discoveries. She sees what you see.
                </div>
              )}
              {chatHistory.map((m, i) => (
                <div key={i} className={`p-2 rounded text-xs ${m.role === 'user' ? 'bg-primary/10 border border-primary/30 ml-4' : 'bg-muted/40 border border-border mr-4'}`}>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{m.role}</div>
                  <div className="whitespace-pre-wrap text-foreground">{m.content}</div>
                </div>
              ))}
              {chatBusy && <div className="text-xs text-muted-foreground italic">Gemma thinking…</div>}
            </div>
            <div className="pt-2 border-t border-border mt-2">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="e.g. Which of these are worth a canon blast first? Which 3 should I park?"
                rows={2}
                className="text-xs"
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendChat(); }}
              />
              <div className="flex justify-end mt-2">
                <Button size="sm" onClick={sendChat} disabled={chatBusy || !chatInput.trim()}>Send</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
