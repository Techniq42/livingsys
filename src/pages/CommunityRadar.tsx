import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardNav } from '@/components/ArchitectDashboard/DashboardNav';
import { ThreadCard, type CommunityThread, type ThreadStatus } from '@/components/CommunityRadar/ThreadCard';
import { TemplatePanel, type ReplyTemplate } from '@/components/CommunityRadar/TemplatePanel';
import { Button } from '@/components/ui/button';
import { Radar, ArrowLeft, Filter } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

type FilterStatus = ThreadStatus | 'all';

export default function CommunityRadarPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedThread, setSelectedThread] = useState<CommunityThread | null>(null);
  const navigate = useNavigate();

  async function verifyArchitectRole(userId: string) {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    if (error || !data || (data.role !== 'architect' && data.role !== 'administrator')) {
      navigate('/dashboard');
      return false;
    }
    return true;
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (!session && event === 'SIGNED_OUT') {
        navigate('/architect-login');
        return;
      }
      if (session?.user) {
        const isArchitect = await verifyArchitectRole(session.user.id);
        setAuthorized(isArchitect);
      }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!authorized) return;
    fetchThreads();
    fetchTemplates();
  }, [authorized]);

  async function fetchThreads() {
    const { data, error } = await supabase
      .from('community_threads')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setThreads(data as CommunityThread[]);
  }

  async function fetchTemplates() {
    const { data, error } = await supabase
      .from('reply_templates')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!error && data) setTemplates(data as ReplyTemplate[]);
  }

  async function handleStatusChange(id: string, status: ThreadStatus) {
    const updates: Record<string, unknown> = { status };
    if (status === 'replied') updates.replied_at = new Date().toISOString();
    await supabase.from('community_threads').update(updates).eq('id', id);
    setThreads(prev => prev.map(t => t.id === id ? { ...t, ...updates } as CommunityThread : t));
  }

  async function handleNotesChange(id: string, notes: string) {
    await supabase.from('community_threads').update({ notes }).eq('id', id);
    setThreads(prev => prev.map(t => t.id === id ? { ...t, notes } : t));
  }

  const filteredThreads = filterStatus === 'all'
    ? threads
    : threads.filter(t => t.status === filterStatus);

  const statusCounts = threads.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-primary animate-pulse-dot" />
      </div>
    );
  }

  if (!session || !authorized) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav userEmail={session.user.email} />
      <div className="px-6 md:px-8 py-10">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 text-xs"
            onClick={() => navigate('/architect-dashboard')}
          >
            <ArrowLeft className="h-3 w-3 mr-1" /> Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Radar className="h-6 w-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">
              Community Radar
            </h1>
          </div>
          <p className="text-muted-foreground">
            Threads surfaced from monitored communities. Review, reply, connect.
          </p>
        </div>

        {/* Filter bar */}
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

        {/* Thread grid */}
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
      </div>

      {/* Template sidebar */}
      <TemplatePanel
        thread={selectedThread}
        templates={templates}
        onClose={() => setSelectedThread(null)}
      />
    </div>
  );
}
