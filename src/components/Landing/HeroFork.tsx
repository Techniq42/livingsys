import { Terminal, Zap } from 'lucide-react';

interface HeroForkProps {
  onSelectPath: (path: 'architect' | 'operator') => void;
  selectedPath: 'architect' | 'operator' | null;
}

export function HeroFork({ onSelectPath }: HeroForkProps) {
  return (
    <section className="relative min-h-screen grid-overlay">
      {/* Logo */}
      <a
        href="https://livingsys.org"
        className="absolute top-8 left-6 md:left-12 lg:left-16 text-xs tracking-[0.25em] uppercase text-muted-foreground font-display hover:text-foreground transition-colors z-10"
      >
        Fellowship of Living Systems
      </a>

      <div className="min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-16 pt-20 pb-12">
        {/* Top: Pre-headline + Headline */}
        <div className="mb-8 lg:mb-10 max-w-5xl">
          <p className="section-label mb-4">
            Coordination failure costs $970B annually
          </p>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold font-display leading-tight text-foreground text-balance">
            The food system isn't broken. It was never designed to do what you think it was.
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed">
            There is a $970 billion ghost haunting every failed community project, every rural town watching its resources extracted upstream. The ghost has a name: coordination failure. Choose your path to fixing it.
          </p>
        </div>

        {/* Two Cards — above the fold */}
        <div className="grid md:grid-cols-2 gap-5 max-w-5xl">
          {/* Architect Card */}
          <div className="border border-border bg-card rounded-sm p-6 lg:p-8 flex flex-col hover:border-primary hover:glow-green transition-all">
            <Terminal className="w-7 h-7 text-primary mb-4" />
            <h3 className="text-lg font-bold font-display text-foreground mb-0.5">The Architect</h3>
            <p className="text-primary text-xs font-display tracking-wider uppercase mb-4">DIY — Open Source</p>

            <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-1">
              Own your stack. Fork it. Adapt it. Build something your community owns. Full n8n workflows, open-source infrastructure, and documentation included.
            </p>

            <ul className="space-y-2 mb-6 text-xs">
              {[
                'Complete n8n automation workflows',
                'Open-source GHL infrastructure snapshot',
                'GitHub repository access',
                'Full documentation and setup guides',
                'Community support network',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-foreground">
                  <span className="text-primary mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={() => onSelectPath('architect')}
              className="w-full border border-primary text-foreground py-3 rounded-sm font-display text-sm tracking-wider hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
            >
              I Build My Own Infrastructure →
            </button>
          </div>

          {/* Operator Card */}
          <div className="border border-secondary/40 bg-[hsl(37_30%_6%)] rounded-sm p-6 lg:p-8 flex flex-col hover:border-secondary hover:glow-gold transition-all">
            <Zap className="w-7 h-7 text-secondary mb-4" />
            <h3 className="text-lg font-bold font-display text-foreground mb-0.5">The Operator</h3>
            <p className="text-secondary text-xs font-display tracking-wider uppercase mb-4">Done-For-You — GoHighLevel</p>

            <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-1">
              Pre-configured system, 10-minute install. Same Field Guide, plus a GHL snapshot with funnels, email, and SMS automation ready to run.
            </p>

            <ul className="space-y-2 mb-4 text-xs">
              {[
                'Pre-configured GoHighLevel snapshot',
                'Funnel sequences pre-built',
                'Email + SMS automation ready',
                '10-minute installation',
                'White-glove setup guidance',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-foreground">
                  <span className="text-secondary mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>

            {/* Affiliate Disclosure — ABOVE the CTA, legally required */}
            <div className="bg-secondary/10 border border-secondary/30 rounded-sm px-3 py-2 mb-4 text-[11px] text-secondary leading-relaxed">
              ⚠ Disclosure: FLS has an affiliate relationship with GoHighLevel. We use it ourselves. You pay the same price either way.
            </div>

            <button
              onClick={() => onSelectPath('operator')}
              className="w-full bg-secondary text-secondary-foreground py-3 rounded-sm font-display text-sm tracking-wider hover:brightness-110 transition-all cursor-pointer"
            >
              Set Up My System →
            </button>
          </div>
        </div>

        {/* Scroll hint */}
        <p className="mt-8 text-xs text-muted-foreground font-display tracking-wider">
          ↓ Scroll to read the full story behind this infrastructure
        </p>
      </div>
    </section>
  );
}
