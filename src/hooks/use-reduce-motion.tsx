import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ReduceMotionContextType {
  reduceMotion: boolean;
  toggleReduceMotion: () => void;
}

const ReduceMotionContext = createContext<ReduceMotionContextType>({
  reduceMotion: false,
  toggleReduceMotion: () => {},
});

const STORAGE_KEY = 'primer-reduce-motion';

export function ReduceMotionProvider({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(reduceMotion));
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);

  const toggleReduceMotion = () => setReduceMotion((v) => !v);

  return (
    <ReduceMotionContext.Provider value={{ reduceMotion, toggleReduceMotion }}>
      {children}
    </ReduceMotionContext.Provider>
  );
}

export const useReduceMotion = () => useContext(ReduceMotionContext);
