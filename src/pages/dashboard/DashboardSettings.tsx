import { Settings, Accessibility, BookOpen, ExternalLink } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { useReduceMotion } from '@/hooks/use-reduce-motion';

export default function DashboardSettings() {
  const { reduceMotion, toggleReduceMotion } = useReduceMotion();

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-3xl">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground italic font-body">
          Operator preferences and access points. Configuration that travels with this device.
        </p>
      </div>

      {/* Accessibility */}
      <section className="border border-border bg-card/50 rounded-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Accessibility className="h-4 w-4 text-primary" />
          <h2 className="text-sm uppercase tracking-[0.2em] font-display text-primary/80">Accessibility</h2>
        </div>

        <div className="flex items-start justify-between gap-6 py-2">
          <div className="flex-1">
            <Label htmlFor="reduce-motion" className="text-sm font-display text-foreground">
              Reduce motion
            </Label>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Quiets decorative animations across the dashboard — drifting backgrounds, pulses, transitions.
              Useful on low-spoon days, for autistic operators, or anyone who finds movement noisy.
              Stored per device.
            </p>
          </div>
          <Switch id="reduce-motion" checked={reduceMotion} onCheckedChange={toggleReduceMotion} />
        </div>
      </section>

      {/* Public surfaces */}
      <section className="border border-border bg-card/50 rounded-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="text-sm uppercase tracking-[0.2em] font-display text-primary/80">Public surfaces</h2>
        </div>
        <ul className="space-y-2 text-sm">
          <li>
            <Link to="/canon" className="inline-flex items-center gap-1.5 text-foreground hover:text-primary">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Public Canon index — <span className="text-muted-foreground">/canon</span></span>
            </Link>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Visitor-facing reading list of every active canon page. Edit entries from the Canon Registry room.
            </p>
          </li>
        </ul>
      </section>

      {/* Placeholder — operator_config UI */}
      <section className="border border-border/50 bg-card/30 rounded-sm p-5 opacity-70">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm uppercase tracking-[0.2em] font-display text-muted-foreground">Instance config</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Org name, enabled modules, and branding live in <span className="font-mono">operator_config</span>.
          UI for editing those values is coming online.
        </p>
      </section>
    </div>
  );
}
