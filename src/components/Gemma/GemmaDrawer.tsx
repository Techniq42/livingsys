import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';
import {
  Bot, X, Send, Loader2, ThumbsUp, ThumbsDown, AlertTriangle, Sparkles,
  MessageCircle, Coins, Repeat, Settings as SettingsIcon,
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
  role: 'user' | 'assistant';
  content: string;
  decision_id?: string | null;
  ts: number;
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
  if (pathname.includes('/dashboard')) return 'hearth';
  return 'unknown';
};

export function GemmaDrawer({ userId, userRole }: { userId: string; userRole: string }) {
  const [open, setOpen] = useState(false);
  const [modes, setModes] = useState<GemmaMode[]>([]);
  const [activeMode, setActiveMode] = useState<string>('free_chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pendingSource, setPendingSource] = useState('');
  const [showSourceField, setShowSourceField] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const room = ROOM_FROM_PATH(location.pathname);

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // Show source field when mode is repurpose
  useEffect(() => {
    setShowSourceField(activeMode === 'repurpose_post');
  }, [activeMode]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);

    const userMsg: Message = { role: 'user', content: text, ts: Date.now() };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');

    try {
      const { data, error } = await supabase.functions.invoke('gemma-switchboard', {
        body: {
          mode_slug: activeMode,
          context: {
            room,
            lens: room === 'radar' ? 'fls' : undefined,
            pasted_source: pendingSource || undefined,
          },
          messages: nextHistory.map(({ role, content }) => ({ role, content })),
        },
      });
      if (error) throw error;
      const assistantMsg: Message = {
        role: 'assistant',
        content: (data as any)?.text ?? 'No response.',
        decision_id: (data as any)?.decision_id ?? null,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
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

  function clearConversation() {
    setMessages([]);
    setPendingSource('');
  }

  if (!userId) return null;

  const currentMode = modes.find((m) => m.slug === activeMode);

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:brightness-110 transition-all flex items-center justify-center cursor-pointer glow-green"
          aria-label="Open Gemma drawer"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {open && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] max-w-full border-l border-border bg-background shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-xs font-display tracking-wider uppercase text-primary">Gemma</span>
              <span className="text-[10px] text-muted-foreground/60 font-display">
                · {room}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {userRole === 'architect' && (
                <a
                  href="/dashboard/switchboard"
                  className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                  title="Open Switchboard cockpit"
                >
                  <SettingsIcon className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={clearConversation}
                className="text-muted-foreground hover:text-foreground p-1 transition-colors text-[10px] font-display tracking-wider uppercase"
                title="Clear conversation"
              >
                Clear
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode chips */}
          <div className="px-4 py-3 border-b border-border bg-card/50">
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
            {currentMode?.tagline && (
              <p className="text-[11px] text-muted-foreground italic font-body mt-2">{currentMode.tagline}</p>
            )}
          </div>

          {/* Pasted source (for repurpose mode) */}
          {showSourceField && (
            <div className="px-4 py-2 border-b border-border bg-muted/20">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-display block mb-1">
                Paste source post (LinkedIn, etc.)
              </label>
              <textarea
                value={pendingSource}
                onChange={(e) => setPendingSource(e.target.value)}
                placeholder="Paste the original post here…"
                className="w-full text-xs bg-background border border-border rounded p-2 font-body resize-none h-20 focus:outline-none focus:border-primary"
              />
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    <div className="flex items-center gap-1 pt-1">
                      <FeedbackBtn icon={<ThumbsUp className="w-3 h-3" />} label="useful" onClick={() => sendFeedback(i, 'thumbs_up')} />
                      <FeedbackBtn icon={<ThumbsDown className="w-3 h-3" />} label="off" onClick={() => sendFeedback(i, 'thumbs_down')} />
                      <FeedbackBtn icon={<AlertTriangle className="w-3 h-3" />} label="wrong mode" onClick={() => sendFeedback(i, 'wrong_category')} />
                      <FeedbackBtn icon={<Sparkles className="w-3 h-3" />} label="use this" onClick={() => sendFeedback(i, 'use_this')} />
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

          {/* Composer */}
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
