export default function DashboardExchange() {
  return (
    <div className="min-h-full p-6 md:p-10">
      <div className="max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 text-amber-400">
          The Exchange
        </h1>
        <p className="text-lg font-display text-white/80 mb-4">
          Communications Hub
        </p>
        <p className="text-base text-white/60 font-body leading-relaxed mb-8">
          Email triage across three inboxes. Surfaces what matters, filters noise.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-400/40 text-amber-400 font-display text-xs tracking-[0.2em] uppercase">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-dot" />
          In development
        </div>
      </div>
    </div>
  );
}
