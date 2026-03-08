import { ChevronDown } from 'lucide-react';

export function OfferBlock() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-24 md:py-32 px-6 md:px-12 lg:px-16 border-t border-border">
      <div className="max-w-3xl">
        <p className="section-label mb-6">The Sovereign Patch Codex</p>

        <h2 className="text-2xl md:text-4xl font-bold font-display leading-tight mb-4 text-foreground">
          The Edge Runner's Field Guide.
        </h2>

        <p className="text-lg md:text-xl text-primary font-display mb-10">
          Free. Because coordination tools should be free.
        </p>

        <div className="space-y-6 text-muted-foreground leading-relaxed text-lg md:text-xl mb-12">
          <p>
            The Sovereign Patch Codex is a curated body of knowledge: coordination frameworks, implementation guides, technology deployment protocols, and the pattern recognition tools developed across thirty years of edge-runner systems work. From Army arms rooms to Kenyan community centers to Colorado soil labs.
          </p>
          <p>
            The Field Guide is your first access point. It's free. No paywall. No upsell trap. Read it, and if it resonates, we talk.
          </p>
          <p className="text-foreground">
            What happens next depends on who you are.
          </p>
        </div>

        <button
          onClick={scrollToTop}
          className="inline-flex items-center gap-2 text-primary font-display tracking-wider text-sm border border-primary px-6 py-3 rounded-sm hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
        >
          Choose your path
          <ChevronDown className="w-4 h-4 animate-scroll-bounce rotate-180" />
        </button>
      </div>
    </section>
  );
}
