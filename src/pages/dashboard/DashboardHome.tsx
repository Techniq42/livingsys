import { useOutletContext } from 'react-router-dom';
import { PortalHub } from '@/components/Primer/PortalHub';
import { SocialDistribution } from '@/components/Primer/SocialDistribution';
import { CoordinationHealth } from '@/components/Primer/CoordinationHealth';
import type { User } from '@supabase/supabase-js';

interface DashboardContext {
  user: User;
  userRole: string;
}

export default function DashboardHome() {
  const { user } = useOutletContext<DashboardContext>();

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-1">
          The Primer
        </h1>
        <p className="text-sm text-muted-foreground italic font-body">
          Hey. Ria here. What are we building today?
        </p>
      </div>
      <PortalHub />
      <SocialDistribution />
      <CoordinationHealth />
    </div>
  );
}
