// @ts-nocheck
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { CalendarPlus, MapPin, Megaphone, Trash2, Loader2 } from 'lucide-react';

interface Lens { slug: string; label: string; }
interface Venue { id: string; name: string; lens_slug: string; city: string | null; region: string | null; }
interface LocalEvent {
  id: string;
  lens_slug: string;
  title: string;
  description: string | null;
  event_type: string | null;
  status: string;
  starts_at: string | null;
  source_url: string | null;
  venue_id: string | null;
  region: string | null;
  amplify: boolean;
  amplify_to: string[];
  audience_hint: string | null;
}

const EMPTY: Partial<LocalEvent> = {
  lens_slug: 'healing',
  title: '',
  description: '',
  event_type: 'soundbath',
  status: 'upcoming',
  starts_at: '',
  source_url: '',
  region: '',
  amplify: true,
  amplify_to: [],
  audience_hint: '',
};

export default function DashboardEvents() {
  const [lenses, setLenses] = useState<Lens[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [filterLens, setFilterLens] = useState<string>('healing');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<LocalEvent>>(EMPTY);
  const [amplifyInput, setAmplifyInput] = useState('');

  async function load() {
    setLoading(true);
    const [{ data: l }, { data: v }, { data: e }] = await Promise.all([
      (supabase as any).from('lenses').select('slug,label').eq('is_active', true).order('sort_order'),
      (supabase as any).from('venues').select('id,name,lens_slug,city,region').eq('is_active', true).order('name'),
      (supabase as any).from('local_events').select('*').eq('lens_slug', filterLens).order('starts_at', { ascending: true }),
    ]);
    setLenses((l ?? []) as Lens[]);
    setVenues((v ?? []) as Venue[]);
    setEvents((e ?? []) as LocalEvent[]);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filterLens]);

  async function save() {
    if (!form.title || !form.lens_slug) {
      toast({ title: 'Missing fields', description: 'Title and lens are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const amplify_to = amplifyInput.split(',').map((s) => s.trim()).filter(Boolean);
    const payload: any = {
      lens_slug: form.lens_slug,
      title: form.title,
      description: form.description || null,
      event_type: form.event_type || null,
      status: form.status || 'upcoming',
      starts_at: form.starts_at || null,
      source_url: form.source_url || null,
      venue_id: form.venue_id || null,
      region: form.region || null,
      amplify: form.amplify ?? true,
      amplify_to,
      audience_hint: form.audience_hint || null,
    };
    const { error } = await (supabase as any).from('local_events').insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Event added', description: `${form.title} is on the radar.` });
    setForm(EMPTY);
    setAmplifyInput('');
    load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this event?')) return;
    const { error } = await (supabase as any).from('local_events').delete().eq('id', id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      return;
    }
    load();
  }

  const lensVenues = venues.filter((v) => v.lens_slug === form.lens_slug);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-primary" /> Local Events
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Surface fundraisers, classes, fusion sessions, barn raisings. Gemma uses these in the Listen + Seed briefings for each lens.
        </p>
      </header>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Showing lens</span>
        {lenses.map((l) => (
          <button
            key={l.slug}
            onClick={() => setFilterLens(l.slug)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-display tracking-wider uppercase border transition-all ${
              filterLens === l.slug ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-foreground/70 border-border hover:border-foreground/40'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* List */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-display uppercase tracking-wider text-foreground mb-4">Upcoming ({events.length})</h2>
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : events.length === 0 ? (
          <p className="text-xs text-muted-foreground">No events yet for this lens.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => {
              const venue = venues.find((v) => v.id === e.venue_id);
              return (
                <li key={e.id} className="p-3 rounded-lg border border-border bg-background/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display text-foreground">{e.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {e.starts_at ? new Date(e.starts_at).toLocaleString() : 'TBD'} · {e.event_type ?? 'event'} · {e.status}
                      </p>
                      {venue && <p className="text-[11px] text-muted-foreground/80 mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{venue.name}{e.region ? ` · ${e.region}` : ''}</p>}
                      {e.description && <p className="text-xs text-foreground/80 mt-2">{e.description}</p>}
                      {e.amplify_to?.length > 0 && (
                        <p className="text-[11px] text-muted-foreground mt-2 flex items-start gap-1">
                          <Megaphone className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{e.amplify_to.join(' · ')}</span>
                        </p>
                      )}
                      {e.source_url && <a href={e.source_url} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline mt-1 inline-block">source ↗</a>}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => remove(e.id)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Add form */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-display uppercase tracking-wider text-foreground">Add an event</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs space-y-1">
            <span className="text-muted-foreground">Lens</span>
            <select
              value={form.lens_slug}
              onChange={(e) => setForm({ ...form, lens_slug: e.target.value, venue_id: undefined })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {lenses.map((l) => <option key={l.slug} value={l.slug}>{l.label}</option>)}
            </select>
          </label>
          <label className="text-xs space-y-1">
            <span className="text-muted-foreground">Venue</span>
            <select
              value={form.venue_id ?? ''}
              onChange={(e) => setForm({ ...form, venue_id: e.target.value || undefined })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— none —</option>
              {lensVenues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </label>
          <label className="text-xs space-y-1 sm:col-span-2">
            <span className="text-muted-foreground">Title</span>
            <Input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Fusion Sound Healing — Melissa & Leanne" />
          </label>
          <label className="text-xs space-y-1">
            <span className="text-muted-foreground">Type</span>
            <Input value={form.event_type ?? ''} onChange={(e) => setForm({ ...form, event_type: e.target.value })} placeholder="soundbath / fusion / fundraiser / class" />
          </label>
          <label className="text-xs space-y-1">
            <span className="text-muted-foreground">Starts (local)</span>
            <Input type="datetime-local" value={form.starts_at ?? ''} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          </label>
          <label className="text-xs space-y-1">
            <span className="text-muted-foreground">Region</span>
            <Input value={form.region ?? ''} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Northern Colorado" />
          </label>
          <label className="text-xs space-y-1">
            <span className="text-muted-foreground">Source URL</span>
            <Input value={form.source_url ?? ''} onChange={(e) => setForm({ ...form, source_url: e.target.value })} placeholder="https://…" />
          </label>
          <label className="text-xs space-y-1 sm:col-span-2">
            <span className="text-muted-foreground">Description</span>
            <Textarea rows={2} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label className="text-xs space-y-1 sm:col-span-2">
            <span className="text-muted-foreground">Amplify to (comma-separated channels/groups)</span>
            <Input value={amplifyInput} onChange={(e) => setAmplifyInput(e.target.value)} placeholder="melissa_ig, leanne_fb, boulder_wellness_groups, …" />
          </label>
          <label className="text-xs space-y-1 sm:col-span-2">
            <span className="text-muted-foreground">Audience hint (who is this for? — guides Gemma's Seed brief)</span>
            <Input value={form.audience_hint ?? ''} onChange={(e) => setForm({ ...form, audience_hint: e.target.value })} placeholder="Local healing seekers within ~40 miles of Loveland" />
          </label>
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <CalendarPlus className="h-3 w-3 mr-2" />}
            Add event
          </Button>
        </div>
      </section>
    </div>
  );
}
