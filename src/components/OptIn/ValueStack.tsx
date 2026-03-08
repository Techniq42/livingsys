import { BookOpen, GitBranch, Zap, Users, GraduationCap, Shield } from 'lucide-react';

interface ValueStackProps {
  path: 'architect' | 'operator';
}

const sharedItems = [
  {
    icon: BookOpen,
    title: 'The Edge Runner\'s Field Guide',
    description: 'The Sovereign Patch Codex entry point. Coordination frameworks, deployment protocols, and thirty years of pattern recognition.',
    value: 'Free',
  },
  {
    icon: Users,
    title: 'Fellowship Community Access',
    description: 'Join the coordination network. Connect with other practitioners building regenerative infrastructure.',
    value: 'Included',
  },
  {
    icon: GraduationCap,
    title: 'Courses & Webinars',
    description: 'Deep dives into coordination strategy, technology deployment, and the Loading Dock Doctrine methodology.',
    value: 'Included',
  },
];

const architectItems = [
  {
    icon: GitBranch,
    title: 'Full Open-Source Repository',
    description: 'Complete n8n workflows, infrastructure configs, and deployment guides. Fork it. Own every node.',
    value: 'Free',
  },
  {
    icon: Shield,
    title: 'Chaos Mage Archive',
    description: 'Advanced sovereignty patterns, decentralized coordination models, and edge-case infrastructure designs developed over years of field work.',
    value: 'Included',
  },
];

const operatorItems = [
  {
    icon: Zap,
    title: 'GoHighLevel Snapshot',
    description: 'Pre-configured funnel sequences, email automation, SMS coordination workflows. 10-minute installation.',
    value: 'Included',
  },
  {
    icon: Shield,
    title: 'AI SEO Strategies & Toolkit',
    description: 'Search optimization frameworks designed for regenerative practitioners. Updated as new tools and strategies emerge.',
    value: 'Included',
  },
];

export function ValueStack({ path }: ValueStackProps) {
  const isArchitect = path === 'architect';
  const pathItems = isArchitect ? architectItems : operatorItems;
  const allItems = [...sharedItems, ...pathItems];
  const accentColor = isArchitect ? 'primary' : 'secondary';

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground mb-4">
        Here's everything you get
      </p>

      {allItems.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={i}
            className={`border border-border bg-card rounded-sm p-4 flex items-start gap-4 hover:border-${accentColor}/50 transition-colors`}
          >
            <Icon className={`w-5 h-5 text-${accentColor} mt-0.5 shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="text-sm font-bold font-display text-foreground">{item.title}</h4>
                <span className={`text-[10px] font-display tracking-wider uppercase text-${accentColor} shrink-0`}>
                  {item.value}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">{item.description}</p>
            </div>
          </div>
        );
      })}

      {/* Stack total — Brunson style */}
      <div className={`border border-${accentColor}/30 bg-${accentColor}/5 rounded-sm p-4 mt-4`}>
        <p className="text-sm font-display text-foreground text-center">
          Total value of this toolkit: <span className={`text-${accentColor} font-bold`}>Priceless</span>
          <br />
          <span className="text-xs text-muted-foreground">
            Your cost: <span className="text-foreground font-bold">$0</span> — because coordination tools should be free.
          </span>
        </p>
      </div>
    </div>
  );
}
