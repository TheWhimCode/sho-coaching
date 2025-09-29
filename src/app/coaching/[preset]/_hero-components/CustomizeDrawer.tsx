"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useRef, useEffect } from "react";
import { Cfg, clamp, addLiveBlock, removeLiveBlock } from "../../../../utils/sessionConfig";
import { getPreset, type Preset } from "@/lib/sessions/preset";
import { colorsByPreset } from "@/lib/sessions/colors";
import { Signature, Scroll, Lightning, PuzzlePiece, X } from "@phosphor-icons/react";
import InfoTooltip from "@/app/_components/small/InfoTooltip";

function PresetIcon({ preset, size = 28 }: { preset: Preset; size?: number }) {
  const { ring, glow } = colorsByPreset[preset];
  const style = { filter: `drop-shadow(0 0 8px ${glow})` } as const;

  if (preset === "vod") return <Scroll size={size} weight="fill" color={ring} style={style} aria-hidden />;
  if (preset === "instant") return <Lightning size={size} weight="fill" color={ring} style={style} aria-hidden />;
  if (preset === "signature") return <Signature size={size} weight="bold" color={ring} style={style} aria-hidden />;
  return <PuzzlePiece size={size} weight="fill" color={ring} style={style} aria-hidden />;
}

function decDuration(cfg: Cfg): Cfg {
  if (cfg.liveMin > 30) return { ...cfg, liveMin: Math.max(30, cfg.liveMin - 15) };
  if (cfg.liveBlocks > 0) return { ...cfg, liveBlocks: cfg.liveBlocks - 1 };
  return cfg;
}
function incDuration(cfg: Cfg): Cfg {
  const total = cfg.liveMin + cfg.liveBlocks * 45;
  if (total >= 120) return cfg;
  return { ...cfg, liveMin: cfg.liveMin + 15 };
}

type Props = {
  open: boolean;
  onClose: () => void;
  cfg: Cfg;
  onChange: (c: Cfg) => void;
  /** Optional deep-link highlight (e.g., "followups") */
  highlightKey?: "followups";
};

