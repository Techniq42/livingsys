import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  FileText, Video, Share2, Mail, Plus, ChevronDown, ChevronRight,
  Clock, Send, Trash2, GripVertical, Megaphone, BookOpen, Users, Sparkles,
  MessageSquare, Globe, Smartphone
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

type ContentPiece = {
  id: string;
  user_id: string;
  title: string;
  hook: string;
  story: string;
  offer: string;
  cta_text: string;
  format_type: string;
  status: string;
  channels: Record<string, boolean>;
  scheduled_at: string | null;
  created_at: string;
};

const FORMAT_ICONS: Record<string, React.ElementType> = {
  article: FileText,
  video: Video,
  social: Share2,
  email: Mail,
};

const FORMAT_OPTIONS = ['article', 'video', 'social', 'email'] as const;

const CHANNELS = [
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'social', label: 'Social', icon: Globe },
  { key: 'sms', label: 'SMS', icon: Smartphone },
  { key: 'community', label: 'Community Feed', icon: MessageSquare },
  { key: 'blog', label: 'Blog', icon: BookOpen },
];

const TEMPLATES = [
  { name: 'Gitcoin Sprint Update', hook: 'The sprint just closed — here\'s what shipped and what it means for your node.', story: '', offer: '', format: 'email' },
  { name: 'Node Activation Announcement', hook: 'A new coordination node just went live.', story: '', offer: '', format: 'social' },
  { name: 'Field Guide Chapter Release', hook: 'Chapter dropped. This one changes how you think about [topic].', story: '', offer: '', format: 'article' },
  { name: 'Practitioner Spotlight', hook: 'Meet the architect who [specific achievement].', story: '', offer: '', format: 'video' },
];

const STATUS_COLUMNS = ['draft', 'review', 'published'] as const;
const STATUS_LABELS: Record<string, string> = { draft: 'Draft', review: 'Review', published: 'Published' };

