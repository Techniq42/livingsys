import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';
import {
  Bot, X, Send, Loader2, ThumbsUp, ThumbsDown, AlertTriangle, Sparkles,
  MessageCircle, Coins, Repeat, Settings as SettingsIcon,
  Plus, Brain, Pin, Trash2, ChevronLeft,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type IconName = 'MessageCircle' | 'Coins' | 'Repeat' | 'Sparkle';

interface GemmaMode {
  slug: string;
  label: string;
  icon: IconName | null;
  tagline: string | null;
  default_lens: string | null;
  sort_order: number;
}

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  decision_id?: string | null;
  ts: number;
}

interface Thread {
  id: string;
  room: string;
  mode_slug: string;
  title: string;
  summary: string | null;
  last_message_at: string;
}

interface Fact {
  id: string;
  fact: string;
  scope_room: string | null;
  pinned: boolean;
  confidence: number;
}

const ICONS: Record<string, typeof Bot> = {
  MessageCircle, Coins, Repeat, Sparkle: Sparkles, Default: Bot,
};

const ROOM_FROM_PATH = (pathname: string): string => {
  if (pathname.includes('/radar')) return 'radar';
  if (pathname.includes('/canon')) return 'canon';
  if (pathname.includes('/exchange')) return 'exchange';
  if (pathname.includes('/editing')) return 'editing';
  if (pathname.includes('/events')) return 'events';
  if (pathname.includes('/funnels')) return 'funnels';
  if (pathname.includes('/health')) return 'health';
  if (pathname.includes('/settings')) return 'settings';
  if (pathname.includes('/switchboard')) return 'switchboard';
  if (pathname.includes('/outreach')) return 'outreach';
  if (pathname.includes('/conversations')) return 'conversations';
  if (pathname.includes('/discovery')) return 'discovery';
  if (pathname.includes('/dashboard')) return 'hearth';
  return 'unknown';
};

