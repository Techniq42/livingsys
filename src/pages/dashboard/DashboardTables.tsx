import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ExternalLink, ChevronDown, ChevronRight, Trash2, Plus, Save } from 'lucide-react';

const short = (id: string) => (id ? id.slice(0, 8) : '');
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

function StatusChip({ value, tone }: { value: string; tone?: string }) {
  const map: Record<string, string> = {
    new: 'border-primary/40 text-primary',
    approved: 'border-emerald-500/40 text-emerald-500',
    posted: 'border-emerald-500/40 text-emerald-500',
    pending_review: 'border-amber-500/40 text-amber-500',
    notified: 'border-amber-500/40 text-amber-500',
    skipped: 'border-muted-foreground/40 text-muted-foreground',
    reframed: 'border-coral/40 text-coral',
    manual_post: 'border-secondary/40 text-secondary',
    reviewed: 'border-secondary/40 text-secondary',
    replied: 'border-emerald-500/40 text-emerald-500',
    active: 'border-emerald-500/40 text-emerald-500',
    draft: 'border-muted-foreground/40 text-muted-foreground',
    archived: 'border-muted-foreground/40 text-muted-foreground',
  };
  const cls = map[value] || tone || 'border-border text-muted-foreground';
  return <span className={`inline-block text-[10px] font-display tracking-wider uppercase border rounded px-1.5 py-0.5 ${cls}`}>{value || '—'}</span>;
}

