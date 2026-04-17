import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export type Room = 'radar' | 'exchange' | 'editing' | 'settings';
export type SpoonMode = 'low' | 'normal' | 'hyperfocus';

const SPOON_STORAGE_KEY = 'fls-spoon-mode';
const DEFAULT_ROOM: Room = 'radar';
const DEFAULT_SPOON: SpoonMode = 'normal';

function deriveRoomFromPath(pathname: string): Room {
  if (pathname.startsWith('/dashboard/exchange') || pathname.startsWith('/dashboard/intake')) {
    return 'exchange';
  }
  if (pathname.startsWith('/dashboard/editing')) {
    return 'editing';
  }
  if (
    pathname.startsWith('/dashboard/settings') ||
    pathname.startsWith('/dashboard/health') ||
    pathname.startsWith('/dashboard/funnels') ||
    pathname.startsWith('/dashboard/sorting-hat')
  ) {
    return 'settings';
  }
  if (pathname.startsWith('/dashboard/radar') || pathname.startsWith('/dashboard/constellation')) {
    return 'radar';
  }
  return DEFAULT_ROOM;
}

interface RoomContextValue {
  currentRoom: Room;
  spoonMode: SpoonMode;
  setSpoonMode: (mode: SpoonMode) => void;
}

const RoomContext = createContext<RoomContextValue | undefined>(undefined);

export function RoomProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const currentRoom = deriveRoomFromPath(location.pathname);

  const [spoonMode, setSpoonModeState] = useState<SpoonMode>(() => {
    if (typeof window === 'undefined') return DEFAULT_SPOON;
    const stored = window.localStorage.getItem(SPOON_STORAGE_KEY) as SpoonMode | null;
    return stored ?? DEFAULT_SPOON;
  });

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
