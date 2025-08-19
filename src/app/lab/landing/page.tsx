// src/app/lab/landing/page.tsx
import AnimatedBg from "@/components/AnimatedBg";

export const dynamic = "force-static";

export default function LabLanding() {
  return (
    <main className="relative min-h-screen text-white">
      <AnimatedBg />

      <div className="relative z-10">
        {/* NAV */}
        <nav className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-white/10 ring-1 ring-white/15 grid place-items-center">⚡</div>
            <span className="font-semibold">CoachLab</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a className="hover:text-white" href="#features">Features</a>
            <a className="hover:text-white" href="#pricing">Pricing</a>
            <a className="hover:text-white" href="#faq">FAQ</a>
            <a
              className="rounded-lg px-3 py-2 bg-white/10 ring-1 ring-white/15 hover:bg-white/15"
              href="/sessions/vod-review"
            >
              Sign in
            </a>
            <span className="cta-halo">
              <a className="btn-cta" href="/sessions/vod-review">Book now</a>
            </span>
          </div>
        </nav>

        {/* HERO */}
        <section className="mx-auto max-w-6xl px-6 py-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Get better, faster.<br />Coaching built for gamers.
            </h1>
            <p className="mt-3 text-white/80 max-w-xl">
              Live VOD reviews, timestamped notes, and a clear plan. Clean UI, secure checkout.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="cta-halo">
                <a className="btn-cta" href="/sessions/vod-review">Book a session</a>
              </span>
              <a
                className="rounded-xl px-5 py-3 bg-white/10 hover:bg-white/15 ring-1 ring-white/15"
                href="#features"
              >
                See how it works
              </a>
            </div>
            <p className="mt-2 text-xs text-white/60">
              Secure checkout via Stripe • Free reschedule up to 24h
            </p>
          </div>

          {/* hero panel */}
          <div className="glow-stroke frost-card p-5">
            <div className="text-xs text-white/60">SESSION</div>
            <div className="mt-1 text-xl font-semibold">VOD Review</div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg bg-white/[0.04] ring-1 ring-white/10 p-3">
                <div className="text-white/60">Duration</div>
                <div className="font-medium">60–120 min</div>
              </div>
              <div className="rounded-lg bg-white/[0.04] ring-1 ring-white/10 p-3">
                <div className="text-white/60">Price</div>
                <div className="font-medium">from €50</div>
              </div>
              <div className="rounded-lg bg-white/[0.04] ring-1 ring-white/10 p-3">
                <div className="text-white/60">Format</div>
                <div className="font-medium">Discord</div>
              </div>
            </div>
            <span className="cta-halo mt-5 inline-block">
              <a className="btn-cta" href="/sessions/vod-review">Check availability</a>
            </span>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-10">
          <h2 className="text-2xl font-bold mb-6">Why it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              ["Timestamped notes","Know exactly what to fix in each moment."],
              ["Action plan","Simple 3-step plan you can follow for 2 weeks."],
              ["Flexible blocks","30–120 min, add follow-ups if you want."],
            ].map(([t,d])=>(
              <div key={t} className="frost-card p-5">
                <div className="text-[var(--primary)] font-semibold">{t}</div>
                <p className="text-white/80 text-sm mt-1">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="mx-auto max-w-6xl px-6 py-10">
          <h2 className="text-2xl font-bold mb-6">Simple pricing</h2>
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            <div className="frost-card p-5 flex flex-col">
              <div className="text-white/80">Starter</div>
              <div className="text-3xl font-extrabold mt-1">€50</div>
              <ul className="mt-3 text-sm text-white/80 space-y-1">
                <li>• 60 min live review</li>
                <li>• Notes + action plan</li>
              </ul>
              <a
                className="mt-auto rounded-lg px-4 py-2 bg-white/10 hover:bg-white/15 ring-1 ring-white/15"
                href="/sessions/vod-review"
              >
                Choose Starter
              </a>
            </div>

            <div className="glow-stroke frost-card p-5 flex flex-col">
              <div className="text-white/80">Most popular</div>
              <div className="text-3xl font-extrabold mt-1">€50 + €0.5/min</div>
              <ul className="mt-3 text-sm text-white/80 space-y-1">
                <li>• 60–120 min live review</li>
                <li>• Timestamps + plan</li>
                <li>• Optional follow-ups</li>
              </ul>
              <span className="mt-auto">
                <a className="btn-cta" href="/sessions/vod-review">Book now</a>
              </span>
            </div>

            <div className="frost-card p-5 flex flex-col">
              <div className="text-white/80">Team</div>
              <div className="text-3xl font-extrabold mt-1">Let’s talk</div>
              <ul className="mt-3 text-sm text-white/80 space-y-1">
                <li>• Blocks for multiple players</li>
                <li>• Team plan & scrim review</li>
              </ul>
              <a
                className="mt-auto rounded-lg px-4 py-2 bg-white/10 hover:bg-white/15 ring-1 ring-white/15"
                href="#contact"
              >
                Contact
              </a>
            </div>
          </div>
        </section>

        {/* TESTIMONIAL */}
        <section className="mx-auto max-w-6xl px-6 py-10">
          <div className="frost-card p-6 md:p-8">
            <blockquote className="text-xl md:text-2xl leading-relaxed">
              “Super actionable. After one session I knew exactly what to fix
              and climbed 200 LP in two weeks.”
            </blockquote>
            <div className="mt-4 flex items-center gap-3 text-white/70">
              <div className="h-8 w-8 rounded-full bg-white/10 ring-1 ring-white/15" />
              <div>R. — Diamond II</div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-6xl px-6 py-10">
          <h2 className="text-2xl font-bold mb-6">FAQ</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              ["What do I need?", "Discord and a VOD (YouTube/Drive)."],
              ["Can I reschedule?", "Yes, free up to 24h before the session."],
              ["Which server/timezone?", "Times are shown in your local timezone."],
              ["Do you accept PayPal?", "Card via Stripe now; PayPal coming soon."],
            ].map(([q,a])=>(
              <div key={q} className="frost-card p-4">
                <div className="font-semibold">{q}</div>
                <p className="text-white/80 text-sm mt-1">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-white/60">
          <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-3">
            <div>© {new Date().getFullYear()} CoachLab</div>
            <div className="flex items-center gap-4">
              <a className="hover:text-white" href="/sessions/vod-review">Book</a>
              <a className="hover:text-white" href="/admin/slots">Admin</a>
              <a className="hover:text-white" href="/lab">UI Lab</a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
