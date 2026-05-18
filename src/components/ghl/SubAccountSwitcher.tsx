import { useSubAccount } from '@/contexts/SubAccountContext';
import { Building2 } from 'lucide-react';

/**
 * Compact sub-account switcher. Drop into the RoomTopBar or any GHL-aware surface.
 * Persists selection in localStorage via SubAccountContext.
 */
export function SubAccountSwitcher() {
  const { subAccounts, active, setActiveSlug, loading } = useSubAccount();

  if (loading || subAccounts.length === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-2.5 py-1.5">
      <Building2 className="h-3.5 w-3.5 text-primary/70" />
      <select
        value={active?.slug ?? ''}
        onChange={(e) => setActiveSlug(e.target.value)}
        className="bg-transparent text-xs font-display uppercase tracking-wider text-foreground focus:outline-none cursor-pointer"
        aria-label="Active GHL sub-account"
      >
        {subAccounts.map((s) => (
          <option key={s.slug} value={s.slug} className="bg-background text-foreground">
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
