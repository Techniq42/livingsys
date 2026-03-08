import { GitFork, MessageCircle, Bot, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: GitFork,
      label: 'Fork the Repo',
      description: 'Clone the full coordination stack',
      onClick: () => window.open('https://github.com', '_blank'),
      variant: 'primary' as const,
    },
    {
      icon: MessageCircle,
      label: 'Join Discord',
      description: 'Connect with other edge runners',
      onClick: () => window.open('https://discord.gg', '_blank'),
      variant: 'secondary' as const,
    },
    {
      icon: Bot,
      label: 'Access Codex AI',
      description: 'Query the knowledge base',
      onClick: () => navigate('/dashboard'),
      variant: 'primary' as const,
    },
  ];

  return (
    <aside>
      <p className="section-label mb-4">Quick Actions</p>
      <div className="space-y-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`w-full border rounded-sm p-4 text-left flex items-start gap-3 transition-all cursor-pointer ${
              action.variant === 'primary'
                ? 'border-border bg-card hover:border-primary/50 hover:glow-green'
                : 'border-secondary/30 bg-[hsl(37_30%_6%)] hover:border-secondary/60 hover:glow-gold'
            }`}
          >
            <action.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              action.variant === 'primary' ? 'text-primary' : 'text-secondary'
            }`} />
            <div>
              <p className="text-sm font-bold font-display text-foreground flex items-center gap-1.5">
                {action.label}
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
