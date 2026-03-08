export function InfrastructureBlock() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-12 lg:px-16 border-t border-border">
      <div className="max-w-4xl">
        <p className="section-label mb-6">Transparency</p>

        <h2 className="text-2xl md:text-4xl font-bold font-display leading-tight mb-10 text-foreground">
          The Infrastructure Behind This Page
        </h2>

        <div className="space-y-6 text-muted-foreground leading-relaxed text-lg md:text-xl mb-14">
          <p>
            This page runs on the same open-source stack we're offering Architects. Lovable built the UI you're reading right now. Supabase stores every lead, manages authentication, and runs the edge functions that process your opt-in. n8n handles the automation layer — routing data between services, triggering email sequences, and syncing with external platforms.
          </p>
          <p>
            GitHub holds the entire codebase. You can fork it right now and run your own version. Every component — from the database schema to the automation workflows — is documented and swappable.
          </p>
          <p>
            No vendor lock-in. If Supabase disappears tomorrow, swap in Postgres. If n8n doesn't fit, plug in Make or Zapier. If you outgrow Lovable, export to any React host. The architecture is the product.
          </p>
          <p className="text-foreground font-medium border-l-4 border-primary pl-6 py-2">
            We don't just talk about sovereignty. We ship it.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="border border-border bg-card rounded-sm p-6 md:p-10">
          <p className="text-xs text-muted-foreground font-display tracking-wider uppercase mb-6 text-center">
            System Architecture
          </p>
          <svg
            viewBox="0 0 800 220"
            className="w-full h-auto"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Connecting lines */}
            <line x1="130" y1="110" x2="230" y2="110" stroke="hsl(142,71%,45%)" strokeWidth="2" opacity="0.5" />
            <line x1="330" y1="110" x2="430" y2="110" stroke="hsl(142,71%,45%)" strokeWidth="2" opacity="0.5" />
            <line x1="530" y1="110" x2="630" y2="110" stroke="hsl(142,71%,45%)" strokeWidth="2" opacity="0.5" />

            {/* Arrow heads */}
            <polygon points="228,105 228,115 238,110" fill="hsl(142,71%,45%)" opacity="0.5" />
            <polygon points="428,105 428,115 438,110" fill="hsl(142,71%,45%)" opacity="0.5" />
            <polygon points="628,105 628,115 638,110" fill="hsl(142,71%,45%)" opacity="0.5" />

            {/* Branch lines from n8n */}
            <line x1="680" y1="80" x2="740" y2="50" stroke="hsl(142,71%,45%)" strokeWidth="1.5" opacity="0.4" />
            <line x1="680" y1="110" x2="740" y2="110" stroke="hsl(142,71%,45%)" strokeWidth="1.5" opacity="0.4" />
            <line x1="680" y1="140" x2="740" y2="170" stroke="hsl(142,71%,45%)" strokeWidth="1.5" opacity="0.4" />

            {/* Node: User */}
            <rect x="30" y="80" width="100" height="60" rx="4" fill="hsl(150,22%,8%)" stroke="hsl(155,30%,17%)" strokeWidth="1.5" />
            <text x="80" y="106" textAnchor="middle" fill="hsl(120,40%,93%)" fontSize="13" fontFamily="Space Grotesk, sans-serif" fontWeight="600">User</text>
            <text x="80" y="124" textAnchor="middle" fill="hsl(220,9%,58%)" fontSize="10" fontFamily="JetBrains Mono, monospace">visitor</text>

            {/* Node: Lovable */}
            <rect x="240" y="80" width="100" height="60" rx="4" fill="hsl(150,22%,8%)" stroke="hsl(142,71%,45%)" strokeWidth="1.5" />
            <text x="290" y="106" textAnchor="middle" fill="hsl(142,71%,45%)" fontSize="13" fontFamily="Space Grotesk, sans-serif" fontWeight="600">Lovable</text>
            <text x="290" y="124" textAnchor="middle" fill="hsl(220,9%,58%)" fontSize="10" fontFamily="JetBrains Mono, monospace">UI layer</text>

            {/* Node: Supabase */}
            <rect x="440" y="80" width="100" height="60" rx="4" fill="hsl(150,22%,8%)" stroke="hsl(142,71%,45%)" strokeWidth="1.5" />
            <text x="490" y="106" textAnchor="middle" fill="hsl(142,71%,45%)" fontSize="13" fontFamily="Space Grotesk, sans-serif" fontWeight="600">Supabase</text>
            <text x="490" y="124" textAnchor="middle" fill="hsl(220,9%,58%)" fontSize="10" fontFamily="JetBrains Mono, monospace">data + auth</text>

            {/* Node: n8n */}
            <rect x="640" y="80" width="80" height="60" rx="4" fill="hsl(150,22%,8%)" stroke="hsl(37,67%,42%)" strokeWidth="1.5" />
            <text x="680" y="106" textAnchor="middle" fill="hsl(37,67%,42%)" fontSize="13" fontFamily="Space Grotesk, sans-serif" fontWeight="600">n8n</text>
            <text x="680" y="124" textAnchor="middle" fill="hsl(220,9%,58%)" fontSize="10" fontFamily="JetBrains Mono, monospace">automate</text>

            {/* Output nodes */}
            <text x="760" y="54" textAnchor="start" fill="hsl(220,9%,58%)" fontSize="11" fontFamily="JetBrains Mono, monospace">Email</text>
            <text x="760" y="114" textAnchor="start" fill="hsl(220,9%,58%)" fontSize="11" fontFamily="JetBrains Mono, monospace">GHL</text>
            <text x="760" y="174" textAnchor="start" fill="hsl(220,9%,58%)" fontSize="11" fontFamily="JetBrains Mono, monospace">Community</text>
          </svg>
        </div>
      </div>
    </section>
  );
}
