import { ExternalLink } from 'lucide-react';

const briefings = [
  {
    label: 'Origin Story',
    title: 'The Mirror — A Personal Pattern Recognition',
    description: 'Thirty years of coordination work. From Army arms rooms to Kenyan villages. The pattern that keeps repeating.',
    url: 'https://mirror.xyz/0xDf69D03098671F885130fA5AA88F170f348DC800/MWcNQ7vVdy-9Ap9LKfBNHWzI8IJ7IjQ4K3kaedxU7Bg',
  },
  {
    label: 'Data Room',
    title: 'The Crash — Full Briefing Deck',
    description: 'Entry point to the complete evidence base. Coordination failure mapped across food, water, soil, and community infrastructure.',
    url: 'https://gamma.app/docs/The-Crash-bem3erkp2jdtbm5',
  },
  {
    label: 'Infrastructure',
    title: 'Build What Institutions Can\'t — The Sori Village Model',
    description: '$10,000. One server. Raspberry Pi workstations. Solar backup. Global connectivity for an entire community center.',
    url: 'https://livingsys.org/community-power/build-what-institutions-cant/',
  },
  {
    label: 'Strategy',
    title: 'The Loading Dock Doctrine — 2026 State of the System',
    description: 'The front door is policy. The loading dock is where the work happens. A battle cry for routing around institutional dysfunction.',
    url: 'https://livingsys.org/climate-solutions/the-2026-state-of-the-system-the-loading-dock-doctrine/',
  },
  {
    label: 'Analysis',
    title: 'The Gatekeeper Didn\'t Hold Knowledge — It Held The Map',
    description: 'Why institutional resistance is market validation. The coordination layer nobody is building.',
    url: 'https://livingsys.org/climate-solutions/the-gatekeeper-didnt-hold-knowledge-it-held-the-map/',
  },
];

export function DataRoomBlock() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-12 lg:px-16 border-t border-border">
      <div className="max-w-5xl">
        <p className="section-label mb-6">Intelligence Briefings</p>
        <h2 className="text-2xl md:text-4xl font-bold font-display leading-tight mb-4 text-foreground">
          Go deeper. Read the source material.
        </h2>
        <p className="text-muted-foreground text-base md:text-lg mb-12 max-w-2xl">
          These aren't blog posts. They're field reports from thirty years of coordination work. Read them if you want to understand what you're building on.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {briefings.map((b) => (
            <a
              key={b.url}
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-border bg-card rounded-sm p-5 flex flex-col hover:border-primary hover:glow-green transition-all"
            >
              <span className="text-[10px] font-display tracking-[0.2em] uppercase text-primary mb-3">
                {b.label}
              </span>
              <h3 className="text-sm font-bold font-display text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">
                {b.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-4">
                {b.description}
              </p>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-primary font-display tracking-wider">
                Read briefing
                <ExternalLink className="w-3 h-3" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
