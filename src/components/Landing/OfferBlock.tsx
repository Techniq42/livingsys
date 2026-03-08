import { ChevronDown } from 'lucide-react';

export function OfferBlock() {
  const scrollToFork = () => {
    document.getElementById('fork-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-24 md:py-32 px-6 md:px-12 lg:px-24 border-t border-border">
      <div className="max-w-3xl">
        <p className="section-label mb-6">The Sovereign Patch Codex</p>

        <h2 className="text-2xl md:text-4xl font-bold font-display leading-tight mb-4 text-foreground">
          The Edge Runner's Field Guide.
        </h2>

        <p className="text-lg md:text-xl text-primary font-display mb-10">
          Free. Because solutions should be free.
        </p>

        <div className="space-y-6 text-muted-foreground leading-relaxed text-base md:text-lg mb-12">
          <p>
            The Sovereign Patch Codex is a curated body of knowledge: coordination frameworks, implementation guides, technology deployment protocols, and the pattern recognition tools developed across thirty years of edge-runner systems work.
          </p>
          <p>
            The Field Guide is your first access point. It's free. No paywall. No upsell trap.
          </p>
          <p className="text-foreground">
            What happens next depends on who you are.
          </p>
        </div>

        <button
          onClick={scrollToFork}
          className="inline-flex items-center gap-2 text-primary font-display tracking-wider text-sm border border-primary px-6 py-3 rounded-sm hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
        >
          Tell us who you are
          <ChevronDown className="w-4 h-4 animate-scroll-bounce" />
        </button>
      </div>
    </section>
  );
}
