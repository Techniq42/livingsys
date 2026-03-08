import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, GitBranch, Database, Rocket, ExternalLink } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  book: BookOpen,
  workflow: GitBranch,
  database: Database,
  rocket: Rocket,
};

export function ResourceLibrary() {
  const { data: resources, isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  return (
    <section id="resources" className="mb-12">
      <p className="section-label mb-4">Resource Library</p>
      <h2 className="text-xl md:text-2xl font-bold font-display text-foreground mb-6">
        Your Toolkit
      </h2>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-border bg-card rounded-sm p-6 animate-pulse">
              <div className="w-8 h-8 bg-muted rounded mb-4" />
              <div className="h-5 bg-muted rounded w-2/3 mb-2" />
              <div className="h-4 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {resources?.map((resource) => {
            const Icon = iconMap[resource.icon] || BookOpen;
            return (
              <div
                key={resource.id}
                className="border border-border bg-card rounded-sm p-6 hover:border-primary/50 transition-all group"
              >
                <Icon className="w-7 h-7 text-primary mb-3" />
                <h3 className="text-base font-bold font-display text-foreground mb-1">
                  {resource.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {resource.description}
                </p>
                <a
                  href={resource.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary font-display tracking-wider hover:underline"
                >
                  Access <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
