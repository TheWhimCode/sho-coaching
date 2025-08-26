// src/components/checkout/UsefulToKnow.tsx
"use client";

export default function UsefulToKnow() {
  return (
    <aside className="relative max-w-2xl sm:max-w-3xl">
      {/* Title */}
      <h1 className="font-extrabold tracking-tight text-3xl sm:text-4xl text-white/95">
        Want to prepare?
      </h1>

      {/* Copy */}
      <ul className="mt-5 space-y-6 text-[15.5px] leading-relaxed tracking-[0.1px] text-white/85">
        <li className="group flex gap-4 rounded-xl border border-white/5 bg-white/5/5 p-4 sm:p-5 backdrop-blur-[2px] transition-colors hover:border-white/10">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300 ring-1 ring-inset ring-white/10">
            <HeadsetIcon className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-white">Join Sho&apos;s Discord</div>
            <p className="text-[15px] text-white/70">
              The session runs on Discord. That’s where you’ll find resources and
              logistics. Before we start, double-check your mic & audio.
            </p>
          </div>
        </li>

        <li className="group flex gap-4 rounded-xl border border-white/5 bg-white/5/5 p-4 sm:p-5 backdrop-blur-[2px] transition-colors hover:border-white/10">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300 ring-1 ring-inset ring-white/10">
            <TargetIcon className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-white">Know your goal</div>
            <p className="text-[15px] text-white/70">
              Ask yourself <em>why</em> you’re getting coaching. The clearer the
              target, the more tailored and valuable the session becomes.
            </p>
          </div>
        </li>

        <li className="group flex gap-4 rounded-xl border border-white/5 bg-white/5/5 p-4 sm:p-5 backdrop-blur-[2px] transition-colors hover:border-white/10">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300 ring-1 ring-inset ring-white/10">
            <VideoIcon className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-white">Bring a game POV</div>
            <p className="text-[15px] text-white/70">
              Record the match you want to review (OBS, Medal, etc.). Upload to
              YouTube or Google Drive if possible — your perspective helps most.
            </p>
          </div>
        </li>
      </ul>

      {/* Soft background glow to keep it blended */}
      <span className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl bg-[radial-gradient(600px_400px_at_top_left,rgba(148,182,255,0.08),transparent_70%)]" />
    </aside>
  );
}

function HeadsetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 4a8 8 0 00-8 8v4a2 2 0 002 2h2v-6H6v-2a6 6 0 0112 0v2h-2v6h2a2 2 0 002-2v-4a8 8 0 00-8-8z"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}
function TargetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function VideoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M17 10l4-2v8l-4-2v-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
