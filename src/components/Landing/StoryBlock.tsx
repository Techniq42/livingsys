import { AbstractVisual } from './AbstractVisual';

export function StoryBlock() {
  return (
    <section id="story-block" className="py-24 md:py-32 px-6 md:px-12 lg:px-16">
      <div className="max-w-3xl">
        <p className="section-label mb-6">The Story</p>

        <h2 className="text-2xl md:text-4xl font-bold font-display leading-tight mb-10 text-foreground">
          I spent thirty years learning how to make other people's systems work. Then one afternoon, I got locked out of my own.
        </h2>

        <div className="space-y-16 text-muted-foreground leading-relaxed text-lg md:text-xl">

          <div className="grid md:grid-cols-[1fr_300px] gap-8 items-center">
            <div className="space-y-6">
              <p>
                Army logistics. Nightclub operations. Nonprofit governance. SaaS funnels. If there was a platform, I could make it hum. I came up through traditional chains of command: military arms rooms, board rooms, grant cycles, and CRMs that promised "all-in-one" control.
              </p>
              <p>
                I learned how to route resources through other people's infrastructure, how to play nice inside their dashboards, how to squeeze regenerative work through tools that were never designed for it.
              </p>
            </div>
            <AbstractVisual variant="neural-network" className="max-h-[300px]" />
          </div>

          <p className="text-foreground font-medium text-xl md:text-2xl border-l-4 border-primary pl-6 py-2">
            Then I got an email that dropped my stomach: I was locked out of my own system. No warning. No appeal. Just gone.
          </p>

          <div className="grid md:grid-cols-[300px_1fr] gap-8 items-center">
            <AbstractVisual variant="map-network" className="max-h-[300px] md:order-1 order-2" />
            <div className="space-y-6 md:order-2 order-1">
              <p>
                That was the day I stopped treating platforms as partners and started treating them as gatekeepers. The gatekeeper never held the knowledge. It held the map &mdash; the routes, automations, and relationships my community depended on.
              </p>
              <p>
                That shock is what birthed the Edge Runner Gateway. It's a sorting hat, not a sales funnel: a way to sort people by how much control they want over their own infrastructure.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-[1fr_300px] gap-8 items-center">
            <div className="space-y-6">
              <p>
                So we built an open-source stack where the architecture itself is the product: Lovable for the interface, Supabase for data and auth, n8n for automation, GitHub for the code &mdash; every piece forkable, swappable, and legible.
              </p>
              <p>
                The Operator path exists because I know how many nonprofits and regenerative projects need a bridge today. But the heart of this work is the Architect path: a DIY route where no vendor can lock you out because you hold the map.
              </p>
            </div>
            <AbstractVisual variant="abundance" className="max-h-[300px]" />
          </div>

        </div>
      </div>
    </section>
  );
}
