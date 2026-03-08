import { AbstractVisual } from './AbstractVisual';

export function StoryBlock() {
  return (
    <section id="story-block" className="py-24 md:py-32 px-6 md:px-12 lg:px-16">
      <div className="max-w-3xl">
        <p className="section-label mb-6">The Pattern</p>

        <h2 className="text-2xl md:text-4xl font-bold font-display leading-tight mb-10 text-foreground">
          Someone figured it out. In an Army arms room in 1994.
        </h2>

        <div className="space-y-16 text-muted-foreground leading-relaxed text-lg md:text-xl">
          
          <div className="grid md:grid-cols-[1fr_300px] gap-8 items-center">
            <div className="space-y-6">
              <p>
                A supply sergeant at Fort Bragg was sitting on resources other units desperately needed. Official channels said impossible. Informal coordination made it routine. He earned an Army Achievement Medal for solving "impossible" security challenges — not by following procedures, but by building coordination networks across units with complementary resources.
              </p>
              <p>
                That supply sergeant spent the next thirty years applying the same pattern: nightclub operations in Nevada, community food infrastructure in Reno, water security in Kenya, soil restoration in Colorado. Every time he found the same thing.
              </p>
            </div>
            <img src="/src/assets/images/fast-brain.png" alt="Neural network coordination" className="rounded-sm border border-border/50 object-cover w-full h-full max-h-[300px]" />
          </div>

          <p className="text-foreground font-medium text-xl md:text-2xl border-l-4 border-primary pl-6 py-2">
            Resources exist everywhere. Coordination infrastructure is missing.
          </p>

          <div className="grid md:grid-cols-[300px_1fr] gap-8 items-center">
            <img src="/src/assets/images/lake-victoria-map.png" alt="Sori Village, Kenya Map" className="rounded-sm border border-border/50 object-cover w-full h-full max-h-[300px] md:order-1 order-2" />
            <div className="space-y-6 md:order-2 order-1">
              <p>
                In Sori Village, Kenya, $10,000 bought a heat-optimized server, Raspberry Pi workstations, a heat pump over the rack, solar panels with battery backup, and Wi-Fi for an entire community center. Global connectivity. Total cost less than a single US nonprofit consultant's monthly fee. That's not charity. That's architecture.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-[1fr_300px] gap-8 items-center">
            <div className="space-y-6">
              <p>
                The food bank president who said out loud: "We can't afford to let donors know other options exist." The composting industry that blocked technology proven in 32 countries. The municipal systems that treat waste disposal as a cost center when it's a resource center.
              </p>
              <p>
                These aren't villains. They're institutions that evolved to manage scarcity — which means they have an active interest in preventing abundance.
              </p>
            </div>
            <img src="/src/assets/images/american-abundance.png" alt="American abundance and waste" className="rounded-sm border border-border/50 object-cover w-full h-full max-h-[300px]" />
          </div>

        </div>
      </div>
    </section>
  );
}
