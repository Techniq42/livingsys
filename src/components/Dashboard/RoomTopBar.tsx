import { useNavigate, useLocation } from 'react-router-dom';
import { useRoom, type SpoonMode } from '@/contexts/RoomContext';

// Spec: Edit, Radar, Bookkeeping, HR, Field-guide-build, Triage, Agency, Brand
// Plus Exchange (kept as a 9th existing room — flagged in plan).
const MODES: Array<{ slug: string; label: string; route: string; live: boolean }> = [
  { slug: 'radar', label: 'Radar', route: '/dashboard/radar', live: true },
  { slug: 'edit', label: 'Edit', route: '/dashboard/editing', live: true },
  { slug: 'exchange', label: 'Exchange', route: '/dashboard/exchange', live: true },
  { slug: 'triage', label: 'Triage', route: '/dashboard/mode/triage', live: false },
  { slug: 'field-guide', label: 'Field Guide', route: '/dashboard/mode/field-guide', live: false },
  { slug: 'bookkeeping', label: 'Bookkeeping', route: '/dashboard/mode/bookkeeping', live: false },
  { slug: 'hr', label: 'HR', route: '/dashboard/mode/hr', live: false },
  { slug: 'agency', label: 'Agency', route: '/dashboard/mode/agency', live: false },
  { slug: 'brand', label: 'Brand', route: '/dashboard/mode/brand', live: false },
];

const SPOON_MODES: Array<{ id: SpoonMode; label: string }> = [
  { id: 'low', label: 'Low Spoon' },
  { id: 'normal', label: 'Normal' },
  { id: 'hyperfocus', label: 'Hyperfocus' },
];

export function RoomTopBar() {
  const { spoonMode, setSpoonMode } = useRoom();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-gray-900/50 border-b border-white/5 overflow-x-auto">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {MODES.map((mode) => {
          const active = location.pathname.startsWith(mode.route);
          return (
            <button
              key={mode.slug}
              onClick={() => mode.live ? navigate(mode.route) : navigate(mode.route)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-display tracking-wider uppercase border transition-all cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : mode.live
                    ? 'bg-transparent text-white/70 border-white/15 hover:text-white hover:border-white/30'
                    : 'bg-transparent text-white/35 border-white/8 hover:text-white/55'
              }`}
              title={mode.live ? mode.label : `${mode.label} — coming online`}
            >
              {mode.label}
              {!mode.live && <span className="ml-1 opacity-60">·</span>}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[10px] tracking-[0.2em] uppercase font-display mr-1 text-white/40">
          Spoons
        </span>
        {SPOON_MODES.map((mode) => {
          const active = spoonMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setSpoonMode(mode.id)}
              className={`px-3 py-1 rounded-full text-[10px] font-display tracking-wider uppercase border transition-all cursor-pointer ${
                active
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-white/50 border-white/10 hover:text-white/80 hover:border-white/20'
              }`}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
