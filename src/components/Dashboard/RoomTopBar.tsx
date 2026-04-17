import { useNavigate } from 'react-router-dom';
import { useRoom, type Room, type SpoonMode } from '@/contexts/RoomContext';

const ROOMS: Array<{ id: Room; label: string; route: string }> = [
  { id: 'radar', label: 'Radar Room', route: '/dashboard/radar' },
  { id: 'exchange', label: 'The Exchange', route: '/dashboard/exchange' },
  { id: 'editing', label: 'Editing Bay', route: '/dashboard/editing' },
];

const SPOON_MODES: Array<{ id: SpoonMode; label: string }> = [
  { id: 'low', label: 'Low Spoon' },
  { id: 'normal', label: 'Normal' },
  { id: 'hyperfocus', label: 'Hyperfocus' },
];

const ROOM_ACCENTS: Record<Room, string> = {
  radar: '#6EB520',
  exchange: '#D4AF37',
  editing: '#0B5783',
  system: '#888888',
};

export function RoomTopBar() {
  const { currentRoom, setCurrentRoom, spoonMode, setSpoonMode } = useRoom();
  const navigate = useNavigate();

  const handleRoomClick = (room: Room, route: string) => {
    setCurrentRoom(room);
    navigate(route);
  };

  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-3 border-b"
      style={{
        borderColor: 'var(--room-accent-muted, hsl(var(--border)))',
        background: 'var(--room-bg, hsl(var(--background)))',
      }}
    >
      {/* Room selector pills */}
      <div className="flex items-center gap-2">
        {ROOMS.map((room) => {
          const active = currentRoom === room.id;
          const accent = ROOM_ACCENTS[room.id];
          return (
            <button
              key={room.id}
              onClick={() => handleRoomClick(room.id, room.route)}
              className="px-3 py-1.5 rounded-lg text-xs font-display tracking-wider uppercase border transition-all min-h-[36px] cursor-pointer"
              style={{
                background: active ? accent : 'transparent',
                color: active ? '#0a0a0a' : 'var(--room-text, hsl(var(--muted-foreground)))',
                borderColor: active ? accent : 'var(--room-accent-muted, hsl(var(--border)))',
              }}
            >
              {room.label}
            </button>
          );
        })}
      </div>

      {/* Spoon mode pills */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] tracking-[0.2em] uppercase font-display mr-2 opacity-60">
          Spoons
        </span>
        {SPOON_MODES.map((mode) => {
          const active = spoonMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setSpoonMode(mode.id)}
              className="px-2.5 py-1 rounded-md text-[10px] font-display tracking-wider uppercase border transition-all cursor-pointer"
              style={{
                background: active ? 'var(--room-accent, hsl(var(--primary)))' : 'transparent',
                color: active ? '#0a0a0a' : 'var(--room-text, hsl(var(--muted-foreground)))',
                borderColor: active
                  ? 'var(--room-accent, hsl(var(--primary)))'
                  : 'var(--room-accent-muted, hsl(var(--border)))',
              }}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
