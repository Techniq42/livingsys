import { useNavigate, useLocation } from 'react-router-dom';
import { SubAccountSwitcher } from '@/components/ghl/SubAccountSwitcher';

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

export function RoomTopBar() {
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
              onClick={() => navigate(mode.route)}
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
      <div className="flex-shrink-0">
        <SubAccountSwitcher />
      </div>
    </div>
  );
}
