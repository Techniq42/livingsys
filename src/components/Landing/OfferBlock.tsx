import { ChevronDown } from 'lucide-react';

export function OfferBlock() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-24 md:py-32 px-6 md:px-12 lg:px-16 border-t border-border">
      <div className="max-w-3xl">
        <p className="section-label mb-6">The Offer</p>

        <h2 className="text-2xl md:text-4xl font-bold font-display leading-tight mb-4 text-foreground">
          Co-Create the Edge Runner Gateway
        </h2>

        <p className="text-lg md:text-xl text-primary font-display mb-10">
          A Gitcoin-backed sprint to finish and open-source this stack for Bloom nodes and regenerative builders.
        </p>

        <div className="space-y-6 text-muted-foreground leading-relaxed text-lg md:text-xl mb-12">
          <p>
            The Edge Runner Gateway is about transferring maps and reflexes, not just templates and tools. The funnels, automations, and phone systems are designed to teach pattern literacy: how to route resources, design for sovereignty, and run real-world regenerative operations without handing your future to a single SaaS login.
          </p>
          <p className="text-foreground">
            If the old gatekeeper's power came from deciding who saw the path, this sprint is about putting the map in many hands.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="border border-border rounded-lg p-6 space-y-3">
            <h3 className="text-foreground font-bold">What you help finish</h3>
            <ul className="space-y-2 text-muted-foreground text-base">
              <li className="flex items-start gap-2"><span className="text-primary mt-1">&#10003;</span>A forkable infrastructure template: Lovable + Supabase + n8n + GitHub</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">&#10003;</span>A Regenerative Architecture Codex: roles, flows, agreements in plain language</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">&#10003;</span>Funnel and phone-system scripts tuned for stewardship, not extraction</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">&#10003;</span>A public Field Guide + repo that lowers the barrier for the next cohort</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-6 space-y-3">
            <h3 className="text-foreground font-bold">How you plug in</h3>
            <ul className="space-y-2 text-muted-foreground text-base">
              <li className="flex items-start gap-2"><span className="text-primary mt-1">&#10003;</span>Fund the sprint through Gitcoin or direct contribution</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">&#10003;</span>Stress-test the DIY stack, fork it, adapt it for your context</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">&#10003;</span>Co-write the regenerative architecture patterns this thing encodes</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">&#10003;</span>Design on-ramps so the next locked-out organizer doesn't start from zero</li>
            </ul>
          </div>
        </div>

        <p className="text-muted-foreground text-lg mb-8">
          This isn't about proving we can crack serious code. It's about making sure the next time a gate closes, there's already a map in people's hands.
        </p>

<a
              href="#optin-section"
              className="inline-flex items-center gap-2 text-primary font-display tracking-wider text-base border border-primary px-6 py-3 rounded-sm hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
            >
              Join the sprint
              <ChevronDown className="w-4 h-4 animate-scroll-bounce rotate-180" />
            </a>
      </div>
    </section>
  );
}
