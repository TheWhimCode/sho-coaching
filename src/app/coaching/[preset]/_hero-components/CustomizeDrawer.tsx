"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useRef, useEffect } from "react";
import {
  SessionConfig,
  clamp,
  addLiveBlock,
  removeLiveBlock,
  totalMinutes,
  MIN_MINUTES,
  MAX_MINUTES,
  LIVEBLOCK_MIN,
  MAX_BLOCKS,
} from "@/engine/session";
import { getPreset, type Preset } from "@/engine/session";
import { colorsByPreset } from "@/engine/session";
import { Signature, Scroll, Lightning, PuzzlePiece, X } from "@phosphor-icons/react";
import InfoTooltip from "@/app/_components/small/InfoTooltip";
import GlassPanel from "@/app/_components/panels/GlassPanel";

function PresetIcon({ preset, size = 28 }: { preset: Preset; size?: number }) {
  const { ring, glow } = colorsByPreset[preset];
  const style = { filter: `drop-shadow(0 0 8px ${glow})` } as const;

  if (preset === "vod") return <Scroll size={size} weight="fill" color={ring} style={style} aria-hidden />;
  if (preset === "instant") return <Lightning size={size} weight="fill" color={ring} style={style} aria-hidden />;
  if (preset === "signature") return <Signature size={size} weight="bold" color={ring} style={style} aria-hidden />;
  return <PuzzlePiece size={size} weight="fill" color={ring} style={style} aria-hidden />;
}

/**
 * UI-only interactions
 */
function decDuration(c: SessionConfig): SessionConfig {
  return clamp({ ...c, liveMin: c.liveMin - 15 });
}
function incDuration(c: SessionConfig): SessionConfig {
  return clamp({ ...c, liveMin: c.liveMin + 15 });
}

function canDecDuration(c: SessionConfig) {
  return !(c.liveMin === MIN_MINUTES && c.liveBlocks === 0);
}
function canIncDuration(c: SessionConfig) {
  return totalMinutes(c) < MAX_MINUTES;
}
function canAddBlock(c: SessionConfig) {
  return c.liveBlocks < MAX_BLOCKS && totalMinutes({ ...c, liveBlocks: c.liveBlocks + 1 }) <= MAX_MINUTES;
}
function canRemoveBlock(c: SessionConfig) {
  return c.liveBlocks > 0;
}

const Divider = () => (
  <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent" />
);

type Props = {
  open: boolean;
  onClose: () => void;
  session: SessionConfig;
  onChange: (c: SessionConfig) => void;
  highlightKey?: "followups";
};

