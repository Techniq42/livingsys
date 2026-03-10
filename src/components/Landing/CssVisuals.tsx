interface CssVisualProps {
  variant: 'network' | 'map' | 'abundance' | 'desert';
  className?: string;
}

export function CssVisual({ variant, className = '' }: CssVisualProps) {
  const base = `w-full min-h-[200px] rounded-sm border border-border/50 overflow-hidden relative ${className}`;

  switch (variant) {
    case 'network':
      return (
        <div className={`${base} bg-background`}>
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Nodes */}
            {[
              { top: '20%', left: '50%', size: 12, delay: '0s' },
              { top: '45%', left: '25%', size: 10, delay: '0.3s' },
              { top: '45%', left: '50%', size: 10, delay: '0.6s' },
              { top: '45%', left: '75%', size: 10, delay: '0.9s' },
              { top: '75%', left: '15%', size: 8, delay: '1.2s' },
              { top: '75%', left: '35%', size: 8, delay: '1.5s' },
              { top: '75%', left: '55%', size: 8, delay: '0.2s' },
              { top: '75%', left: '75%', size: 8, delay: '0.5s' },
              { top: '75%', left: '90%', size: 8, delay: '0.8s' },
            ].map((node, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-pulse"
                style={{
                  top: node.top,
                  left: node.left,
                  width: node.size,
                  height: node.size,
                  backgroundColor: 'hsl(var(--primary))',
                  boxShadow: '0 0 12px 4px hsl(var(--primary) / 0.4), 0 0 24px 8px hsl(var(--primary) / 0.15)',
                  transform: 'translate(-50%, -50%)',
                  animationDelay: node.delay,
                  animationDuration: '2.5s',
                }}
              />
            ))}
            {/* Connection lines via pseudo-elements simulated with thin divs */}
            {[
              { x1: '50%', y1: '20%', x2: '25%', y2: '45%' },
              { x1: '50%', y1: '20%', x2: '50%', y2: '45%' },
              { x1: '50%', y1: '20%', x2: '75%', y2: '45%' },
              { x1: '25%', y1: '45%', x2: '15%', y2: '75%' },
              { x1: '25%', y1: '45%', x2: '35%', y2: '75%' },
              { x1: '50%', y1: '45%', x2: '35%', y2: '75%' },
              { x1: '50%', y1: '45%', x2: '55%', y2: '75%' },
              { x1: '75%', y1: '45%', x2: '75%', y2: '75%' },
              { x1: '75%', y1: '45%', x2: '90%', y2: '75%' },
            ].map((line, i) => {
              const x1 = parseFloat(line.x1);
              const y1 = parseFloat(line.y1);
              const x2 = parseFloat(line.x2);
              const y2 = parseFloat(line.y2);
              const dx = x2 - x1;
              const dy = y2 - y1;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);
              return (
                <div
                  key={`line-${i}`}
                  className="absolute origin-left"
                  style={{
                    top: `${y1}%`,
                    left: `${x1}%`,
                    width: `${length}%`,
                    height: 1,
                    backgroundColor: 'hsl(var(--primary) / 0.25)',
                    transform: `rotate(${angle}deg)`,
                  }}
                />
              );
            })}
          </div>
        </div>
      );

    case 'map':
      return (
        <div className={`${base} bg-gradient-to-br from-[hsl(200_15%_8%)] to-background`}>
          <div className="absolute inset-0">
            {/* Abstract lake shape */}
            <div
              className="absolute rounded-[40%_60%_55%_45%/50%_40%_60%_50%]"
              style={{
                top: '25%', left: '20%', width: '60%', height: '55%',
                background: 'hsl(200 30% 12%)',
                border: '1px solid hsl(200 30% 20%)',
              }}
            />
            {/* Location pins with pulse */}
            {[
              { top: '40%', left: '45%' },
              { top: '55%', left: '32%' },
              { top: '50%', left: '62%' },
              { top: '60%', left: '50%' },
              { top: '42%', left: '38%' },
            ].map((pin, i) => (
              <div key={i} className="absolute" style={{ top: pin.top, left: pin.left, transform: 'translate(-50%, -50%)' }}>
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    boxShadow: '0 0 8px 3px hsl(var(--primary) / 0.4)',
                    animationDelay: `${i * 0.4}s`,
                  }}
                />
                <div
                  className="absolute inset-[-4px] rounded-full border animate-ping"
                  style={{
                    borderColor: 'hsl(var(--primary) / 0.3)',
                    animationDelay: `${i * 0.4}s`,
                    animationDuration: '3s',
                  }}
                />
              </div>
            ))}
            {/* Dashed connection lines */}
            <div className="absolute" style={{ top: '40%', left: '33%', width: '12%', height: 1, background: 'repeating-linear-gradient(90deg, hsl(var(--primary) / 0.3) 0 4px, transparent 4px 8px)' }} />
            <div className="absolute" style={{ top: '50%', left: '46%', width: '16%', height: 1, background: 'repeating-linear-gradient(90deg, hsl(var(--primary) / 0.3) 0 4px, transparent 4px 8px)' }} />
            {/* Label */}
            <p className="absolute bottom-4 left-0 right-0 text-center text-[10px] font-mono text-primary/50 tracking-widest">
              SORI VILLAGE · KENYA
            </p>
          </div>
        </div>
      );

    case 'abundance':
      return (
        <div className={`${base} bg-gradient-to-t from-background to-[hsl(30_15%_8%)]`}>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
            <p className="text-[11px] font-mono text-secondary/60 tracking-wider">ABUNDANCE → WASTE</p>
            <p className="text-[9px] font-mono text-secondary/40">coordination failure</p>
            <div className="flex gap-4 mt-4">
              {[60, 80, 50].map((h, i) => (
                <div key={i} className="flex flex-col items-center">
                  {/* Overflow dots */}
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2].map(j => (
                      <div key={j} className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--primary) / 0.4)' }} />
                    ))}
                  </div>
                  {/* Container */}
                  <div
                    className="w-12 rounded-sm border"
                    style={{
                      height: h,
                      backgroundColor: 'hsl(150 10% 12%)',
                      borderColor: 'hsl(150 10% 22%)',
                    }}
                  />
                  {/* Blocked arrow */}
                  <div className="mt-2 text-[10px] text-destructive/40">✕</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'desert':
      return (
        <div className={`${base} bg-gradient-to-t from-[hsl(142_20%_6%)] to-[hsl(37_20%_8%)]`}>
          <div className="absolute inset-0">
            {/* Sun */}
            <div
              className="absolute rounded-full"
              style={{
                top: '15%', right: '15%', width: 50, height: 50,
                background: 'radial-gradient(circle, hsl(37 67% 42% / 0.2), transparent 70%)',
              }}
            />
            {/* Desert ground */}
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{
                height: '40%',
                background: 'linear-gradient(to bottom, hsl(37 30% 16%), hsl(37 20% 10%))',
                borderRadius: '60% 40% 0 0 / 20% 20% 0 0',
              }}
            />
            {/* Green shoots */}
            {[20, 35, 50, 65, 80].map((left, i) => (
              <div key={i} className="absolute" style={{ bottom: '38%', left: `${left}%`, transform: 'translateX(-50%)' }}>
                <div
                  className="w-[2px] rounded-full"
                  style={{
                    height: 16 + i * 4,
                    backgroundColor: 'hsl(var(--primary) / 0.6)',
                    boxShadow: '0 0 6px hsl(var(--primary) / 0.3)',
                  }}
                />
                <div
                  className="absolute rounded-full"
                  style={{
                    top: 2, left: -4, width: 8, height: 4,
                    backgroundColor: 'hsl(var(--primary) / 0.5)',
                    transform: 'rotate(-25deg)',
                    borderRadius: '50%',
                  }}
                />
              </div>
            ))}
            {/* Water channels */}
            <div className="absolute" style={{ bottom: '35%', left: '10%', right: '10%', height: 1, background: 'hsl(200 40% 35% / 0.4)' }} />
          </div>
        </div>
      );
  }
}