export default function CustomizeDrawer({ open, onClose, cfg, onChange, highlightKey }: Props) {
  const [hoverPreset, setHoverPreset] = useState<Preset | null>(null);

  const baseOnly = cfg.liveMin;
  const currentPreset = useMemo(
    () => getPreset(baseOnly, cfg.followups, cfg.liveBlocks),
    [baseOnly, cfg.followups, cfg.liveBlocks],
  );

  // --- Highlight handling (slide reveal after open; disappears on first interaction) ---
  const [showHighlight, setShowHighlight] = useState(false);
  const interactedRef = useRef(false);

  useEffect(() => {
    if (open && highlightKey && !interactedRef.current) {
      // Make it available immediately; animation itself is delayed by 0.5s
      const t = setTimeout(() => setShowHighlight(true), 0);
      return () => clearTimeout(t);
    } else {
      setShowHighlight(false);
    }
  }, [open, highlightKey]);

  const clearHighlight = () => {
    if (!interactedRef.current) {
      interactedRef.current = true;
      setShowHighlight(false);
    }
  };

  // Wrap onChange to also clear highlight on first change
  const changeAndClear = (next: Cfg) => {
    clearHighlight();
    onChange(next);
  };

  function applyPreset(p: Exclude<Preset, "custom">) {
    clearHighlight();
    if (p === "instant") changeAndClear(clamp({ ...cfg, liveMin: 30, liveBlocks: 0, followups: 0 }));
    else if (p === "vod") changeAndClear(clamp({ ...cfg, liveMin: 60, liveBlocks: 0, followups: 0 }));
    else if (p === "signature") changeAndClear(clamp({ ...cfg, liveMin: 45, liveBlocks: 0, followups: 1 }));
  }

  const Divider = () => (
    <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent" />
  );

  const squareBtn =
    "w-12 h-12 grid place-items-center rounded-[10px] text-[15px] font-semibold text-white/95 " +
    "bg-white/[.08] supports-[backdrop-filter]:backdrop-blur-md " +
    "ring-1 ring-white/12 shadow-[inset_0_0_0_1px_rgba(0,0,0,.28)] " +
    "hover:bg-white/[.12] hover:ring-[rgba(120,160,255,.45)] " +
    "hover:shadow-[0_0_10px_rgba(56,124,255,.38),inset_0_0_0_1px_rgba(0,0,0,.28)] " +
    "active:scale-[.98] transition disabled:opacity-45 disabled:shadow-none disabled:cursor-not-allowed";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { clearHighlight(); onClose(); }}
        >
          <motion.aside
            className="absolute left-0 top-0 h-full w-[min(440px,92vw)]
                       bg-[#0B1220]/15 backdrop-blur-[4px]
                       ring-1 ring-[rgba(146,180,255,.14)]
                       border-r border-white/10 p-6 text-white
                       shadow-[0_10px_30px_rgba(0,0,0,.35)]"
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={clearHighlight}
          >
            {/* Header with close button */}
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">
                Customize your session
              </h3>
              <button
                onClick={() => { clearHighlight(); onClose(); }}
                aria-label="Close customization drawer"
                className="p-2 rounded-md hover:bg-white/10 transition"
              >
                <X size={22} weight="bold" />
              </button>
            </div>

            <Divider />

            <div>
              {/* Add/remove time */}
              <section>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] md:text-[16px] font-semibold">Add/remove time</span>
                  <span className="text-sm opacity-80">{cfg.liveMin} min</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    className={squareBtn}
                    onClick={() => changeAndClear(decDuration(cfg))}
                    disabled={cfg.liveMin <= 30 && cfg.liveBlocks === 0}
                    aria-label="Decrease 15 minutes"
                  >
                    −15
                  </button>
                  <button
                    className={squareBtn}
                    onClick={() => changeAndClear(incDuration(cfg))}
                    disabled={cfg.liveMin + cfg.liveBlocks * 45 >= 120}
                    aria-label="Increase 15 minutes"
                  >
                    +15
                  </button>
                </div>
              </section>

              <Divider />

              {/* In-game coaching */}
              <section>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] md:text-[16px] font-semibold flex items-center gap-1">
                    In-game coaching
                    <InfoTooltip ariaLabel="What is in-game coaching?">
                      <>
                        Receive coaching while playing.{" "}
                        <span className="text-red-400 font-semibold">
                          Warning, in-game coaching is very stressful and often less informative than regular coaching!
                        </span>
                      </>
                    </InfoTooltip>
                  </span>
                  <span className="text-sm opacity-80">{cfg.liveBlocks} × 45 min</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    className={squareBtn}
                    disabled={cfg.liveBlocks === 0}
                    onClick={() => changeAndClear(removeLiveBlock(cfg))}
                    aria-label="Remove 45-minute block"
                  >
                    −45
                  </button>
                  <button
                    className={squareBtn}
                    disabled={cfg.liveMin + (cfg.liveBlocks + 1) * 45 > 120 || cfg.liveBlocks >= 2}
                    onClick={() => changeAndClear(addLiveBlock(cfg))}
                    aria-label="Add 45-minute block"
                  >
                    +45
                  </button>
                </div>
              </section>

              <Divider />

              {/* Follow-ups (HIGHLIGHT: slide reveal with 0.5s delay; purple→blue) */}
              <section className="relative">
                <AnimatePresence>
                  {showHighlight && highlightKey === "followups" && (
                    <motion.span
                      key="fu-highlight"
                      aria-hidden
                      className="pointer-events-none absolute -inset-2 rounded-xl"
                      // slide reveal: start fully clipped to the right, then reveal
                      initial={{ clipPath: "inset(0% 100% 0% 0%)" }}
                      animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
                      exit={{ clipPath: "inset(0% 100% 0% 0%)" }}
                      transition={{ delay: 0.5, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(139,92,246,0.30), rgba(59,130,246,0.22))",
                      }}
                    />
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between relative">
                  <span className="text-[15px] md:text-[16px] font-semibold flex items-center gap-1">
                    Follow-up recordings
                    <InfoTooltip ariaLabel="What are follow-ups?">
                      A few days after your session, Sho will create a Follow-up recording to review your progress and give new input.
                    </InfoTooltip>
                  </span>
                  <span className="text-sm opacity-80">{cfg.followups} × 15 min</span>
                </div>
                <div className="mt-2 flex gap-2 relative">
                  <button
                    className={squareBtn}
                    disabled={cfg.followups === 0}
                    onClick={() => changeAndClear({ ...cfg, followups: cfg.followups - 1 })}
                    aria-label="Decrease follow-ups"
                  >
                    −
                  </button>
                  <button
                    className={squareBtn}
                    disabled={cfg.followups >= 2}
                    onClick={() => changeAndClear({ ...cfg, followups: cfg.followups + 1 })}
                    aria-label="Increase follow-ups"
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
        "relative w-full rounded-xl px-4 py-3 text-left transition",
        "ring-1 bg-white/[.04] hover:bg-white/[.06] shadow-[inset_0_0_0_1px_rgba(0,0,0,.35)]",
        active
          ? "ring-[rgba(120,160,255,.55)] shadow-[0_0_6px_rgba(56,124,255,.35)]"
          : "ring-white/12",
      ].join(" ")}
      type="button"
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
