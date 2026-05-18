import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SubAccount {
  slug: string;
  label: string;
  agency_role: 'owned' | 'external';
  voice_register: string;
  lens_binding: string | null;
}

interface SubAccountContextValue {
  subAccounts: SubAccount[];
  active: SubAccount | null;
  setActiveSlug: (slug: string) => void;
  loading: boolean;
}

const Ctx = createContext<SubAccountContextValue | null>(null);

const STORAGE_KEY = 'fls.active_sub_account';

export function SubAccountProvider({ children }: { children: ReactNode }) {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [activeSlug, setActive] = useState<string | null>(
    () => (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('ghl_sub_accounts')
        .select('slug,label,agency_role,voice_register,lens_binding')
        .eq('is_active', true)
        .order('sort_order');
      const rows = (data ?? []) as SubAccount[];
      setSubAccounts(rows);
      if (!activeSlug && rows.length) {
        const defaultSlug = rows.find((r) => r.slug === 'fls')?.slug ?? rows[0].slug;
        setActive(defaultSlug);
        localStorage.setItem(STORAGE_KEY, defaultSlug);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setActiveSlug = (slug: string) => {
    setActive(slug);
    localStorage.setItem(STORAGE_KEY, slug);
  };

  const active = subAccounts.find((s) => s.slug === activeSlug) ?? null;

  return (
    <Ctx.Provider value={{ subAccounts, active, setActiveSlug, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSubAccount() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSubAccount must be used inside SubAccountProvider');
  return v;
}
