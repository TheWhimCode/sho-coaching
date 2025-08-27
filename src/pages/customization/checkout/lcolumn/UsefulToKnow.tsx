// src/pages/customization/checkout/lcolumn/UsefulToKnow.tsx
"use client";

export default function UsefulToKnow() {
  return (
    <aside
      className="
        relative
        max-w-3xl sm:max-w-4xl lg:max-w-5xl
        w-full
      "
    >
      {/* Title */}
      <h2 className="font-semibold tracking-tight text-xl sm:text-3xl text-white/90 mb-10">
        Want to prepare?
      </h2>

      {/* Notes */}
      <ul className="space-y-14 text-[16px] leading-relaxed text-white/65">
        <PrepItem
          color="sky"
          title="Join Discord"
          description="You will meet with Sho on his Discord server, make sure you join! You’ll find some additional resources there as well. Before your session, double-check your mic & audio."
          icon={<HeadsetIcon className="h-5 w-5" />}
        />
        <PrepItem
          color="violet"
          title="Know your goal"
          description="Ask yourself the most important question: Why are you getting coaching? Sho will ask you this. If you know exactly what you want, he will be able to tailor the session to your goals."
          icon={<TargetIcon className="h-5 w-5" />}
        />
        <PrepItem
          color="orange"
          title="Bring a POV"
          description="Record your point of view of the game you want to review. This way you’ll be able to review the game from your own perspective. There are many softwares to make this easy: Insights.gg, Outplayed, Replays.gg. Upload to Google Drive/Youtube for smooth playback."
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
    sky: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
    violet: "bg-violet-400/10 text-violet-300 ring-violet-400/20",
    orange: "bg-orange-400/10 text-orange-300 ring-orange-400/20",
  };

  return (
    <li className="flex gap-5">
      <div
        className={`
          flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset
          ${colorClasses[color]}
        `}
      >
        {icon}
      </div>
      <div className="space-y-2">
        <div className="font-medium text-white/75 text-[16px]">{title}</div>
        <p>{description}</p>
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
