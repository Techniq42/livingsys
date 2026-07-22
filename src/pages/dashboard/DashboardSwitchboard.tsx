// @ts-nocheck
import { useEffect, useState } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Wrench, BookOpen, Activity } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface Ctx { user: User; userRole: string }

interface ModeRow { id: string; slug: string; label: string; tagline: string | null; allowed_tools: string[]; is_enabled: boolean; voice_register: string }
interface ToolRow { id: string; slug: string; label: string; kind: string; skill_summary: string | null; confidence_threshold: number; is_enabled: boolean }
interface SkillRow { id: string; slug: string; title: string; summary: string | null; applies_to_modes: string[]; is_enabled: boolean }
interface DecisionRow { id: string; mode_slug: string; tools_considered: string[]; tool_chosen: string | null; outcome: string | null; created_at: string }

export default function DashboardSwitchboard() {
  const { userRole } = useOutletContext<Ctx>();
  const [modes, setModes] = useState<ModeRow[]>([]);
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [decisions, setDecisions] = useState<DecisionRow[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: m }, { data: t }, { data: s }, { data: d }] = await Promise.all([
        (supabase as any).from('gemma_modes').select('*').order('sort_order'),
        (supabase as any).from('tool_registry').select('*').order('label'),
        (supabase as any).from('skill_files').select('*').order('sort_order'),
        (supabase as any).from('switchboard_decisions').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      setModes((m ?? []) as ModeRow[]);
      setTools((t ?? []) as ToolRow[]);
      setSkills((s ?? []) as SkillRow[]);
      setDecisions((d ?? []) as DecisionRow[]);
    })();
  }, []);

  if (userRole !== 'architect') return <Navigate to="/dashboard" replace />;

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-1">
          The Switchboard
        </h1>
        <p className="text-sm text-muted-foreground italic font-body">
          The plug-in layer. What modes Gemma can wear, which tools each mode can reach, and the decisions she's been making.
        </p>
      </div>

      {/* Modes */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-display font-semibold uppercase tracking-wider">Focus modes</h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-display">
            {modes.length} configured
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modes.map((m) => (
            <div key={m.id} className={`rounded-lg border p-3 ${m.is_enabled ? 'border-border bg-background/60' : 'border-border/30 bg-muted/10 opacity-60'}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-display font-semibold">{m.label}</p>
                <span className="text-[9px] font-mono text-muted-foreground/60">{m.slug}</span>
              </div>
              {m.tagline && <p className="text-xs text-muted-foreground font-body italic mb-2">{m.tagline}</p>}
              <div className="flex items-center gap-1 flex-wrap">
                {m.allowed_tools.map((t) => (
                  <span key={t} className="text-[9px] uppercase tracking-wider font-display bg-primary/10 text-primary px-1.5 py-0.5 rounded">{t}</span>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-2">voice: {m.voice_register}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-display font-semibold uppercase tracking-wider">Tool registry</h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-display">
            {tools.length} tools
          </span>
        </div>
        <div className="space-y-2">
          {tools.map((t) => (
            <div key={t.id} className="rounded-lg border border-border p-3 bg-background/60">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-display font-semibold">{t.label}</p>
                  <span className="text-[9px] uppercase tracking-wider bg-muted/50 px-1.5 py-0.5 rounded font-display">{t.kind}</span>
                  {!t.is_enabled && <span className="text-[9px] uppercase tracking-wider bg-destructive/20 text-destructive px-1.5 py-0.5 rounded font-display">disabled</span>}
                </div>
                <span className="text-[10px] text-muted-foreground/60 font-mono">conf ≥ {t.confidence_threshold}</span>
              </div>
              {t.skill_summary && <p className="text-xs text-muted-foreground font-body">{t.skill_summary}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-display font-semibold uppercase tracking-wider">Skill files</h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-display">
            {skills.length} skills
          </span>
        </div>
        <div className="space-y-2">
          {skills.map((s) => (
            <div key={s.id} className="rounded-lg border border-border p-3 bg-background/60">
              <p className="text-sm font-display font-semibold mb-1">{s.title}</p>
              {s.summary && <p className="text-xs text-muted-foreground font-body mb-2">{s.summary}</p>}
              <div className="flex items-center gap-1 flex-wrap">
                {s.applies_to_modes.map((mode) => (
                  <span key={mode} className="text-[9px] uppercase tracking-wider font-display bg-secondary/20 text-secondary px-1.5 py-0.5 rounded">{mode}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Decisions */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-display font-semibold uppercase tracking-wider">Recent decisions</h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-display">
            last {decisions.length}
          </span>
        </div>
        {decisions.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 italic">No decisions logged yet. Open the drawer and ask Gemma something.</p>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {decisions.map((d) => (
              <div key={d.id} className="rounded border border-border/50 bg-background/40 px-3 py-1.5 text-xs flex items-center gap-3">
                <span className="font-display uppercase tracking-wider text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                  {d.mode_slug}
                </span>
                <span className="text-muted-foreground font-body flex-1 truncate">
                  considered: {d.tools_considered.join(', ') || '—'}
                </span>
                <span className="text-[10px] text-muted-foreground/60 font-mono">
                  {new Date(d.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
