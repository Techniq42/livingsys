export default function DashboardExchange() {
  return (
    <div
      data-room="exchange"
      className="min-h-full p-6 md:p-10"
      style={{ background: 'var(--room-bg, hsl(var(--background)))' }}
    >
      <div className="max-w-2xl">
        <p
          className="text-xs tracking-[0.25em] uppercase font-display mb-3"
          style={{ color: 'var(--room-accent, hsl(var(--primary)))' }}
        >
          The Exchange
        </p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
          Communications Hub
        </h1>
        <p className="text-base text-muted-foreground font-body leading-relaxed mb-8">
          Email triage across three inboxes. Surfaces what matters, filters what doesn't.
        </p>
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-display text-sm tracking-wider"
          style={{
            borderColor: 'var(--room-accent, hsl(var(--primary) / 0.3))',
            color: 'var(--room-accent, hsl(var(--primary)))',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-pulse-dot" />
          Coming Soon
        </div>
      </div>
    </div>
  );
}
