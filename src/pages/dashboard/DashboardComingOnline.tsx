import { useParams } from 'react-router-dom';

const MODE_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  bookkeeping: {
    label: 'Bookkeeping',
    description: 'Capital flows, ledger reconciliation, RIA-side accounting surfaces. Wires when finance pipeline lands.',
  },
  hr: {
    label: 'HR',
    description: 'Operator onboarding, role assignments, federation handshake. Wires after federation_operators surfaces light up.',
  },
  'field-guide': {
    label: 'Field Guide Build',
    description: 'Substrate-meaning authoring, exemplar curation, no-list editing. Wires when Claude\'s substrate files land.',
  },
  triage: {
    label: 'Triage',
    description: 'Three-tier email surface: Act Now / Worth Knowing / Archive-Searchable. Wires when n8n IMAP route ships.',
  },
  agency: {
    label: 'Agency',
    description: 'External representation lane — speaking-on-behalf-of with explicit handoff. Wires after Agency mode in Nexus.',
  },
  brand: {
    label: 'Brand',
    description: 'Voice consistency, asset library, public-face publishing. Wires after Editing Bay reaches v1.',
  },
};

export default function DashboardComingOnline() {
  const { mode } = useParams<{ mode: string }>();
  const info = mode ? MODE_DESCRIPTIONS[mode] : undefined;

  if (!info) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Unknown mode.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl">
      <div className="mb-2 inline-flex items-center gap-2 px-2 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 text-[10px] uppercase tracking-wider">
        Scaffolded · not yet wired
      </div>
      <h1 className="text-2xl font-display text-foreground mb-3">{info.label}</h1>
      <p className="text-sm text-muted-foreground italic font-body mb-8">{info.description}</p>
      <div className="border border-dashed border-border rounded-lg p-8 text-center bg-card/30">
        <p className="text-xs text-muted-foreground/70 font-mono">coming online</p>
      </div>
    </div>
  );
}
