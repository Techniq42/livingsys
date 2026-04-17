export default function DashboardEditing() {
  return (
    <div className="min-h-full p-6 md:p-10">
      <div className="max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 text-blue-400">
          Editing Bay
        </h1>
        <p className="text-lg font-display text-white/80 mb-4">
          Content Production
        </p>
        <p className="text-base text-white/60 font-body leading-relaxed mb-8">
          Multi-platform canon distribution. Write once, publish everywhere.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-400/40 text-blue-400 font-display text-xs tracking-[0.2em] uppercase">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse-dot" />
          In development
        </div>
      </div>
    </div>
  );
}
