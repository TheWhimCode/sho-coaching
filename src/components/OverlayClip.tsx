"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

type Props = {
  slug: string;
  src: string;
  onEnded: () => void;     // navigate after clip
  poster?: string;
};

export default function OverlayClip({ slug, src, onEnded, poster }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { ref.current?.play().catch(() => {}); }, []);

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <div className="absolute inset-0 bg-black/60" />
        <motion.div layoutId={`card-${slug}`} className="absolute inset-0 overflow-hidden">
          <video
            ref={ref}
            src={src}
            poster={poster}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="auto"
            autoPlay
            onEnded={onEnded}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