export default function CustomizeDrawer({ open, onClose, session, onChange, highlightKey }: Props) {
  const [hoverPreset, setHoverPreset] = useState<Preset | null>(null);

  const currentPreset = useMemo(
    () => getPreset(session.liveMin, session.followups, session.liveBlocks, session.productId),
    [session],
  );

  const [showHighlight, setShowHighlight] = useState(false);
  const interactedRef = useRef(false);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isMobile || !open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = prev; };
  }, [open, isMobile]);

  useEffect(() => {
    if (!isMobile || !open) return;
    const handlePop = () => onClose();
    window.history.pushState({ drawer: true }, "");
    window.addEventListener("popstate", handlePop);
    return () => {
      window.removeEventListener("popstate", handlePop);
    };
  }, [open, isMobile, onClose]);

  useEffect(() => {
    if (open && highlightKey && !interactedRef.current) {
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

  const changeAndClear = (next: SessionConfig) => {
    clearHighlight();
    onChange(clamp(next));
  };

  function applyPreset(p: Exclude<Preset, "custom">) {
    clearHighlight();
    changeAndClear({
      productId: undefined,
      ...(p === "instant"   && { liveMin: 30, liveBlocks: 0, followups: 0 }),
      ...(p === "vod"       && { liveMin: 60, liveBlocks: 0, followups: 0 }),
      ...(p === "signature" && { liveMin: 45, liveBlocks: 0, followups: 1 }),
    } as SessionConfig);
  }

  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) {
      clearHighlight();
      onClose();
    }
  };

  const stopMouseDown: React.MouseEventHandler = (e) => e.stopPropagation();

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
          onMouseDown={handleBackdropClick}
        >
          <motion.aside
            className={[
              "fixed inset-0 w-screen h-[100svh] text-white",
              "bg-black/35 backdrop-blur-[4px]",
              "overflow-y-auto overflow-x-hidden overscroll-contain",
              "pb-[env(safe-area-inset-bottom)]",
              "md:absolute md:inset-auto md:left-0 md:top-0 md:h-full md:w-[min(440px,92vw)] md:bg-transparent md:backdrop-blur-0 md:overflow-y-auto",
            ].join(" ")}
            initial={isMobile ? { y: 16, opacity: 0 } : { x: -24, opacity: 0 }}
            animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
            exit={isMobile ? { y: 16, opacity: 0 } : { x: -24, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onMouseDown={stopMouseDown}
          >
            {isMobile ? (
              <div className="p-6">
                <Header onClose={() => { clearHighlight(); onClose(); }} />
                <Divider />
                <Content
                  session={session}
                  changeAndClear={changeAndClear}
                  applyPreset={applyPreset}
                  currentPreset={currentPreset}
                  isMobile={true}
                  showHighlight={showHighlight}
                  highlightKey={highlightKey}
                  squareBtn={squareBtn}
                  setHoverPreset={setHoverPreset}
                />
              </div>
            ) : (
              <GlassPanel className="h-full w-full rounded-none text-white md:border-r md:border-white/10">
                <div className="p-6 h-full overflow-y-auto" onMouseDown={stopMouseDown}>
                  <Header onClose={() => { clearHighlight(); onClose(); }} />
                  <Divider />
                  <Content
                    session={session}
                    changeAndClear={changeAndClear}
                    applyPreset={applyPreset}
                    currentPreset={currentPreset}
                    isMobile={false}
                    showHighlight={showHighlight}
                    highlightKey={highlightKey}
                    squareBtn={squareBtn}
                    setHoverPreset={setHoverPreset}
                  />
                </div>
              </GlassPanel>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div className="mb-1 flex items-center justify-between">
      <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">Customize your session</h3>
      <button
        onClick={onClose}
        aria-label="Close customization drawer"
        className="p-2 rounded-md hover:bg-white/10 transition"
      >
        <X size={22} weight="bold" />
      </button>
    </div>
  );
}

function Content({
  session,
  changeAndClear,
  applyPreset,
  currentPreset,
  isMobile,
  showHighlight,
  highlightKey,
  squareBtn,
  setHoverPreset,
}: {
  session: SessionConfig;
  changeAndClear: (c: SessionConfig) => void;
  applyPreset: (p: Exclude<Preset, "custom">) => void;
  currentPreset: Preset;
  isMobile: boolean;
  showHighlight: boolean;
  highlightKey?: "followups";
  squareBtn: string;
  setHoverPreset: (p: Preset | null) => void;
}) {
  const isBundle = session.productId === "bundle_4x60";

  return (
    <div>
      {/* Duration */}
      <section>
        <div className="flex items-center justify-between">
          <span className="text-[15px] md:text-[16px] font-semibold">Add/remove time</span>
          <span className="text-sm opacity-80">{session.liveMin} min</span>
        </div>

        <div className="mt-2 flex gap-2">
          <button
            className={squareBtn}
            onClick={() => changeAndClear(decDuration(session))}
            disabled={isBundle || !canDecDuration(session)}
          >
            −15
          </button>

          <button
            className={squareBtn}
            onClick={() => changeAndClear(incDuration(session))}
            disabled={isBundle || !canIncDuration(session)}
          >
            +15
          </button>
        </div>
      </section>

      <Divider />

      {/* Blocks */}
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
          <span className="text-sm opacity-80">{session.liveBlocks} × {LIVEBLOCK_MIN} min</span>
        </div>

        <div className="mt-2 flex gap-2">
          <button
            className={squareBtn}
            disabled={isBundle || !canRemoveBlock(session)}
            onClick={() => changeAndClear(removeLiveBlock(session))}
          >
            −45
          </button>

          <button
            className={squareBtn}
            disabled={isBundle || !canAddBlock(session)}
            onClick={() => changeAndClear(addLiveBlock(session))}
          >
            +45
          </button>
        </div>
      </section>

      <Divider />

      {/* Follow-ups */}
      <section className="relative">
        <AnimatePresence>
          {showHighlight && highlightKey === "followups" && (
            <motion.span
              key="fu-highlight"
              aria-hidden
              className="pointer-events-none absolute -inset-2 rounded-xl"
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
          <span className="text-sm opacity-80">{session.followups} × 15 min</span>
        </div>

        <div className="mt-2 flex gap-2 relative">
          <button
            className={squareBtn}
            disabled={isBundle || session.followups <= 0}
            onClick={() => changeAndClear({ ...session, followups: session.followups - 1 })}
          >
            −
          </button>
          <button
            className={squareBtn}
            disabled={isBundle || session.followups >= 2}
            onClick={() => changeAndClear({ ...session, followups: session.followups + 1 })}
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
            active={!isBundle && currentPreset === "vod"}
            onClick={() => applyPreset("vod")}
            onHover={setHoverPreset}
            isMobile={isMobile}
          />

          <PresetButton
            label="Signature" sub="45 min + 15 min follow-up" price="€45" preset="signature"
            active={!isBundle && currentPreset === "signature"}
            onClick={() => applyPreset("signature")}
            onHover={setHoverPreset}
            isMobile={isMobile}
          />

          <PresetButton
            label="Instant Insight" sub="30 min" price="€20" preset="instant"
            active={!isBundle && currentPreset === "instant"}
            onClick={() => applyPreset("instant")}
            onHover={setHoverPreset}
            isMobile={isMobile}
          />

          {/* NEW BUNDLE BUTTON */}
          <PresetButton
            label="4-Session Bundle"
            sub="4 × 60 min"
            price="€110"
            preset="bundle_4x60"
            active={isBundle}
            onClick={() => {
              if (isBundle) {
                changeAndClear({ ...session, productId: undefined });
              } else {
                changeAndClear({
                  ...session,
                  productId: "bundle_4x60",
                  liveMin: 60,
                  liveBlocks: 0,
                  followups: 0,
                });
              }
            }}
            onHover={setHoverPreset}
            isMobile={isMobile}
          />
        </div>
      </section>
    </div>
  );
}

function PresetButton({
  label, sub, price, preset, active, onClick, onHover, isMobile,
}: {
  label: string; sub: string; price: string; preset: Preset; active?: boolean;
  onClick: () => void; onHover: (p: Preset | null) => void; isMobile: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHover(preset)}
      onMouseLeave={() => onHover(null)}
      className={[
        "relative w-full rounded-xl px-4 py-3 text-left transition overflow-hidden",
        isMobile
          ? "ring-1 bg-black/[.04] hover:bg-black/[.06] shadow-[inset_0_0_0_1px_rgba(0,0,0,.35)]"
          : "ring-1 bg-white/[.04] hover:bg-white/[.06] shadow-[inset_0_0_0_1px_rgba(0,0,0,.35)]",
        active
          ? "ring-[rgba(120,160,255,.55)] shadow-[0_0_6px_rgba(56,124,255,.35)]"
          : "ring-white/12",
      ].join(" ")}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-xl bg-dottexture" />
      <div className="relative flex items-center">
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
