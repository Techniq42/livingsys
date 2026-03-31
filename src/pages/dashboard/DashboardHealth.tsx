import { CoordinationHealth } from '@/components/Primer/CoordinationHealth';
import { Activity } from 'lucide-react';

export default function DashboardHealth() {
  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">Ecosystem Health</h1>
        </div>
        <p className="text-sm text-muted-foreground italic font-body">
          Green means go. Red means Ria's already looking into it.
        </p>
      </div>
      <CoordinationHealth />
    </div>
  );
}
