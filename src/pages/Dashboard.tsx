import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthPage } from '@/components/Auth/AuthPage';
import { DashboardSidebar } from '@/components/Dashboard/DashboardSidebar';
import { CodexFloatingWidget } from '@/components/ArchitectDashboard/CodexFloatingWidget';
import { ReduceMotionProvider } from '@/hooks/use-reduce-motion';
import type { User } from '@supabase/supabase-js';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState('practitioner');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setUserRole(data.role);
          });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setUserRole(data.role);
          });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="w-3 h-3 rounded-full bg-primary animate-pulse-dot" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <ReduceMotionProvider>
      <div className="h-screen flex bg-background">
        <DashboardSidebar email={user.email || ''} role={userRole} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <Outlet context={{ user, userRole }} />
          </div>
        </main>
        <CodexFloatingWidget />
      </div>
    </ReduceMotionProvider>
  );
}
