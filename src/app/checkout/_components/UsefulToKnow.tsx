// src/pages/customization/checkout/lcolumn/UsefulToKnow.tsx
"use client";

import { Target, FilmReel } from "@phosphor-icons/react";
import { FaDiscord } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  returningStudentName?: string | null;
  returningStudentCoupon?: { code: string; value: number } | null;
};

export default function UsefulToKnow({ returningStudentName, returningStudentCoupon }: Props) {
  const isReturning = !!returningStudentName;

  return (
    <aside
      className="relative w-full min-w-0 max-w-full overflow-visible"
    >
      <div className="relative w-full min-w-0 overflow-visible">
        <AnimatePresence mode="wait">
          {isReturning ? (
            <motion.div
              key="welcome-back"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
              className="relative w-full min-w-0 flex flex-col justify-center pt-16 pb-14 px-0 overflow-visible mt-24"
            >
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.4, ease: "easeOut" }}
                className="relative z-10 font-semibold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-white/95"
              >
                Welcome back{returningStudentName ? `, ${returningStudentName}` : ""}.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
                className="relative z-10 mt-8 text-base sm:text-lg text-white/70"
              >
                {returningStudentCoupon ? (
                  <>
                    Ready for the next steps?
                    <br />
                    Don&apos;t forget your <strong className="font-semibold text-white/90">€{returningStudentCoupon.value}</strong> discount code — <strong className="font-semibold text-white/90">{returningStudentCoupon.code}</strong>
                  </>
                ) : (
                  "Ready for the next steps? — continue to choose your payment method when you're ready."
                )}
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="prep"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative w-full min-w-0 overflow-y-auto"
            >
              <h2 className="font-semibold tracking-tight text-xl sm:text-3xl text-white/90 mb-10">
                Want to prepare?
              </h2>

              <ul className="space-y-14 text-[16px] leading-relaxed text-white/65">
        <PrepItem
          color="sky"
          title="Join Discord"
          description="We will meet on my Discord server, make sure you join! You’ll find some additional resources there as well. Before your session, double-check your mic & audio."
          icon={<FaDiscord size={20} />}
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
          </motion.div>
        )}
      </AnimatePresence>
      </div>
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
