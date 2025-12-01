"use client";

import { AnimatePresence, motion } from "framer-motion";
import { colorsByPreset, type Preset } from "@/engine/session";
import { iconsByPreset } from "@/engine/session";

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
  label: string;
  sub: string;
  price: string;
  preset: Preset;
  active?: boolean;
  onClick: () => void;
  onHover: (p: Preset | null) => void;
  isMobile: boolean;
};

export default function PresetButton({
  label, sub, price, preset, active, onClick, onHover, isMobile
}: Props) {

  const isBundle = preset === "bundle_4x60" && active;

  return (
    <div className="relative">
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

          {!isBundle ? (
            <div className="mr-3 text-base font-semibold">{price}</div>
          ) : (
            <div className="mr-3 flex items-center gap-2">
              <span className="text-[16px] font-semibold">110€</span>
              <span className="text-xs opacity-60 line-through">160€</span>
            </div>
          )}

          <div className="shrink-0">
            <PresetIcon preset={preset} size={30} />
          </div>
        </div>
      </button>

      {/* Bundle expanded list */}
      <AnimatePresence>
        {isBundle && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="
              w-full
              rounded-b-xl
              overflow-hidden
              px-4 pb-2 pt-1
              bg-white/[.04]
              shadow-[inset_0_0_0_1px_rgba(0,0,0,.35)]
            "
          >
            <div className="space-y-1 w-full">
              {[
                ["Session 1", "35€"],
                ["Session 2", "30€"],
                ["Session 3", "25€"],
                ["Session 4", "20€"],
              ].map(([label, price], i) => {

                const level = i + 1;
                const size =
                  level === 1 ? "text-[14px]" :
                  level === 2 ? "text-[15px]" :
                  level === 3 ? "text-[16px]" :
                  "text-[17px]";

                const opacity =
                  level === 1 ? "opacity-40" :
                  level === 2 ? "opacity-60" :
                  level === 3 ? "opacity-80" :
                  "opacity-100";

                const saturation =
                  level === 1 ? "saturate-50" :
                  level === 2 ? "saturate-75" :
                  level === 3 ? "saturate-100" :
                  "saturate-150";

                const classes = `
                  bg-gradient-to-br from-[#3EA8FF] to-[#FFA033]
                  bg-clip-text text-transparent font-bold
                  ${size} ${opacity} ${saturation}
                `;

                return (
                  <div key={label}
                    className="grid grid-cols-[1fr_auto_1fr] w-full items-center">
                    <span className={`${classes} justify-self-start text-center`}>
                      {label}
                    </span>
                    <span />
                    <span className={`${classes} justify-self-end text-center`}>
                      {price}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
