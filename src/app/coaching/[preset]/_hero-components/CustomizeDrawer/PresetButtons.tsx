"use client";

import { useState, useMemo } from "react";
import { getPreset, type Preset } from "@/lib/sessions/preset";
import { colorsByPreset } from "@/lib/sessions/colors";
import { Signature, Scroll, Lightning, PuzzlePiece } from "@phosphor-icons/react";
import { Cfg } from "@/engine/session/config";

// ⭐ UI preset type → only selectable presets
type UIPreset = "vod" | "signature" | "instant";

type PresetButtonProps = {
  label: string;
  sub: string;
  price: string;
  preset: UIPreset;
  active: boolean;
  onClick: () => void;
  onHover: (p: UIPreset | null) => void;
  isMobile: boolean;
};

function PresetIcon({ preset, size = 28 }: { preset: UIPreset; size?: number }) {
  const { ring, glow } = colorsByPreset[preset];
  const style = { filter: `drop-shadow(0 0 8px ${glow})` } as const;

  if (preset === "vod")
    return <Scroll size={size} weight="fill" color={ring} style={style} aria-hidden />;

  if (preset === "instant")
    return <Lightning size={size} weight="fill" color={ring} style={style} aria-hidden />;

  return <Signature size={size} weight="bold" color={ring} style={style} aria-hidden />;
}

function PresetButton({
  label,
  sub,
  price,
  preset,
  active,
  onClick,
  onHover,
  isMobile,
}: PresetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
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
        <div className="shrink-0">
          <PresetIcon preset={preset} size={30} />
        </div>
      </div>
    </button>
  );
}

type PresetButtonGroupProps = {
  cfg: Cfg;
  applyPreset: (preset: UIPreset, opts?: { exitBundle?: boolean }) => void;
  isMobile?: boolean;
};

// ⭐ Only selectable presets. NO “bootcamp”
const PRESETS: Array<{
  label: string;
  sub: string;
  price: string;
  key: UIPreset;
}> = [
  { label: "VOD Review", sub: "60 min", price: "€40", key: "vod" },
  { label: "Signature", sub: "45 min + 15 min follow-up", price: "€45", key: "signature" },
  { label: "Instant Insight", sub: "30 min", price: "€20", key: "instant" },
];

export default function PresetButtonGroup({
  cfg,
  applyPreset,
  isMobile = false,
}: PresetButtonGroupProps) {
  // ⭐ If bundle, Bootcamp is active — but bootcamp has no button → highlight none
  const inferred = getPreset(cfg.liveMin, cfg.followups, cfg.liveBlocks);

  const currentPreset: UIPreset =
    inferred === "vod" || inferred === "instant" || inferred === "signature"
      ? inferred
      : "vod"; // fall back for custom/bootcamp

  const [hoverPreset, setHoverPreset] = useState<UIPreset | null>(null);

  return (
    <div className="grid gap-2">
      {PRESETS.map(({ label, sub, price, key }) => (
        <PresetButton
          key={key}
          label={label}
          sub={sub}
          price={price}
          preset={key}
          active={currentPreset === key}
          onClick={() => applyPreset(key, { exitBundle: true })}
          onHover={setHoverPreset}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
}
