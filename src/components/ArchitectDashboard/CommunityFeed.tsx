import { MessageSquare, GitFork, Zap, Users } from 'lucide-react';

const feedItems = [
  {
    icon: GitFork,
    user: 'jm_colorado',
    action: 'forked the coordination stack',
    time: '2 hours ago',
    color: 'text-primary',
  },
  {
    icon: Zap,
    user: 'sori_village_node',
    action: 'deployed n8n workflow: community-food-routing',
    time: '5 hours ago',
    color: 'text-secondary',
  },
  {
    icon: MessageSquare,
    user: 'edge_runner_42',
    action: 'shared field notes from blast chiller deployment',
    time: '1 day ago',
    color: 'text-primary',
  },
  {
    icon: Users,
    user: 'reno_coop',
    action: 'connected 3 new vendor nodes to the network',
    time: '2 days ago',
    color: 'text-secondary',
  },
  {
    icon: GitFork,
    user: 'humisoil_lab',
    action: 'pushed update: soil-amendment-calculator v2.1',
    time: '3 days ago',
    color: 'text-primary',
  },
];

export function CommunityFeed() {
  return (
    <section id="community" className="mb-12">
      <p className="section-label mb-4">Community Feed</p>
      <h2 className="text-xl md:text-2xl font-bold font-display text-foreground mb-6">
        Network Activity
      </h2>

      <div className="border border-border bg-card rounded-sm divide-y divide-border">
        {feedItems.map((item, i) => (
          <div key={i} className="px-5 py-4 flex items-start gap-3">
            <item.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-mono text-primary text-xs">{item.user}</span>{' '}
                <span className="text-muted-foreground">{item.action}</span>
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5 font-mono">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
