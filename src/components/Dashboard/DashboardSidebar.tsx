import { Home, Upload, Radar, Activity, BarChart3, GitFork, Settings, LogOut, Sparkles, Map } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { supabase } from '@/integrations/supabase/client';

interface DashboardSidebarProps {
  email: string;
  role: string;
}

const navItems = [
  { to: '/dashboard', label: 'The Room', icon: Home, end: true },
  { to: '/dashboard/intake', label: 'Content Intake', icon: Upload, end: false },
  { to: '/dashboard/radar', label: 'Community Radar', icon: Radar, end: false },
  { to: '/dashboard/health', label: 'Health', icon: Activity, end: false },
  { to: '/dashboard/funnels', label: 'Funnels', icon: BarChart3, end: false },
  { to: '/dashboard/sorting-hat', label: 'Sorting Hat', icon: GitFork, end: false },
  { to: '/dashboard/constellation', label: 'Constellation', icon: Map, end: false },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings, end: false },
];

export function DashboardSidebar({ email, role }: DashboardSidebarProps) {
  const { reduceMotion, toggleReduceMotion } = useReduceMotion();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const roleBadgeColor: Record<string, string> = {
    practitioner: 'text-primary border-primary/30',
    healer: 'text-secondary border-secondary/30',
    administrator: 'text-destructive border-destructive/30',
    architect: 'text-coral border-coral/30',
  };

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-display mb-1">
          The Primer
        </p>
        <p className="text-foreground font-display text-sm">Sovereign OS</p>
      </div>

      <div className="px-6 py-4 border-b border-border">
        <span className={`inline-block text-[10px] font-display tracking-wider uppercase border rounded-lg px-2 py-1 ${roleBadgeColor[role] || roleBadgeColor.practitioner}`}>
          {role}
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-display transition-all min-h-[44px] text-muted-foreground hover:text-foreground hover:bg-accent/50"
            activeClassName="bg-accent text-primary"
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        <button
          onClick={toggleReduceMotion}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-display tracking-wider min-h-[44px] w-full"
        >
          <Sparkles className="w-3 h-3" />
          {reduceMotion ? 'Motion: Off' : 'Motion: On'}
        </button>
        <p className="text-xs text-muted-foreground truncate">{email}</p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-display tracking-wider min-h-[44px]"
        >
          <LogOut className="w-3 h-3" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
