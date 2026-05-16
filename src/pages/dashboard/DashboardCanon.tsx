import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, ExternalLink, Pencil, Plus, ScrollText } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

type CanonPage = {
  id: string;
  slug: string;
  title: string;
  url: string;
  summary: string | null;
  audience: string | null;
  methodology_tags: string[] | null;
  substrate_topics: string[] | null;
  navigation_notes: string | null;
  status: string;
  sort_order: number;
};

const EMPTY: Partial<CanonPage> = {
  slug: '', title: '', url: '', summary: '', audience: '',
  methodology_tags: [], substrate_topics: [], navigation_notes: '',
  status: 'active', sort_order: 100,
};

export default function DashboardCanon() {
  const { userRole } = useOutletContext<{ user: User; userRole: string }>();
  const isArchitect = userRole === 'architect' || userRole === 'administrator';
  const { toast } = useToast();
  const [pages, setPages] = useState<CanonPage[]>([]);
  const [editing, setEditing] = useState<Partial<CanonPage> | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { fetchPages(); }, []);

  async function fetchPages() {
    const { data, error } = await (supabase as any)
      .from('canon_pages')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!error && data) setPages(data as CanonPage[]);
  }

  function openEditor(page?: CanonPage) {
    setEditing(page ? { ...page } : { ...EMPTY });
    setOpen(true);
  }

  async function save() {
    if (!editing?.slug || !editing.title || !editing.url) {
      toast({ title: 'Slug, title, and URL are required', variant: 'destructive' });
      return;
    }
    const payload = {
      slug: editing.slug,
      title: editing.title,
      url: editing.url,
      summary: editing.summary || null,
      audience: editing.audience || null,
      methodology_tags: editing.methodology_tags || [],
      substrate_topics: editing.substrate_topics || [],
      navigation_notes: editing.navigation_notes || null,
      status: editing.status || 'active',
      sort_order: editing.sort_order ?? 100,
    };
    const op = editing.id
      ? (supabase as any).from('canon_pages').update(payload).eq('id', editing.id)
      : (supabase as any).from('canon_pages').insert(payload);
    const { error } = await op;
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editing.id ? 'Canon page updated' : 'Canon page added' });
    setOpen(false);
    setEditing(null);
    fetchPages();
  }

  function tagsToString(t: string[] | null | undefined) { return (t || []).join(', '); }
  function stringToTags(s: string) {
    return s.split(',').map((x) => x.trim()).filter(Boolean);
  }

  return (
    <div className="p-6 md:p-8 pb-16 max-w-5xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold font-display text-foreground">Canon Registry</h1>
          </div>
          <p className="text-sm text-muted-foreground italic font-body max-w-2xl">
            The source-of-truth catalog of canonical web pages this system reasons over. Each row is a door:
            an audience, a methodology, and navigation notes the Codex uses to recommend the right page to the right person.
            Edit a page here and the app's understanding updates — no fetching, no scraping.
          </p>
        </div>
        {isArchitect && (
          <Button onClick={() => openEditor()} size="sm" className="shrink-0">
            <Plus className="h-4 w-4 mr-1.5" /> Add canon page
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {pages.map((p) => (
          <div key={p.id} className="border border-border bg-card rounded-sm p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-base font-bold font-display text-foreground">{p.title}</h3>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    p.status === 'active'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  }`}>{p.status}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{p.slug}</span>
                </div>
                <a href={p.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline break-all">
                  {p.url} <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
              {isArchitect && (
                <Button size="sm" variant="ghost" onClick={() => openEditor(p)} className="shrink-0">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {p.audience && (
              <p className="text-xs text-muted-foreground mb-2">
                <span className="uppercase tracking-wider font-display text-[10px] mr-2">Audience</span>
                {p.audience}
              </p>
            )}

            {p.summary && <p className="text-sm text-foreground/80 mb-3 leading-relaxed">{p.summary}</p>}

            {(p.methodology_tags?.length || p.substrate_topics?.length) ? (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.methodology_tags?.map((t) => (
                  <span key={`m-${t}`} className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-primary/30 bg-primary/5 text-primary">
                    {t}
                  </span>
                ))}
                {p.substrate_topics?.map((t) => (
                  <span key={`s-${t}`} className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-secondary/30 bg-secondary/5 text-secondary">
                    substrate:{t}
                  </span>
                ))}
              </div>
            ) : null}

            {p.navigation_notes && (
              <div className="mt-3 border-l-2 border-primary/40 pl-3 bg-muted/20 py-2 rounded-r">
                <div className="flex items-center gap-1.5 mb-1">
                  <ScrollText className="h-3 w-3 text-primary" />
                  <span className="text-[10px] uppercase tracking-wider font-display text-primary">Navigation notes (skill)</span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{p.navigation_notes}</p>
              </div>
            )}
          </div>
        ))}
        {pages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">No canon pages registered yet.</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit canon page' : 'Add canon page'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Slug</Label>
                  <Input value={editing.slug || ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="watershed-thesis" />
                </div>
                <div>
                  <Label>Status</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={editing.status || 'active'}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                    <option value="active">active</option>
                    <option value="draft">draft</option>
                    <option value="archived">archived</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Title</Label>
                <Input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <Label>URL</Label>
                <Input value={editing.url || ''} onChange={(e) => setEditing({ ...editing, url: e.target.value })} placeholder="https://shannondobbs.com/..." />
              </div>
              <div>
                <Label>Audience</Label>
                <Input value={editing.audience || ''} onChange={(e) => setEditing({ ...editing, audience: e.target.value })} placeholder="Who is this page for?" />
              </div>
              <div>
                <Label>Summary</Label>
                <Textarea rows={2} value={editing.summary || ''} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Methodology tags (comma-separated)</Label>
                  <Input value={tagsToString(editing.methodology_tags)}
                    onChange={(e) => setEditing({ ...editing, methodology_tags: stringToTags(e.target.value) })} />
                </div>
                <div>
                  <Label>Substrate topics (comma-separated)</Label>
                  <Input value={tagsToString(editing.substrate_topics)}
                    onChange={(e) => setEditing({ ...editing, substrate_topics: stringToTags(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-1.5">
                  <ScrollText className="h-3.5 w-3.5 text-primary" />
                  Navigation notes (the skill the Codex reads)
                </Label>
                <Textarea rows={6} value={editing.navigation_notes || ''}
                  onChange={(e) => setEditing({ ...editing, navigation_notes: e.target.value })}
                  placeholder="When to recommend this door. Who it's for. Who it's NOT for. What frame to pair it with." />
                <p className="text-[10px] text-muted-foreground mt-1 italic">
                  Plain language. The Codex AI pulls this verbatim as substrate context, so write it like you're briefing a colleague.
                </p>
              </div>
              <div>
                <Label>Sort order</Label>
                <Input type="number" value={editing.sort_order ?? 100}
                  onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 100 })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing?.id ? 'Save' : 'Add page'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
