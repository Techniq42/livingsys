import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Edit3, ExternalLink, RefreshCw, MessageSquare } from 'lucide-react';

type Draft = {
  id: string;
  status: string;
  classifier_tier: number | null;
  subreddit: string | null;
  post_title: string | null;
  draft_text: string | null;
  thread_url: string | null;
  shannon_notes: string | null;
  safety_flags: string | null;
  created_at: string;
};

const short = (id: string) => id.slice(0, 8);
const fmt = (d: string) => new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const STATUS_COLORS: Record<string, string> = {
  pending_review: 'border-amber-500/40 text-amber-500',
  notified:       'border-amber-500/40 text-amber-500',
  approved:       'border-emerald-500/40 text-emerald-500',
  skipped:        'border-muted-foreground/40 text-muted-foreground',
  reframed:       'border-blue-500/40 text-blue-500',
  posted:         'border-emerald-500/40 text-emerald-500',
  manual_post:    'border-secondary/40 text-secondary',
};

const QUEUE_STATUSES = ['pending_review', 'notified'];
const ALL_STATUSES = ['all', 'pending_review', 'notified', 'approved', 'skipped', 'reframed', 'posted', 'manual_post'];

export default function DashboardConversations() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selected, setSelected] = useState<Draft | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('queue');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState('');
  const [editNote, setEditNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    let q = supabase.from('response_drafts').select('*').order('created_at', { ascending: false }).limit(100);
    if (statusFilter === 'queue') {
      q = q.in('status', QUEUE_STATUSES);
    } else if (statusFilter !== 'all') {
      q = q.eq('status', statusFilter);
    }
    const { data, error } = await q;
    if (error) toast.error(error.message);
    const rows = (data || []) as Draft[];
    setDrafts(rows);
    if (selected) {
      const refreshed = rows.find(r => r.id === selected.id);
      setSelected(refreshed ?? null);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  // Live subscription — new drafts appear without manual refresh
  useEffect(() => {
    const channel = supabase
      .channel('response_drafts_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'response_drafts' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [statusFilter]);

  const patch = async (id: string, update: Partial<Draft>) => {
    const { error } = await supabase.from('response_drafts').update(update).eq('id', id);
    if (error) { toast.error(error.message); return false; }
    return true;
  };

  const approve = async (draft: Draft) => {
    if (!await patch(draft.id, { status: 'approved' })) return;
    toast.success('Approved — n8n send worker will post.');
    await load();
  };

  const skip = async (draft: Draft) => {
    if (!await patch(draft.id, { status: 'skipped' })) return;
    toast('Skipped.');
    await load();
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    // Update draft text, keep status notified (human reviewed, awaiting re-queue)
    const ok = await patch(selected.id, { draft_text: editText, status: 'notified' });
    if (!ok) { setSaving(false); return; }

    // Log guidance to danny_calibration so Danny learns from the reframe
    if (editNote.trim()) {
      const { error } = await supabase.from('danny_calibration').insert({
        draft_id: selected.id,
        feedback: editNote.trim(),
      });
      if (error) toast.error(`Calibration log failed: ${error.message}`);
      else toast.success('Draft updated — guidance logged to Danny.');
    } else {
      toast.success('Draft updated.');
    }

    setEditMode(false);
    setEditText('');
    setEditNote('');
    setSaving(false);
    await load();
  };

  const selectDraft = (d: Draft) => {
    setSelected(d);
    setEditMode(false);
    setEditText('');
    setEditNote('');
  };

  const queueCount = drafts.filter(d => QUEUE_STATUSES.includes(d.status)).length;

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-display">Respond</p>
          <h1 className="text-2xl font-display flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Draft queue
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Approve, skip, or reframe. n8n posts approved drafts — nothing ships without your say.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="queue">Queue ({queueCount})</SelectItem>
              {ALL_STATUSES.slice(1).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              <SelectItem value="all">all</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="h-8" onClick={load}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
        {/* Draft list */}
        <div className="border border-border rounded-lg bg-card divide-y divide-border max-h-[75vh] overflow-y-auto">
          {loading && <p className="p-4 text-xs text-muted-foreground">Loading…</p>}
          {!loading && drafts.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground text-center">
              {statusFilter === 'queue' ? 'Queue is clear.' : 'No drafts.'}
            </p>
          )}
          {drafts.map(d => (
            <button
              key={d.id}
              onClick={() => selectDraft(d)}
              className={`w-full text-left p-3 hover:bg-accent/40 transition ${selected?.id === d.id ? 'bg-accent/50' : ''}`}
            >
              <div className="flex items-center gap-2 text-xs mb-1">
                <span className={`inline-block text-[10px] font-display tracking-wider uppercase border rounded px-1.5 py-0.5 ${STATUS_COLORS[d.status] ?? 'border-border text-muted-foreground'}`}>
                  {d.status}
                </span>
                {d.classifier_tier != null && (
                  <Badge variant="outline" className="text-[10px] h-4">T{d.classifier_tier}</Badge>
                )}
                {d.subreddit && <span className="text-muted-foreground">r/{d.subreddit}</span>}
                <span className="text-muted-foreground ml-auto text-[10px]">{fmt(d.created_at)}</span>
              </div>
              <p className="text-sm font-display truncate">{d.post_title || '—'}</p>
              {d.draft_text && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.draft_text}</p>
              )}
            </button>
          ))}
        </div>

        {/* Detail + actions */}
        <div className="border border-border rounded-lg bg-card p-4 min-h-[75vh] flex flex-col gap-4">
          {!selected && (
            <p className="text-sm text-muted-foreground m-auto">Select a draft to review.</p>
          )}

          {selected && (
            <>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap text-xs mb-1">
                    <code className="text-muted-foreground">{short(selected.id)}</code>
                    <span className={`inline-block text-[10px] font-display tracking-wider uppercase border rounded px-1.5 py-0.5 ${STATUS_COLORS[selected.status] ?? 'border-border text-muted-foreground'}`}>
                      {selected.status}
                    </span>
                    {selected.classifier_tier != null && (
                      <Badge variant="outline" className="text-[10px]">T{selected.classifier_tier}</Badge>
                    )}
                    {selected.subreddit && <span className="text-muted-foreground">r/{selected.subreddit}</span>}
                    {selected.safety_flags && (
                      <span className="text-coral text-[10px]">⚑ {selected.safety_flags}</span>
                    )}
                  </div>
                  <p className="text-base font-display">{selected.post_title || '—'}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{fmt(selected.created_at)}</p>
                </div>
                {selected.thread_url && (
                  <a
                    href={selected.thread_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary shrink-0"
                  >
                    Thread <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Draft text */}
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Draft</p>
                {!editMode ? (
                  <div className="bg-muted/20 border border-border rounded p-3 text-sm whitespace-pre-wrap font-mono">
                    {selected.draft_text || <span className="text-muted-foreground italic">No draft text.</span>}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      rows={8}
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      className="text-sm font-mono"
                      placeholder="Edit the draft…"
                    />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Guidance for Danny (logged to calibration)</p>
                      <Textarea
                        rows={3}
                        value={editNote}
                        onChange={e => setEditNote(e.target.value)}
                        className="text-xs"
                        placeholder="What should Danny do differently? (optional)"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} disabled={saving}>
                        {saving ? 'Saving…' : 'Save edit'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditMode(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Shannon notes (read) */}
              {selected.shannon_notes && !editMode && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                  <p className="text-xs text-muted-foreground">{selected.shannon_notes}</p>
                </div>
              )}

              {/* Action buttons */}
              {!editMode && (
                <div className="flex gap-2 flex-wrap pt-3 border-t border-border">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    onClick={() => approve(selected)}
                    disabled={selected.status === 'approved' || selected.status === 'posted'}
                  >
                    <CheckCircle className="h-4 w-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => {
                      setEditMode(true);
                      setEditText(selected.draft_text ?? '');
                    }}
                  >
                    <Edit3 className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-muted-foreground"
                    onClick={() => skip(selected)}
                    disabled={selected.status === 'skipped'}
                  >
                    <XCircle className="h-4 w-4" /> Skip
                  </Button>
                  <p className="w-full text-[10px] text-muted-foreground">
                    Approve queues for n8n send worker. Edit rewrites the draft and logs guidance to Danny. Skip removes from queue.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
