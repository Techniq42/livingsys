import { motion } from 'framer-motion';

const platforms = [
  { name: 'Instagram', status: 'queued' },
  { name: 'Pinterest', status: 'sent' },
  { name: 'Reddit', status: 'confirmed' },
  { name: 'YouTube', status: 'queued' },
  { name: 'LinkedIn', status: 'failed' },
];

const statusLabel: Record<string, { text: string; color: string }> = {
  queued: { text: 'Waiting in line.', color: 'text-muted-foreground' },
  sent: { text: 'Sent. Fingers crossed.', color: 'text-warning' },
  confirmed: { text: 'Landed. Nice.', color: 'text-primary' },
  failed: { text: 'Nope. Try again?', color: 'text-destructive' },
};

export function SocialDistribution() {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-display font-semibold text-foreground">Distribution Status</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {platforms.map((p, i) => {
          const cfg = statusLabel[p.status] || statusLabel.queued;
          return (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-xl border border-border bg-card text-center"
            >
              <p className="text-xs font-display text-foreground mb-1">{p.name}</p>
              <p className={`text-[11px] italic ${cfg.color}`}>{cfg.text}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
