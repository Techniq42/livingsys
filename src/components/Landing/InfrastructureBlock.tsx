export function InfrastructureBlock() {
  const mainNodes = [
    { label: 'User', sub: 'visitor', accent: false },
    { label: 'Lovable', sub: 'UI layer', accent: true },
    { label: 'Supabase', sub: 'data + auth', accent: true },
    { label: 'n8n', sub: 'automate', accent: false, gold: true },
  ];

  const outputNodes = ['Email', 'GHL', 'Community'];

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

        {/* CSS Architecture Diagram */}
        <div className="border border-border bg-card rounded-sm p-6 md:p-10">
          <p className="text-xs text-muted-foreground font-display tracking-wider uppercase mb-8 text-center">
            System Architecture
          </p>

          {/* Main flow: User -> Lovable -> Supabase -> n8n */}
          <div className="flex flex-col md:flex-row items-center gap-0 justify-center mb-8">
            {mainNodes.map((node, i) => (
              <div key={node.label} className="flex items-center">
                {/* Node */}
                <div
                  className="flex flex-col items-center justify-center px-5 py-4 rounded border min-w-[100px]"
                  style={{
                    backgroundColor: 'hsl(150 22% 8%)',
                    borderColor: node.gold
                      ? 'hsl(37 67% 42%)'
                      : node.accent
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--border))',
                    boxShadow: node.accent
                      ? '0 0 12px hsl(var(--primary) / 0.15)'
                      : node.gold
                        ? '0 0 12px hsl(37 67% 42% / 0.15)'
                        : 'none',
                  }}
                >
                  <span
                    className="text-sm font-display font-semibold"
                    style={{
                      color: node.gold
                        ? 'hsl(37 67% 42%)'
                        : node.accent
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--foreground))',
                    }}
                  >
                    {node.label}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    {node.sub}
                  </span>
                </div>

                {/* Arrow connector (not after last node) */}
                {i < mainNodes.length - 1 && (
                  <div className="flex items-center mx-1">
                    {/* Horizontal on md+, vertical on mobile */}
                    <div className="hidden md:flex items-center">
                      <div className="w-6 h-[1px] bg-primary/40" />
                      <div
                        className="w-0 h-0"
                        style={{
                          borderTop: '5px solid transparent',
                          borderBottom: '5px solid transparent',
                          borderLeft: '6px solid hsl(var(--primary) / 0.5)',
                        }}
                      />
                    </div>
                    <div className="flex md:hidden flex-col items-center my-2">
                      <div className="h-6 w-[1px] bg-primary/40" />
                      <div
                        className="w-0 h-0"
                        style={{
                          borderLeft: '5px solid transparent',
                          borderRight: '5px solid transparent',
                          borderTop: '6px solid hsl(var(--primary) / 0.5)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Output branches from n8n */}
          <div className="flex justify-center">
            <div className="flex flex-col items-center">
              {/* Connector line down from n8n */}
              <div className="h-4 w-[1px] bg-secondary/30" />
              {/* Branch out */}
              <div className="flex items-start gap-6 md:gap-10">
                {outputNodes.map((output) => (
                  <div key={output} className="flex flex-col items-center">
                    <div className="h-4 w-[1px] bg-secondary/30" />
                    <div
                      className="px-3 py-2 rounded border text-[11px] font-mono text-muted-foreground"
                      style={{
                        backgroundColor: 'hsl(150 22% 6%)',
                        borderColor: 'hsl(var(--border))',
                      }}
                    >
                      {output}
                    </div>
                  </div>
                ))}
              </div>
              {/* Horizontal connector across outputs */}
              <div
                className="h-[1px] bg-secondary/20 -mt-[calc(1rem+2px+8px)]"
                style={{ width: 'calc(100% - 24px)', marginLeft: 12, marginRight: 12 }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
