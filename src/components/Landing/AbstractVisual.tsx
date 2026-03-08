interface AbstractVisualProps {
  variant: 'shattered-pillar' | 'neural-network' | 'map-network' | 'abundance' | 'desert-growth';
  className?: string;
}

export function AbstractVisual({ variant, className = '' }: AbstractVisualProps) {
  const base = `w-full h-full min-h-[200px] rounded-sm border border-border/50 overflow-hidden ${className}`;

  switch (variant) {
    case 'shattered-pillar':
      return (
        <div className={`${base} relative bg-gradient-to-b from-[hsl(150_25%_6%)] to-[hsl(150_25%_4%)]`}>
          <svg viewBox="0 0 400 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            {/* Crumbling pillar fragments */}
            <defs>
              <linearGradient id="pillar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(150 10% 25%)" />
                <stop offset="100%" stopColor="hsl(150 10% 12%)" />
              </linearGradient>
              <linearGradient id="growth" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity="0.8" />
                <stop offset="60%" stopColor="hsl(142 71% 45%)" stopOpacity="0.1" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            
            {/* Fractured column pieces */}
            <rect x="160" y="40" width="80" height="60" fill="url(#pillar)" transform="rotate(-3 200 70)" rx="2" />
            <rect x="155" y="110" width="85" height="50" fill="url(#pillar)" transform="rotate(2 197 135)" rx="2" />
            <rect x="150" y="170" width="90" height="40" fill="url(#pillar)" transform="rotate(-5 195 190)" rx="2" />
            <polygon points="170,220 220,215 230,260 160,265" fill="hsl(150 10% 18%)" />
            <polygon points="140,270 250,260 260,310 130,320" fill="hsl(150 10% 15%)" />
            
            {/* Cracks */}
            <path d="M195 40 L192 100 L198 170 L185 220 L190 270" stroke="hsl(150 25% 4%)" strokeWidth="3" fill="none" />
            <path d="M205 60 L210 120 L200 180 L215 240" stroke="hsl(150 25% 4%)" strokeWidth="2" fill="none" />
            
            {/* Organic growth from base */}
            <path d="M130,320 Q120,280 100,260 Q110,270 115,250 Q105,240 95,220" stroke="hsl(142 71% 45%)" strokeWidth="2.5" fill="none" filter="url(#glow)" opacity="0.9" />
            <path d="M180,310 Q170,270 160,250 Q165,240 155,220 Q160,210 150,190" stroke="hsl(142 71% 45%)" strokeWidth="2" fill="none" filter="url(#glow)" opacity="0.7" />
            <path d="M260,310 Q270,275 280,255 Q275,245 285,225" stroke="hsl(142 71% 45%)" strokeWidth="2.5" fill="none" filter="url(#glow)" opacity="0.9" />
            <path d="M220,315 Q230,285 240,265 Q235,250 245,230 Q240,220 250,200" stroke="hsl(142 71% 45%)" strokeWidth="2" fill="none" filter="url(#glow)" opacity="0.7" />
            
            {/* Leaves / organic shapes */}
            <ellipse cx="95" cy="218" rx="8" ry="4" fill="hsl(142 71% 45%)" opacity="0.6" transform="rotate(-30 95 218)" />
            <ellipse cx="150" cy="188" rx="7" ry="3.5" fill="hsl(142 71% 45%)" opacity="0.5" transform="rotate(20 150 188)" />
            <ellipse cx="285" cy="223" rx="8" ry="4" fill="hsl(142 71% 45%)" opacity="0.6" transform="rotate(30 285 223)" />
            <ellipse cx="250" cy="198" rx="7" ry="3.5" fill="hsl(142 71% 45%)" opacity="0.5" transform="rotate(-20 250 198)" />
            
            {/* Ground / roots */}
            <rect x="0" y="320" width="400" height="80" fill="url(#growth)" />
            <path d="M0,340 Q100,330 200,335 Q300,340 400,330" stroke="hsl(142 71% 35%)" strokeWidth="1" fill="none" opacity="0.4" />
            <path d="M0,355 Q80,345 160,350 Q240,355 320,348 Q360,345 400,350" stroke="hsl(142 71% 35%)" strokeWidth="0.8" fill="none" opacity="0.3" />
          </svg>
        </div>
      );

    case 'neural-network':
      return (
        <div className={`${base} relative bg-gradient-to-br from-[hsl(150_25%_6%)] to-[hsl(150_25%_8%)]`}>
          <svg viewBox="0 0 300 300" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <filter id="nodeGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {/* Connections */}
            {[[150,60,80,150],[150,60,220,150],[150,60,150,150],[80,150,50,250],[80,150,150,250],
              [150,150,100,250],[150,150,200,250],[220,150,150,250],[220,150,250,250]].map(([x1,y1,x2,y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(142 71% 45%)" strokeWidth="1" opacity="0.3" />
            ))}
            {/* Nodes */}
            {[[150,60],[80,150],[150,150],[220,150],[50,250],[100,250],[150,250],[200,250],[250,250]].map(([cx,cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={i === 0 ? 8 : 6} fill="hsl(142 71% 45%)" opacity={0.5 + i * 0.05} filter="url(#nodeGlow)" />
            ))}
            {/* Pulse rings */}
            <circle cx="150" cy="60" r="14" stroke="hsl(142 71% 45%)" strokeWidth="1" fill="none" opacity="0.2" />
            <circle cx="150" cy="150" r="12" stroke="hsl(142 71% 45%)" strokeWidth="1" fill="none" opacity="0.15" />
          </svg>
        </div>
      );

    case 'map-network':
      return (
        <div className={`${base} relative bg-gradient-to-br from-[hsl(200_15%_8%)] to-[hsl(150_20%_6%)]`}>
          <svg viewBox="0 0 300 300" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <filter id="pinGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {/* Abstract lake shape */}
            <path d="M80,100 Q120,80 180,90 Q220,95 240,120 Q260,160 240,200 Q220,230 180,240 Q130,250 100,220 Q70,190 60,150 Q55,120 80,100Z" fill="hsl(200 30% 15%)" stroke="hsl(200 30% 25%)" strokeWidth="1" />
            {/* Coastline detail */}
            <path d="M90,110 Q130,95 170,100 Q200,105 220,125" stroke="hsl(150 20% 25%)" strokeWidth="0.8" fill="none" />
            {/* Network connections */}
            {[[150,130,100,180],[150,130,200,170],[150,130,160,210],[100,180,160,210],[200,170,160,210]].map(([x1,y1,x2,y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(142 71% 45%)" strokeWidth="1" opacity="0.4" strokeDasharray="4 3" />
            ))}
            {/* Location pins */}
            {[[150,130],[100,180],[200,170],[160,210],[120,140]].map(([cx,cy], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r="4" fill="hsl(142 71% 45%)" filter="url(#pinGlow)" opacity="0.8" />
                <circle cx={cx} cy={cy} r="7" stroke="hsl(142 71% 45%)" strokeWidth="0.8" fill="none" opacity="0.3" />
              </g>
            ))}
            {/* Label */}
            <text x="150" y="265" textAnchor="middle" fill="hsl(142 71% 45%)" fontSize="10" fontFamily="monospace" opacity="0.5">SORI VILLAGE · KENYA</text>
          </svg>
        </div>
      );

    case 'abundance':
      return (
        <div className={`${base} relative bg-gradient-to-t from-[hsl(150_25%_4%)] to-[hsl(30_15%_10%)]`}>
          <svg viewBox="0 0 300 300" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            {/* Overflowing containers */}
            <rect x="60" y="160" width="60" height="80" rx="3" fill="hsl(150 10% 15%)" stroke="hsl(150 10% 25%)" strokeWidth="1" />
            <rect x="140" y="140" width="60" height="100" rx="3" fill="hsl(150 10% 15%)" stroke="hsl(150 10% 25%)" strokeWidth="1" />
            <rect x="220" y="170" width="60" height="70" rx="3" fill="hsl(150 10% 15%)" stroke="hsl(150 10% 25%)" strokeWidth="1" />
            {/* Overflow - green organic matter */}
            {[[90,155],[80,148],[100,150],[170,135],[160,128],[180,132],[250,165],[240,160],[260,162]].map(([cx,cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={5 + (i % 3) * 2} fill="hsl(142 71% 45%)" opacity={0.3 + (i % 3) * 0.1} />
            ))}
            {/* Waste arrows going nowhere */}
            <path d="M90,250 L90,280" stroke="hsl(0 60% 40%)" strokeWidth="2" opacity="0.4" markerEnd="none" />
            <line x1="85" y1="280" x2="95" y2="280" stroke="hsl(0 60% 40%)" strokeWidth="2" opacity="0.4" />
            <path d="M170,250 L170,280" stroke="hsl(0 60% 40%)" strokeWidth="2" opacity="0.4" />
            <line x1="165" y1="280" x2="175" y2="280" stroke="hsl(0 60% 40%)" strokeWidth="2" opacity="0.4" />
            {/* "Blocked" X marks */}
            <g opacity="0.3" stroke="hsl(0 60% 45%)" strokeWidth="1.5">
              <line x1="85" y1="275" x2="95" y2="285" /><line x1="95" y1="275" x2="85" y2="285" />
              <line x1="165" y1="275" x2="175" y2="285" /><line x1="175" y1="275" x2="165" y2="285" />
            </g>
            {/* Header text */}
            <text x="150" y="50" textAnchor="middle" fill="hsl(37 67% 42%)" fontSize="11" fontFamily="monospace" opacity="0.6">ABUNDANCE → WASTE</text>
            <text x="150" y="68" textAnchor="middle" fill="hsl(37 67% 42%)" fontSize="9" fontFamily="monospace" opacity="0.4">coordination failure</text>
          </svg>
        </div>
      );

    case 'desert-growth':
      return (
        <div className={`${base} relative bg-gradient-to-t from-[hsl(142_30%_8%)] to-[hsl(37_20%_10%)]`}>
          <svg viewBox="0 0 300 250" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(37 30% 20%)" />
                <stop offset="100%" stopColor="hsl(37 20% 12%)" />
              </linearGradient>
            </defs>
            {/* Desert dunes */}
            <path d="M0,180 Q75,160 150,175 Q225,190 300,170 L300,250 L0,250Z" fill="url(#sand)" />
            <path d="M0,195 Q60,185 120,190 Q180,195 240,188 Q270,185 300,190 L300,250 L0,250Z" fill="hsl(37 20% 10%)" />
            {/* Irrigation channels */}
            <path d="M50,190 Q100,185 150,188 Q200,191 250,186" stroke="hsl(200 40% 35%)" strokeWidth="1.5" fill="none" opacity="0.5" />
            <path d="M80,200 Q130,196 180,198 Q220,200 260,196" stroke="hsl(200 40% 35%)" strokeWidth="1" fill="none" opacity="0.3" />
            {/* Green shoots growing */}
            {[[100,178],[150,172],[200,175],[130,180],[230,174]].map(([x,y], i) => (
              <g key={i}>
                <line x1={x} y1={y} x2={x} y2={y - 15 - i * 3} stroke="hsl(142 71% 40%)" strokeWidth="1.5" />
                <ellipse cx={x - 4} cy={y - 14 - i * 3} rx="4" ry="2.5" fill="hsl(142 71% 45%)" opacity="0.6" transform={`rotate(-25 ${x-4} ${y-14-i*3})`} />
                <ellipse cx={x + 4} cy={y - 10 - i * 3} rx="4" ry="2.5" fill="hsl(142 71% 45%)" opacity="0.5" transform={`rotate(25 ${x+4} ${y-10-i*3})`} />
              </g>
            ))}
            {/* Sun/heat */}
            <circle cx="250" cy="50" r="25" fill="hsl(37 67% 42%)" opacity="0.15" />
            <circle cx="250" cy="50" r="35" stroke="hsl(37 67% 42%)" strokeWidth="0.5" fill="none" opacity="0.1" />
          </svg>
        </div>
      );
  }
}
