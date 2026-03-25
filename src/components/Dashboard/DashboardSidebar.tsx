import { MessageSquare, History, BookOpen, GitBranch, LogOut, Home, Radio } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardSidebarProps {
  email: string;
  role: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'room', label: 'The Room', icon: Home },
  { id: 'chat', label: 'Codex Chat', icon: MessageSquare },
  { id: 'sessions', label: 'My Sessions', icon: History },
  { id: 'fieldguide', label: 'Field Guide', icon: BookOpen },
  { id: 'repository', label: 'Repository', icon: GitBranch },
];

export function DashboardSidebar({ email, role, activeTab, onTabChange }: DashboardSidebarProps) {
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
        <p className="text-foreground font-display text-sm">Regenerative Impact Alliance</p>
      </div>

      <div className="px-6 py-4 border-b border-border">
        <span className={`inline-block text-[10px] font-display tracking-wider uppercase border rounded-lg px-2 py-1 ${roleBadgeColor[role] || roleBadgeColor.practitioner}`}>
          {role}
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-display transition-all cursor-pointer min-h-[44px] ${
              activeTab === item.id
                ? 'bg-accent text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground truncate mb-3">{email}</p>
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
