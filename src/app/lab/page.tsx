export default function LabPage() {
  return (
    <main className="relative min-h-screen text-white">
      {/* background layers */}
      <div className="absolute inset-0 bg-hero" />
      <div className="absolute inset-0 hud-grid" />
      <div className="absolute inset-0 vignette" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12 space-y-10">
        <h1 className="text-3xl font-bold">UI Lab</h1>

        {/* Buttons */}
        <section className="grid gap-3 md:grid-cols-3">
          <button className="rounded-xl py-3 px-4 bg-[var(--cta)] hover:bg-[var(--cta2)] text-black font-semibold transition">
            Primary CTA (orange)
          </button>
          <button className="rounded-xl py-3 px-4 bg-white/10 hover:bg-white/15 ring-1 ring-white/15 transition">
            Secondary
          </button>
          <a className="rounded-xl py-3 px-4 text-[var(--primary)] hover:text-[var(--primary2)] ring-1 ring-white/10 bg-white/5 transition inline-flex items-center justify-center cursor-pointer">
            Link / Tertiary
          </a>
        </section>

        {/* Cards */}
        <section className="grid gap-6 md:grid-cols-3">
          <div className="frost-card p-5">
            <h3 className="font-semibold mb-2">Frost card</h3>
            <p className="text-[var(--muted)] text-sm">
              Soft glass panel for most content blocks.
            </p>
          </div>

          <div className="glow-stroke frost-card p-5">
            <h3 className="font-semibold mb-2">Featured (glow stroke)</h3>
            <p className="text-[var(--muted)] text-sm">
              Use sparingly (hero/session card).
            </p>
          </div>

          <div className="frost-card corner-ticks p-5">
            <h3 className="font-semibold mb-2">Corner ticks</h3>
            <p className="text-[var(--muted)] text-sm">
              Tiny HUD detail for sections.
            </p>
          </div>
        </section>

        {/* Availability list sample */}
        <section className="frost-card p-5">
          <div className="text-sm text-white/80 mb-3">Next available</div>
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {["Today • 19:00","Tomorrow • 16:15","Fri • 18:00"].map((t) => (
              <li key={t}>
                <button className="w-full px-3 py-2 rounded-lg text-sm ring-1 ring-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-white/90">
                  {t}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-white/60">
            Times are shown in your timezone.
          </p>
        </section>

        {/* Alerts */}
        <section className="grid gap-3 md:grid-cols-3">
          <div className="frost-card p-4 text-emerald-300 ring-1 ring-emerald-500/20">
            ✅ Success message
          </div>
          <div className="frost-card p-4 text-amber-300 ring-1 ring-amber-500/20">
            ⚠️ Warning
          </div>
          <div className="frost-card p-4 text-rose-300 ring-1 ring-rose-500/20">
            ✖ Error
          </div>
        </section>
      </div>
    </main>
  );
}
