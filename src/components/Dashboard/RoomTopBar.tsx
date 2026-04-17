import { useNavigate } from 'react-router-dom';
import { useRoom, type Room, type SpoonMode } from '@/contexts/RoomContext';

const ROOMS: Array<{ id: Room; label: string; route: string; accent: string }> = [
  { id: 'radar', label: 'Radar Room', route: '/dashboard/radar', accent: 'bg-[#6EB520] text-black border-[#6EB520]' },
  { id: 'exchange', label: 'The Exchange', route: '/dashboard/exchange', accent: 'bg-[#D4AF37] text-black border-[#D4AF37]' },
  { id: 'editing', label: 'Editing Bay', route: '/dashboard/editing', accent: 'bg-[#0B5783] text-white border-[#0B5783]' },
];

const SPOON_MODES: Array<{ id: SpoonMode; label: string }> = [
  { id: 'low', label: 'Low Spoon' },
  { id: 'normal', label: 'Normal' },
  { id: 'hyperfocus', label: 'Hyperfocus' },
];

export function RoomTopBar() {
  const { currentRoom, spoonMode, setSpoonMode } = useRoom();
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-gray-900/50 border-b border-white/5">
      <div className="flex items-center gap-2">
        {ROOMS.map((room) => {
          const active = currentRoom === room.id;
          return (
            <button
              key={room.id}
              onClick={() => navigate(room.route)}
              className={`px-4 py-1.5 rounded-full text-xs font-display tracking-wider uppercase border transition-all cursor-pointer ${
                active
                  ? room.accent
                  : 'bg-transparent text-white/60 border-white/10 hover:text-white/90 hover:border-white/20'
              }`}
            >
              {room.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5">
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
