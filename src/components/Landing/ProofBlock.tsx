const STATS = [
  { value: '$970B', label: 'Annual coordination failure cost in the food system' },
  { value: '47', label: 'Bloom Network nodes across the planet without a shared routing layer' },
  { value: '32', label: 'Countries where field-tested solutions exist with no connection to demand' },
];

export function ProofBlock() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-12 lg:px-16 border-t border-border">
      <div className="max-w-4xl">
        <p className="section-label mb-6">The Scale</p>
        <h2 className="text-2xl md:text-4xl font-bold font-display leading-tight mb-16 text-foreground">
          This isn't theory. It's running in 32 countries.
        </h2>
        <div className="grid md:grid-cols-3 gap-12">
          {STATS.map((stat) => (
            <div key={stat.value} className="space-y-3">
              <div className="text-4xl md:text-5xl font-bold font-display text-primary">
                {stat.value}
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
