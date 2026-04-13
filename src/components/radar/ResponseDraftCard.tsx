import { ExternalLink, Check, X, Clock, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export interface ResponseDraft {
  id: string;
  thread_id: string | null;
  draft_body: string;
  classifier_tier: number;
  classifier_reasoning: string | null;
  safety_flags: unknown[];
  auto_posted: boolean;
  auto_posted_at: string | null;
  reddit_comment_id: string | null;
  reddit_comment_url: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // joined from thread
  post_title?: string;
  post_url?: string;
  subreddit?: string;
}

const tierConfig: Record<number, { label: string; className: string }> = {
  1: { label: 'T1', className: 'border-primary/60 text-primary bg-primary/10' },
  2: { label: 'T2', className: 'border-secondary/60 text-secondary bg-secondary/10' },
  3: { label: 'T3', className: 'border-coral/60 text-coral bg-coral/10' },
};

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning border-warning/30',
  approved: 'bg-primary/20 text-primary border-primary/30',
  posted: 'bg-primary/20 text-primary border-primary/30',
  rejected: 'bg-muted text-muted-foreground border-border',
  blocked: 'bg-destructive/20 text-destructive border-destructive/30',
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

interface ResponseDraftCardProps {
  draft: ResponseDraft;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isArchitect: boolean;
}

export function ResponseDraftCard({ draft, onApprove, onReject, isArchitect }: ResponseDraftCardProps) {
  const tier = tierConfig[draft.classifier_tier] || tierConfig[2];

  return (
    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-mono ${tier.className}`}>
                {tier.label}
              </Badge>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColors[draft.status] || ''}`}>
                {draft.status}
              </Badge>
              {draft.auto_posted && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/40 text-primary/70 bg-primary/5">
                  <Bot className="h-2.5 w-2.5 mr-0.5" /> auto
                </Badge>
              )}
              {draft.subreddit && (
                <span className="text-[10px] font-mono text-muted-foreground">r/{draft.subreddit}</span>
              )}
            </div>
            {draft.post_title && (
              <a
                href={draft.post_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
              >
                {draft.post_title}
                <ExternalLink className="inline-block ml-1 h-2.5 w-2.5 opacity-50" />
              </a>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(draft.created_at)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-xs text-muted-foreground mb-3 line-clamp-4 whitespace-pre-wrap leading-relaxed">
          {draft.draft_body}
        </p>
        {draft.classifier_reasoning && (
          <p className="text-[10px] text-muted-foreground/60 italic mb-3 line-clamp-2">
            Reasoning: {draft.classifier_reasoning}
          </p>
        )}
        {draft.reddit_comment_url && (
          <a
            href={draft.reddit_comment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary hover:underline mb-3 block"
          >
            View posted comment →
          </a>
        )}
        {isArchitect && draft.status === 'pending' && (
          <div className="flex items-center gap-1.5 mt-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2 text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => onApprove(draft.id)}
            >
              <Check className="h-3 w-3 mr-1" /> Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onReject(draft.id)}
            >
              <X className="h-3 w-3 mr-1" /> Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