/**
 * CSS-only bioluminescent network topology for the hero section.
 */
export function HeroNetworkVisual() {
  const nodes = [
    { top: '12%', left: '50%', size: 14 },
    { top: '30%', left: '22%', size: 11 },
    { top: '28%', left: '50%', size: 12 },
    { top: '32%', left: '78%', size: 11 },
    { top: '52%', left: '12%', size: 9 },
    { top: '55%', left: '38%', size: 10 },
    { top: '50%', left: '62%', size: 10 },
    { top: '54%', left: '88%', size: 9 },
    { top: '78%', left: '25%', size: 8 },
    { top: '75%', left: '50%', size: 9 },
    { top: '80%', left: '75%', size: 8 },
    { top: '92%', left: '40%', size: 7 },
    { top: '90%', left: '65%', size: 7 },
  ];

  const connections = [
    [0, 1], [0, 2], [0, 3],
    [1, 4], [1, 5], [2, 5], [2, 6], [3, 6], [3, 7],
    [4, 8], [5, 8], [5, 9], [6, 9], [6, 10], [7, 10],
    [8, 11], [9, 11], [9, 12], [10, 12],
  ];

  return (
    <div className="w-full h-full min-h-[350px] rounded-sm border border-border/50 overflow-hidden relative bg-background">
      {/* Ambient glow */}
      <div
        className="absolute rounded-full"
        style={{
          top: '30%', left: '40%', width: '40%', height: '40%',
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.08), transparent 70%)',
          filter: 'blur(30px)',
        }}
      />

      {/* Connection lines */}
      {connections.map(([a, b], i) => {
        const n1 = nodes[a];
        const n2 = nodes[b];
        const x1 = parseFloat(n1.left);
        const y1 = parseFloat(n1.top);
        const x2 = parseFloat(n2.left);
        const y2 = parseFloat(n2.top);
        // Use an SVG-free approach: a thin rotated div
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <div
            key={`conn-${i}`}
            className="absolute origin-left"
            style={{
              top: `${y1}%`,
              left: `${x1}%`,
              width: `${length}%`,
              height: 1,
              background: 'hsl(var(--primary) / 0.2)',
              transform: `rotate(${angle}deg)`,
              boxShadow: '0 0 4px hsl(var(--primary) / 0.1)',
            }}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((node, i) => (
        <div
          key={`node-${i}`}
          className="absolute animate-pulse"
          style={{
            top: node.top,
            left: node.left,
            width: node.size,
            height: node.size,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            backgroundColor: 'hsl(var(--primary))',
            boxShadow: `0 0 ${node.size}px ${node.size / 2}px hsl(var(--primary) / 0.35), 0 0 ${node.size * 2}px ${node.size}px hsl(var(--primary) / 0.12)`,
            animationDelay: `${i * 0.2}s`,
            animationDuration: '3s',
          }}
        />
      ))}
    </div>
  );
}
