import { ExternalLink, MessageSquare, Archive, Flag, Eye, Clock, ThumbsUp, ThumbsDown, Info, RefreshCw, Sparkles, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ThreadStatus = 'new' | 'reviewed' | 'replied' | 'archived' | 'flagged';
export type RadarPlatform = 'reddit' | 'discord' | 'forum' | 'other';
export type SourcePlatform = 'reddit' | 'bluesky' | 'discord' | 'forum' | 'other';
export type CardType = 'standard' | 'reframe_opportunity';

export interface CommunityThread {
  id: string;
  platform: RadarPlatform;
  subreddit: string | null;
  post_id: string;
  post_title: string;
  post_url: string;
  author: string | null;
  snippet: string | null;
  matched_keywords: string[];
  relevance_score: number;
  status: ThreadStatus;
  notes: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
  source_platform?: SourcePlatform | null;
  source_handle?: string | null;
  match_reason?: { substrate_topic?: string; confidence?: number; matched_phrasings?: string[]; reframe_note?: string } | null;
  card_type?: CardType;
}

interface ThreadCardProps {
  thread: CommunityThread;
  operatorId?: string;
  onStatusChange: (id: string, status: ThreadStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  onSelectTemplate: (thread: CommunityThread) => void;
  onDraftReframe?: (thread: CommunityThread) => void;
}

const statusColors: Record<ThreadStatus, string> = {
  new: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  reviewed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  replied: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  flagged: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

const sourceMeta: Record<SourcePlatform, { prefix: string; label: string; color: string }> = {
  reddit:  { prefix: 'u/', label: 'Reddit',   color: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  bluesky: { prefix: '@',  label: 'Bluesky',  color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  discord: { prefix: '#',  label: 'Discord',  color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  forum:   { prefix: '>>', label: 'Forum',    color: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
  other:   { prefix: '*',  label: 'Other',    color: 'bg-gray-500/15 text-gray-300 border-gray-500/30' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export function ThreadCard({ thread, operatorId, onStatusChange, onNotesChange, onSelectTemplate, onDraftReframe }: ThreadCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [showGemmaNote, setShowGemmaNote] = useState(false);
  const [localNotes, setLocalNotes] = useState(thread.notes || '');
  const [gemmaNote, setGemmaNote] = useState('');
  const [wrongCategory, setWrongCategory] = useState(false);
  const [gemmaSent, setGemmaSent] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<'up' | 'down' | null>(null);

  const source: SourcePlatform = (thread.source_platform as SourcePlatform) || 'other';
  const meta = sourceMeta[source] || sourceMeta.other;
  const handle = thread.source_handle || thread.author || '';
  const handleDisplay = handle.startsWith(meta.prefix) ? handle : `${meta.prefix}${handle.replace(/^[@#]|^u\//, '')}`;
  const isReframe = thread.card_type === 'reframe_opportunity';
  const reason = thread.match_reason || {};

  async function sendFeedback(signal: 'up' | 'down') {
    if (!operatorId) return;
    setFeedbackSent(signal);
    await (supabase as any).from('feedback_signals').insert({
      thread_id: thread.id,
      operator_id: operatorId,
      signal_type: signal,
      substrate_topic: reason.substrate_topic || null,
    });
  }

  async function sendGemmaNote() {
    if (!operatorId || (!gemmaNote.trim() && !wrongCategory)) return;
    const noteBody = [
      wrongCategory ? '[right idea, wrong category]' : null,
      gemmaNote.trim() || null,
    ].filter(Boolean).join(' ');
    await (supabase as any).from('feedback_signals').insert({
      thread_id: thread.id,
      operator_id: operatorId,
      signal_type: 'calibration_note',
      substrate_topic: reason.substrate_topic || null,
      note: noteBody,
    });
    setGemmaSent(true);
    setTimeout(() => {
      setShowGemmaNote(false);
      setGemmaNote('');
      setWrongCategory(false);
      setGemmaSent(false);
    }, 1200);
  }

  return (
    <Card className={`bg-card/50 transition-colors ${
      isReframe
        ? 'border-amber-500/40 hover:border-amber-500/70 ring-1 ring-amber-500/10'
        : 'border-border/50 hover:border-primary/30'
    }`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${meta.color}`}>
                {meta.label}
              </Badge>
              <span className="text-xs font-mono text-muted-foreground truncate max-w-[180px]">
                {handleDisplay}
              </span>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColors[thread.status]}`}>
                {thread.status}
              </Badge>
              {isReframe && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/20 text-amber-300 border-amber-500/40">
                  reframe
                </Badge>
              )}
              {thread.relevance_score > 7 && !isReframe && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-500/20 text-red-300 border-red-500/30">
                  high match
                </Badge>
              )}
            </div>
            <a
              href={thread.post_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2"
            >
              {thread.post_title}
              <ExternalLink className="inline-block ml-1 h-3 w-3 opacity-50" />
            </a>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(thread.created_at)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {thread.snippet && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{thread.snippet}</p>
        )}
        {thread.matched_keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {thread.matched_keywords.map((kw) => (
              <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary/70">
                {kw}
              </span>
            ))}
          </div>
        )}

        {/* Why-this-surfaced */}
        {(reason.substrate_topic || reason.matched_phrasings?.length) && (
          <div className="mb-3">
            <button
              onClick={() => setShowWhy(!showWhy)}
              className="text-[10px] inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <Info className="h-3 w-3" />
              Why this surfaced
            </button>
            {showWhy && (
              <div className="mt-2 p-2 bg-background/40 border border-border/40 rounded text-[11px] space-y-1">
                {reason.substrate_topic && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">substrate:</span>
                    <span className="font-mono text-primary">{reason.substrate_topic}</span>
                  </div>
                )}
                {typeof reason.confidence === 'number' && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-20">confidence:</span>
                    <div className="flex-1 h-1 rounded-full bg-border/40 overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.round(reason.confidence * 100)}%` }} />
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">{Math.round(reason.confidence * 100)}%</span>
                  </div>
                )}
                {reason.matched_phrasings?.length ? (
                  <div>
                    <span className="text-muted-foreground">phrasings:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {reason.matched_phrasings.map((p) => (
                        <span key={p} className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-200 text-[10px]">"{p}"</span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {reason.reframe_note && (
                  <p className="italic text-amber-300/80 mt-1">{reason.reframe_note}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Primary action row: Visit + workflow */}
        <div className="flex items-center gap-1 flex-wrap mb-1">
          <Button
            size="sm"
            variant="default"
            className="h-7 text-xs px-3"
            asChild
          >
            <a href={thread.post_url} target="_blank" rel="noopener noreferrer" title="Open the source discussion in a new tab">
              <ExternalLink className="h-3 w-3 mr-1" /> Visit discussion
            </a>
          </Button>
          {isReframe && onDraftReframe ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2 text-amber-300 hover:bg-amber-500/10"
              onClick={() => onDraftReframe(thread)}
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Draft Reframe
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                onClick={() => onStatusChange(thread.id, 'reviewed')}>
                <Eye className="h-3 w-3 mr-1" /> Review
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                onClick={() => onStatusChange(thread.id, 'replied')}>
                <MessageSquare className="h-3 w-3 mr-1" /> Replied
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                onClick={() => onSelectTemplate(thread)}>
                Templates
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
            onClick={() => onStatusChange(thread.id, 'flagged')} title="Flag for later">
            <Flag className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
            onClick={() => onStatusChange(thread.id, 'archived')} title="Archive">
            <Archive className="h-3 w-3" />
          </Button>
        </div>

        {/* Secondary row: calibration signals */}
        <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-border/30">
          <Button
            size="sm"
            variant="ghost"
            disabled={!operatorId || feedbackSent !== null}
            className={`h-7 text-xs px-2 ${feedbackSent === 'up' ? 'text-emerald-300 bg-emerald-500/10' : 'hover:text-emerald-300'}`}
            onClick={() => sendFeedback('up')}
            title="Relevant — helps Gemma learn what you want"
          >
            <ThumbsUp className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={!operatorId || feedbackSent !== null}
            className={`h-7 text-xs px-2 ${feedbackSent === 'down' ? 'text-rose-300 bg-rose-500/10' : 'hover:text-rose-300'}`}
            onClick={() => sendFeedback('down')}
            title="Off-topic — corrects keyword-match drift"
          >
            <ThumbsDown className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`h-7 text-xs px-2 ${showGemmaNote ? 'text-primary bg-primary/10' : 'hover:text-primary'}`}
            onClick={() => setShowGemmaNote(!showGemmaNote)}
            title="Send a calibration note to Gemma about this surfacing"
          >
            <Sparkles className="h-3 w-3 mr-1" /> Note for Gemma
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs px-2 ml-auto"
            onClick={() => setShowNotes(!showNotes)}
            title="Private notes on this thread (architect-only)">
            Notes
          </Button>
        </div>

        {showGemmaNote && (
          <div className="mt-2 p-2 rounded border border-primary/20 bg-primary/5 space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-display">
              Calibration for Gemma · trains future surfacings
            </p>
            <Textarea
              value={gemmaNote}
              onChange={(e) => setGemmaNote(e.target.value)}
              placeholder="What's off about this surfacing? Or what should I see more of?"
              className="text-xs h-16 bg-background/50"
              disabled={gemmaSent}
            />
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={wrongCategory}
                  onChange={(e) => setWrongCategory(e.target.checked)}
                  className="h-3 w-3 accent-primary"
                  disabled={gemmaSent}
                />
                right idea, wrong category
              </label>
              <Button
                size="sm"
                variant="default"
                className="h-6 text-[11px] px-2"
                disabled={gemmaSent || (!gemmaNote.trim() && !wrongCategory)}
                onClick={sendGemmaNote}
              >
                {gemmaSent ? (
                  <><Check className="h-3 w-3 mr-1" /> sent</>
                ) : (
                  'Send to Gemma'
                )}
              </Button>
            </div>
          </div>
        )}

        {showNotes && (
          <div className="mt-2">
            <Textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={() => onNotesChange(thread.id, localNotes)}
              placeholder="Private notes on this thread..."
              className="text-xs h-16 bg-background/50"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
