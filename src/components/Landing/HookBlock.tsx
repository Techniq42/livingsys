import { ChevronDown } from 'lucide-react';

export function HookBlock() {
  const scrollToStory = () => {
    document.getElementById('story-block')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24 grid-overlay">
      {/* Logo */}
      <a
        href="https://livingsys.org"
        className="absolute top-8 left-6 md:left-12 lg:left-24 text-xs tracking-[0.25em] uppercase text-muted-foreground font-display hover:text-foreground transition-colors"
      >
        Fellowship of Living Systems
      </a>

      <div className="max-w-4xl">
        <p className="section-label mb-6">
          Coordination failure costs $970B annually
        </p>

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-8 text-foreground text-balance">
          The food system isn't broken. It was never designed to do what you think it was.
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
          There is a $970 billion ghost haunting every failed community project, every grant-dependent nonprofit, every rural town watching its resources extracted upstream. The ghost has a name: coordination failure. And almost no one is talking about the actual fix.
        </p>
      </div>

      <button
        onClick={scrollToStory}
        className="absolute bottom-12 left-6 md:left-12 lg:left-24 flex items-center gap-2 text-primary text-sm font-display tracking-wider hover:gap-3 transition-all cursor-pointer"
      >
        Scroll to understand what's actually happening
        <ChevronDown className="w-4 h-4 animate-scroll-bounce" />
      </button>
    </section>
  );
}
