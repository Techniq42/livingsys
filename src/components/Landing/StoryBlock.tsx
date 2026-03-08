export function StoryBlock() {
  return (
    <section id="story-block" className="py-24 md:py-32 px-6 md:px-12 lg:px-24">
      <div className="max-w-3xl">
        <p className="section-label mb-6">The Pattern</p>

        <h2 className="text-2xl md:text-4xl font-bold font-display leading-tight mb-10 text-foreground">
          Someone figured it out. In an Army arms room in 1994.
        </h2>

        <div className="space-y-6 text-muted-foreground leading-relaxed text-base md:text-lg">
          <p>
            A supply sergeant at Fort Bragg was sitting on resources other units desperately needed. Official channels said impossible. Informal coordination made it routine. He earned an Army Achievement Medal for solving "impossible" security challenges — not by following procedures, but by building coordination networks across units with complementary resources.
          </p>
          <p>
            That supply sergeant spent the next thirty years applying the same pattern: nightclub operations in Nevada, community food infrastructure in Reno, water security in Kenya, soil restoration in Colorado. Every time he found the same thing.
          </p>
          <p className="text-foreground font-medium text-lg md:text-xl border-l-2 border-primary pl-6">
            Resources exist everywhere. Coordination infrastructure is missing.
          </p>
          <p>
            The food bank president who said out loud: "We can't afford to let donors know other options exist." The composting industry that blocked technology proven in 32 countries. The municipal systems that treat waste disposal as a cost center when it's a resource center.
          </p>
          <p>
            These aren't villains. They're institutions that evolved to manage scarcity — which means they have an active interest in preventing abundance.
          </p>
        </div>
      </div>
    </section>
  );
}
