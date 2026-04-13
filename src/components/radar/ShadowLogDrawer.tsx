import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Activity } from 'lucide-react';

interface ShadowLogEntry {
  id: string;
  thread_id: string | null;
  draft_body: string;
  classifier_tier: number;
  status: string;
  auto_posted: boolean;
  created_at: string;
  post_title: string | null;
  subreddit: string | null;
  log_category: string;
}

type LogFilter = 'all' | 'auto' | 'blocked' | 'pending';

const tierBadge: Record<number, string> = {
  1: 'border-primary/60 text-primary bg-primary/10',
  2: 'border-secondary/60 text-secondary bg-secondary/10',
  3: 'border-coral/60 text-coral bg-coral/10',
};

const categoryBadge: Record<string, string> = {
  auto: 'bg-primary/15 text-primary border-primary/30',
  blocked: 'bg-destructive/15 text-destructive border-destructive/30',
  pending: 'bg-warning/15 text-warning border-warning/30',
  manual: 'bg-secondary/15 text-secondary border-secondary/30',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ShadowLogDrawer() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ShadowLogEntry[]>([]);
  const [filter, setFilter] = useState<LogFilter>('all');

  useEffect(() => {
    fetchLog();
    const channel = supabase
      .channel('shadow_log_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'response_drafts' }, () => {
        fetchLog();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchLog() {
    const { data } = await (supabase as any)
      .from('shadow_log')
      .select('*')
      .limit(100);
    if (data) setEntries(data as ShadowLogEntry[]);
  }

  const filtered = filter === 'all' ? entries : entries.filter(e => e.log_category === filter);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ease-out ${
        open ? 'h-80' : 'h-10'
      }`}
      style={{ boxShadow: open ? '0 -8px 30px rgba(0,0,0,0.4)' : '0 -2px 10px rgba(0,0,0,0.2)' }}
    >
      {/* Handle bar */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full h-10 bg-card border-t border-border flex items-center justify-between px-4 hover:bg-accent/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Shadow Log</span>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
            {entries.length}
          </Badge>
        </div>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {/* Content */}
      {open && (
        <div className="bg-card h-[calc(100%-2.5rem)] overflow-hidden flex flex-col animate-fade-in">
          {/* Filter pills */}
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border/50">
            {(['all', 'auto', 'blocked', 'pending'] as LogFilter[]).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'default' : 'ghost'}
                className="h-6 text-[10px] px-2"
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>

          {/* Log entries */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
            {filtered.length === 0 && (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground/50">No activity logged yet.</p>
              </div>
            )}
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-accent/30 transition-colors text-xs"
              >
                <span className="text-[10px] text-muted-foreground/60 w-14 shrink-0">
                  {timeAgo(entry.created_at)}
                </span>
                <Badge variant="outline" className={`text-[9px] px-1 py-0 font-mono ${tierBadge[entry.classifier_tier] || ''}`}>
                  T{entry.classifier_tier}
                </Badge>
                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${categoryBadge[entry.log_category] || ''}`}>
                  {entry.log_category}
                </Badge>
                {entry.subreddit && (
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">r/{entry.subreddit}</span>
                )}
                <span className="text-muted-foreground truncate flex-1">
                  {entry.post_title || entry.draft_body.slice(0, 60)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
