import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthPage } from '@/components/Auth/AuthPage';
import { DashboardSidebar } from '@/components/Dashboard/DashboardSidebar';
import { CodexChat } from '@/components/Dashboard/CodexChat';
import { BookOpen, GitBranch, History } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

const GITHUB_REPO = 'https://github.com/Techniq42/fls-ghl-infrastructure';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState('practitioner');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        // Fetch role
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
    <div className="h-screen flex bg-background">
      <DashboardSidebar
        email={user.email || ''}
        role={userRole}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'chat' && (
          <CodexChat userId={user.id} userRole={userRole} />
        )}

        {activeTab === 'sessions' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <History className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-display text-sm">Session history coming soon.</p>
            </div>
          </div>
        )}

        {activeTab === 'fieldguide' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-display text-sm">Field Guide access available after opt-in.</p>
            </div>
          </div>
        )}

        {activeTab === 'repository' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <GitBranch className="w-8 h-8 text-primary mx-auto mb-4" />
              <p className="text-foreground font-display text-sm mb-4">Open Source Infrastructure</p>
              <a
                href={GITHUB_REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-primary text-foreground px-6 py-3 rounded-sm font-display text-sm tracking-wider hover:bg-primary hover:text-primary-foreground transition-all"
              >
                View Repository →
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
