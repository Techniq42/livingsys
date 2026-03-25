import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { portalTiles, iNeedToOptions } from '@/config/primerConfig';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function PortalHub() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-semibold text-foreground">Portals</h2>

        {/* "I need to..." dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 text-sm font-display text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg border border-border hover:border-primary/30 cursor-pointer min-h-[44px]"
          >
            I need to…
            <ChevronDown className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden"
            >
              {iNeedToOptions.map((opt) => (
                <a
                  key={opt.label}
                  href={opt.target}
                  target={opt.target.startsWith('http') ? '_blank' : undefined}
                  rel={opt.target.startsWith('http') ? 'noopener noreferrer' : undefined}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors min-h-[44px]"
                >
                  <opt.icon className="w-4 h-4 text-muted-foreground" />
                  {opt.label}
                </a>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Tile Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {portalTiles.map((tile, i) => (
          <Tooltip key={tile.id}>
            <TooltipTrigger asChild>
              <motion.a
                href={tile.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                whileHover={{ scale: 1.03 }}
                className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:glow-green transition-all min-h-[100px] cursor-pointer group"
              >
                <tile.icon className="w-6 h-6 text-primary group-hover:text-foreground transition-colors" />
                <span className="text-xs font-display text-muted-foreground group-hover:text-foreground transition-colors">
                  {tile.label}
                </span>
              </motion.a>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-body text-xs italic">
              {tile.riaHover}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </section>
  );
}