// ------ response_drafts ------
function ResponseDraftsTable() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [edits, setEdits] = useState<Record<string, { status?: string; shannon_notes?: string; draft_text?: string }>>({});

  const load = async () => {
    setLoading(true);
    let q = supabase.from('response_drafts').select('*').order('created_at', { ascending: false }).limit(200);
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [statusFilter]);

  const save = async (id: string) => {
    const patch = edits[id];
    if (!patch) return;
    const { error } = await supabase.from('response_drafts').update(patch).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Saved');
    setEdits((e) => { const c = { ...e }; delete c[id]; return c; });
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['all','pending_review','notified','approved','posted','skipped','reframed','manual_post'].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{rows.length} rows</span>
      </div>

      <div className="space-y-2">
        {loading && <p className="text-xs text-muted-foreground">Reading…</p>}
        {rows.map((r) => {
          const isOpen = expanded === r.id;
          const patch = edits[r.id] || {};
          return (
            <Card key={r.id} className="p-3 bg-card/40">
              <div className="flex items-start gap-3">
                <button onClick={() => setExpanded(isOpen ? null : r.id)} className="mt-0.5 text-muted-foreground shrink-0">
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <code className="text-muted-foreground">{short(r.id)}</code>
                    <StatusChip value={r.status} />
                    {r.classifier_tier != null && <Badge variant="outline" className="text-[10px]">T{r.classifier_tier}</Badge>}
                    {r.subreddit && <span className="text-muted-foreground">r/{r.subreddit}</span>}
                    {r.safety_flags && <span className="text-coral text-[10px]">⚑ {r.safety_flags}</span>}
                    <span className="text-muted-foreground ml-auto">{fmt(r.created_at)}</span>
                  </div>
                  <p className="text-sm mt-1 font-display truncate">{r.post_title || '—'}</p>
                  {!isOpen && r.draft_text && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.draft_text}</p>
                  )}
                </div>
              </div>
              {isOpen && (
                <div className="mt-3 pl-7 space-y-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</label>
                    <Select
                      value={patch.status ?? r.status ?? ''}
                      onValueChange={(v) => setEdits((e) => ({ ...e, [r.id]: { ...e[r.id], status: v } }))}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['pending_review','notified','approved','posted','skipped','reframed','manual_post'].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Draft text</label>
                    <Textarea
                      rows={6}
                      value={patch.draft_text ?? r.draft_text ?? ''}
                      onChange={(e) => setEdits((s) => ({ ...s, [r.id]: { ...s[r.id], draft_text: e.target.value } }))}
                      className="text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Shannon notes</label>
                    <Textarea
                      rows={3}
                      value={patch.shannon_notes ?? r.shannon_notes ?? ''}
                      onChange={(e) => setEdits((s) => ({ ...s, [r.id]: { ...s[r.id], shannon_notes: e.target.value } }))}
                      className="text-xs"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => save(r.id)} disabled={!edits[r.id]}><Save className="w-3 h-3 mr-1" />Save</Button>
                    {r.thread_url && (
                      <a href={r.thread_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary">
                        Thread <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ------ community_threads ------
function CommunityThreadsTable() {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase.from('community_threads').select('*').order('created_at', { ascending: false }).limit(200);
      if (status !== 'all') q = q.eq('status', status as any);
      if (platform !== 'all') q = q.eq('platform', platform as any);
      const { data, error } = await q;
      if (error) toast.error(error.message);
      setRows(data || []);
      setLoading(false);
    })();
  }, [status, platform]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['all','new','reviewed','replied','archived'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['all','reddit','bluesky','telegram'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground self-center">{rows.length} rows</span>
      </div>
      {loading && <p className="text-xs text-muted-foreground">Reading…</p>}
      <div className="space-y-2">
        {rows.map((r) => (
          <Card key={r.id} className="p-3 bg-card/40">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <Badge variant="outline" className="text-[10px]">{r.platform}</Badge>
              <StatusChip value={r.status} />
              {r.relevance_score != null && <span className="text-muted-foreground">score {r.relevance_score}</span>}
              <span className="text-muted-foreground ml-auto">{fmt(r.created_at)}</span>
            </div>
            <p className="text-sm mt-1 font-display">{r.post_title || '—'}</p>
            {r.post_url && (
              <a href={r.post_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                Open <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ------ danny_calibration (CRUD) ------
function DannyCalibrationTable() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ draft_id: '', feedback: '' });
  const [edits, setEdits] = useState<Record<string, { feedback?: string; draft_id?: string }>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('danny_calibration').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!draft.feedback.trim()) return toast.error('Feedback required');
    const payload: any = { feedback: draft.feedback };
    if (draft.draft_id.trim()) payload.draft_id = draft.draft_id.trim();
    const { error } = await supabase.from('danny_calibration').insert(payload);
    if (error) return toast.error(error.message);
    toast.success('Added');
    setDraft({ draft_id: '', feedback: '' });
    load();
  };

  const save = async (id: string) => {
    const patch = edits[id];
    if (!patch) return;
    const { error } = await supabase.from('danny_calibration').update(patch).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Saved');
    setEdits((e) => { const c = { ...e }; delete c[id]; return c; });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this calibration note?')) return;
    const { error } = await supabase.from('danny_calibration').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  return (
    <div className="space-y-4">
      <Card className="p-3 bg-card/40 border-dashed">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">New calibration note</p>
        <div className="space-y-2">
          <Input
            placeholder="draft_id (optional, uuid)"
            value={draft.draft_id}
            onChange={(e) => setDraft({ ...draft, draft_id: e.target.value })}
            className="text-xs font-mono"
          />
          <Textarea
            placeholder="Guidance for Danny…"
            rows={3}
            value={draft.feedback}
            onChange={(e) => setDraft({ ...draft, feedback: e.target.value })}
            className="text-sm"
          />
          <Button size="sm" onClick={create}><Plus className="w-3 h-3 mr-1" />Add</Button>
        </div>
      </Card>

      {loading && <p className="text-xs text-muted-foreground">Reading…</p>}
      <div className="space-y-2">
        {rows.map((r) => {
          const patch = edits[r.id] || {};
          return (
            <Card key={r.id} className="p-3 bg-card/40">
              <div className="flex items-center gap-2 text-xs mb-2">
                <code className="text-muted-foreground">{short(r.id)}</code>
                <span className="text-muted-foreground ml-auto">{fmt(r.created_at)}</span>
              </div>
              <Input
                placeholder="draft_id"
                value={patch.draft_id ?? r.draft_id ?? ''}
                onChange={(e) => setEdits((s) => ({ ...s, [r.id]: { ...s[r.id], draft_id: e.target.value } }))}
                className="text-xs font-mono mb-2"
              />
              <Textarea
                rows={3}
                value={patch.feedback ?? r.feedback ?? ''}
                onChange={(e) => setEdits((s) => ({ ...s, [r.id]: { ...s[r.id], feedback: e.target.value } }))}
                className="text-sm"
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => save(r.id)} disabled={!edits[r.id]}><Save className="w-3 h-3 mr-1" />Save</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(r.id)} className="text-destructive">
                  <Trash2 className="w-3 h-3 mr-1" />Delete
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ------ danny_chat_log (read-only) ------
function DannyChatLogTable() {
  const [rows, setRows] = useState<any[]>([]);
  const [chatId, setChatId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase.from('danny_chat_log').select('*').order('created_at', { ascending: false }).limit(300);
      if (chatId.trim()) q = q.eq('chat_id', chatId.trim());
      const { data, error } = await q;
      if (error) toast.error(error.message);
      setRows(data || []);
      setLoading(false);
    })();
  }, [chatId]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap items-center">
        <Input
          placeholder="filter by chat_id…"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
          className="max-w-xs text-xs font-mono"
        />
        <span className="text-xs text-muted-foreground">{rows.length} turns</span>
      </div>
      {loading && <p className="text-xs text-muted-foreground">Reading…</p>}
      <div className="space-y-2">
        {rows.map((r) => (
          <Card key={r.id} className="p-3 bg-card/40">
            <div className="flex items-center gap-2 text-xs mb-1">
              <Badge variant="outline" className="text-[10px]">{r.role}</Badge>
              <code className="text-muted-foreground">{r.chat_id}</code>
              <span className="text-muted-foreground ml-auto">{fmt(r.created_at)}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap font-mono text-xs">{r.content}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ------ library_documents ------
function LibraryDocumentsTable() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('library_documents')
      .select('id, slug, title, doc_type, canonical_url, status, body_md')
      .order('updated_at', { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (id: string) => {
    const status = edits[id];
    if (!status) return;
    const { error } = await supabase.from('library_documents').update({ status }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Saved');
    setEdits((e) => { const c = { ...e }; delete c[id]; return c; });
    load();
  };

  return (
    <div className="space-y-2">
      {loading && <p className="text-xs text-muted-foreground">Reading…</p>}
      {rows.map((r: any) => {
        const bodyFetched = (r.body_md?.length || 0) > 100;
        return (
          <Card key={r.id} className="p-3 bg-card/40">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <code className="text-muted-foreground">{r.slug}</code>
              <Badge variant="outline" className="text-[10px]">{r.doc_type}</Badge>
              <StatusChip value={r.status} />
              <span className={`text-[10px] ${bodyFetched ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {bodyFetched ? '● body' : '○ no body'}
              </span>
              {r.canonical_url && (
                <a href={r.canonical_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary ml-auto">
                  Open <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <p className="text-sm mt-1 font-display">{r.title}</p>
            <div className="flex items-center gap-2 mt-2">
              <Select
                value={edits[r.id] ?? r.status ?? ''}
                onValueChange={(v) => setEdits((s) => ({ ...s, [r.id]: v }))}
              >
                <SelectTrigger className="h-8 text-xs w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['active','draft','archived','withdrawn'].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => save(r.id)} disabled={!edits[r.id] || edits[r.id] === r.status}>
                <Save className="w-3 h-3 mr-1" />Save status
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ------ Danny's Judgment (read-only browser) ------
const JUDGMENT_TABLES = [
  { key: 'routing_logic', label: 'Routing logic', title: (r: any) => `${r.room_slug} · ${r.situation_key}`, meta: (r: any) => r.response_level },
  { key: 'room_intelligence', label: 'Room intelligence', title: (r: any) => r.display_name || r.room_slug, meta: (r: any) => r.platform },
  { key: 'hwr_classifications', label: 'HWR classifications', title: (r: any) => `${r.axis} · ${r.sub_label}`, meta: (r: any) => r.description },
  { key: 'fulfillment_rules', label: 'Fulfillment rules', title: (r: any) => r.rule_slug, meta: (r: any) => `${r.match_axis}=${r.match_value} → ${r.posture}` },
  { key: 'value_ladder_tiers', label: 'Value ladder tiers', title: (r: any) => `${r.rung}. ${r.display_name}`, meta: (r: any) => `${(r.price_cents ?? 0) / 100} · ${r.cadence}` },
  { key: 'bad_faith_patterns', label: 'Bad-faith patterns', title: (r: any) => r.display_name || r.slug, meta: (r: any) => r.pattern_kind },
  { key: 'content_hooks', label: 'Content hooks', title: (r: any) => r.hook_slug, meta: (r: any) => `${r.surface} · ${r.format}` },
] as const;

function JudgmentTable({ table }: { table: typeof JUDGMENT_TABLES[number] }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from(table.key as any).select('*').limit(200);
      if (error) toast.error(`${table.key}: ${error.message}`);
      setRows(data || []);
      setLoading(false);
    })();
  }, [table.key]);

  return (
    <div className="space-y-2">
      {loading && <p className="text-xs text-muted-foreground">Reading…</p>}
      {!loading && rows.length === 0 && <p className="text-xs text-muted-foreground">Empty.</p>}
      {rows.map((r: any) => {
        const key = r.id || r.slug || JSON.stringify(r).slice(0, 40);
        const isOpen = expanded === key;
        return (
          <Card key={key} className="p-3 bg-card/40">
            <button className="w-full text-left" onClick={() => setExpanded(isOpen ? null : key)}>
              <div className="flex items-center gap-2 text-xs">
                {isOpen ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                <span className="font-display text-sm">{table.title(r)}</span>
                {table.meta(r) && <span className="text-muted-foreground ml-auto text-[11px]">{String(table.meta(r))}</span>}
              </div>
            </button>
            {isOpen && (
              <pre className="mt-2 pl-5 text-[10px] text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(r, null, 2)}
              </pre>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ------ Page ------
export default function DashboardTables() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <header className="space-y-1">
        <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-display">Field journal</p>
        <h1 className="text-2xl font-display">Tables</h1>
        <p className="text-xs text-muted-foreground">Quiet admin view over the live substrate. Edits are scoped.</p>
      </header>

      <Tabs defaultValue="drafts" className="w-full">
        <TabsList className="flex flex-wrap h-auto justify-start bg-card/40">
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="threads">Radar</TabsTrigger>
          <TabsTrigger value="calibration">Calibration</TabsTrigger>
          <TabsTrigger value="chatlog">Chat log</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="judgment">Danny's Judgment</TabsTrigger>
        </TabsList>

        <TabsContent value="drafts" className="mt-4"><ResponseDraftsTable /></TabsContent>
        <TabsContent value="threads" className="mt-4"><CommunityThreadsTable /></TabsContent>
        <TabsContent value="calibration" className="mt-4"><DannyCalibrationTable /></TabsContent>
        <TabsContent value="chatlog" className="mt-4"><DannyChatLogTable /></TabsContent>
        <TabsContent value="library" className="mt-4"><LibraryDocumentsTable /></TabsContent>
        <TabsContent value="judgment" className="mt-4">
          <Tabs defaultValue={JUDGMENT_TABLES[0].key}>
            <TabsList className="flex flex-wrap h-auto justify-start bg-transparent border-b border-border rounded-none w-full">
              {JUDGMENT_TABLES.map((t) => (
                <TabsTrigger key={t.key} value={t.key} className="text-xs">{t.label}</TabsTrigger>
              ))}
            </TabsList>
            {JUDGMENT_TABLES.map((t) => (
              <TabsContent key={t.key} value={t.key} className="mt-3">
                <JudgmentTable table={t} />
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
