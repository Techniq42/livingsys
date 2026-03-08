import { MessageSquare, History, BookOpen, GitBranch, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardSidebarProps {
  email: string;
  role: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'chat', label: 'Codex Chat', icon: MessageSquare },
  { id: 'sessions', label: 'My Sessions', icon: History },
  { id: 'fieldguide', label: 'Field Guide', icon: BookOpen },
  { id: 'repository', label: 'Repository', icon: GitBranch },
];

export function DashboardSidebar({ email, role, activeTab, onTabChange }: DashboardSidebarProps) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const roleBadgeColor = {
    practitioner: 'text-primary border-primary/30',
    healer: 'text-secondary border-secondary/30',
    administrator: 'text-destructive border-destructive/30',
  }[role] || 'text-primary border-primary/30';

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-display mb-1">
          Fellowship of Living Systems
        </p>
        <p className="text-foreground font-display text-sm">Sovereign OS v1.0</p>
      </div>

      <div className="px-6 py-4 border-b border-border">
        <span className={`inline-block text-[10px] font-display tracking-wider uppercase border rounded-sm px-2 py-1 ${roleBadgeColor}`}>
          {role}
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-display transition-all cursor-pointer ${
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
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-display tracking-wider"
        >
          <LogOut className="w-3 h-3" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