export function ContentEngine() {
  const queryClient = useQueryClient();
  const [expandedSection, setExpandedSection] = useState<string | null>('hook');
  const [editingPiece, setEditingPiece] = useState<ContentPiece | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [hook, setHook] = useState('');
  const [story, setStory] = useState('');
  const [offer, setOffer] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [formatType, setFormatType] = useState<string>('article');
  const [channels, setChannels] = useState<Record<string, boolean>>({});
  const [scheduledAt, setScheduledAt] = useState('');

  const { data: pieces = [], isLoading } = useQuery({
    queryKey: ['content_pieces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_pieces')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as ContentPiece[]) || [];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (piece: Partial<ContentPiece> & { id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        title: piece.title || '',
        hook: piece.hook || '',
        story: piece.story || '',
        offer: piece.offer || '',
        cta_text: piece.cta_text || '',
        format_type: piece.format_type || 'article',
        status: piece.status || 'draft',
        channels: piece.channels || {},
        scheduled_at: piece.scheduled_at || null,
        user_id: user.id,
      };

      if (piece.id) {
        const { error } = await supabase.from('content_pieces').update(payload).eq('id', piece.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('content_pieces').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_pieces'] });
      resetForm();
      setShowBuilder(false);
      toast({ title: 'Content saved', description: 'Your content piece has been saved.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('content_pieces').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_pieces'] });
      toast({ title: 'Deleted', description: 'Content piece removed.' });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('content_pieces').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content_pieces'] }),
  });

  function resetForm() {
    setTitle(''); setHook(''); setStory(''); setOffer(''); setCtaText('');
    setFormatType('article'); setChannels({}); setScheduledAt('');
    setEditingPiece(null);
  }

  function loadPieceIntoForm(p: ContentPiece) {
    setTitle(p.title); setHook(p.hook); setStory(p.story); setOffer(p.offer);
    setCtaText(p.cta_text); setFormatType(p.format_type);
    setChannels(typeof p.channels === 'object' && p.channels ? p.channels : {});
    setScheduledAt(p.scheduled_at ? p.scheduled_at.slice(0, 16) : '');
    setEditingPiece(p);
    setShowBuilder(true);
  }

  function applyTemplate(t: typeof TEMPLATES[number]) {
    setTitle(t.name); setHook(t.hook); setStory(t.story); setOffer(t.offer);
    setFormatType(t.format); setShowBuilder(true); setExpandedSection('hook');
  }

  function handleSave() {
    if (!title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    upsertMutation.mutate({
      id: editingPiece?.id,
      title, hook, story, offer, cta_text: ctaText,
      format_type: formatType, status: editingPiece?.status || 'draft',
      channels, scheduled_at: scheduledAt || null,
    });
  }

  const toggleSection = (s: string) => setExpandedSection(prev => prev === s ? null : s);
  const FormatIcon = FORMAT_ICONS[formatType] || FileText;

  return (
    <section id="content-engine" className="mb-12">
      <p className="section-label mb-4">Content Engine</p>
      <h2 className="text-xl md:text-2xl font-bold font-display text-foreground mb-2">
        Dissemination Battalion
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Create and distribute content using the Hook → Story → Offer framework.
      </p>

      {/* Quick Templates */}
      <div className="mb-8">
        <p className="text-xs font-display tracking-widest text-muted-foreground uppercase mb-3">Quick Templates</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TEMPLATES.map((t) => {
            const TIcon = FORMAT_ICONS[t.format] || FileText;
            return (
              <button
                key={t.name}
                onClick={() => applyTemplate(t)}
                className="border border-border bg-card rounded-sm p-4 text-left hover:border-primary/50 transition-all group"
              >
                <TIcon className="w-5 h-5 text-primary mb-2" />
                <p className="text-sm font-display text-foreground leading-tight">{t.name}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* HSO Builder */}
      {showBuilder && (
        <div className="border border-primary/30 bg-card rounded-sm p-6 mb-8 relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold font-display text-foreground">
              {editingPiece ? 'Edit Content' : 'New Content Piece'}
            </h3>
            <button
              onClick={() => { resetForm(); setShowBuilder(false); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          {/* Title + Format */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Content title..."
              className="flex-1 bg-background border-border"
            />
            <div className="flex gap-1">
              {FORMAT_OPTIONS.map((f) => {
                const FIcon = FORMAT_ICONS[f];
                return (
                  <button
                    key={f}
                    onClick={() => setFormatType(f)}
                    className={`p-2 rounded-sm border transition-all ${
                      formatType === f
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                    title={f}
                  >
                    <FIcon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collapsible HSO Sections */}
          {[
            {
              key: 'hook',
              label: 'HOOK',
              sublabel: 'The Pattern Interrupt',
              guidance: 'What stops the scroll? Lead with tension, curiosity, or a bold claim that forces attention.',
              content: (
                <div>
                  <Input
                    value={hook}
                    onChange={(e) => setHook(e.target.value)}
                    placeholder="Your pattern interrupt..."
                    className="bg-background border-border mb-1"
                    maxLength={280}
                  />
                  <p className="text-xs text-muted-foreground text-right">{hook.length}/280</p>
                </div>
              ),
            },
            {
              key: 'story',
              label: 'STORY',
              sublabel: 'The Origin Narrative',
              guidance: 'Build trust through lived experience. Share the transformation — where you were, what changed, what you learned.',
              content: (
                <Textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Your origin narrative..."
                  className="bg-background border-border min-h-[100px]"
                />
              ),
            },
            {
              key: 'offer',
              label: 'OFFER',
              sublabel: 'The Call to Action',
              guidance: 'Make the next step unmistakable. What do you want them to do, and why should they do it now?',
              content: (
                <div className="space-y-3">
                  <Textarea
                    value={offer}
                    onChange={(e) => setOffer(e.target.value)}
                    placeholder="Your offer / CTA description..."
                    className="bg-background border-border min-h-[80px]"
                  />
                  <Input
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="CTA button text (e.g. 'Fork the System')"
                    className="bg-background border-border"
                  />
                </div>
              ),
            },
          ].map((section) => (
            <div key={section.key} className="border border-border rounded-sm mb-3 overflow-hidden">
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedSection === section.key ? (
                    <ChevronDown className="w-4 h-4 text-primary" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-display font-bold text-primary tracking-wider">
                    {section.label}
                  </span>
                  <span className="text-xs text-muted-foreground">— {section.sublabel}</span>
                </div>
              </button>
              {expandedSection === section.key && (
                <div className="px-3 pb-3">
                  <p className="text-xs text-muted-foreground italic mb-3">{section.guidance}</p>
                  {section.content}
                </div>
              )}
            </div>
          ))}

          {/* Channel Distribution Matrix */}
          <div className="border border-border rounded-sm p-4 mb-4">
            <p className="text-xs font-display tracking-widest text-muted-foreground uppercase mb-3">
              Distribution Channels
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {CHANNELS.map((ch) => (
                <div
                  key={ch.key}
                  className="flex items-center justify-between gap-2 border border-border rounded-sm p-2"
                >
                  <div className="flex items-center gap-1.5">
                    <ch.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-foreground">{ch.label}</span>
                  </div>
                  <Switch
                    checked={!!channels[ch.key]}
                    onCheckedChange={(v) => setChannels((prev) => ({ ...prev, [ch.key]: v }))}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="bg-background border border-border rounded-sm px-2 py-1 text-xs text-foreground"
              />
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={upsertMutation.isPending}
            className="w-full py-2.5 bg-primary text-primary-foreground font-display tracking-wider text-sm rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {upsertMutation.isPending ? 'Saving...' : editingPiece ? 'Update Content' : 'Save to Pipeline'}
          </button>
        </div>
      )}

      {/* New Content button (when builder is hidden) */}
      {!showBuilder && (
        <button
          onClick={() => { resetForm(); setShowBuilder(true); }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 border border-dashed border-primary/40 text-primary text-sm font-display tracking-wider rounded-sm hover:bg-primary/5 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Content Piece
        </button>
      )}

      {/* Kanban Pipeline */}
      <div className="grid md:grid-cols-3 gap-4">
        {STATUS_COLUMNS.map((status) => {
          const columnPieces = pieces.filter((p) => p.status === status);
          return (
            <div key={status} className="border border-border rounded-sm">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-xs font-display tracking-widest uppercase text-foreground">
                  {STATUS_LABELS[status]}
                </span>
                <Badge variant="outline" className="text-xs">
                  {columnPieces.length}
                </Badge>
              </div>
              <div className="p-3 space-y-2 min-h-[120px]">
                {isLoading ? (
                  <div className="h-16 bg-muted animate-pulse rounded-sm" />
                ) : columnPieces.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No items</p>
                ) : (
                  columnPieces.map((piece) => {
                    const PIcon = FORMAT_ICONS[piece.format_type] || FileText;
                    const nextStatus = status === 'draft' ? 'review' : status === 'review' ? 'published' : null;
                    const prevStatus = status === 'published' ? 'review' : status === 'review' ? 'draft' : null;
                    return (
                      <div
                        key={piece.id}
                        className="border border-border bg-card rounded-sm p-3 hover:border-primary/30 transition-all cursor-pointer group"
                        onClick={() => loadPieceIntoForm(piece)}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-display text-foreground leading-tight flex-1">
                            {piece.title || 'Untitled'}
                          </p>
                          <PIcon className="w-3.5 h-3.5 text-muted-foreground ml-2 mt-0.5" />
                        </div>
                        {piece.hook && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{piece.hook}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            {Object.entries(piece.channels || {})
                              .filter(([, v]) => v)
                              .map(([k]) => {
                                const ch = CHANNELS.find((c) => c.key === k);
                                return ch ? (
                                  <ch.icon key={k} className="w-3 h-3 text-primary/60" />
                                ) : null;
                              })}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            {prevStatus && (
                              <button
                                onClick={() => statusMutation.mutate({ id: piece.id, status: prevStatus })}
                                className="text-xs text-muted-foreground hover:text-foreground px-1"
                                title={`Move to ${STATUS_LABELS[prevStatus]}`}
                              >
                                ←
                              </button>
                            )}
                            {nextStatus && (
                              <button
                                onClick={() => statusMutation.mutate({ id: piece.id, status: nextStatus })}
                                className="text-xs text-primary hover:text-primary/80 px-1"
                                title={`Move to ${STATUS_LABELS[nextStatus]}`}
                              >
                                →
                              </button>
                            )}
                            <button
                              onClick={() => deleteMutation.mutate(piece.id)}
                              className="text-xs text-destructive hover:text-destructive/80 px-1"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
