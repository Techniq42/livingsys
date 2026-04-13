import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ResponseDraftCard, type ResponseDraft } from './ResponseDraftCard';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DraftFilter = 'all' | 'pending' | 'approved' | 'posted' | 'rejected' | 'blocked';

interface ResponseDraftsPanelProps {
  isArchitect: boolean;
}

export function ResponseDraftsPanel({ isArchitect }: ResponseDraftsPanelProps) {
  const [drafts, setDrafts] = useState<ResponseDraft[]>([]);
  const [filter, setFilter] = useState<DraftFilter>('pending');

  useEffect(() => {
    fetchDrafts();
    const channel = supabase
      .channel('response_drafts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'response_drafts' }, () => {
        fetchDrafts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchDrafts() {
    const { data, error } = await (supabase as any)
      .from('response_drafts')
      .select('*, community_threads(post_title, post_url, subreddit)')
      .order('created_at', { ascending: false });
    if (!error && data) {
      const mapped = (data as any[]).map((d) => ({
        ...d,
        post_title: d.community_threads?.post_title,
        post_url: d.community_threads?.post_url,
        subreddit: d.community_threads?.subreddit,
      }));
      setDrafts(mapped);
    }
  }

  async function handleApprove(id: string) {
    await (supabase as any).from('response_drafts').update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
    }).eq('id', id);
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, status: 'approved', reviewed_at: new Date().toISOString() } : d));
  }

  async function handleReject(id: string) {
    await (supabase as any).from('response_drafts').update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
    }).eq('id', id);
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, status: 'rejected', reviewed_at: new Date().toISOString() } : d));
  }

  const filtered = filter === 'all' ? drafts : drafts.filter(d => d.status === filter);
  const counts = drafts.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <FileText className="h-4 w-4 text-muted-foreground" />
        {(['pending', 'approved', 'posted', 'rejected', 'blocked', 'all'] as DraftFilter[]).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? 'default' : 'outline'}
            className="h-7 text-xs px-3"
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== 'all' && counts[s] ? ` (${counts[s]})` : ''}
            {s === 'all' ? ` (${drafts.length})` : ''}
          </Button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((draft) => (
          <ResponseDraftCard
            key={draft.id}
            draft={draft}
            onApprove={handleApprove}
            onReject={handleReject}
            isArchitect={isArchitect}
          />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No response drafts found.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {drafts.length === 0 ? 'Waiting for the responder to generate drafts.' : 'Try a different filter.'}
          </p>
        </div>
      )}
    </div>
  );
}
