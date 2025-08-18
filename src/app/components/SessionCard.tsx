"use client";
import { motion } from "framer-motion";

type Session = {
  slug: string;
  title: string;
  subtitle: string;
  duration: number;
  badge: string;
  cardGradient: string;
};

export default function SessionCard({
  session: s,
  onClick,
  onHover,
  variants,
  direction,
  poster,
  overlayOpacity = 1,
}: {
  session: Session;
  onClick: () => void;
  onHover: (hovering: boolean) => void;
  variants: any;        // reuse your SLIDE_VARIANTS from the page
  direction: number;    // -1 or 1
  poster?: string;      // optional preview image
  overlayOpacity?: number;
}) {
  return (
    <motion.button
      layoutId={`card-${s.slug}`}
      key={s.slug}
      onClick={onClick}
      onHoverStart={() => onHover(true)}
      onHoverEnd={() => onHover(false)}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.2 },
      }}
      className="relative w-[92vw] max-w-[500px] h-[20vh] min-h-[300px] rounded-[4px] p-[1px] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.75)] overflow-hidden"
    >
      {/* Preview image */}
      <div className="absolute inset-0 overflow-hidden rounded-[4px]">
        {poster && (
          <img
            src={poster}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        )}
      </div>

      {/* Gradient overlay (opacity controlled by parent) */}
      <motion.div
        className={`absolute inset-0 rounded-[4px] ${s.cardGradient}`}
        initial={false}
        animate={{ opacity: overlayOpacity }}
      />

      {/* Content */}
      <div className="relative h-full w-full p-6 sm:p-10 flex flex-col justify-between">
        <div className="text-left">
          <div className="mb-2 text-3xl font-extrabold sm:text-3xl">{s.title}</div>
          <div className="mb-6 text-base text-white/85 sm:text-md">{s.subtitle}</div>
        </div>
        <div className="flex items-center gap-6 text-sm sm:text-base">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-white" />
            <span className="font-semibold">{s.duration} min</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-300">★</span>
            <span className="text-white/90">{s.badge}</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
