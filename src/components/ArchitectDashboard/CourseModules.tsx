import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lock, CheckCircle2, Circle, ChevronRight } from 'lucide-react';

export function CourseModules() {
  const { data: modules, isLoading } = useQuery({
    queryKey: ['course_modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // For now, progress is visual-only (first module "in progress", rest not started)
  const getStatus = (index: number, locked: boolean) => {
    if (locked) return 'locked';
    if (index === 0) return 'in_progress';
    return 'not_started';
  };

  return (
    <section id="modules" className="mb-12">
      <p className="section-label mb-4">Course Modules</p>
      <h2 className="text-xl md:text-2xl font-bold font-display text-foreground mb-6">
        Build Path
      </h2>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-border bg-card rounded-sm p-5 animate-pulse">
              <div className="h-5 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {modules?.map((mod, index) => {
            const status = getStatus(index, mod.is_locked);
            const isLocked = status === 'locked';

            return (
              <div
                key={mod.id}
                className={`border rounded-sm p-5 flex items-start gap-4 transition-all ${
                  isLocked
                    ? 'border-border/50 bg-card/50 opacity-60'
                    : 'border-border bg-card hover:border-primary/40 cursor-pointer'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isLocked ? (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  ) : status === 'in_progress' ? (
                    <Circle className="w-5 h-5 text-primary" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-primary/40" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground font-mono">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-base font-bold font-display text-foreground">
                      {mod.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {mod.description}
                  </p>

                  {status === 'in_progress' && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: '15%' }} />
                      </div>
                      <span className="text-xs text-primary font-mono">15%</span>
                    </div>
                  )}
                </div>

                {!isLocked && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
