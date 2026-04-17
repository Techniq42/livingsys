import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthPage } from '@/components/Auth/AuthPage';
import { DashboardSidebar } from '@/components/Dashboard/DashboardSidebar';
import { RoomTopBar } from '@/components/Dashboard/RoomTopBar';
import { CodexFloatingWidget } from '@/components/ArchitectDashboard/CodexFloatingWidget';
import { ReduceMotionProvider } from '@/hooks/use-reduce-motion';
import { RoomProvider, useRoom } from '@/contexts/RoomContext';
import type { User } from '@supabase/supabase-js';

function DashboardMain({ user, userRole }: { user: User; userRole: string }) {
  const { currentRoom } = useRoom();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    el.setAttribute('data-room', currentRoom);
    // CSS variables defined in index.css under [data-room="..."]
    // cascade into descendants automatically.
  }, [currentRoom]);

  return (
    <div className="h-screen flex bg-background">
      <DashboardSidebar email={user.email || ''} role={userRole} />
      <main
        ref={mainRef}
        data-room={currentRoom}
        className="flex-1 flex flex-col overflow-hidden"
        style={{ background: 'var(--room-bg, #0f1419)', color: 'var(--room-text, #e0e0e0)' }}
      >
        <RoomTopBar />
        <div className="flex-1 overflow-y-auto">
          <Outlet context={{ user, userRole }} />
        </div>
      </main>
      <CodexFloatingWidget />
    </div>
  );
}

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
      <RoomProvider>
        <DashboardMain user={user} userRole={userRole} />
      </RoomProvider>
    </ReduceMotionProvider>
  );
}
