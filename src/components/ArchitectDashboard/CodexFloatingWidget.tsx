import { useState, useEffect } from 'react';
import { Bot, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CodexChat } from '@/components/Dashboard/CodexChat';

export function CodexFloatingWidget() {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id);
    });
  }, []);

  if (!userId) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:brightness-110 transition-all flex items-center justify-center cursor-pointer glow-green"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[560px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-4rem)] border border-border bg-background rounded-sm shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
            <span className="text-xs font-display tracking-wider uppercase text-primary">Codex AI</span>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <CodexChat userId={userId} userRole="practitioner" />
          </div>
        </div>
      )}
    </>
  );
}
