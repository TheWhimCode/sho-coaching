// src/pages/customization/checkout/lcolumn/UsefulToKnow.tsx
"use client";

import { Target, FilmReel } from "@phosphor-icons/react";
import { FaDiscord } from "react-icons/fa"; // 👈 added

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
          description="We will meet on my Discord server, make sure you join! You’ll find some additional resources there as well. Before your session, double-check your mic & audio."
          icon={<FaDiscord size={20} />} // 👈 swapped in FontAwesome Discord
        />
        <PrepItem
          color="violet"
          title="Know your goal"
          description="Ask yourself the most important question: Why are you getting coaching? I will ask you this. If you know exactly what you want, I will be able to tailor the session to your goals."
          icon={<Target size={20} weight="regular" />}
        />
        <PrepItem
          color="orange"
          title="Bring a POV"
          description="Record your point of view of the game you want to review. This way we’ll be able to review the game from your own perspective. There are many softwares to make this easy: Insights.gg, Outplayed, Replays.gg. Upload to Google Drive/Youtube for smooth playback."
          icon={<FilmReel size={20} weight="regular" />}
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
