import { GitFork } from 'lucide-react';

export default function DashboardSortingHat() {
  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <GitFork className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">The Sorting Hat</h1>
        </div>
        <p className="text-sm text-muted-foreground italic font-body">
          Route contacts to the right pathway. Entry → signals → funnel.
        </p>
      </div>
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <GitFork className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-display text-sm">Routing engine coming in Phase 5.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Visual rule builder and contact journey visualization.
          </p>
        </div>
      </div>
    </div>
  );
}
