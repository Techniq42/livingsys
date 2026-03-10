import { useState } from 'react';
import { HeroFork } from '@/components/Landing/HeroFork';
import { StoryBlock } from '@/components/Landing/StoryBlock';
import { InfrastructureBlock } from '@/components/Landing/InfrastructureBlock';
import { ReHookBlock } from '@/components/Landing/ReHookBlock';
import { OfferBlock } from '@/components/Landing/OfferBlock';
import { Footer } from '@/components/Landing/Footer';

import { OptInForm } from '@/components/OptIn/OptInForm';

const Index = () => {
  const [selectedPath, setSelectedPath] = useState<'architect' | 'operator' | null>(null);

  const handleSelectPath = (path: 'architect' | 'operator') => {
    setSelectedPath(path);
    setTimeout(() => {
      document.getElementById('optin-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleBackToTop = () => {
    setSelectedPath(null);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroFork
        onSelectPath={handleSelectPath}
        selectedPath={selectedPath}
      />

      {selectedPath === 'architect' ? (
        <>
          {/* Architect Domino Sequence */}
          <StoryBlock />
          <ReHookBlock />
          <InfrastructureBlock />
          <OfferBlock />
          <OptInForm path={selectedPath} onBack={handleBackToTop} />
        </>
      ) : selectedPath === 'operator' ? (
        <>
          {/* Operator Domino Sequence */}
          <section className="py-24 md:py-32 px-6 md:px-12 lg:px-16">
            <div className="max-w-3xl">
              <p className="section-label mb-6">The Problem</p>
              <h2 className="text-2xl md:text-4xl font-bold font-display leading-tight mb-10 text-foreground">
                You learned sustainability through the front door. The actual work happens at the loading dock.
              </h2>
              <div className="space-y-6 text-muted-foreground leading-relaxed text-lg md:text-xl">
                <p>
                  You run a nonprofit, a regenerative startup, a church, a community initiative. You know the mission inside and out. But when it comes to getting the word out, following up with leads, coordinating volunteers, managing donors, running events &mdash; you're duct-taping together five different platforms that don't talk to each other.
                </p>
                <p>
                  Your board wants metrics. Your donors want updates. Your community wants action. And you're spending 80% of your time on plumbing and 20% on the work that actually matters.
                </p>
                <p className="text-foreground font-medium text-xl md:text-2xl border-l-4 border-secondary pl-6 py-2">
                  The coordination layer is missing. Not the knowledge. Not the passion. The infrastructure.
                </p>
              </div>
            </div>
          </section>

          <section className="py-24 md:py-32 px-6 md:px-12 lg:px-16 border-t border-border">
            <div className="max-w-3xl">
              <p className="section-label mb-6">The Vision</p>
              <h2 className="text-2xl md:text-4xl font-bold font-display leading-tight mb-10 text-foreground">
                What if your entire coordination system was pre-built and ready to go?
              </h2>
              <div className="space-y-6 text-muted-foreground leading-relaxed text-lg md:text-xl">
                <p>
                  Imagine one platform where your CRM, email sequences, SMS workflows, funnel pages, appointment booking, and donor management all live together. Pre-configured for regenerative work. Not another SaaS experiment &mdash; a system that was built by people who've actually run the operations you're running.
                </p>
                <p>
                  You focus on the mission. The system handles the plumbing. 10-minute install. You're live.
                </p>
              </div>
            </div>
          </section>

          <section className="py-24 md:py-32 px-6 md:px-12 lg:px-16 border-t border-border">
            <div className="max-w-3xl">
              <p className="section-label mb-6">The Shift</p>
              <h2 className="text-2xl md:text-4xl font-bold font-display leading-tight mb-10 text-foreground">
                The secret isn't a better CRM. It's that the coordination pattern itself is the value.
              </h2>
              <div className="space-y-6 text-muted-foreground leading-relaxed text-lg md:text-xl">
                <p>
                  GoHighLevel is the platform &mdash; but what we've built on top of it is thirty years of coordination architecture. The email sequences aren't templates; they're field-tested nurture patterns from running real operations across food systems, water security, soil restoration, and community infrastructure.
                </p>
                <p>
                  The funnel logic, the tag structures, the automation triggers &mdash; these aren't guesses. They're the same patterns that coordinated resources across Army units, managed nightclub operations, and built community food infrastructure from scratch.
                </p>
                <p>
                  You're not buying software. You're installing decades of operational pattern recognition into a platform that already works.
                </p>
              </div>
            </div>
          </section>

          <section className="py-24 md:py-32 px-6 md:px-12 lg:px-16 border-t border-border">
            <div className="max-w-3xl">
              <p className="section-label mb-6">The Truth</p>
              <h2 className="text-2xl md:text-4xl font-bold font-display leading-tight mb-10 text-foreground">
                "But I'm not technical."
              </h2>
              <div className="space-y-6 text-muted-foreground leading-relaxed text-lg md:text-xl">
                <p>
                  That's the point. The snapshot installs in 10 minutes. The email sequences are pre-written. The SMS workflows fire automatically. The onboarding call walks you through every toggle.
                </p>
                <p>
                  If you can send an email, you can run this system. It was designed for operators &mdash; people who move resources, build coalitions, and serve communities &mdash; not for people who want to tinker with code.
                </p>
                <p className="text-foreground font-medium text-xl md:text-2xl border-l-4 border-secondary pl-6 py-2">
                  You run the mission. We handle the plumbing.
                </p>
              </div>
            </div>
          </section>

          <section className="py-24 md:py-32 px-6 md:px-12 lg:px-16 border-t border-border">
            <div className="max-w-3xl">
              <p className="section-label mb-6">The Landscape</p>
              <h2 className="text-2xl md:text-4xl font-bold font-display leading-tight mb-10 text-foreground">
                Your donors use funnels. Your competitors use automation. Your community deserves the same tools.
              </h2>
              <div className="space-y-6 text-muted-foreground leading-relaxed text-lg md:text-xl">
                <p>
                  Every major corporation, every political campaign, every megachurch already runs on this kind of infrastructure. CRM, email automation, SMS, funnels, analytics &mdash; it's not new. It's just been out of reach for the organizations doing the most important work.
                </p>
                <p>
                  This isn't about keeping up with Silicon Valley. It's about giving grassroots leaders the same operational firepower that corporations take for granted.
                </p>
              </div>
            </div>
          </section>

          <OptInForm path={selectedPath} onBack={handleBackToTop} />
        </>
      ) : (
        <>
          {/* Main Lead-In Story (null state) */}
          <StoryBlock />
          <InfrastructureBlock />
          <ReHookBlock />
          <OfferBlock />

          {/* Repeat fork buttons at bottom */}
          <section className="py-24 md:py-32 px-6 md:px-12 lg:px-16 border-t border-border">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold font-display leading-tight mb-6 text-foreground">
                Ready to choose your path?
              </h2>
              <p className="text-muted-foreground text-lg mb-10">
                Both paths use the same Field Guide. Choose based on how you want to hold the map.
              </p>
              <div className="grid md:grid-cols-2 gap-4 max-w-xl mx-auto">
                <button
                  onClick={() => handleSelectPath('architect')}
                  className="border border-primary text-foreground py-4 rounded-sm font-display text-sm tracking-wider hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
                >
                  I Build My Own Infrastructure &rarr;
                </button>
                <button
                  onClick={() => handleSelectPath('operator')}
                  className="bg-secondary text-secondary-foreground py-4 rounded-sm font-display text-sm tracking-wider hover:brightness-110 transition-all cursor-pointer"
                >
                  Set Up My System &rarr;
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
};

export default Index;
