"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Cfg } from "@/engine/session/config";
import GlassPanel from "@/app/_components/panels/GlassPanel";
import { X } from "@phosphor-icons/react";

import PresetButtonGroup from "./PresetButtons";
import BundleButton from "./BundleButton";
import CustomizationSection from "./CustomizationSection";

import { applyPresetChanges } from "./customizationOptions";

const Divider = () => (
  <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent" />
);

type Props = {
  open: boolean;
  onClose: () => void;
  cfg: Cfg;
  onChange: (c: Cfg) => void;
};

export default function CustomizeDrawer({
  open,
  onClose,
  cfg,
  onChange,
}: Props) {
  const interactedRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  const [expanded, setExpanded] = useState<"bundle" | "section" | "none">("none");

  const clearHighlight = () => {
    if (!interactedRef.current) interactedRef.current = true;
  };

  const changeAndClear = (next: Cfg) => {
    clearHighlight();
    onChange(next);
  };

  /* ========= APPLY PRESET (NOW USING derivePreset) ========= */

  function applyPreset(p: "vod" | "signature" | "instant" | "bootcamp") {
    clearHighlight();

    if (p === "bootcamp") {
      setExpanded("bundle");
      onChange({ ...cfg, productType: "bundle" });
      return;
    }

    setExpanded("section");
    onChange(applyPresetChanges({ ...cfg, productType: "normal" }, p));
  }

  /* ========= EXPAND/COLLAPSE HANDLERS ========= */

  const handleBundleExpandChange = (shouldExpand: boolean) => {
    clearHighlight();

    if (shouldExpand) {
      setExpanded("bundle");
      onChange({ ...cfg, productType: "bundle" });
    } else {
      setExpanded("section");
      onChange({ ...cfg, productType: "normal" });
    }
  };

  const handleSectionExpandChange = (shouldExpand: boolean) => {
    clearHighlight();

    if (shouldExpand) {
      setExpanded("section");
      onChange({ ...cfg, productType: "normal" });
    } else {
      setExpanded("bundle");
      onChange({ ...cfg, productType: "bundle" });
    }
  };

  /* ========= RESPONSIVE ========= */

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.aside
            className={[
              "fixed inset-0 w-screen h-[100svh] text-white",
              "bg-black/35 backdrop-blur-[4px]",
              "overflow-y-auto overflow-x-hidden overscroll-contain",
              "pb-[env(safe-area-inset-bottom)]",
              "md:absolute md:left-0 md:top-0 md:h-full md:w-[min(440px,92vw)] md:bg-transparent md:backdrop-blur-0",
            ].join(" ")}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {isMobile ? (
              <div className="p-6">
                <Header onClose={onClose} />

                <CustomizationSection
                  cfg={cfg}
                  onChange={changeAndClear}
                  squareBtn={squareBtn}
                  expanded={expanded === "section"}
                  onExpandToggle={() =>
                    handleSectionExpandChange(expanded !== "section")
                  }
                />

                <BundleButton
                  cfg={cfg}
                  isMobile={isMobile}
                  expanded={expanded === "bundle"}
                  onExpandChange={(next) => handleBundleExpandChange(next)}
                />

                <Divider />

                <PresetButtonGroup
                  cfg={cfg}
                  applyPreset={applyPreset}
                  isMobile={isMobile}
                />
              </div>
            ) : (
              <GlassPanel className="h-full w-full max-w-[440px] rounded-none text-white md:border-r md:border-white/10">
                <div className="p-6 h-full overflow-y-auto">
                  <Header onClose={onClose} />
                  <div className="tiny-gap" />

                  <CustomizationSection
                    cfg={cfg}
                    onChange={changeAndClear}
                    squareBtn={squareBtn}
                    expanded={expanded === "section"}
                    onExpandToggle={() =>
                      handleSectionExpandChange(expanded !== "section")
                    }
                  />

                  <Divider />

                  <BundleButton
                    cfg={cfg}
                    isMobile={false}
                    expanded={expanded === "bundle"}
                    onExpandChange={(next) => handleBundleExpandChange(next)}
                  />

                  <Divider />

                  <PresetButtonGroup
                    cfg={cfg}
                    applyPreset={applyPreset}
                    isMobile={false}
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
      <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">
        Customize your session
      </h3>
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

const squareBtn =
  "w-12 h-12 grid place-items-center rounded-[10px] text-[15px] font-semibold text-white/95 " +
  "bg-white/[.08] supports-[backdrop-filter]:backdrop-blur-md " +
  "ring-1 ring-white/12 shadow-[inset_0_0_0_1px_rgba(0,0,0,.28)] " +
  "hover:bg-white/[.12] hover:ring-[rgba(120,160,255,.45)] " +
  "hover:shadow-[0_0_10px_rgba(56,124,255,.38),inset_0_0_0_1px_rgba(0,0,0,.28)] " +
  "active:scale-[.98] transition disabled:opacity-45 disabled:shadow-none disabled:cursor-not-allowed";
