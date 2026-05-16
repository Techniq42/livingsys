import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, ExternalLink } from 'lucide-react';

type CanonPage = {
  id: string;
  slug: string;
  title: string;
  url: string;
  summary: string | null;
  audience: string | null;
  methodology_tags: string[] | null;
  substrate_topics: string[] | null;
  sort_order: number;
};

export default function Canon() {
  const [pages, setPages] = useState<CanonPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('canon_pages')
        .select('id, slug, title, url, summary, audience, methodology_tags, substrate_topics, sort_order')
        .eq('status', 'active')
        .order('sort_order', { ascending: true });
      setPages((data as CanonPage[]) || []);
      setLoading(false);
    })();

    document.title = 'Canon — Living Systems';
    const desc = document.querySelector('meta[name="description"]');
    const content =
      'The canonical reading list for the Living Systems substrate — every door the work walks through, indexed.';
    if (desc) desc.setAttribute('content', content);
    else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = content;
      document.head.appendChild(m);
    }
    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = `${window.location.origin}/canon`;
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-card/30 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-display text-primary/80">Canon</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight mb-3">
            The reading list for this work
          </h1>
          <p className="text-base text-muted-foreground italic font-body max-w-2xl leading-relaxed">
            Every page below is canon — a door we recommend to a specific audience, paired with a methodology and a
            frame. The system reasons over this list when it decides what to surface to whom. Read in any order.
          </p>
          <p className="mt-4 text-xs text-muted-foreground/70">
            <Link to="/" className="hover:text-primary underline-offset-4 hover:underline">← Back to the landing page</Link>
          </p>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-10">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading canon…</p>
        ) : pages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No canon pages published yet.</p>
        ) : (
          <ul className="space-y-6">
            {pages.map((p) => (
              <li key={p.id} className="border border-border bg-card/50 rounded-sm p-5 hover:border-primary/40 transition-colors">
                <a href={p.url} target="_blank" rel="noopener" className="group block">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h2 className="text-xl font-bold font-display group-hover:text-primary transition-colors">
                      {p.title}
                    </h2>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-1" />
                  </div>
                  {p.audience && (
                    <p className="text-[11px] uppercase tracking-wider font-display text-primary/70 mb-2">
                      For: {p.audience}
                    </p>
                  )}
                  {p.summary && (
                    <p className="text-sm text-foreground/80 leading-relaxed mb-3">{p.summary}</p>
                  )}
                  {(p.methodology_tags?.length || p.substrate_topics?.length) ? (
                    <div className="flex flex-wrap gap-1.5">
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
                  <p className="mt-3 text-[11px] text-muted-foreground/60 font-mono break-all">{p.url}</p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="border-t border-border/40 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-8 text-xs text-muted-foreground/60">
          Canon is curated, not crowdsourced. Suggest an addition by reaching out through the landing page.
        </div>
      </footer>
    </main>
  );
}
