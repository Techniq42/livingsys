// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ThreadCard, type CommunityThread, type ThreadStatus, type SourcePlatform } from '@/components/CommunityRadar/ThreadCard';
import { TemplatePanel, type ReplyTemplate } from '@/components/CommunityRadar/TemplatePanel';
import { ResponseDraftsPanel } from '@/components/radar/ResponseDraftsPanel';
import { AutoResponseKillSwitch } from '@/components/radar/AutoResponseKillSwitch';
import { AutoResponseConfigEditor } from '@/components/radar/AutoResponseConfigEditor';
import { ShadowLogDrawer } from '@/components/radar/ShadowLogDrawer';
import { SourceKillSwitches } from '@/components/radar/SourceKillSwitches';
import { SubstrateFilterIndicator } from '@/components/radar/SubstrateFilterIndicator';
import { BadActorVisibilityToggle } from '@/components/radar/BadActorVisibilityToggle';
import { Button } from '@/components/ui/button';
import { Radar, Filter, Settings2, Sunrise, Sparkles } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import '@/styles/skins.css';

// Which source slugs have a matching [data-skin] in skins.css
const SKIN_FOR_SOURCE: Partial<Record<string, string>> = {
  reddit: 'reddit',
  bluesky: 'bluesky',
};

type FilterStatus = ThreadStatus | 'all';
type FilterSource = SourcePlatform | 'all';

const SOURCE_LABELS: Record<FilterSource, string> = {
  all: 'All sources',
  reddit: 'Reddit',
  bluesky: 'Bluesky',
  discord: 'Discord',
  forum: 'Forums',
  other: 'Other',
};

