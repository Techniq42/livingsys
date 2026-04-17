import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export type Room = 'radar' | 'exchange' | 'editing' | 'system';
export type SpoonMode = 'low' | 'normal' | 'hyperfocus';

const ROOM_STORAGE_KEY = 'sovereign-os.current-room';
const SPOON_STORAGE_KEY = 'sovereign-os.spoon-mode';
const DEFAULT_ROOM: Room = 'radar';
const DEFAULT_SPOON: SpoonMode = 'normal';

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
  spoonMode: SpoonMode;
  setSpoonMode: (mode: SpoonMode) => void;
}

const RoomContext = createContext<RoomContextValue | undefined>(undefined);

export function RoomProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  const [currentRoom, setCurrentRoomState] = useState<Room>(() => {
    if (typeof window === 'undefined') return DEFAULT_ROOM;
    const stored = window.localStorage.getItem(ROOM_STORAGE_KEY) as Room | null;
    return stored ?? DEFAULT_ROOM;
  });

  const [spoonMode, setSpoonModeState] = useState<SpoonMode>(() => {
    if (typeof window === 'undefined') return DEFAULT_SPOON;
    const stored = window.localStorage.getItem(SPOON_STORAGE_KEY) as SpoonMode | null;
    return stored ?? DEFAULT_SPOON;
  });

  useEffect(() => {
    const derived = deriveRoomFromPath(location.pathname);
    if (derived && derived !== currentRoom) {
      setCurrentRoomState(derived);
    }
  }, [location.pathname, currentRoom]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ROOM_STORAGE_KEY, currentRoom);
    } catch {
      // ignore
    }
  }, [currentRoom]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SPOON_STORAGE_KEY, spoonMode);
    } catch {
      // ignore
    }
  }, [spoonMode]);

  const value = useMemo<RoomContextValue>(
    () => ({
      currentRoom,
      setCurrentRoom: setCurrentRoomState,
      spoonMode,
      setSpoonMode: setSpoonModeState,
    }),
    [currentRoom, spoonMode],
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom(): RoomContextValue {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used within a RoomProvider');
  return ctx;
}
