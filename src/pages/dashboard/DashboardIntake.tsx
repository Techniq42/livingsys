import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ContentIntake } from '@/components/Primer/ContentIntake';
import { JobStatusList } from '@/components/Primer/JobStatusList';
import type { User } from '@supabase/supabase-js';

interface DashboardContext {
  user: User;
  userRole: string;
}

export default function DashboardIntake() {
  const { user } = useOutletContext<DashboardContext>();
  const [jobRefreshKey, setJobRefreshKey] = useState(0);

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground mb-1">Content Intake</h1>
        <p className="text-sm text-muted-foreground italic font-body">
          Drop it in. Ria will figure out what it is.
        </p>
      </div>
      <ContentIntake userId={user.id} onJobCreated={() => setJobRefreshKey((k) => k + 1)} />
      <JobStatusList userId={user.id} refreshKey={jobRefreshKey} />
    </div>
  );
}
