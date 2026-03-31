import { BarChart3 } from 'lucide-react';

export default function DashboardFunnels() {
  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">Funnel Performance</h1>
        </div>
        <p className="text-sm text-muted-foreground italic font-body">
          Constellation metrics. Who's entering, who's converting, who's stuck.
        </p>
      </div>
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-display text-sm">Funnel tracking coming in Phase 4.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Tables will be wired once n8n pushes GHL events.
          </p>
        </div>
      </div>
    </div>
  );
}
