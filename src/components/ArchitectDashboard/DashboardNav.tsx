import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, User } from 'lucide-react';

interface DashboardNavProps {
  userEmail?: string | null;
}

export function DashboardNav({ userEmail }: DashboardNavProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 md:px-8 h-14">
        <div className="flex items-center gap-8">
          <a
            href="/"
            className="text-xs tracking-[0.25em] uppercase text-foreground/70 font-display hover:text-foreground transition-colors"
          >
            Fellowship of Living Systems
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm font-display tracking-wider">
            <a href="#resources" className="text-muted-foreground hover:text-foreground transition-colors">Resources</a>
            <a href="#modules" className="text-muted-foreground hover:text-foreground transition-colors">Modules</a>
            <a href="#community" className="text-muted-foreground hover:text-foreground transition-colors">Community</a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="hidden md:inline text-xs font-mono truncate max-w-[180px]">{userEmail}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
