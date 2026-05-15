import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter } from 'lucide-react';

type Topic = { slug: string; name: string; status: string };

export function SubstrateFilterIndicator() {
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('topic_verticals')
        .select('slug,name,status')
        .order('name');
      if (data) setTopics(data);
    })();
  }, []);

  const activeCount = topics.filter((t) => t.status === 'active').length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[10px] uppercase tracking-wider hover:bg-emerald-500/20 transition-colors">
          <Filter className="h-3 w-3" />
          Substrate filter active · {activeCount}
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Substrate definitions loaded</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          <p className="text-xs text-muted-foreground italic">
            Topics currently shaping the meaning layer. Upstream Gemma applies the no-list, exemplars, and reframe heuristics for each.
          </p>
          {topics.length === 0 && <p className="text-sm text-muted-foreground">No substrate topics loaded.</p>}
          {topics.map((t) => (
            <div key={t.slug} className="flex items-center justify-between py-2 border-b border-border/30">
              <div>
                <p className="text-sm font-display">{t.name}</p>
                <p className="text-[10px] font-mono text-muted-foreground">{t.slug}</p>
              </div>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                t.status === 'active'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-border text-muted-foreground'
              }`}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
