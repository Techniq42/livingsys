import { AbstractVisual } from './AbstractVisual';

export function ProofBlock() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-12 lg:px-16 border-t border-border">
      <div className="max-w-4xl">
        <p className="section-label mb-6">Proof of Concept</p>

        <h2 className="text-2xl md:text-4xl font-bold font-display leading-tight mb-4 text-foreground">
          This isn't theory. It's running in 32 countries.
        </h2>

        <div className="grid lg:grid-cols-[1fr_300px] gap-8 mb-10 items-center">
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-3xl">
            HumiSoil's bacterial processing technology was presented at COP28 — converting organic waste into drought-resistant soil amendments across Malaysia, the UAE, and beyond. Watch the field demonstration.
          </p>
          <AbstractVisual variant="desert-growth" className="max-h-[250px]" />
        </div>

        {/* 16:9 responsive YouTube embed */}
        <div className="relative w-full overflow-hidden rounded-sm border border-border" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube.com/embed/Og0ocvmk3GQ?start=439"
            title="HumiSoil COP28 Presentation — Humus Oil Process and Use Cases"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>

        <p className="mt-6 text-sm text-muted-foreground font-display tracking-wider">
          COP28, Dubai — Fellowship of Living Systems field presentation
        </p>
      </div>
    </section>
  );
}