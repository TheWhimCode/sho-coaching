// components/CustomizeDrawer.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Cfg, clamp, addLiveBlock, removeLiveBlock } from "../utils/sessionConfig";
import { getPreset, type Preset } from "@/lib/sessions/preset";
import { colorsByPreset } from "@/lib/sessions/colors";
import DualWipeLR from "@/components/DualWipeLR";


/* ---------- Icons use shared palette ---------- */
function PresetIcon({ preset, size = 28 }: { preset: Preset; size?: number }) {
  const { ring, glow } = colorsByPreset[preset];
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    style: { filter: `drop-shadow(0 0 8px ${glow})` },
  } as const;

  if (preset === "vod") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="6.5" stroke={ring} strokeWidth="1.8" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke={ring} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (preset === "instant") {
    return (
      <svg {...common}>
        <path d="M13 2L6 13h5l-1 9 7-11h-5l1-9Z" fill={ring} opacity=".95" />
      </svg>
    );
  }
  if (preset === "signature") {
    return (
      <svg {...common}>
        <path
          d="M12 3c1.5 2.2 2 3.9 2 5.2 0 1.6-.7 2.7-1.9 3.5.2-1.6-.5-3.2-2.1-4.7-.2 1.3-.7 2.3-1.5 3.1C7.5 11.1 7 12.1 7 13.5 7 16.5 9.2 19 12 19s5-2.5 5-5.5c0-3.5-2.3-6-5-10.5Z"
          fill={ring}
          opacity=".95"
        />
      </svg>
    );
  }
  // custom
  return (
    <svg {...common}>
      <path d="M12 4l1.2 2.6L16 8l-2.8 1.4L12 12l-1.2-2.6L8 8l2.8-1.4L12 4Z" fill={ring} />
      <path d="M18 12l.7 1.6L20 14l-1.3.4L18 16l-.7-1.6L16 14l1.3-.4L18 12Z" fill={ring} opacity=".95" />
    </svg>
  );
}

/* ---------- Unified +/- 15 logic ----------
   - Decrement prefers base minutes; if base is at 30, removes one 45m block.
   - Increment respects the unified 120m cap (base + 45*blocks). */
function decDuration(cfg: Cfg): Cfg {
  if (cfg.liveMin > 30) {
    return { ...cfg, liveMin: Math.max(30, cfg.liveMin - 15) };
  }
  if (cfg.liveBlocks > 0) {
    return { ...cfg, liveBlocks: cfg.liveBlocks - 1 };
  }
  return cfg;
}

function incDuration(cfg: Cfg): Cfg {
  const total = cfg.liveMin + cfg.liveBlocks * 45;
  if (total >= 120) return cfg;
  return { ...cfg, liveMin: cfg.liveMin + 15 };
}

/* ---------- Drawer ---------- */
type Props = { open: boolean; onClose: () => void; cfg: Cfg; onChange: (c: Cfg) => void };

