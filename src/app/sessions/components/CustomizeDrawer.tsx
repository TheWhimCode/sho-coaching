"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Cfg, clamp, addLiveBlock, removeLiveBlock } from "../../utils/sessionConfig"; // adjust path if needed

type Props = {
  open: boolean;
  onClose: () => void;
  cfg: Cfg;
  onChange: (c: Cfg) => void;
};



export default function CustomizeDrawer({ open, onClose, cfg, onChange }: Props) {
  function applyPreset(preset: "quick" | "vod" | "signature") {
  if (preset === "quick") {
    onChange(clamp({ ...cfg, liveMin: 30, liveBlocks: 0, followups: 0 }));
  } else if (preset === "vod") {
    onChange(clamp({ ...cfg, liveMin: 60, liveBlocks: 0, followups: 0 }));
  } else if (preset === "signature") {
    onChange(clamp({ ...cfg, liveMin: 45, liveBlocks: 0, followups: 1 }));
  }
}

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* click-off backdrop */}
          <div className="absolute inset-0" onClick={onClose} />

          <motion.aside
            className="absolute left-0 top-0 h-full w-[min(420px,90vw)] bg-neutral-900/90 backdrop-blur
                       ring-1 ring-white/10 border-r border-white/10 p-5 text-white"
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Customize session</h3>
              <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
            </div>
            

            {/* Duration (total live minutes) */}
<div className="mb-6">
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium">Duration</span>
    <span className="text-sm opacity-80">{cfg.liveMin} min</span>
  </div>

  <div className="mt-2 flex gap-2">
    <button
      className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 disabled:opacity-40"
      disabled={cfg.liveMin <= 30}
      onClick={() => onChange({ ...cfg, liveMin: Math.max(30, cfg.liveMin - 15) })}
    >
      −15
    </button>
    <button
      className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 disabled:opacity-40"
      disabled={cfg.liveMin >= 120}
      onClick={() => onChange({ ...cfg, liveMin: Math.min(120, cfg.liveMin + 15) })}
    >
      +15
    </button>
  </div>

  <div className="mt-1 text-xs text-white/60">30–120 min, in 15-min steps</div>
</div>



            {/* In-game coaching blocks (45m each, shares the same 120 pool) */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">In-game coaching</span>
                <span className="text-sm opacity-80">{cfg.liveBlocks} × 45 min</span>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 disabled:opacity-40"
                  disabled={cfg.liveBlocks === 0}
                  onClick={() => onChange(removeLiveBlock(cfg))}
                >
                  −45
                </button>
                <button
                  className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 disabled:opacity-40"
                  disabled={cfg.liveMin + 45 > 120 || cfg.liveBlocks >= 2}
                  onClick={() => onChange(addLiveBlock(cfg))}
                >
                  +45
                </button>
              </div>
              <div className="mt-1 text-xs text-white/60">
                Uses the same time pool. Max 2 blocks (90 min).
              </div>
            </div>

            {/* Follow-up recordings (don’t use live time) */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Follow-up recordings</span>
                <span className="text-sm opacity-80">{cfg.followups} × 15 min</span>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 disabled:opacity-40"
                  disabled={cfg.followups === 0}
                  onClick={() => onChange({ ...cfg, followups: cfg.followups - 1 })}
                >
                  −
                </button>
                <button
                  className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 disabled:opacity-40"
                  disabled={cfg.followups >= 2}
                  onClick={() => onChange({ ...cfg, followups: cfg.followups + 1 })}
                >
                  +
                </button>
              </div>
              <div className="mt-1 text-xs text-white/60">
                Delivered later, no scheduling needed.
              </div>
            </div>
            {/* Presets */}
<div className="mt-6">
  <div className="text-sm font-medium mb-2">Presets</div>
  <div className="grid gap-2">
    {/* VOD Review */}
<button
  onClick={() => applyPreset("vod")}
  className="relative w-full rounded-xl px-4 py-3 text-left ring-1 ring-white/15 overflow-hidden
             bg-gradient-to-r from-indigo-500/40 via-fuchsia-500/30 to-violet-500/40 hover:brightness-110"
>
  <div className="pointer-events-none absolute inset-0 opacity-20"
       style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.25) 1px, transparent 1px)", backgroundSize: "10px 10px" }} />
  <div className="relative flex items-center justify-between">
    <div>
      <div className="font-semibold">VOD Review</div>
      <div className="text-xs opacity-85">60 min · no add-ons</div>
    </div>
    <div className="text-sm font-semibold">€40</div>
  </div>
</button>

<button
  onClick={() => applyPreset("signature")}
  className="relative w-full rounded-xl px-4 py-3 text-left ring-1 ring-white/15 overflow-hidden
             bg-gradient-to-r from-rose-500/40 via-orange-400/35 to-amber-400/35 hover:brightness-110"
>
  <div className="pointer-events-none absolute inset-0 opacity-15"
       style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.25) 0 2px, transparent 2px 6px)" }} />
  <div className="relative flex items-center justify-between">
    <div>
      <div className="font-semibold">Signature</div>
      <div className="text-xs opacity-85">45 min + 15 min follow-up</div>
    </div>
    <div className="text-sm font-semibold">€55</div>
  </div>
</button>

<button
  onClick={() => applyPreset("quick")}
  className="relative w-full rounded-xl px-4 py-3 text-left ring-1 ring-white/15 overflow-hidden
             bg-gradient-to-r from-yellow-400/40 via-amber-300/35 to-lime-300/35 hover:brightness-110"
>
  <div className="pointer-events-none absolute inset-0 opacity-15"
       style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.25) 1px, transparent 1px)", backgroundSize: "12px 12px" }} />
  <div className="relative flex items-center justify-between">
    <div>
      <div className="font-semibold">Quick Session</div>
      <div className="text-xs opacity-85">30 min · focused</div>
    </div>
    <div className="text-sm font-semibold">€40</div>
  </div>
</button>
    {/* Bootcamp (shown but not wired) */}
    <button
      disabled
      title="Coming soon"
      className="relative w-full rounded-xl px-4 py-3 text-left ring-1 ring-white/15 overflow-hidden
                 bg-gradient-to-r from-sky-400/30 via-emerald-400/25 to-violet-400/30 opacity-50 cursor-not-allowed"
    >
      <div className="relative flex items-center justify-between">
        <div>
          <div className="font-semibold">Bootcamp</div>
          <div className="text-xs opacity-85">Multi-session bundle</div>
        </div>
        <div className="text-sm font-semibold">—</div>
      </div>
    </button>
  </div>
</div>


            {/* Footer summary (optional) */}
            <div className="text-sm text-white/80">
              Live: <b>{cfg.liveMin} min</b>
              {cfg.liveBlocks > 0 && <> • In-game: <b>{cfg.liveBlocks}×45</b></>}
              {cfg.followups > 0 && <> • Follow-ups: <b>{cfg.followups}×15</b></>}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
