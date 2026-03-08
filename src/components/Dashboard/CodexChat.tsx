import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { fireCodexQuery } from '@/lib/webhooks';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  isProtected?: boolean;
}

interface CodexChatProps {
  userId: string;
  userRole: string;
}

export function CodexChat({ userId, userRole }: CodexChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load existing conversation
  useEffect(() => {
    async function loadConversations() {
      const { data } = await supabase
        .from('codex_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (data?.length) {
        setMessages(data.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          sources: m.sources as string[] | undefined,
        })));
      }
    }
    loadConversations();
  }, [userId]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Save user message
    await supabase.from('codex_conversations').insert({
      user_id: userId,
      session_id: sessionId,
      role: 'user',
      content: userMessage.content,
    });

    // Call Codex webhook
    const lastMessages = messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fireCodexQuery({
      user_id: userId,
      role: userRole,
      session_id: sessionId,
      message: userMessage.content,
      conversation_history: lastMessages,
    });

    const isProtected = response.answer?.includes('[PROTECTED]');
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: isProtected
        ? 'This source document is protected. The Codex can summarize and cite but cannot reproduce full content.'
        : response.answer,
      sources: response.sources,
      isProtected,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    // Save assistant message
    await supabase.from('codex_conversations').insert({
      user_id: userId,
      session_id: sessionId,
      role: 'assistant',
      content: assistantMessage.content,
      sources: response.sources,
    });

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-bold font-display text-foreground">Codex Chat</h2>
        <p className="text-xs text-muted-foreground">
          Grounded in the Sovereign Patch Codex. Answers are cited. Sources are protected.
        </p>
      </div>

      {/* Security notice */}
      <div className="px-6 py-2 text-[10px] text-muted-foreground border-b border-border">
        This AI speaks only from curated documentation. It will not speculate beyond its source material. All queries are logged to your session.
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                The Codex is ready.<br />
                Ask anything about coordination infrastructure,<br />
                HumiSoil deployment, community ownership frameworks,<br />
                or the Edge Runner methodology.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-sm px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary/10 border border-primary/30 text-foreground'
                  : 'bg-card border border-border text-foreground'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-[10px] text-muted-foreground font-display tracking-wider uppercase mb-1">Sources</p>
                  {msg.sources.map((src, i) => (
                    <p key={i} className="text-xs text-primary font-mono">{src}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" />
                <span className="text-xs text-muted-foreground">Processing query</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-6 py-4">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the Codex..."
            rows={1}
            className="flex-1 bg-card border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="border border-primary text-primary px-4 rounded-sm hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-30 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
