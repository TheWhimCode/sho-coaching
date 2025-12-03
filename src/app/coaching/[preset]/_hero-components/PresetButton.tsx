"use client";

import type { ReactNode } from "react";
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
  price: string | ReactNode;
  preset: Preset;
  active?: boolean;
  onClick: () => void;
  onHover: (p: Preset | null) => void;
  isMobile: boolean;
};

export default function PresetButton({
  label,
  sub,
  price,
  preset,
  active,
  onClick,
  onHover,
  isMobile,
}: Props) {
  const isBundle = preset === "bundle_4x60" && active;
  const { ring } = colorsByPreset[preset];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => onHover(preset)}
        onMouseLeave={() => onHover(null)}
        className={[
          "relative w-full rounded-xl text-left transition overflow-hidden border",
          isMobile
            ? "bg-black/[.04] hover:bg-black/[.06] shadow-[inset_0_0_0_1px_rgba(0,0,0,.35)]"
            : "bg-white/[.04] hover:bg-white/[.06] shadow-[inset_0_0_0_1px_rgba(0,0,0,.35)]",
          active
            ? "border-[rgba(120,160,255,.55)] shadow-[0_0_6px_rgba(56,124,255,.35)]"
            : "border-white/12",
        ].join(" ")}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl bg-dottexture"
        />

        <div className="relative flex items-center px-4 py-3">
          <div className="grow">
            <div className="font-semibold">{label}</div>
            <div className="text-xs opacity-85">{sub}</div>
          </div>

          {preset === "bundle_4x60" ? (
 <div className="mr-3 flex items-baseline gap-2">
  <span className="text-[21px] font-bold leading-none">
    {price}
  </span>

  <span className="text-[14px] font-semibold line-through leading-none opacity-60">
    €160
  </span>
</div>

          ) : (
            <div className="mr-3 text-base font-semibold">{price}</div>
          )}

          <div className="shrink-0">
            <PresetIcon preset={preset} size={30} />
          </div>
        </div>

        <AnimatePresence>
          {isBundle && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                duration: 0.85,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{ overflow: "hidden" }}
            >
              <motion.div
                layout
                className="
                  bg-black/20
                  border-t border-[rgba(120,160,255,.35)]
                  shadow-[inset_0_8px_12px_-6px_rgba(0,0,0,0.4)]
                "
              >
                <div className="relative px-4 pt-3 pb-3 min-h-full">
                  <div
                    className="
                      pointer-events-none absolute inset-0 -mx-4
                      bg-gradient-to-b
                      from-black/0 via-black/30 to-black/60
                    "
                  />

                  <div className="relative space-y-2">
                    {[
                      ["Session 1", "€35", "-12%"],
                      ["Session 2", "€30", "-25%"],
                      ["Session 3", "€25", "-37%"],
                      ["Session 4", "€20", "-50%"],
                    ].map(([label, price, discount], i) => {
                      const level = i + 1;
                      const size =
                        level === 1
                          ? "text-[14px]"
                          : level === 2
                            ? "text-[15px]"
                            : level === 3
                              ? "text-[16px]"
                              : "text-[17px]";

                      const opacity =
                        level === 1
                          ? "opacity-40"
                          : level === 2
                            ? "opacity-60"
                            : level === 3
                              ? "opacity-80"
                              : "opacity-100";

                      return (
                        <div
                          key={label}
                          className="flex items-center justify-between w-full"
                        >
                          <span className={`${size} ${opacity} font-bold`}>
                            {label}
                          </span>

                          <span
                            className={`${size} ${opacity} font-semibold flex items-center gap-1`}
                          >
                            {price}
                            <span
                              className="text-xs font-semibold"
                              style={{ color: ring }}
                            >
                              {discount}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