export function GemmaDrawer({ userId, userRole }: { userId: string; userRole: string }) {
  const [open, setOpen] = useState(false);
  const [modes, setModes] = useState<GemmaMode[]>([]);
  const [activeMode, setActiveMode] = useState<string>('free_chat');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [input, setInput] = useState('');
  const [pendingSource, setPendingSource] = useState('');
  const [showSourceField, setShowSourceField] = useState(false);
  const [sending, setSending] = useState(false);
  const [view, setView] = useState<'threads' | 'chat' | 'memory'>('threads');
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const room = ROOM_FROM_PATH(location.pathname);

  // Load modes once
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('gemma_modes')
        .select('slug,label,icon,tagline,default_lens,sort_order')
        .eq('is_enabled', true)
        .order('sort_order');
      setModes((data ?? []) as GemmaMode[]);
    })();
  }, []);

  // Load threads for this room
  const loadThreads = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('gemma_threads')
      .select('id,room,mode_slug,title,summary,last_message_at')
      .eq('user_id', userId)
      .eq('room', room)
      .is('archived_at', null)
      .order('last_message_at', { ascending: false })
      .limit(50);
    setThreads((data ?? []) as Thread[]);
  }, [userId, room]);

  // Load facts (global + scoped to room)
  const loadFacts = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('gemma_facts')
      .select('id,fact,scope_room,pinned,confidence')
      .eq('user_id', userId)
      .is('retired_at', null)
      .or(`scope_room.is.null,scope_room.eq.${room}`)
      .order('pinned', { ascending: false })
      .order('confidence', { ascending: false })
      .limit(20);
    setFacts((data ?? []) as Fact[]);
  }, [userId, room]);

  useEffect(() => {
    if (!open || !userId) return;
    loadThreads();
    loadFacts();
  }, [open, userId, room, loadThreads, loadFacts]);

  // Load messages when active thread changes
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    (async () => {
      const { data } = await (supabase as any)
        .from('gemma_thread_messages')
        .select('id,role,content,decision_id,created_at')
        .eq('thread_id', activeThreadId)
        .order('created_at', { ascending: true });
      setMessages(
        ((data ?? []) as any[]).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          decision_id: m.decision_id,
          ts: new Date(m.created_at).getTime(),
        }))
      );
    })();
  }, [activeThreadId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  useEffect(() => {
    setShowSourceField(activeMode === 'repurpose_post');
  }, [activeMode]);

  async function newThread() {
    const { data, error } = await (supabase as any)
      .from('gemma_threads')
      .insert({ user_id: userId, room, mode_slug: activeMode, title: 'New thread' })
      .select()
      .single();
    if (error) {
      toast({ title: 'Could not start thread', description: error.message, variant: 'destructive' });
      return;
    }
    setThreads((prev) => [data as Thread, ...prev]);
    setActiveThreadId(data.id);
    setMessages([]);
    setView('chat');
  }

  function openThread(t: Thread) {
    setActiveThreadId(t.id);
    setActiveMode(t.mode_slug);
    setView('chat');
  }

  async function deleteThread(id: string) {
    if (!confirm('Delete this thread?')) return;
    await (supabase as any).from('gemma_threads').delete().eq('id', id);
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (activeThreadId === id) {
      setActiveThreadId(null);
      setMessages([]);
      setView('threads');
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);

    // Ensure thread exists
    let threadId = activeThreadId;
    if (!threadId) {
      const { data, error } = await (supabase as any)
        .from('gemma_threads')
        .insert({
          user_id: userId,
          room,
          mode_slug: activeMode,
          title: text.slice(0, 60),
        })
        .select()
        .single();
      if (error) {
        toast({ title: 'Could not start thread', description: error.message, variant: 'destructive' });
        setSending(false);
        return;
      }
      threadId = data.id;
      setActiveThreadId(threadId);
      setThreads((prev) => [data as Thread, ...prev]);
    }

    const userMsg: Message = { role: 'user', content: text, ts: Date.now() };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');

    // Persist user message
    await (supabase as any).from('gemma_thread_messages').insert({
      thread_id: threadId, user_id: userId, role: 'user', content: text,
    });

    try {
      const factStrings = facts.map((f) => f.fact);
      const { data, error } = await supabase.functions.invoke('gemma-switchboard', {
        body: {
          mode_slug: activeMode,
          context: {
            room,
            thread_id: threadId,
            lens: room === 'radar' ? 'fls' : undefined,
            pasted_source: pendingSource || undefined,
            facts: factStrings,
          },
          messages: nextHistory.map(({ role, content }) => ({ role, content })),
        },
      });
      if (error) throw error;
      const assistantText = (data as any)?.text ?? 'No response.';
      const decisionId = (data as any)?.decision_id ?? null;

      const assistantMsg: Message = {
        role: 'assistant', content: assistantText, decision_id: decisionId, ts: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Persist assistant message + bump thread
      await (supabase as any).from('gemma_thread_messages').insert({
        thread_id: threadId, user_id: userId, role: 'assistant',
        content: assistantText, decision_id: decisionId,
      });
      await (supabase as any).from('gemma_threads').update({
        last_message_at: new Date().toISOString(),
        title: messages.length === 0 ? text.slice(0, 60) : undefined,
      }).eq('id', threadId);
      loadThreads();
    } catch (err: any) {
      toast({ title: 'Gemma failed', description: err.message ?? 'Unknown error', variant: 'destructive' });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `_Error: ${err.message ?? 'unknown'}_`, ts: Date.now() },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function sendFeedback(msgIndex: number, signal: 'thumbs_up' | 'thumbs_down' | 'wrong_category' | 'use_this') {
    const msg = messages[msgIndex];
    if (!msg || msg.role !== 'assistant') return;
    try {
      await (supabase as any).from('gemma_feedback').insert({
        user_id: userId,
        decision_id: msg.decision_id ?? null,
        mode_slug: activeMode,
        message_excerpt: msg.content.slice(0, 280),
        signal,
      });
      toast({ title: 'Feedback logged', description: signal.replace('_', ' ') });
    } catch (err: any) {
      toast({ title: 'Feedback failed', description: err.message, variant: 'destructive' });
    }
  }

  async function rememberSelection(msgIndex: number) {
    const msg = messages[msgIndex];
    if (!msg) return;
    const fact = prompt('Save as durable fact for Gemma (kept across all future threads):', msg.content.slice(0, 200));
    if (!fact?.trim()) return;
    const scoped = confirm(`Scope to this room only (${room})?\nOK = ${room} only · Cancel = global`);
    const { error } = await (supabase as any).from('gemma_facts').insert({
      user_id: userId, fact: fact.trim(), scope_room: scoped ? room : null,
      source_thread_id: activeThreadId, confidence: 0.8, pinned: false,
    });
    if (error) {
      toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Banked', description: 'Gemma will carry this forward.' });
      loadFacts();
    }
  }

  async function togglePin(id: string, pinned: boolean) {
    await (supabase as any).from('gemma_facts').update({ pinned: !pinned }).eq('id', id);
    loadFacts();
  }

  async function deleteFact(id: string) {
    await (supabase as any).from('gemma_facts').update({ retired_at: new Date().toISOString() }).eq('id', id);
    loadFacts();
  }

  if (!userId) return null;
  const currentMode = modes.find((m) => m.slug === activeMode);

  return (
    <>
      {!open && (
        <button
          onClick={() => { setOpen(true); setView(activeThreadId ? 'chat' : 'threads'); }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:brightness-110 transition-all flex items-center justify-center cursor-pointer glow-green"
          aria-label="Open Gemma drawer"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {open && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[520px] max-w-full border-l border-border bg-background shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-2 min-w-0">
              {view === 'chat' && (
                <button onClick={() => setView('threads')} className="text-muted-foreground hover:text-foreground p-1" title="Back to threads">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <Bot className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-display tracking-wider uppercase text-primary">Gemma</span>
              <span className="text-[10px] text-muted-foreground/60 font-display truncate">
                · {room}{view === 'chat' && activeThreadId ? ` · ${threads.find(t => t.id === activeThreadId)?.title ?? ''}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setView(view === 'memory' ? 'threads' : 'memory')}
                className={`p-1 transition-colors ${view === 'memory' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                title="What Gemma Knows"
              >
                <Brain className="w-4 h-4" />
              </button>
              {userRole === 'architect' && (
                <a href="/dashboard/switchboard" className="text-muted-foreground hover:text-foreground p-1" title="Switchboard">
                  <SettingsIcon className="w-4 h-4" />
                </a>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* THREADS VIEW */}
          {view === 'threads' && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 border-b border-border">
                <button
                  onClick={newThread}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded px-3 py-2 text-xs font-display tracking-wider uppercase hover:brightness-110"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New thread in {room}
                </button>
              </div>
              <div className="px-2 py-1">
                {threads.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 italic text-center py-8 font-body">
                    No threads yet in <span className="text-foreground/70">{room}</span>.<br />Start one to begin.
                  </p>
                ) : (
                  threads.map((t) => (
                    <div key={t.id} className="group flex items-center gap-1 px-2 py-2 rounded hover:bg-muted/30 cursor-pointer">
                      <button onClick={() => openThread(t)} className="flex-1 text-left min-w-0">
                        <div className="text-sm font-body text-foreground/90 truncate">{t.title}</div>
                        <div className="text-[10px] text-muted-foreground/60 font-display uppercase tracking-wider">
                          {t.mode_slug} · {new Date(t.last_message_at).toLocaleDateString()}
                        </div>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteThread(t.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                        aria-label="Delete thread"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              {/* Facts peek */}
              {facts.length > 0 && (
                <div className="border-t border-border px-3 py-2">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-display mb-1">
                    <Brain className="w-3 h-3" />
                    What Gemma Knows ({facts.length})
                  </div>
                  <p className="text-[11px] text-muted-foreground/80 italic font-body">
                    {facts.slice(0, 3).map((f) => f.fact).join(' · ')}
                    {facts.length > 3 ? '…' : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MEMORY VIEW */}
          {view === 'memory' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div>
                <h3 className="text-xs font-display tracking-wider uppercase text-primary mb-1">What Gemma Knows</h3>
                <p className="text-[11px] text-muted-foreground/80 font-body italic">
                  Durable facts injected into every thread in this room. Pin the ones that must always be in context.
                </p>
              </div>
              {facts.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic font-body text-center py-8">
                  No facts yet. Use the 🧠 button on any Gemma reply to bank one.
                </p>
              ) : (
                facts.map((f) => (
                  <div key={f.id} className="border border-border rounded p-2 bg-card/40">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-body text-foreground/90 leading-relaxed">{f.fact}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => togglePin(f.id, f.pinned)} title="Pin" className={`p-1 ${f.pinned ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                          <Pin className="w-3 h-3" />
                        </button>
                        <button onClick={() => deleteFact(f.id)} title="Retire" className="p-1 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 font-display uppercase tracking-wider mt-1">
                      {f.scope_room ?? 'global'} · conf {Math.round(f.confidence * 100)}%
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* CHAT VIEW */}
          {view === 'chat' && (
            <>
              {/* Mode chips */}
              <div className="px-4 py-2 border-b border-border bg-card/50">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {modes.map((m) => {
                    const Icon = ICONS[m.icon ?? 'Default'] ?? Bot;
                    const active = m.slug === activeMode;
                    return (
                      <button
                        key={m.slug}
                        onClick={() => setActiveMode(m.slug)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-display tracking-wider uppercase border transition-all ${
                          active
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-transparent text-foreground/70 border-border hover:text-foreground hover:border-foreground/40'
                        }`}
                        title={m.tagline ?? m.label}
                      >
                        <Icon className="w-3 h-3" />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {showSourceField && (
                <div className="px-4 py-2 border-b border-border bg-muted/20">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-display block mb-1">
                    Paste source post
                  </label>
                  <textarea
                    value={pendingSource}
                    onChange={(e) => setPendingSource(e.target.value)}
                    placeholder="Paste the original post here…"
                    className="w-full text-xs bg-background border border-border rounded p-2 font-body resize-none h-20 focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {facts.length > 0 && messages.length === 0 && (
                  <div className="text-[10px] text-muted-foreground/60 font-display uppercase tracking-wider text-center">
                    Gemma is carrying {facts.length} fact{facts.length === 1 ? '' : 's'} into this thread.
                  </div>
                )}
                {messages.length === 0 && (
                  <p className="text-xs text-muted-foreground/60 font-body italic text-center mt-8">
                    {currentMode?.label ?? 'Gemma'} is ready. Say what you need.
                  </p>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
                    {m.role === 'user' ? (
                      <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2 text-sm font-body whitespace-pre-wrap">
                        {m.content}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-sm font-body text-foreground/90 leading-relaxed whitespace-pre-wrap">
                          {m.content}
                        </div>
                        <div className="flex items-center gap-1 pt-1 flex-wrap">
                          <FeedbackBtn icon={<ThumbsUp className="w-3 h-3" />} label="useful" onClick={() => sendFeedback(i, 'thumbs_up')} />
                          <FeedbackBtn icon={<ThumbsDown className="w-3 h-3" />} label="off" onClick={() => sendFeedback(i, 'thumbs_down')} />
                          <FeedbackBtn icon={<AlertTriangle className="w-3 h-3" />} label="wrong mode" onClick={() => sendFeedback(i, 'wrong_category')} />
                          <FeedbackBtn icon={<Sparkles className="w-3 h-3" />} label="use this" onClick={() => sendFeedback(i, 'use_this')} />
                          <FeedbackBtn icon={<Brain className="w-3 h-3" />} label="remember" onClick={() => rememberSelection(i)} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {sending && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Gemma is thinking…
                  </div>
                )}
              </div>

              <div className="border-t border-border p-3 bg-card">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={`Talk to Gemma in ${currentMode?.label ?? 'this mode'}…`}
                    rows={2}
                    className="flex-1 bg-background border border-border rounded p-2 text-sm font-body resize-none focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="bg-primary text-primary-foreground rounded p-2 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all h-10 w-10 flex items-center justify-center"
                    aria-label="Send"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function FeedbackBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-[10px] font-display tracking-wider uppercase text-muted-foreground/60 hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted/30"
    >
      {icon}
      {label}
    </button>
  );
}
