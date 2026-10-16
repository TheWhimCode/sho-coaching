"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import GuideImage from "@/app/_components/guides/GuideImage";
import { POSSESSION_TIER_LIST } from "@/app/guide/possessionTierList";
import { possessionTierFor, possessionValueFor } from "@/app/guide/possessionValues";
import { guideChampionIconImgClass } from "@/lib/guides/guideTheme";
import { preloadGuideImages } from "@/lib/guides/preloadGuideImages";

export type PossessionTierListChampion = {
  id: string;
  name: string;
  icon: string;
};

const TIER_TONE: Record<string, { chip: string; row: string; label: string }> = {
  perfect: {
    chip: "bg-[#F0ABCF] text-[#2A1520]",
    row: "bg-[#F0ABCF]/[0.09]",
    label: "text-[#FAD4E8]",
  },
  great: {
    chip: "bg-[#B8D8EA] text-[#142028]",
    row: "bg-[#B8D8EA]/[0.09]",
    label: "text-[#CFE6F3]",
  },
  good: {
    chip: "bg-[#E8C676] text-[#2A2110]",
    row: "bg-[#E8C676]/[0.09]",
    label: "text-[#F3DCA0]",
  },
  okay: {
    chip: "bg-[#C4899A] text-[#2A1520]",
    row: "bg-[#C4899A]/[0.08]",
    label: "text-[#E7C3CE]",
  },
  useless: {
    chip: "bg-[#F5E6D3]/25 text-[#F5E6D3]",
    row: "bg-white/[0.03]",
    label: "text-[#F5E6D3]/55",
  },
};

function ChampionChip({
  champion,
  loading,
  revealDelayMs,
}: {
  champion: PossessionTierListChampion;
  loading: boolean;
  revealDelayMs: number;
}) {
  return (
    <div className="flex h-[45px] w-[45px] items-center justify-center" title={champion.name}>
      <div className="h-[45px] w-[45px] overflow-hidden rounded-lg bg-[#352839] ring-1 ring-[#F5E6D3]/15">
        {loading ? (
          <div aria-hidden className="possession-tier-list-skeleton h-full w-full" />
        ) : (
          <div
            className="possession-tier-list-icon-reveal h-full w-full"
            style={{ animationDelay: `${revealDelayMs}ms` }}
          >
            <GuideImage
              src={champion.icon}
              alt={champion.name}
              loading="lazy"
              fade={false}
              className={guideChampionIconImgClass}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function PossessionTierListOverlay({
  open,
  champions,
  onClose,
}: {
  open: boolean;
  champions: PossessionTierListChampion[];
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [iconsReady, setIconsReady] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setIconsReady(false);
      return;
    }

    let cancelled = false;
    setIconsReady(false);
    void preloadGuideImages([...new Set(champions.map((champion) => champion.icon).filter(Boolean))]).then(() => {
      if (!cancelled) setIconsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [open, champions]);

  const tiers = useMemo(() => {
    const grouped = new Map<string, PossessionTierListChampion[]>(
      POSSESSION_TIER_LIST.map((tier) => [tier.id, []])
    );
    for (const champion of champions) {
      const value = possessionValueFor(champion.name);
      const tierId = value == null ? null : possessionTierFor(value);
      if (!tierId) continue;
      grouped.get(tierId)?.push(champion);
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => {
        const valueDifference = (possessionValueFor(b.name) ?? 0) - (possessionValueFor(a.name) ?? 0);
        return valueDifference || a.name.localeCompare(b.name);
      });
    }
    return POSSESSION_TIER_LIST.map((tier) => ({
      ...tier,
      champions: grouped.get(tier.id) ?? [],
    }));
  }, [champions]);
  const championCount = tiers.reduce((count, tier) => count + tier.champions.length, 0);
  let championIndex = 0;

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close possession tier list"
        className="absolute inset-0 bg-[#0C0A10]/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="possession-tier-list-title"
        className="relative flex max-h-[100dvh] w-full max-w-7xl flex-col overflow-hidden rounded-t-3xl border border-[#F0ABCF]/20 bg-[#1A1520] shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:max-h-[min(920px,calc(100dvh-3rem))] sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#F5E6D3]/10 px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#B8D8EA]/70">
              Possessions
            </p>
            <h2 id="possession-tier-list-title" className="mt-1 text-xl font-bold tracking-tight text-[#F5E6D3] sm:text-2xl">
              Possession tier list
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#F5E6D3]/70 transition hover:bg-white/5 hover:text-[#F5E6D3]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="overflow-hidden rounded-2xl border border-[#F5E6D3]/10">
            {tiers.map((tier, index) => {
              const tone = TIER_TONE[tier.id];
              return (
                <div
                  key={tier.id}
                  className={clsx(
                    "flex flex-col sm:grid sm:grid-cols-[10rem_minmax(0,1fr)]",
                    index > 0 && "border-t border-[#F5E6D3]/10",
                    tone.row
                  )}
                >
                  <div className="relative z-10 flex min-w-0 flex-col justify-center px-3 py-2.5 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-2">
                      <span className={clsx("flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold", tone.chip)}>
                        {index + 1}
                      </span>
                      <div className="flex min-w-0 items-baseline gap-2 leading-tight sm:block">
                        <span className={clsx("block text-sm font-semibold", tone.label)}>{tier.label}</span>
                        <span className="block whitespace-nowrap text-[0.65rem] font-medium text-[#F5E6D3]/45 sm:mt-0.5">
                          {tier.subtitle}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-0 grid min-w-0 grid-cols-[repeat(auto-fill,2.8125rem)] items-center gap-1 border-t border-[#F5E6D3]/10 px-3 py-2.5 sm:border-t-0 sm:px-4">
                    {tier.champions.length ? (
                      tier.champions.map((champion) => {
                        const revealDelayMs = Math.round(
                          (championIndex++ / Math.max(championCount - 1, 1)) * 650
                        );
                        return (
                          <ChampionChip
                            key={champion.id}
                            champion={champion}
                            loading={!iconsReady}
                            revealDelayMs={revealDelayMs}
                          />
                        );
                      })
                    ) : (
                      <p className="self-center text-sm text-[#F5E6D3]/35">Empty</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>
    </div>,
    document.body
  );
}
