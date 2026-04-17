import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export type Room = 'radar' | 'exchange' | 'editing' | 'system';

const STORAGE_KEY = 'sovereign-os.current-room';
const DEFAULT_ROOM: Room = 'radar';

const ROUTE_TO_ROOM: Array<{ match: (path: string) => boolean; room: Room }> = [
  { match: (p) => p.startsWith('/dashboard/exchange') || p.startsWith('/dashboard/intake'), room: 'exchange' },
  { match: (p) => p.startsWith('/dashboard/radar') || p.startsWith('/dashboard/constellation'), room: 'radar' },
  { match: (p) => p.startsWith('/dashboard/editing'), room: 'editing' },
  {
    match: (p) =>
      p.startsWith('/dashboard/health') ||
      p.startsWith('/dashboard/funnels') ||
      p.startsWith('/dashboard/sorting-hat') ||
      p.startsWith('/dashboard/settings'),
    room: 'system',
  },
];

function deriveRoomFromPath(pathname: string): Room | null {
  for (const entry of ROUTE_TO_ROOM) {
    if (entry.match(pathname)) return entry.room;
  }
  return null;
}

interface RoomContextValue {
  currentRoom: Room;
  setCurrentRoom: (room: Room) => void;
}

const RoomContext = createContext<RoomContextValue | undefined>(undefined);

export function RoomProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  const [currentRoom, setCurrentRoomState] = useState<Room>(() => {
    if (typeof window === 'undefined') return DEFAULT_ROOM;
    const stored = window.localStorage.getItem(STORAGE_KEY) as Room | null;
    return stored ?? DEFAULT_ROOM;
  });

  // Derive room from route when it matches a known mapping
  useEffect(() => {
    const derived = deriveRoomFromPath(location.pathname);
    if (derived && derived !== currentRoom) {
      setCurrentRoomState(derived);
    }
  }, [location.pathname, currentRoom]);

  // Persist to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, currentRoom);
    } catch {
      // ignore storage errors (private mode, quota)
    }
  }, [currentRoom]);

  const value = useMemo<RoomContextValue>(
    () => ({ currentRoom, setCurrentRoom: setCurrentRoomState }),
    [currentRoom],
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom(): RoomContextValue {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used within a RoomProvider');
  return ctx;
}
