// src/app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Full-bleed background behind BOTH navbar and content */}
      <div className="fixed inset-0 z-0 bg-[#0B1220]">
        {/* Glow layers */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[120vw] h-[60vh] blur-3xl opacity-80"
            style={{
              background:
                "radial-gradient(60% 80% at 50% 20%, rgba(56,97,251,0.55) 0%, rgba(56,97,251,0.18) 45%, transparent 70%)",
            }}
          />

        </div>
      </div>

      {/* Content (layout adds pt-20 when nav is visible) */}
      <div className="relative z-10 grid place-items-center min-h-[calc(100vh-5rem)] p-8">
        <div className="flex flex-col items-center text-center gap-3">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            Nothing to see here yet.
          </h1>
          <h2 className="text-sm sm:text-base text-white/80">
            Have a cookie <span aria-hidden>🍪</span>
          </h2>
<Link
  href="/coaching"
  className="mt-6 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm sm:text-base font-semibold text-[#0A0A0A] bg-[#fc8803] hover:bg-[#f8a81a] transition shadow-[0_8px_22px_rgba(245,158,11,.35)] ring-1 ring-[rgba(255,190,80,.55)]"
>
  Get Coaching
</Link>
        </div>
      </div>
    </>
  );
}
