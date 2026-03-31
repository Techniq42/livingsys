import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ThreadCard, type CommunityThread, type ThreadStatus } from '@/components/CommunityRadar/ThreadCard';
import { TemplatePanel, type ReplyTemplate } from '@/components/CommunityRadar/TemplatePanel';
import { Button } from '@/components/ui/button';
import { Radar, Filter } from 'lucide-react';

type FilterStatus = ThreadStatus | 'all';

export default function DashboardRadar() {
  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedThread, setSelectedThread] = useState<CommunityThread | null>(null);

  useEffect(() => {
    fetchThreads();
    fetchTemplates();
  }, []);

  async function fetchThreads() {
    const { data, error } = await (supabase as any)
      .from('community_threads')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setThreads(data as CommunityThread[]);
  }

  async function fetchTemplates() {
    const { data, error } = await (supabase as any)
      .from('reply_templates')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!error && data) setTemplates(data as ReplyTemplate[]);
  }

  async function handleStatusChange(id: string, status: ThreadStatus) {
    const updates: Record<string, unknown> = { status };
    if (status === 'replied') updates.replied_at = new Date().toISOString();
    await (supabase as any).from('community_threads').update(updates).eq('id', id);
    setThreads(prev => prev.map(t => t.id === id ? { ...t, ...updates } as CommunityThread : t));
  }

  async function handleNotesChange(id: string, notes: string) {
    await (supabase as any).from('community_threads').update({ notes }).eq('id', id);
    setThreads(prev => prev.map(t => t.id === id ? { ...t, notes } : t));
  }

  const filteredThreads = filterStatus === 'all' ? threads : threads.filter(t => t.status === filterStatus);
  const statusCounts = threads.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Radar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">Community Radar</h1>
        </div>
        <p className="text-sm text-muted-foreground italic font-body">
          Threads surfaced from monitored communities. Review, reply, connect.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {(['all', 'new', 'reviewed', 'flagged', 'replied', 'archived'] as FilterStatus[]).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filterStatus === s ? 'default' : 'outline'}
            className="h-7 text-xs px-3"
            onClick={() => setFilterStatus(s)}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== 'all' && statusCounts[s] ? ` (${statusCounts[s]})` : ''}
            {s === 'all' ? ` (${threads.length})` : ''}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredThreads.map((thread) => (
          <ThreadCard
            key={thread.id}
            thread={thread}
            onStatusChange={handleStatusChange}
            onNotesChange={handleNotesChange}
            onSelectTemplate={(t) => setSelectedThread(t)}
          />
        ))}
      </div>

      {filteredThreads.length === 0 && (
        <div className="text-center py-16">
          <Radar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No threads found.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {threads.length === 0
              ? 'Waiting for n8n to surface community threads.'
              : 'Try a different filter.'}
          </p>
        </div>
      )}

      <TemplatePanel
        thread={selectedThread}
        templates={templates}
        onClose={() => setSelectedThread(null)}
      />
    </div>
  );
}
