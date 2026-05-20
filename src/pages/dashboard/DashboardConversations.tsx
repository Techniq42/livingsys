import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, ExternalLink, Sparkles, Send, Compass } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

type Conversation = {
  id: string;
  channel: string;
  counterpart_handle: string | null;
  counterpart_display_name: string | null;
  canon_slug: string | null;
  status: string;
  route_slug: string | null;
  external_thread_url: string | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  message_count: number;
  metadata: any;
  notes: string | null;
};

type Message = {
  id: string;
  conversation_id: string;
  direction: string;
  author_handle: string | null;
  body: string;
  external_message_url: string | null;
  created_at: string;
};

type Route = {
  slug: string;
  label: string;
  description: string | null;
  handoff_notes: string | null;
};

const STATUSES: Conversation['status'][] = ['open', 'awaiting_reply', 'routed', 'parked', 'closed'];

export default function DashboardConversations() {
  const { userRole } = useOutletContext<{ user: User; userRole: string }>();
  const isArchitect = userRole === 'architect' || userRole === 'administrator';
  const { toast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [draft, setDraft] = useState('');
  const [draftRationale, setDraftRationale] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    loadMessages(selectedId);
    const channel = supabase
      .channel(`conv_${selectedId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'outreach_messages', filter: `conversation_id=eq.${selectedId}` }, () => loadMessages(selectedId))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedId]);

  async function refresh() {
    const [{ data: convs }, { data: rts }] = await Promise.all([
      (supabase as any).from('outreach_conversations').select('*').order('last_inbound_at', { ascending: false, nullsFirst: false }),
      (supabase as any).from('conversation_routes').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    ]);
    setConversations((convs ?? []) as Conversation[]);
    setRoutes((rts ?? []) as Route[]);
  }

  async function loadMessages(id: string) {
    const { data } = await (supabase as any).from('outreach_messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true });
    setMessages((data ?? []) as Message[]);
  }

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return conversations;
    return conversations.filter(c => c.status === statusFilter);
  }, [conversations, statusFilter]);

  const selected = conversations.find(c => c.id === selectedId) ?? null;

  async function updateConversation(patch: Partial<Conversation>) {
    if (!selected) return;
    const { error } = await (supabase as any).from('outreach_conversations').update(patch).eq('id', selected.id);
    if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); return; }
    setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, ...patch } : c));
  }

  async function generateDraft() {
    if (!selected) return;
    setDrafting(true);
    setDraftRationale(null);
    try {
      const { data, error } = await (supabase.functions as any).invoke('conversation-draft', {
        body: { conversation_id: selected.id, route_slug: selected.route_slug },
      });
      if (error) throw error;
      if (data?.draft) {
        setDraft(data.draft);
        setDraftRationale(data.rationale ?? null);
        if (data.suggested_route && !selected.route_slug) {
          toast({ title: 'Gemma suggests a route', description: data.suggested_route });
        }
      } else {
        toast({ title: 'No draft returned', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Draft failed', description: e.message ?? String(e), variant: 'destructive' });
    } finally {
      setDrafting(false);
    }
  }

  async function sendOutbound() {
    if (!selected || !draft.trim()) return;
    setSending(true);
    try {
      // Log the outbound message locally; actual posting handled by n8n in a follow-up sprint.
      const { data, error } = await (supabase.functions as any).invoke('conversation-ingest', {
        body: {
          channel: selected.channel,
          direction: 'outbound',
          body: draft,
          counterpart_handle: selected.counterpart_handle,
          external_thread_url: selected.external_thread_url,
          target_id: undefined,
          canon_slug: selected.canon_slug,
        },
      });
      if (error) throw error;
      setDraft('');
      setDraftRationale(null);
      await loadMessages(selected.id);
      await refresh();
      toast({ title: 'Logged outbound', description: 'Hand off to n8n / manual post when ready.' });
    } catch (e: any) {
      toast({ title: 'Log failed', description: e.message ?? String(e), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Conversations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Threads from canon outreach. Where the signal flare becomes a discussion that routes somewhere useful.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', ...STATUSES].map(s => (
          <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setStatusFilter(s)}>
            {s} {s !== 'all' ? `(${conversations.filter(c => c.status === s).length})` : `(${conversations.length})`}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        {/* Conversation list */}
        <div className="border border-border rounded-lg bg-card divide-y divide-border max-h-[70vh] overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground text-center">No conversations.</div>
          )}
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full text-left p-3 hover:bg-accent/40 transition ${selectedId === c.id ? 'bg-accent/50' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{c.channel}</span>
                <span className="text-[10px] text-muted-foreground">{c.message_count} msgs</span>
              </div>
              <div className="text-sm font-display text-foreground truncate mt-1">{c.counterpart_handle ?? c.counterpart_display_name ?? '(unknown)'}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">{c.status}</span>
                {c.route_slug && <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/40 text-primary">{c.route_slug}</span>}
                {c.metadata?.route_hint && !c.route_slug && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-coral/40 text-coral flex items-center gap-1"><Compass className="h-3 w-3" />hint: {c.metadata.route_hint}</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Thread + composer */}
        <div className="border border-border rounded-lg bg-card p-4 min-h-[70vh] flex flex-col">
          {!selected && (
            <div className="text-sm text-muted-foreground text-center my-auto">Select a conversation to view the thread.</div>
          )}
          {selected && (
            <>
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
                <div>
                  <div className="text-sm font-display text-foreground">{selected.counterpart_handle ?? '(unknown)'}</div>
                  <div className="text-xs text-muted-foreground">{selected.channel} · canon: {selected.canon_slug ?? '—'}</div>
                </div>
                <div className="flex items-center gap-2">
                  {selected.external_thread_url && (
                    <a href={selected.external_thread_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1">
                      thread <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Status + Route */}
              {isArchitect && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <select
                    value={selected.status}
                    onChange={(e) => updateConversation({ status: e.target.value })}
                    className="text-xs bg-background border border-border rounded px-2 py-1"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select
                    value={selected.route_slug ?? ''}
                    onChange={(e) => updateConversation({ route_slug: e.target.value || null, routed_at: e.target.value ? new Date().toISOString() : null, status: e.target.value ? 'routed' : selected.status } as any)}
                    className="text-xs bg-background border border-border rounded px-2 py-1"
                  >
                    <option value="">— Route —</option>
                    {routes.map(r => <option key={r.slug} value={r.slug}>{r.label}</option>)}
                  </select>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
                {messages.length === 0 && <div className="text-xs text-muted-foreground">No messages yet.</div>}
                {messages.map(m => (
                  <div key={m.id} className={`p-3 rounded-lg text-sm ${m.direction === 'inbound' ? 'bg-muted/40 border border-border' : 'bg-primary/10 border border-primary/30 ml-8'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.direction} · {m.author_handle ?? '—'}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
                    </div>
                    <div className="whitespace-pre-wrap text-foreground">{m.body}</div>
                  </div>
                ))}
              </div>

              {/* Composer */}
              {isArchitect && (
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Draft next reply</span>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={generateDraft} disabled={drafting}>
                      <Sparkles className="h-3 w-3 mr-1" />
                      {drafting ? 'Drafting…' : 'Gemma draft'}
                    </Button>
                  </div>
                  <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} placeholder="Write or generate a reply…" className="text-sm" />
                  {draftRationale && <p className="text-[10px] text-muted-foreground italic">Rationale: {draftRationale}</p>}
                  <div className="flex justify-end">
                    <Button size="sm" onClick={sendOutbound} disabled={sending || !draft.trim()}>
                      <Send className="h-3 w-3 mr-1" /> Log outbound
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Logging records the message in-app. n8n / manual posting handles the actual send.</p>
                </div>
              )}

              {/* Notes */}
              {isArchitect && (
                <div className="mt-3 pt-3 border-t border-border">
                  <label className="text-xs text-muted-foreground">Internal notes</label>
                  <Textarea
                    value={selected.notes ?? ''}
                    onChange={(e) => setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, notes: e.target.value } : c))}
                    onBlur={(e) => updateConversation({ notes: e.target.value })}
                    rows={2}
                    className="text-xs mt-1"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
