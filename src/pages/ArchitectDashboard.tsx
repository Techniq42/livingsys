import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardNav } from '@/components/ArchitectDashboard/DashboardNav';
import { ResourceLibrary } from '@/components/ArchitectDashboard/ResourceLibrary';
import { CourseModules } from '@/components/ArchitectDashboard/CourseModules';
import { CommunityFeed } from '@/components/ArchitectDashboard/CommunityFeed';
import { QuickActions } from '@/components/ArchitectDashboard/QuickActions';
import { CodexFloatingWidget } from '@/components/ArchitectDashboard/CodexFloatingWidget';
import { ContentEngine } from '@/components/ArchitectDashboard/ContentEngine';
import type { Session } from '@supabase/supabase-js';

export default function ArchitectDashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes (including token recovery from email links)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false);
      // Only redirect if we've confirmed there's no session AND it's not an initial loading event
      if (!session && event === 'SIGNED_OUT') {
        navigate('/architect-login');
      }
    });

    // Check for existing session, but don't redirect immediately
    // because the URL hash fragment may still be processing
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setLoading(false);
      } else {
        // Give the auth callback hash time to be processed before redirecting
        // If there's a hash fragment, the onAuthStateChange will fire
        const hasAuthHash = window.location.hash.includes('access_token') || 
                           window.location.hash.includes('type=');
        if (!hasAuthHash) {
          setLoading(false);
          navigate('/architect-login');
        }
        // If there IS a hash, wait for onAuthStateChange to handle it
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-primary animate-pulse-dot" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav userEmail={session.user.email} />

      <div className="px-6 md:px-8 py-10">
        {/* Welcome banner */}
        <div className="mb-10">
          <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">
            Architect Dashboard
          </h1>
          <p className="text-muted-foreground">
            Your coordination node is active. Build, fork, deploy.
          </p>
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-[1fr_280px] gap-10">
          <div>
            <ResourceLibrary />
            <CourseModules />
            <CommunityFeed />
          </div>
          <QuickActions />
        </div>
      </div>

      <CodexFloatingWidget />
    </div>
  );
}
