import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, X, Copy } from 'lucide-react';
import type { CommunityThread } from './ThreadCard';

export interface ReplyTemplate {
  id: string;
  category: string;
  title: string;
  scaffold: string;
  keywords: string[];
  funnel_url: string | null;
  is_active: boolean;
  sort_order: number;
}

interface TemplatePanelProps {
  thread: CommunityThread | null;
  templates: ReplyTemplate[];
  onClose: () => void;
}

function matchScore(threadKeywords: string[], templateKeywords: string[]): number {
  const lower = threadKeywords.map(k => k.toLowerCase());
  return templateKeywords.filter(tk => lower.some(k => k.includes(tk.toLowerCase()) || tk.toLowerCase().includes(k))).length;
}

export function TemplatePanel({ thread, templates, onClose }: TemplatePanelProps) {
  if (!thread) return null;

  const ranked = [...templates]
    .map(t => ({ ...t, score: matchScore(thread.matched_keywords, t.keywords) }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-background border-l border-border shadow-xl z-50 overflow-y-auto">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">Reply Templates</h3>
        <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-3">
        <p className="text-[10px] text-muted-foreground mb-3 line-clamp-2">
          For: {thread.post_title}
        </p>
        <div className="space-y-3">
          {ranked.map((template) => (
            <Card key={template.id} className={`bg-card/50 ${template.score > 0 ? 'border-primary/30' : 'border-border/50'}`}>
              <CardHeader className="pb-1 pt-3 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs">{template.title}</CardTitle>
                  {template.score > 0 && (
                    <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {template.score} match{template.score > 1 ? 'es' : ''}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
                  {template.scaffold}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] px-2"
                    onClick={() => navigator.clipboard.writeText(template.scaffold)}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                  {template.funnel_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-2"
                      onClick={() => navigator.clipboard.writeText(template.funnel_url!)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" /> Copy Link
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
