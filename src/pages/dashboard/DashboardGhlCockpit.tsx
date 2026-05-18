import { useEffect, useState } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSubAccount } from '@/contexts/SubAccountContext';
import { Building2, Layers, ClipboardList, AlertCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface Ctx { user: User; userRole: string }
interface InventoryRow { id: string; object_kind: string; name: string; status: string | null; last_synced_at: string }
interface ActionRow { id: string; action_kind: string; via: string; status: string; created_at: string; error_message: string | null }

export default function DashboardGhlCockpit() {
  const { userRole } = useOutletContext<Ctx>();
  const { active, subAccounts } = useSubAccount();
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [actions, setActions] = useState<ActionRow[]>([]);

  useEffect(() => {
    if (!active) return;
    (async () => {
      const [{ data: inv }, { data: acts }] = await Promise.all([
        (supabase as any)
          .from('ghl_inventory')
          .select('id,object_kind,name,status,last_synced_at')
          .eq('sub_account_slug', active.slug)
          .order('object_kind'),
        (supabase as any)
          .from('ghl_action_log')
          .select('id,action_kind,via,status,created_at,error_message')
          .eq('sub_account_slug', active.slug)
          .order('created_at', { ascending: false })
          .limit(25),
      ]);
      setInventory((inv ?? []) as InventoryRow[]);
      setActions((acts ?? []) as ActionRow[]);
    })();
  }, [active]);

  if (userRole !== 'architect') return <Navigate to="/dashboard" replace />;

  const byKind = inventory.reduce<Record<string, InventoryRow[]>>((acc, r) => {
    (acc[r.object_kind] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-1">
          GHL Cockpit
        </h1>
        <p className="text-sm text-muted-foreground italic font-body">
          {active
            ? `Piloting ${active.label}. Empty is sandbox; FLS and BLS require approval.`
            : 'Select a sub-account from the top bar to begin.'}
        </p>
      </div>

      {/* Sub-account summary strip */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-display font-semibold uppercase tracking-wider">Sub-accounts</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {subAccounts.map((s) => (
            <div
              key={s.slug}
              className={`rounded-lg border p-3 ${
                active?.slug === s.slug ? 'border-primary bg-primary/5' : 'border-border bg-background/40'
              }`}
            >
              <p className="text-sm font-display font-semibold">{s.label}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-display mt-1">
                voice: {s.voice_register} {s.lens_binding && `· lens: ${s.lens_binding}`}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Inventory */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-display font-semibold uppercase tracking-wider">Inventory</h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-display">
            {inventory.length} objects synced
          </span>
        </div>
        {inventory.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 italic">
            No inventory synced yet. n8n will populate this once the GHL OAuth handshake completes and the
            first sync workflow fires.
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(byKind).map(([kind, rows]) => (
              <div key={kind}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-display mb-1">
                  {kind} · {rows.length}
                </p>
                <div className="space-y-1">
                  {rows.slice(0, 6).map((r) => (
                    <div key={r.id} className="text-xs flex items-center gap-3 rounded border border-border/40 bg-background/40 px-2 py-1">
                      <span className="font-body flex-1 truncate">{r.name}</span>
                      {r.status && <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-display">{r.status}</span>}
                    </div>
                  ))}
                  {rows.length > 6 && <p className="text-[10px] text-muted-foreground/60 italic pl-2">+{rows.length - 6} more</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Action log */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-display font-semibold uppercase tracking-wider">Recent actions</h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-display">
            last {actions.length}
          </span>
        </div>
        {actions.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 italic">No actions logged yet for this sub-account.</p>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {actions.map((a) => (
              <div key={a.id} className="rounded border border-border/50 bg-background/40 px-3 py-1.5 text-xs flex items-center gap-3">
                <span className="font-display uppercase tracking-wider text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                  {a.action_kind}
                </span>
                <span className="font-display uppercase tracking-wider text-[9px] bg-muted/40 px-1.5 py-0.5 rounded">
                  {a.via}
                </span>
                <span className={`font-display uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded ${
                  a.status === 'completed' ? 'bg-emerald-500/15 text-emerald-300'
                  : a.status === 'failed' ? 'bg-destructive/15 text-destructive'
                  : a.status === 'executing' ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-muted/40 text-muted-foreground'
                }`}>
                  {a.status}
                </span>
                {a.error_message && (
                  <span className="text-destructive/80 flex items-center gap-1 truncate flex-1">
                    <AlertCircle className="h-3 w-3" />
                    {a.error_message}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground/60 font-mono ml-auto">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
