// src/components/checkout/UsefulToKnow.tsx
"use client";

export default function UsefulToKnow() {
  return (
    <aside className="relative max-w-xl">
      {/* Header */}
      <div className="mb-4">
        <div className="text-xs uppercase tracking-wider text-sky-300/80">
          Want to prepare?
        </div>
        <h2 className="mt-1 font-bold text-2xl text-white/90">
          Make the most of your session
        </h2>
      </div>

      {/* Content list (integrated look) */}
      <ul className="space-y-5 text-[15px] text-white/80">
        <li className="flex gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-400/10 text-sky-300">
            <HeadsetIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-white">Join Sho&apos;s Discord</div>
            <p className="text-white/60 text-sm">
              The session runs on Discord. That’s where you’ll find resources
              and logistics. Before we start, double-check your mic & audio.
            </p>
          </div>
        </li>

        <li className="flex gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-400/10 text-sky-300">
            <TargetIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-white">Know your goal</div>
            <p className="text-white/60 text-sm">
              Ask yourself <em>why</em> you’re getting coaching. The clearer the
              target, the more tailored and valuable the session becomes.
            </p>
          </div>
        </li>

        <li className="flex gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-400/10 text-sky-300">
            <VideoIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-white">Bring a game POV</div>
            <p className="text-white/60 text-sm">
              Record the match you want to review (OBS, Medal, etc.). Upload to
              YouTube or Google Drive if possible — your perspective helps most.
            </p>
          </div>
        </li>
      </ul>

      {/* Soft anchor glow */}
      <span className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl bg-[radial-gradient(circle_at_top_left,rgba(148,182,255,0.08),transparent_70%)]" />
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
