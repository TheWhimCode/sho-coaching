"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useRef, useEffect } from "react";
import {
  SessionConfig,
  clamp,
  colorsByPreset,
  getPreset,
  type Preset,
} from "@/engine/session";
import { iconsByPreset } from "@/engine/session";
import { X } from "@phosphor-icons/react";
import GlassPanel from "@/app/_components/panels/GlassPanel";
import PresetButton from "./PresetButton";
import CustomizationControls from "./CustomizationControls";

function PresetIcon({ preset, size = 28 }: { preset: Preset; size?: number }) {
  const Icon = iconsByPreset[preset].icon;
  const weight = iconsByPreset[preset].weight ?? "fill";
  const { ring, glow } = colorsByPreset[preset];
  return (
    <Icon
      size={size}
      weight={weight}
      color={ring}
      style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
      aria-hidden
    />
  );
}

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
transition={{
  duration: 0.85,
  ease: [0.16, 1, 0.3, 1] // smooth + soft spring-like easeOut
}}
            onMouseDown={stopMouseDown}
          >
            {isMobile ? (
              <div className="p-6">
                <Header onClose={() => { clearHighlight(); onClose(); }} />
                <Content
                  session={session}
                  changeAndClear={changeAndClear}
                  applyPreset={applyPreset}
                  currentPreset={currentPreset}
                  isMobile={true}
                  setHoverPreset={setHoverPreset}
                />
              </div>
            ) : (
              <GlassPanel className="h-full w-full rounded-none text-white md:border-r md:border-white/10">
                <div className="p-6 h-full overflow-y-auto" onMouseDown={stopMouseDown}>
                  <Header onClose={() => { clearHighlight(); onClose(); }} />
                  <Content
                    session={session}
                    changeAndClear={changeAndClear}
                    applyPreset={applyPreset}
                    currentPreset={currentPreset}
                    isMobile={false}
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
  setHoverPreset,
}: {
  session: SessionConfig;
  changeAndClear: (c: SessionConfig) => void;
  applyPreset: (p: Exclude<Preset, "custom">) => void;
  currentPreset: Preset;
  isMobile: boolean;
  setHoverPreset: (p: Preset | null) => void;
}) {
  const isBundle = session.productId === "bundle_4x60";
  const [customOpen, setCustomOpen] = useState(!isBundle);

  useEffect(() => {
    setCustomOpen(!isBundle);
  }, [isBundle]);

  return (
    <div>

      {/* CUSTOM COLLAPSIBLE */}
      <AnimatePresence initial={false}>
        {!customOpen ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
<button
  onClick={() => {
    if (session.productId === "bundle_4x60") {
      changeAndClear({ ...session, productId: undefined });
    }
    setCustomOpen(true);
  }}
              className="relative w-full rounded-xl px-4 py-3 text-left border
                        bg-white/[.04] hover:bg-white/[.06] shadow-[inset_0_0_0_1px_rgba(0,0,0,.35)]
                        border-white/12 flex justify-between items-center transition"
            >
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-xl bg-dottexture" />
              <span className="relative font-semibold text-[15px]">Adjust time</span>

              <motion.span
                animate={{ rotate: 0 }}
                className="relative text-lg leading-none"
              >
                ▶
              </motion.span>
            </button>

            <div className="mt-3" />
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <CustomizationControls
              session={session}
              onChange={changeAndClear}
              disabled={false}
            />
            <div className="mt-3" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRESETS */}
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

          <PresetButton
            label="Elo Rush"
            sub="60 min ⨯4"
price={
<span className="
  inline-flex items-center
  bg-gradient-to-br from-[#1E9FFF] to-[#FF8C00]
  bg-clip-text text-transparent font-extrabold
  drop-shadow-[0_0_6px_rgba(30,159,255,0.6),0_0_12px_rgba(255,140,0,0.5)]
">
  
    €110
  </span>
}            preset="bundle_4x60"
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
