import { Terminal, Zap } from 'lucide-react';

interface ForkSectionProps {
  onSelectPath: (path: 'architect' | 'operator') => void;
}

export function ForkSection({ onSelectPath }: ForkSectionProps) {
  return (
    <section id="fork-section" className="py-24 md:py-32 px-6 md:px-12 lg:px-24 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <p className="section-label mb-6">Your Path</p>
        <h2 className="text-2xl md:text-4xl font-bold font-display leading-tight mb-12 text-foreground">
          Two kinds of Edge Runners. Which one are you?
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Architect Card */}
          <div className="border border-border bg-card rounded-sm p-8 flex flex-col hover:border-primary hover:glow-green transition-all">
            <Terminal className="w-8 h-8 text-primary mb-6" />
            <h3 className="text-xl font-bold font-display text-foreground mb-1">The Architect</h3>
            <p className="text-primary text-sm font-display tracking-wider uppercase mb-6">DIY — Open Source</p>

            <p className="text-muted-foreground leading-relaxed mb-6 flex-1">
              You want to own your stack. You're comfortable with GitHub, webhooks, and building on open infrastructure. You believe sovereignty isn't just a principle — it's an architecture decision. You get the full source. Fork it. Adapt it. Build something your community owns.
            </p>

            <ul className="space-y-3 mb-8 text-sm">
              {[
                'Complete n8n automation workflows',
                'Open-source GHL infrastructure snapshot',
                'Full documentation and setup guides',
                'GitHub repository access',
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
          <div className="border border-secondary/40 bg-[hsl(37_30%_6%)] rounded-sm p-8 flex flex-col hover:border-secondary hover:glow-gold transition-all">
            <Zap className="w-8 h-8 text-secondary mb-6" />
            <h3 className="text-xl font-bold font-display text-foreground mb-1">The Operator</h3>
            <p className="text-secondary text-sm font-display tracking-wider uppercase mb-6">Done-For-You — GoHighLevel</p>

            <p className="text-muted-foreground leading-relaxed mb-6 flex-1">
              You want results, not a build project. You need a pre-configured system you can install and run without engineering a backend. GoHighLevel is the operating system — we've already built the snapshot. You get the same Field Guide. Plus a pre-configured GHL snapshot and setup instructions.
            </p>

            <ul className="space-y-3 mb-6 text-sm">
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

            {/* Affiliate Disclosure */}
            <div className="bg-secondary/10 border border-secondary/30 rounded-sm px-4 py-3 mb-6 text-xs text-secondary">
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
      </div>
    </section>
  );
}