export default function DashboardRadar() {
  const { user, userRole } = useOutletContext<{ user: User; userRole: string }>();
  const isArchitect = userRole === 'architect' || userRole === 'administrator';

  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterSource, setFilterSource] = useState<FilterSource>('all');
  const [selectedThread, setSelectedThread] = useState<CommunityThread | null>(null);
  const [activeTab, setActiveTab] = useState<'threads' | 'drafts' | 'config'>('threads');

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

  async function handleDraftReframe(thread: CommunityThread) {
    await (supabase as any).from('feedback_signals').insert({
      thread_id: thread.id,
      operator_id: user.id,
      signal_type: 'reframe_flag',
      substrate_topic: thread.match_reason?.substrate_topic || null,
      note: 'Operator triggered Draft Reframe',
    });
    await handleStatusChange(thread.id, 'flagged');
  }

  const sourceCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    threads.forEach((t) => {
      const s = (t.source_platform || 'other') as string;
      acc[s] = (acc[s] || 0) + 1;
    });
    return acc;
  }, [threads]);

  const filteredThreads = threads.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterSource !== 'all' && (t.source_platform || 'other') !== filterSource) return false;
    return true;
  });

  const newThreads = filteredThreads.filter((t) => t.status === 'new');
  const movementThreads = filteredThreads.filter((t) => t.status !== 'new');

  const statusCounts = threads.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceFilters: FilterSource[] = ['all', 'reddit', 'bluesky', 'discord', 'forum', 'other'];

  return (
    <div className="p-6 md:p-8 pb-16">
      {/* Header row with kill switch */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <Radar className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold font-display text-foreground">Community Radar</h1>
            <SubstrateFilterIndicator />
          </div>
          <p className="text-sm text-muted-foreground italic font-body">
            Threads surfaced from monitored communities. Review, reply, connect.
          </p>
        </div>
        {isArchitect && (
          <div className="lg:w-auto space-y-3">
            <AutoResponseKillSwitch isArchitect={isArchitect} />
            <SourceKillSwitches isArchitect={isArchitect} />
            <BadActorVisibilityToggle isArchitect={isArchitect} />
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-3">
        <Button size="sm" variant={activeTab === 'threads' ? 'default' : 'ghost'} className="h-8 text-xs px-4"
          onClick={() => setActiveTab('threads')}>
          <Radar className="h-3.5 w-3.5 mr-1.5" /> Threads
        </Button>
        <Button size="sm" variant={activeTab === 'drafts' ? 'default' : 'ghost'} className="h-8 text-xs px-4"
          onClick={() => setActiveTab('drafts')}>
          Response Drafts
        </Button>
        {isArchitect && (
          <Button size="sm" variant={activeTab === 'config' ? 'default' : 'ghost'} className="h-8 text-xs px-4"
            onClick={() => setActiveTab('config')}>
            <Settings2 className="h-3.5 w-3.5 mr-1.5" /> Auto-Response Config
          </Button>
        )}
      </div>

      {activeTab === 'threads' && (
        <div data-skin={SKIN_FOR_SOURCE[filterSource] || undefined}>
          {/* Source filter chips — also swap the room skin when a platform is selected */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display mr-1">Source</span>
            {sourceFilters.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={filterSource === s ? 'default' : 'outline'}
                className="h-7 text-xs px-3"
                onClick={() => setFilterSource(s)}
                title={SKIN_FOR_SOURCE[s] ? `Switch room skin → ${SOURCE_LABELS[s]}` : undefined}
              >
                {SOURCE_LABELS[s]}
                {s === 'all' ? ` (${threads.length})` : sourceCounts[s] ? ` (${sourceCounts[s]})` : ''}
              </Button>
            ))}
          </div>

          {/* Status filter chips */}
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

          {/* Overnight summary — Gemma briefing stub */}
          <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sunrise className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-display font-semibold text-foreground">Since you were last here</h3>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-display ml-auto">Gemma briefing · coming online</span>
            </div>
            <p className="text-xs text-muted-foreground italic font-body leading-relaxed">
              {newThreads.length > 0
                ? `${newThreads.length} new thread${newThreads.length === 1 ? '' : 's'} surfaced. ${movementThreads.length > 0 ? `${movementThreads.length} with movement worth a second look.` : ''}`
                : 'Nothing new overnight. The radar is quiet.'}
            </p>
            <p className="text-[10px] text-muted-foreground/50 mt-2">
              Pattern read coming next: "this one looks promising · this petered out · someone watching #3 dropped something intriguing."
            </p>
          </div>

          {/* Section: New */}
          {newThreads.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <h2 className="text-xs uppercase tracking-[0.2em] font-display text-emerald-300/80">New</h2>
                <span className="text-[10px] text-muted-foreground">{newThreads.length}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {newThreads.map((thread) => (
                  <ThreadCard
                    key={thread.id}
                    thread={thread}
                    operatorId={user?.id}
                    onStatusChange={handleStatusChange}
                    onNotesChange={handleNotesChange}
                    onSelectTemplate={(t) => setSelectedThread(t)}
                    onDraftReframe={handleDraftReframe}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section: Movement */}
          {movementThreads.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Radar className="h-3.5 w-3.5 text-primary" />
                <h2 className="text-xs uppercase tracking-[0.2em] font-display text-primary/80">Threads with movement</h2>
                <span className="text-[10px] text-muted-foreground">{movementThreads.length}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {movementThreads.map((thread) => (
                  <ThreadCard
                    key={thread.id}
                    thread={thread}
                    operatorId={user?.id}
                    onStatusChange={handleStatusChange}
                    onNotesChange={handleNotesChange}
                    onSelectTemplate={(t) => setSelectedThread(t)}
                    onDraftReframe={handleDraftReframe}
                  />
                ))}
              </div>
            </section>
          )}

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
        </div>
      )}

      {activeTab === 'drafts' && (
        <ResponseDraftsPanel isArchitect={isArchitect} />
      )}

      {activeTab === 'config' && isArchitect && (
        <div className="max-w-xl">
          <AutoResponseConfigEditor isArchitect={isArchitect} />
        </div>
      )}

      <TemplatePanel
        thread={selectedThread}
        templates={templates}
        onClose={() => setSelectedThread(null)}
      />

      {isArchitect && <ShadowLogDrawer />}
    </div>
  );
}
