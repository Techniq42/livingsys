import { ExternalLink, MessageSquare, Archive, Flag, Eye, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

export type ThreadStatus = 'new' | 'reviewed' | 'replied' | 'archived' | 'flagged';
export type RadarPlatform = 'reddit' | 'discord' | 'forum' | 'other';

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
}

interface ThreadCardProps {
  thread: CommunityThread;
  onStatusChange: (id: string, status: ThreadStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  onSelectTemplate: (thread: CommunityThread) => void;
}

const statusColors: Record<ThreadStatus, string> = {
  new: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  reviewed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  replied: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  flagged: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

const platformIcons: Record<RadarPlatform, string> = {
  reddit: 'r/',
  discord: '#',
  forum: '>>',
  other: '*',
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

export function ThreadCard({ thread, onStatusChange, onNotesChange, onSelectTemplate }: ThreadCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState(thread.notes || '');

  return (
    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground">
                {platformIcons[thread.platform]}{thread.subreddit}
              </span>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColors[thread.status]}`}>
                {thread.status}
              </Badge>
              {thread.relevance_score > 7 && (
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
        {thread.author && (
          <p className="text-[10px] text-muted-foreground mb-3">by u/{thread.author}</p>
        )}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-2"
            onClick={() => onStatusChange(thread.id, 'reviewed')}
            title="Mark reviewed"
          >
            <Eye className="h-3 w-3 mr-1" /> Review
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-2"
            onClick={() => onStatusChange(thread.id, 'replied')}
            title="Mark replied"
          >
            <MessageSquare className="h-3 w-3 mr-1" /> Replied
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-2"
            onClick={() => onSelectTemplate(thread)}
            title="Show reply templates"
          >
            Templates
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-2"
            onClick={() => onStatusChange(thread.id, 'flagged')}
            title="Flag for later"
          >
            <Flag className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-2"
            onClick={() => onStatusChange(thread.id, 'archived')}
            title="Archive"
          >
            <Archive className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-2 ml-auto"
            onClick={() => setShowNotes(!showNotes)}
          >
            Notes
          </Button>
        </div>
        {showNotes && (
          <div className="mt-2">
            <Textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={() => onNotesChange(thread.id, localNotes)}
              placeholder="Add notes about this thread..."
              className="text-xs h-16 bg-background/50"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