export default function CustomizeDrawer({ open, onClose, cfg, onChange }: Props) {
  console.log("Drawer cfg", cfg);   // 👈 Add here

  const [hoverPreset, setHoverPreset] = useState<Preset | null>(null);

  // IMPORTANT: preset should be based on TOTAL live minutes (base + in-game)
const baseOnly = cfg.liveMin;
const currentPreset = useMemo(
  () => getPreset(baseOnly, cfg.followups, cfg.liveBlocks),   // ← include liveBlocks
  [baseOnly, cfg.followups, cfg.liveBlocks]
,);
  const { ring, glow } = colorsByPreset[currentPreset];

  function applyPreset(p: Exclude<Preset, "custom">) {
    if (p === "instant") onChange(clamp({ ...cfg, liveMin: 30, liveBlocks: 0, followups: 0 }));
    else if (p === "vod") onChange(clamp({ ...cfg, liveMin: 60, liveBlocks: 0, followups: 0 }));
    else if (p === "signature") onChange(clamp({ ...cfg, liveMin: 45, liveBlocks: 0, followups: 1 }));
  }

  const Divider = () => (
    <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent" />
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0" onClick={onClose} />
          <motion.aside
            className="absolute left-0 top-0 h-full w-[min(440px,92vw)] bg-[#0B1220]/90 backdrop-blur-md ring-1 ring-[rgba(146,180,255,.18)] border-r border-white/10 p-6 text-white shadow-[0_10px_30px_rgba(0,0,0,.35)]"
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header (slightly smaller) */}
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">Customize your session</h3>
              <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
            </div>

            {/* Controls */}
            <div>
              {/* Add/remove time */}
              <section>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] md:text-[16px] font-semibold">Add/remove time</span>
                  <span className="text-sm opacity-80">{cfg.liveMin} min</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/15 disabled:opacity-40"
                    onClick={() => onChange(decDuration(cfg))}
                    disabled={cfg.liveMin <= 30 && cfg.liveBlocks === 0}
                  >
                    −15
                  </button>

                  <button
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/15 disabled:opacity-40"
                    onClick={() => onChange(incDuration(cfg))}
                    disabled={cfg.liveMin + cfg.liveBlocks * 45 >= 120}
                  >
                    +15
                  </button>
                </div>
              </section>

              <Divider />

              {/* In-game coaching */}
              <section>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] md:text-[16px] font-semibold">In-game coaching</span>
                  <span className="text-sm opacity-80">{cfg.liveBlocks} × 45 min</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/15 disabled:opacity-40"
                    disabled={cfg.liveBlocks === 0}
                    onClick={() => onChange(removeLiveBlock(cfg))}
                  >
                    −45
                  </button>
                  <button
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/15 disabled:opacity-40"
                    disabled={cfg.liveMin + (cfg.liveBlocks + 1) * 45 > 120 || cfg.liveBlocks >= 2}
                    onClick={() => onChange(addLiveBlock(cfg))}
                  >
                    +45
                  </button>
                </div>
              </section>

              <Divider />

              {/* Follow-ups */}
              <section>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] md:text-[16px] font-semibold">Follow-up recordings</span>
                  <span className="text-sm opacity-80">{cfg.followups} × 15 min</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/15 disabled:opacity-40"
                    disabled={cfg.followups === 0}
                    onClick={() => onChange({ ...cfg, followups: cfg.followups - 1 })}
                  >
                    −
                  </button>
                  <button
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/15 disabled:opacity-40"
                    disabled={cfg.followups >= 2}
                    onClick={() => onChange({ ...cfg, followups: cfg.followups + 1 })}
                  >
                    +
                  </button>
                </div>
              </section>

              <Divider />

              {/* Presets */}
              <section>
                <div className="text-[15px] md:text-[16px] font-semibold mb-2">Presets</div>
                <div className="grid gap-2">
                  <PresetButton
                    label="VOD Review" sub="60 min" price="€40" preset="vod"
                    active={currentPreset === "vod"} onClick={() => applyPreset("vod")} onHover={setHoverPreset}
                  />
                  <PresetButton
                    label="Signature" sub="45 min + 15 min follow-up" price="€45" preset="signature"
                    active={currentPreset === "signature"} onClick={() => applyPreset("signature")} onHover={setHoverPreset}
                  />
                  <PresetButton
                    label="Instant Insight" sub="30 min" price="€20" preset="instant"
                    active={currentPreset === "instant"} onClick={() => applyPreset("instant")} onHover={setHoverPreset}
                  />
                </div>
              </section>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* neutral preset button */
function PresetButton({
  label, sub, price, preset, active, onClick, onHover,
}: {
  label: string; sub: string; price: string; preset: Preset; active?: boolean;
  onClick: () => void; onHover: (p: Preset | null) => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(preset)}
      onMouseLeave={() => onHover(null)}
      className={[
        "relative w-full rounded-xl px-4 py-3 text-left",
        "ring-1 ring-white/12 bg-white/[.04] hover:bg-white/[.06]",
        "transition shadow-[inset_0_0_0_1px_rgba(0,0,0,.35)]",
        active ? "outline outline-1 -outline-offset-1 outline-[rgba(146,180,255,.35)]" : "",
      ].join(" ")}
      style={{
        backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "12px 12px",
        backgroundBlendMode: "overlay",
      }}
    >
      <div className="flex items-center">
        <div className="grow">
          <div className="font-semibold">{label}</div>
          <div className="text-xs opacity-85">{sub}</div>
        </div>
        <div className="mr-3 text-base font-semibold">{price}</div>
        <div className="shrink-0"><PresetIcon preset={preset} size={30} /></div>
      </div>
    </button>
  );
}
