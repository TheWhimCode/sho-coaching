"use client";

export default function UsefulToKnow() {
  return (
    <aside className="relative max-w-2xl sm:max-w-3xl">
      {/* Title */}
      <h1 className="font-extrabold tracking-tight text-2xl sm:text-3xl text-white mb-4">
        Want to prepare?
      </h1>

      {/* Notes */}
      <ul className="space-y-6 text-[15.5px] leading-relaxed text-white/80">
        <PrepItem
          color="sky"
          title="Join Sho's Discord"
          description="The session runs on Discord. That’s where you’ll find resources and logistics. Before we start, double-check your mic & audio."
          icon={<HeadsetIcon className="h-5 w-5" />}
        />
        <PrepItem
          color="violet"
          title="Know your goal"
          description="Ask yourself why you’re getting coaching. The clearer the target, the more tailored and valuable the session becomes."
          icon={<TargetIcon className="h-5 w-5" />}
        />
        <PrepItem
          color="orange"
          title="Bring a game POV"
          description="Record the match you want to review (OBS, Medal, etc.). Upload to YouTube or Google Drive if possible — your perspective helps most."
          icon={<VideoIcon className="h-5 w-5" />}
        />
      </ul>
    </aside>
  );
}

function PrepItem({
  title,
  description,
  icon,
  color,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: "sky" | "violet" | "orange";
}) {
  const colorClasses: Record<string, string> = {
    sky: "bg-sky-400/10 text-sky-300 group-hover:ring-sky-400/30",
    violet: "bg-violet-400/10 text-violet-300 group-hover:ring-violet-400/30",
    orange: "bg-orange-400/10 text-orange-300 group-hover:ring-orange-400/30",
  };

  return (
    <li
      className="
        group flex gap-4 rounded-xl p-5 transition
        hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]
      "
    >
      <div
        className={`
          flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10
          ${colorClasses[color]}
        `}
      >
        {icon}
      </div>
      <div className="space-y-1">
        <div className="font-semibold text-white">{title}</div>
        <p className="text-[15px] text-white/70">{description}</p>
      </div>
    </li>
  );
}

/* Icons */
function HeadsetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 4a8 8 0 00-8 8v4a2 2 0 002 2h2v-6H6v-2a6 6 0 0112 0v2h-2v6h2a2 2 0 002-2v-4a8 8 0 00-8-8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
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
