"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { X } from "@phosphor-icons/react";
import GlassPanel from "@/app/_components/panels/GlassPanel";
import {
  getLeaderboardClientId,
  setLeaderboardDisplayName,
  LEADERBOARD_ADDED_EVENT,
} from "@/app/skillcheck/leaderboard-client-id";
import { getSkillcheckStreak } from "@/app/skillcheck/streak";

const overlay: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] },
  },
  exit: { opacity: 0 },
};

// Wrapper has no opacity on enter so the panel (sibling of overlay) is never in an opacity < 1 stack; only fades on exit.
const wrapper: Variants = {
  hidden: {},
  show: {},
  exit: { opacity: 0, transition: { duration: 0.16 } },
};

// Use marginTop only (no opacity) so the panel is never in an opacity < 1 stacking context;
// then the panel's backdrop-filter works from the first frame instead of only after the animation ends.
const shell: Variants = {
  hidden: { marginTop: 24 },
  show: {
    marginTop: 0,
    transition: { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] },
  },
  exit: {
    marginTop: 24,
    transition: { duration: 0.16, ease: [0.2, 0.8, 0.2, 1] },
  },
};

export default function LeaderboardNamePrompt() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(LEADERBOARD_ADDED_EVENT, handler);
    return () => window.removeEventListener(LEADERBOARD_ADDED_EVENT, handler);
  }, []);

  async function handleSave() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const clientId = getLeaderboardClientId();
      const displayName = name.trim().slice(0, 16) || null;
      const streak = getSkillcheckStreak();
      await fetch("/api/skillcheck/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          streakDays: streak.streakDays,
          displayName,
        }),
      });
      if (displayName) setLeaderboardDisplayName(displayName);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none"
          variants={wrapper}
          initial="hidden"
          animate="show"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leaderboard-name-title"
        >
          {/* Overlay and panel are siblings so the panel is never inside an opacity-animated parent (which would trap backdrop-filter until the end). */}
          <motion.div
            className="absolute inset-0 bg-black/25 pointer-events-none"
            variants={overlay}
            initial="hidden"
            animate="show"
            exit="exit"
            aria-hidden
          />
          <motion.div
            className="pointer-events-auto w-full max-w-sm relative z-10"
            variants={shell}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <GlassPanel className="relative w-full p-8 text-white shadow-xl backdrop-blur-[8px] bg-[#0B1220]/40 ring-[rgba(146,180,255,.22)]">
              <div className="mb-1 flex items-center justify-between">
                <h2
                  id="leaderboard-name-title"
                  className="text-lg font-semibold text-white"
                >
                  You&apos;re on the board!
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="p-2 rounded-md hover:bg-white/10 transition cursor-pointer"
                >
                  <X size={22} weight="bold" />
                </button>
              </div>
              <p className="mt-1 text-sm text-white/60">
                What&apos;s your name?
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 16))}
                  placeholder="Anonymous"
                  className="rounded-xl border border-white/20 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/40 w-full focus:outline-none focus:ring-1 focus:ring-white/50"
                  maxLength={16}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                  }}
                />
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={submitting}
                  className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Saving…" : "Save"}
                </button>
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
